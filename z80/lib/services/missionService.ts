/**
 * missionService — mission lifecycle and the execution SIMULATOR.
 *
 * All functions are pure: they take a Mission and return the next Mission
 * plus a list of Emissions (activity, chat, approvals, sounds) for the store
 * to apply. When real agents run server-side, replace `advanceMission` with
 * events streamed from the backend; the Emission shape stays the same.
 */
import type {
  ActivityEvent,
  AgentId,
  Approval,
  ChatMessage,
  Mission,
  MissionTask,
  Plan,
  ScriptEvent,
} from "@/types";
import { generateResults } from "@/lib/services/resultsService";
import { uid } from "@/lib/utils";

export type SoundName = "deploy" | "complete" | "approval" | "message";

export type Emission =
  | { type: "activity"; event: Omit<ActivityEvent, "id" | "at"> }
  | { type: "chat"; message: Omit<ChatMessage, "id" | "at"> }
  | { type: "approval"; approval: Approval }
  | { type: "sound"; name: SoundName };

/* ------------------------------------------------------------------ */
/* Creation                                                            */
/* ------------------------------------------------------------------ */

export function buildScript(plan: Plan): ScriptEvent[] {
  const script: ScriptEvent[] = [];
  let t = 700;
  for (const task of plan.tasks) {
    script.push({ type: "task-start", at: t, taskId: task.id });
    for (const s of task.steps) {
      t += s.delay;
      script.push({ type: "step", at: t, taskId: task.id, agentId: task.agentId, message: s.message, detail: s.detail });
    }
    if (task.approval) {
      if (task.handoff) {
        t += 300;
        script.push({ type: "handoff", at: t, from: task.agentId, to: task.handoff.to, message: task.handoff.message });
      }
      t += 400;
      script.push({ type: "approval", at: t, taskId: task.id });
      continue;
    }
    t += 500;
    script.push({ type: "task-complete", at: t, taskId: task.id, output: task.output });
    if (task.handoff) {
      t += 350;
      script.push({ type: "handoff", at: t, from: task.agentId, to: task.handoff.to, message: task.handoff.message });
    }
  }
  t += 900;
  script.push({ type: "complete", at: t });
  return script;
}

export function createMission(plan: Plan, number: number, now = Date.now()): Mission {
  const tasks: MissionTask[] = plan.tasks.map((t) => ({
    id: t.id,
    label: t.label,
    agentId: t.agentId,
    kind: t.kind,
    dependsOn: t.dependsOn,
    status: "waiting",
  }));
  return {
    id: `m${number}`,
    number,
    title: plan.title,
    objective: plan.objective,
    status: "running",
    agents: plan.agents,
    tasks,
    approvals: [],
    createdAt: now,
    progress: 0,
    elapsed: 0,
    speed: 1,
    script: buildScript(plan),
    cursor: 0,
    resultKind: plan.resultKind,
    entities: plan.entities,
    lead: plan.lead,
    plannedApprovals: Object.fromEntries(
      plan.tasks.flatMap((t) => (t.approval ? [[t.id, { kind: t.approval.kind, title: t.approval.title, detail: t.approval.detail }]] : [])),
    ),
  };
}

function plannedApproval(m: Mission, taskId: string) {
  return m.plannedApprovals?.[taskId];
}

/* ------------------------------------------------------------------ */
/* Simulation                                                          */
/* ------------------------------------------------------------------ */

function progressOf(tasks: MissionTask[]): number {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => t.status === "complete" || t.status === "skipped").length;
  const running = tasks.filter((t) => t.status === "running").length;
  return Math.min(0.99, (done + running * 0.4) / tasks.length);
}

function setTask(tasks: MissionTask[], id: string, patch: Partial<MissionTask>): MissionTask[] {
  return tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
}

function eventAgent(m: Mission, e: ScriptEvent): AgentId | undefined {
  if (e.type === "step") return e.agentId;
  if (e.type === "handoff") return e.from;
  if (e.type === "task-start" || e.type === "task-complete" || e.type === "approval") return m.tasks.find((t) => t.id === e.taskId)?.agentId;
  return undefined;
}

/**
 * Advance a mission's clock by `dt` ms of real time.
 * `pausedAgents` holds the clock when the next beat belongs to a paused agent.
 */
export function advanceMission(
  mission: Mission,
  dt: number,
  pausedAgents: AgentId[] = [],
  now = Date.now(),
): { mission: Mission; emissions: Emission[] } {
  if (mission.status !== "running") return { mission, emissions: [] };
  const next = mission.script[mission.cursor];
  if (next) {
    const a = eventAgent(mission, next);
    if (a && pausedAgents.includes(a)) return { mission, emissions: [] };
  }

  const emissions: Emission[] = [];
  let m: Mission = { ...mission, elapsed: mission.elapsed + dt * mission.speed };

  while (m.cursor < m.script.length && m.script[m.cursor].at <= m.elapsed) {
    const e = m.script[m.cursor];
    const agent = eventAgent(m, e);
    if (agent && pausedAgents.includes(agent)) {
      m.elapsed = e.at;
      break;
    }
    m = { ...m, cursor: m.cursor + 1 };

    switch (e.type) {
      case "task-start":
        m.tasks = setTask(m.tasks, e.taskId, { status: "running" });
        break;
      case "step":
        emissions.push({
          type: "activity",
          event: {
            missionId: m.id,
            taskId: e.taskId,
            actor: e.agentId,
            kind: /\d/.test(e.message) && !/^(Scanning|Requesting|Scheduling)/.test(e.message) ? "result" : "action",
            message: e.message,
            detail: e.detail,
          },
        });
        break;
      case "task-complete":
        m.tasks = setTask(m.tasks, e.taskId, { status: "complete", output: e.output });
        break;
      case "handoff":
        emissions.push({ type: "activity", event: { missionId: m.id, actor: e.from, to: e.to, kind: "handoff", message: e.message } });
        if (e.to !== "user") {
          emissions.push({ type: "chat", message: { author: e.from, to: e.to, text: e.message, missionId: m.id } });
          emissions.push({ type: "sound", name: "message" });
        }
        break;
      case "approval": {
        const task = m.tasks.find((t) => t.id === e.taskId);
        const meta = plannedApproval(m, e.taskId);
        if (!task || !meta) break;
        const approval: Approval = {
          id: uid("apv"),
          missionId: m.id,
          taskId: task.id,
          agentId: task.agentId,
          kind: meta.kind,
          title: meta.title,
          detail: meta.detail,
          status: "pending",
          createdAt: now,
        };
        m.tasks = setTask(m.tasks, task.id, { status: "blocked" });
        m.approvals = [...m.approvals, approval.id];
        m.status = "awaiting-approval";
        m.elapsed = e.at;
        emissions.push({ type: "approval", approval });
        emissions.push({ type: "activity", event: { missionId: m.id, actor: task.agentId, kind: "approval", message: `Approval required: ${meta.title}.` } });
        emissions.push({
          type: "chat",
          message: {
            author: task.agentId,
            text: meta.kind === "access" ? `${meta.title}. ${meta.detail}` : `${meta.detail}`,
            missionId: m.id,
            actions: [{ kind: "approval", approvalId: approval.id }],
          },
        });
        emissions.push({ type: "sound", name: "approval" });
        break;
      }
      case "complete": {
        m.status = "complete";
        m.completedAt = now;
        m.progress = 1;
        m.tasks = m.tasks.map((t) => (t.status === "skipped" ? t : { ...t, status: "complete" }));
        m.results = generateResults(m);
        emissions.push({ type: "activity", event: { missionId: m.id, actor: "z80", kind: "system", message: `Job ${m.number} done.` } });
        emissions.push({
          type: "chat",
          message: {
            author: "manager",
            text: `${m.results.headline}\n${m.results.summary}`,
            missionId: m.id,
            actions: [
              { kind: "view-results", missionId: m.id },
              { kind: "new-mission" },
            ],
          },
        });
        emissions.push({ type: "sound", name: "complete" });
        break;
      }
    }
    if (m.status !== "running") break;
  }

  if (m.status !== "complete") m.progress = progressOf(m.tasks);
  return { mission: m, emissions };
}

/** Apply a human decision to a pending approval. */
export function resolveMissionApproval(
  mission: Mission,
  approval: Approval,
  decision: "approved" | "denied",
): { mission: Mission; emissions: Emission[] } {
  const emissions: Emission[] = [];
  let m: Mission = { ...mission, status: mission.status === "awaiting-approval" ? "running" : mission.status };
  const verb = approval.kind === "access" ? (decision === "approved" ? "Access allowed" : "Access denied") : decision === "approved" ? "Approved" : "Held";
  emissions.push({ type: "activity", event: { missionId: m.id, actor: "user", kind: "approval", message: `${verb}: ${approval.title}.` } });

  if (decision === "approved") {
    m.tasks = setTask(m.tasks, approval.taskId, { status: "complete" });
  } else {
    m.tasks = setTask(m.tasks, approval.taskId, { status: "skipped" });
    if (approval.kind === "review") {
      const launchIds = m.tasks.filter((t) => t.kind === "launch").map((t) => t.id);
      m.tasks = m.tasks.map((t) => (launchIds.includes(t.id) ? { ...t, status: "skipped" } : t));
      m.script = m.script.filter((e, i) => i < m.cursor || !("taskId" in e) || !launchIds.includes(e.taskId));
      m.outreachHeld = true;
      emissions.push({
        type: "activity",
        event: { missionId: m.id, actor: "manager", kind: "action", message: "Outreach held. Prospects and drafts saved for your edits." },
      });
    } else {
      emissions.push({
        type: "activity",
        event: { missionId: m.id, actor: approval.agentId, kind: "action", message: "Continuing without CRM access. Duplicate check skipped." },
      });
    }
  }
  m.progress = progressOf(m.tasks);
  return { mission: m, emissions };
}

/** Demo control: simulate a lost connection. */
export function interruptMission(mission: Mission): { mission: Mission; emissions: Emission[] } {
  if (mission.status !== "running") return { mission, emissions: [] };
  const running = mission.tasks.find((t) => t.status === "running");
  const agentId = running?.agentId ?? mission.agents[0]?.agentId ?? "lead-hunter";
  const m: Mission = {
    ...mission,
    status: "interrupted",
    interruption: { agentId, integration: "Google Drive", message: "lost access to Google Drive." },
  };
  return {
    mission: m,
    emissions: [
      { type: "activity", event: { missionId: m.id, actor: agentId, kind: "system", message: "Lost access to Google Drive. Job paused." } },
      { type: "sound", name: "approval" },
    ],
  };
}

export function recoverMission(mission: Mission, mode: "reconnect" | "continue"): { mission: Mission; emissions: Emission[] } {
  if (mission.status !== "interrupted") return { mission, emissions: [] };
  const agentId = mission.interruption?.agentId ?? "manager";
  const m: Mission = { ...mission, status: "running", interruption: undefined };
  return {
    mission: m,
    emissions: [
      {
        type: "activity",
        event: {
          missionId: m.id,
          actor: mode === "reconnect" ? "user" : agentId,
          kind: "system",
          message: mode === "reconnect" ? "Google Drive reconnected. Job back on." : "Continuing without Google Drive.",
        },
      },
    ],
  };
}

/** Fast-forward a fresh mission until it reaches a state (used for demo seeding). */
export function fastForward(mission: Mission, until: "approval" | "complete", now: number) {
  let m = mission;
  const out: Emission[] = [];
  let guard = 0;
  while (guard++ < 400) {
    const r = advanceMission(m, 500, [], now);
    m = r.mission;
    out.push(...r.emissions);
    if (until === "approval" && m.status === "awaiting-approval") break;
    if (m.status === "complete") break;
    if (m.status === "awaiting-approval" && until === "complete") {
      const apvEmission = r.emissions.find((e) => e.type === "approval");
      if (apvEmission && apvEmission.type === "approval") {
        const res = resolveMissionApproval(m, apvEmission.approval, "approved");
        m = res.mission;
        out.push({ type: "approval", approval: { ...apvEmission.approval, status: "approved", resolvedAt: now } });
        out.push(...res.emissions);
      }
    }
  }
  return { mission: m, emissions: out };
}
