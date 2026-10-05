/**
 * agentService — derives each intelligence's live state from the workspace.
 * Pure: swap the inputs for server state when agents run for real.
 */
import { agentOrFallback, getAgent } from "@/data/bots";
import type { ActivityEvent, Agent, AgentId, AgentState, Approval, Mission } from "@/types";

export interface AgentLiveState {
  agent: Agent;
  state: AgentState;
  /** One-line description of what the agent is doing right now. */
  doing: string;
  activeMissions: Mission[];
  tasksToday: number;
  pendingApprovals: Approval[];
  lastEvent?: ActivityEvent;
}

const STATE_LABEL: Record<AgentState, string> = {
  active: "Active",
  working: "Working",
  waiting: "Waiting",
  idle: "Standing by",
  paused: "Paused",
};

export function agentStateLabel(s: AgentState): string {
  return STATE_LABEL[s];
}

export function getAgentLiveState(
  agentId: AgentId,
  missions: Mission[],
  approvals: Approval[],
  activity: ActivityEvent[],
  paused: AgentId[],
  now = Date.now(),
): AgentLiveState | null {
  // Custom bots may not be registered on the very first render; fall back instead of failing.
  const agent = getAgent(agentId) ?? agentOrFallback(agentId);
  const mine = missions.filter((m) => m.agents.some((a) => a.agentId === agentId));
  const activeMissions = mine.filter((m) => m.status !== "complete");
  const pendingApprovals = approvals.filter((a) => a.agentId === agentId && a.status === "pending");
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const events = activity.filter((e) => e.actor === agentId);
  const tasksToday = mine
    .flatMap((m) => m.tasks.filter((t) => t.agentId === agentId && t.status === "complete").map(() => m))
    .filter((m) => (m.completedAt ?? m.createdAt) >= startOfDay.getTime() || m.status !== "complete").length;
  const lastEvent = events[0];
  const runningTask = activeMissions
    .filter((m) => m.status === "running")
    .flatMap((m) => m.tasks.filter((t) => t.status === "running" && t.agentId === agentId))[0];

  let state: AgentState = "idle";
  let doing =
    agent.availability !== "available" ? "Not yet available" : agentId === "lead-hunter" ? "Watching the market around the clock" : agentId === "manager" ? "Tracking reminders and follow-ups" : "On shift";
  if (paused.includes(agentId)) {
    state = "paused";
    doing = "Paused by you";
  } else if (pendingApprovals.length) {
    state = "waiting";
    doing = pendingApprovals[0].kind === "access" ? "Waiting for access approval" : "Approval requested";
  } else if (runningTask) {
    state = "working";
    doing = lastEvent?.missionId && activeMissions.some((m) => m.id === lastEvent.missionId) ? lastEvent.message : runningTask.label;
  } else if (activeMissions.length) {
    state = "active";
    doing = agentId === "manager" ? `Coordinating ${activeMissions.length} mission${activeMissions.length === 1 ? "" : "s"}` : `Assigned to ${activeMissions.length} mission${activeMissions.length === 1 ? "" : "s"}`;
  }
  return { agent, state, doing, activeMissions, tasksToday, pendingApprovals, lastEvent };
}
