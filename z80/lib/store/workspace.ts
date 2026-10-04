"use client";

/**
 * Workspace store — the client-side state for the product demo.
 *
 * A tiny external store (no dependency) read through `useWorkspace(selector)`.
 * All business logic lives in lib/services; this file only wires services to
 * state, persists to localStorage, and drives the mission simulator clock.
 */
import { useRef, useSyncExternalStore } from "react";
import { defaultPermissions } from "@/data/permissions";
import { memoryDomains } from "@/data/memory";
import { requestChat, requestPlan } from "@/lib/api";
import { agentReply } from "@/lib/services/chatService";
import {
  advanceMission,
  createMission,
  fastForward,
  interruptMission,
  recoverMission,
  resolveMissionApproval,
  type Emission,
} from "@/lib/services/missionService";
import { createPlan, retargetPlan } from "@/lib/services/planService";
import { playSound } from "@/lib/sound";
import { uid } from "@/lib/utils";
import type {
  ActivityEvent,
  AgentId,
  Approval,
  ChatMessage,
  Mission,
  Organization,
  PermissionLevel,
  PermissionRule,
  Plan,
  WorkspaceSettings,
} from "@/types";

export interface WorkspaceState {
  hydrated: boolean;
  org: Organization | null;
  onboarded: boolean;
  missions: Record<string, Mission>;
  /** Newest first. */
  missionOrder: string[];
  approvals: Record<string, Approval>;
  /** Newest first. */
  activity: ActivityEvent[];
  /** Oldest first. The single Command conversation. */
  chat: ChatMessage[];
  /** Direct threads with individual intelligences. */
  threads: Record<AgentId, ChatMessage[]>;
  plans: Record<string, Plan>;
  /** planId → missionId once deployed. */
  deployedPlans: Record<string, string>;
  /** Organization memory items by domain id. */
  memory: Record<string, string[]>;
  /** Integrations the user asked to be notified about. */
  interest: string[];
  permissions: PermissionRule[];
  connections: Record<string, boolean>;
  pausedAgents: AgentId[];
  settings: WorkspaceSettings;
  nextMissionNumber: number;
  /** Z80 is composing a reply. */
  thinking: boolean;
}

const STORAGE_KEY = "z80.workspace.v2";
const ACTIVITY_CAP = 600;
const CHAT_CAP = 300;

function emptyState(): WorkspaceState {
  return {
    hydrated: false,
    org: null,
    onboarded: false,
    missions: {},
    missionOrder: [],
    approvals: {},
    activity: [],
    chat: [],
    threads: {},
    plans: {},
    deployedPlans: {},
    memory: Object.fromEntries(memoryDomains.map((d) => [d.id, d.items])),
    interest: [],
    permissions: defaultPermissions,
    connections: {},
    pausedAgents: [],
    settings: { sound: false, demoSpeed: 1 },
    nextMissionNumber: 248,
    thinking: false,
  };
}

/* ------------------------------------------------------------------ */
/* Store core                                                          */
/* ------------------------------------------------------------------ */

let state: WorkspaceState = emptyState();
const listeners = new Set<() => void>();
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function setState(patch: Partial<WorkspaceState> | ((s: WorkspaceState) => Partial<WorkspaceState>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  emit();
  schedulePersist();
}

function schedulePersist() {
  if (!state.hydrated || typeof window === "undefined") return;
  // Throttle, not debounce: the mission clock changes state every 200ms,
  // so a debounce would never fire while anything is running.
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      const { hydrated: _h, thinking: _t, ...rest } = state;
      void _h;
      void _t;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    } catch {
      /* storage full or unavailable — demo keeps working in memory */
    }
  }, 400);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getWorkspace(): WorkspaceState {
  return state;
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    return ka.length === kb.length && ka.every((k) => Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
  }
  return false;
}

/** Subscribe to a slice of the workspace. Selectors may return new arrays/objects; results are shallow-compared. */
export function useWorkspace<T>(selector: (s: WorkspaceState) => T): T {
  const cache = useRef<{ v: T } | null>(null);
  const get = () => {
    const v = selector(state);
    if (cache.current && shallowEqual(cache.current.v, v)) return cache.current.v;
    cache.current = { v };
    return v;
  };
  return useSyncExternalStore(subscribe, get, get);
}

/* ------------------------------------------------------------------ */
/* Emissions                                                           */
/* ------------------------------------------------------------------ */

function applyEmissions(emissions: Emission[], s: WorkspaceState, now = Date.now()): Partial<WorkspaceState> {
  if (!emissions.length) return {};
  let activity = s.activity;
  let chat = s.chat;
  let approvals = s.approvals;
  let i = 0;
  for (const e of emissions) {
    const at = now + i++;
    if (e.type === "activity") activity = [{ ...e.event, id: uid("ev"), at }, ...activity];
    else if (e.type === "chat") chat = [...chat, { ...e.message, id: uid("msg"), at }];
    else if (e.type === "approval") approvals = { ...approvals, [e.approval.id]: e.approval };
    else if (e.type === "sound") playSound(e.name, s.settings.sound);
  }
  return {
    activity: activity.length > ACTIVITY_CAP ? activity.slice(0, ACTIVITY_CAP) : activity,
    chat: chat.length > CHAT_CAP ? chat.slice(-CHAT_CAP) : chat,
    approvals,
  };
}

/* ------------------------------------------------------------------ */
/* Demo seed                                                           */
/* ------------------------------------------------------------------ */

const SEED_ORG: Organization = {
  name: "Meridian Web Co.",
  description: "A web design studio for local service businesses.",
  focus: "More customers",
};

function seedState(now = Date.now()): WorkspaceState {
  const base = emptyState();
  base.org = SEED_ORG;
  base.onboarded = true;
  const seeds: { n: number; objective: string; until: "approval" | "complete"; ago: number }[] = [
    { n: 244, objective: "Research my top five competitors and tell me where we can win.", until: "complete", ago: 26 * 3600e3 },
    { n: 245, objective: "Organize our open projects and send me a status report.", until: "complete", ago: 3 * 3600e3 },
    { n: 246, objective: "Launch our spring promo campaign for the website care plan.", until: "approval", ago: 52 * 60e3 },
    { n: 247, objective: "Re-engage our cold leads from Q3 with a personalized follow-up.", until: "approval", ago: 9 * 60e3 },
  ];
  for (const seed of seeds) {
    const created = now - seed.ago;
    const plan = createPlan(seed.objective, SEED_ORG);
    let m = createMission(plan, seed.n, created);
    const res = fastForward(m, seed.until, created + 60e3);
    m = { ...res.mission, createdAt: created };
    if (m.status === "complete") m.completedAt = created + 14 * 60e3;
    // Spread activity timestamps across the mission's runtime.
    const span = (m.completedAt ?? now - 30e3) - created;
    const count = res.emissions.length || 1;
    res.emissions.forEach((e, idx) => {
      const at = Math.round(created + (span * (idx + 1)) / (count + 1));
      if (e.type === "activity") base.activity.unshift({ ...e.event, id: uid("ev"), at });
      if (e.type === "approval") base.approvals[e.approval.id] = { ...e.approval, createdAt: at };
    });
    base.missions[m.id] = m;
    base.missionOrder.unshift(m.id);
  }
  base.activity.sort((a, b) => b.at - a.at);
  base.connections = { web: true };
  base.hydrated = true;
  return base;
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

function chatMessage(m: Omit<ChatMessage, "id" | "at">): ChatMessage {
  return { ...m, id: uid("msg"), at: Date.now() };
}

export const workspace = {
  /** Load persisted workspace (or seed the demo). Call once on the client. */
  init() {
    if (state.hydrated) return;
    let loaded: WorkspaceState | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = { ...emptyState(), ...JSON.parse(raw), hydrated: true, thinking: false };
    } catch {
      loaded = null;
    }
    state = loaded ?? seedState();
    emit();
    schedulePersist();
  },

  /** Advance every running mission. Called by the runner. */
  tick(dt: number) {
    const s = state;
    const running = s.missionOrder.filter((id) => s.missions[id]?.status === "running");
    if (!running.length) return;
    const missions = { ...s.missions };
    const all: Emission[] = [];
    for (const id of running) {
      const r = advanceMission(missions[id], dt * s.settings.demoSpeed, s.pausedAgents);
      missions[id] = r.mission;
      all.push(...r.emissions);
    }
    setState({ missions, ...applyEmissions(all, s) });
  },

  /** Send a message in the Command conversation. */
  async sendCommand(text: string) {
    const t = text.trim();
    if (!t) return;
    setState((s) => ({ chat: [...s.chat, chatMessage({ author: "user", text: t })], thinking: true }));
    const started = Date.now();
    const s = state;
    const reply = await requestChat(t, {
      org: s.org,
      missions: s.missionOrder.map((id) => s.missions[id]),
      approvals: Object.values(s.approvals),
    });
    // Give the analysis state a moment to be seen.
    const wait = Math.max(0, 1300 - (Date.now() - started));
    await new Promise((r) => setTimeout(r, wait));
    setState((cur) => {
      const plans = reply.plan ? { ...cur.plans, [reply.plan.id]: reply.plan } : cur.plans;
      const msg = chatMessage({
        author: "z80",
        text: reply.text,
        planId: reply.plan?.id,
        team: reply.plan?.agents.map((a) => a.agentId),
        actions: reply.plan
          ? [
              { kind: "review-plan", planId: reply.plan.id },
              { kind: "deploy-plan", planId: reply.plan.id },
            ]
          : undefined,
      });
      return { plans, chat: [...cur.chat, msg], thinking: false };
    });
    playSound("message", state.settings.sound);
  },

  /** Plan an objective without posting to the conversation (hero flow). */
  async plan(objective: string): Promise<Plan> {
    const plan = await requestPlan(objective, state.org);
    setState((s) => ({ plans: { ...s.plans, [plan.id]: plan } }));
    return plan;
  },

  /** Replace a plan's team after the user edits it. */
  updatePlanTeam(planId: string, agentIds: AgentId[], roles: Record<AgentId, string> = {}): Plan | null {
    const plan = state.plans[planId];
    if (!plan) return null;
    const next = retargetPlan(plan, agentIds, roles);
    setState((s) => ({ plans: { ...s.plans, [planId]: next } }));
    return next;
  },

  /** Deploy a plan as a running mission. Returns the mission id. */
  deploy(planId: string): string | null {
    const plan = state.plans[planId];
    if (!plan || !plan.agents.length) return null;
    const number = state.nextMissionNumber;
    const mission = createMission(plan, number);
    const names = plan.agents.length;
    setState((s) => ({
      missions: { ...s.missions, [mission.id]: mission },
      deployedPlans: { ...s.deployedPlans, [planId]: mission.id },
      missionOrder: [mission.id, ...s.missionOrder.filter((id) => id !== mission.id)],
      nextMissionNumber: number + 1,
      chat: [
        ...s.chat,
        chatMessage({
          author: "z80",
          text: `Team deployed. Mission ${String(number).padStart(4, "0")} is running with ${names === 1 ? "one intelligence" : `${names} intelligences`}. I'll bring you anything that needs a decision.`,
          missionId: mission.id,
          actions: [{ kind: "open-mission", missionId: mission.id }],
        }),
      ],
      activity: [
        { id: uid("ev"), actor: "user", kind: "system", at: Date.now(), missionId: mission.id, message: `Deployed mission ${String(number).padStart(4, "0")}: ${plan.title}.` },
        ...s.activity,
      ],
    }));
    playSound("deploy", state.settings.sound);
    return mission.id;
  },

  resolveApproval(approvalId: string, decision: "approved" | "denied") {
    const approval = state.approvals[approvalId];
    if (!approval || approval.status !== "pending") return;
    const mission = state.missions[approval.missionId];
    const resolved: Approval = { ...approval, status: decision, resolvedAt: Date.now() };
    if (!mission) {
      setState((s) => ({ approvals: { ...s.approvals, [approvalId]: resolved } }));
      return;
    }
    const r = resolveMissionApproval(mission, approval, decision);
    setState((s) => {
      const base = { ...s, approvals: { ...s.approvals, [approvalId]: resolved } };
      return { approvals: base.approvals, missions: { ...s.missions, [mission.id]: r.mission }, ...applyEmissions(r.emissions, base) };
    });
  },

  setMissionSpeed(missionId: string, speed: number) {
    const m = state.missions[missionId];
    if (!m) return;
    setState((s) => ({ missions: { ...s.missions, [missionId]: { ...m, speed } } }));
  },

  interrupt(missionId: string) {
    const m = state.missions[missionId];
    if (!m) return;
    const r = interruptMission(m);
    setState((s) => ({ missions: { ...s.missions, [missionId]: r.mission }, ...applyEmissions(r.emissions, s) }));
  },

  recover(missionId: string, mode: "reconnect" | "continue") {
    const m = state.missions[missionId];
    if (!m) return;
    const r = recoverMission(m, mode);
    setState((s) => ({ missions: { ...s.missions, [missionId]: r.mission }, ...applyEmissions(r.emissions, s) }));
  },

  togglePauseAgent(agentId: AgentId) {
    setState((s) => {
      const paused = s.pausedAgents.includes(agentId);
      return {
        pausedAgents: paused ? s.pausedAgents.filter((a) => a !== agentId) : [...s.pausedAgents, agentId],
        activity: [
          { id: uid("ev"), actor: "user", to: agentId, kind: "system", at: Date.now(), message: paused ? "Resumed intelligence." : "Paused intelligence." },
          ...s.activity,
        ],
      };
    });
  },

  setPermission(id: string, level: PermissionLevel) {
    setState((s) => ({ permissions: s.permissions.map((p) => (p.id === id ? { ...p, level } : p)) }));
  },

  /** Demo-only: connections are simulated; nothing contacts a third party. */
  toggleConnection(id: string) {
    setState((s) => ({ connections: { ...s.connections, [id]: !s.connections[id] } }));
  },

  messageAgent(agentId: AgentId, text: string) {
    const t = text.trim();
    if (!t) return;
    const s = state;
    const userMsg = chatMessage({ author: "user", to: agentId, text: t });
    setState((cur) => ({ threads: { ...cur.threads, [agentId]: [...(cur.threads[agentId] ?? []), userMsg] } }));
    setTimeout(() => {
      const reply = agentReply(agentId, t, {
        org: s.org,
        missions: s.missionOrder.map((id) => s.missions[id]),
        approvals: Object.values(s.approvals),
      });
      setState((cur) => ({
        threads: { ...cur.threads, [agentId]: [...(cur.threads[agentId] ?? []), chatMessage({ author: agentId, text: reply })] },
      }));
      playSound("message", state.settings.sound);
    }, 900);
  },

  addMemory(domainId: string, item: string) {
    const t = item.trim();
    if (!t) return;
    setState((s) => ({ memory: { ...s.memory, [domainId]: [...(s.memory[domainId] ?? []), t] } }));
  },

  removeMemory(domainId: string, index: number) {
    setState((s) => ({ memory: { ...s.memory, [domainId]: (s.memory[domainId] ?? []).filter((_, i) => i !== index) } }));
  },

  toggleInterest(integrationId: string) {
    setState((s) => ({ interest: s.interest.includes(integrationId) ? s.interest.filter((i) => i !== integrationId) : [...s.interest, integrationId] }));
  },

  setOrg(org: Organization) {
    setState({ org, onboarded: true });
  },

  setSettings(patch: Partial<WorkspaceSettings>) {
    setState((s) => ({ settings: { ...s.settings, ...patch } }));
  },

  clearConversation() {
    setState({ chat: [] });
  },

  /** Restore the seeded demo workspace. */
  resetDemo() {
    const settings = state.settings;
    state = { ...seedState(), settings };
    emit();
    schedulePersist();
  },

  /** Empty workspace — shows the product's empty states. */
  clearWorkspace() {
    const settings = state.settings;
    state = { ...emptyState(), hydrated: true, settings, org: state.org, onboarded: state.onboarded };
    emit();
    schedulePersist();
  },
};

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export const selectMissions = (s: WorkspaceState) => s.missionOrder.map((id) => s.missions[id]).filter(Boolean);
export const selectPendingApprovals = (s: WorkspaceState) =>
  Object.values(s.approvals)
    .filter((a) => a.status === "pending")
    .sort((a, b) => b.createdAt - a.createdAt);
