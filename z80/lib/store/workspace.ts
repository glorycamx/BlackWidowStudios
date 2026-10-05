"use client";

/**
 * Workspace store: the client-side state for the product demo.
 *
 * A tiny external store (no dependency) read through `useWorkspace(selector)`.
 * Business logic lives in lib/services and lib/sim; this file wires them to
 * state, persists to localStorage, and drives the clock.
 */
import { useRef, useSyncExternalStore } from "react";
import { defaultPermissions } from "@/data/permissions";
import { memoryDomains } from "@/data/memory";
import { registerCustomBots, specToAgent, agentOrFallback, CUSTOM_COLORS } from "@/data/bots";
import { describeTrigger, LEGACY_BOT_IDS, routineFromTemplate, routineTemplates, emptyStats } from "@/data/routines";
import { seedSkills } from "@/data/skills";
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
import { createLeadPlan, createPlan, retargetPlan } from "@/lib/services/planService";
import * as clock from "@/lib/sim/clock";
import { isRoutineRequest, parseBotSpec, parseRoutine } from "@/lib/sim/parse";
import { jobLabel } from "@/lib/copy";
import { addQuietChecks, loadBeatCounts, makeBeat, pushBeat, resetBeats } from "@/lib/sim/heartbeats";
import { backfill, FEED_CAP, NOTICE_CAP, scheduleNext, step, TEAM_CAP, type SimStep } from "@/lib/sim/scheduler";
import { channelLabel, fillCalendar } from "@/lib/sim/generators";
import { playSound } from "@/lib/sound";
import { parseClock, startOfDay } from "@/lib/time";
import { hashString, prng, uid } from "@/lib/utils";
import type {
  ActivityEvent,
  AgentId,
  AgentVisual,
  Approval,
  AwaySummary,
  ChatMessage,
  CustomBotSpec,
  FeedItem,
  Mission,
  Notice,
  Organization,
  PermissionLevel,
  PermissionRule,
  Plan,
  Routine,
  ScheduledPost,
  Skill,
  TeamMessage,
  Trigger,
  RoutineEngine,
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
  /** Oldest first. The conversation with Manager. */
  chat: ChatMessage[];
  /** Direct threads with individual bots. */
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
  /** Manager is composing a reply. */
  thinking: boolean;
  /** Jobs each bot keeps doing. */
  routines: Routine[];
  /** What the bots found or did. Newest first. */
  feed: FeedItem[];
  /** The content calendar, oldest first. */
  posts: ScheduledPost[];
  /** Bots talking to each other. Oldest first. */
  teamChat: TeamMessage[];
  skills: Skill[];
  customBots: CustomBotSpec[];
  nicknames: Record<string, string>;
  /** Bell and toasts. Newest first. */
  notices: Notice[];
  /** Last moment the app was open and visible. */
  lastSeenAt: number;
  /** Set when the bots did things while you were away. */
  away: AwaySummary | null;
  /** Non-null while time traveling (nothing is saved in that mode). */
  traveling: string | null;
}

const STORAGE_KEY = "z80.workspace.v4";
const LEGACY_KEY = "z80.workspace.v3";
const ACTIVITY_CAP = 600;
const CHAT_CAP = 300;
/** Gaps shorter than this don't count as "away". */
const AWAY_MS = 2 * 60e3;

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  sound: false,
  demoSpeed: 1,
  morningTextAt: "06:00",
  recapAt: "18:00",
  quietFrom: "22:00",
  quietTo: "06:00",
  browserAlerts: false,
};

function defaultRoutines(now: number): Routine[] {
  return routineTemplates.map((t) => routineFromTemplate(t, now - 14 * 86400e3));
}

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
    settings: DEFAULT_SETTINGS,
    nextMissionNumber: 248,
    thinking: false,
    routines: defaultRoutines(0),
    feed: [],
    posts: [],
    teamChat: [],
    skills: seedSkills(0),
    customBots: [],
    nicknames: {},
    notices: [],
    lastSeenAt: 0,
    away: null,
    traveling: null,
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
  if (!state.hydrated || state.traveling || typeof window === "undefined") return;
  // Throttle, not debounce: the mission clock changes state every 200ms,
  // so a debounce would never fire while anything is running.
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      const { hydrated: _h, thinking: _t, traveling: _v, ...rest } = state;
      void _h;
      void _t;
      void _v;
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

const JOB_CAP = 40;

/** Keep memory bounded: drop the oldest finished jobs past the cap. */
function trimJobs(missions: Record<string, Mission>, order: string[]): { missions: Record<string, Mission>; missionOrder: string[] } {
  if (order.length <= JOB_CAP) return { missions, missionOrder: order };
  const keep = [...order];
  const next = { ...missions };
  for (let i = keep.length - 1; i >= 0 && keep.length > JOB_CAP; i--) {
    const m = next[keep[i]];
    if (!m || m.status === "complete") {
      delete next[keep[i]];
      keep.splice(i, 1);
    }
  }
  return { missions: next, missionOrder: keep };
}

const PLAN_CAP = 60;

/** Keep the newest plans (insertion order) and their deploy links. */
function trimPlans(plans: Record<string, Plan>, deployed: Record<string, string>): { plans: Record<string, Plan>; deployedPlans: Record<string, string> } {
  const ids = Object.keys(plans);
  if (ids.length <= PLAN_CAP) return { plans, deployedPlans: deployed };
  const keep = new Set(ids.slice(-PLAN_CAP));
  return {
    plans: Object.fromEntries(Object.entries(plans).filter(([id]) => keep.has(id))),
    deployedPlans: Object.fromEntries(Object.entries(deployed).filter(([id]) => keep.has(id))),
  };
}

/** Activity log lines and sounds for new finds. */
function findEmissions(finds: FeedItem[]): Emission[] {
  const out: Emission[] = [];
  for (const f of finds) {
    if (f.kind === "lead" && f.lead) {
      out.push({ type: "activity", event: { actor: f.botId, kind: "result", message: `New ${f.lead.temperature} lead: ${f.lead.business}. ${f.trigger}.`, detail: [f.summary, `${f.lead.recommended.offer} · ${f.lead.recommended.price}`] } });
      out.push({ type: "sound", name: f.lead.temperature === "hot" ? "approval" : "message" });
    } else if (f.kind === "post") {
      out.push({ type: "activity", event: { actor: f.botId, kind: "action", message: `${f.title}, on the minute.` } });
    } else if (f.kind === "digest") {
      out.push({ type: "activity", event: { actor: f.botId, kind: "action", message: `Sent your ${f.trigger.toLowerCase()}.` } });
    } else {
      out.push({ type: "activity", event: { actor: f.botId, kind: "result", message: `${f.trigger}: ${f.title}.` } });
    }
  }
  return out;
}

function mergeNotices(cur: Notice[], add: Notice[]): Notice[] {
  if (!add.length) return cur;
  const ids = new Set(cur.map((n) => n.id));
  const fresh = add.filter((n) => !ids.has(n.id));
  if (!fresh.length) return cur;
  return [...fresh.reverse(), ...cur].slice(0, NOTICE_CAP);
}

function appendTeam(cur: TeamMessage[], add: TeamMessage[]): TeamMessage[] {
  if (!add.length) return cur;
  const next = [...cur, ...add].sort((a, b) => a.at - b.at);
  return next.length > TEAM_CAP ? next.slice(-TEAM_CAP) : next;
}

function simSlice(s: WorkspaceState) {
  return {
    routines: s.routines,
    feed: s.feed,
    posts: s.posts,
    pendingApprovals: Object.values(s.approvals).filter((a) => a.status === "pending").length,
    pausedBots: s.pausedAgents,
    quiet: [parseClock(s.settings.quietFrom ?? "22:00") ?? 1320, parseClock(s.settings.quietTo ?? "06:00") ?? 360] as [number, number],
  };
}

/** Give every routine a next run time, staggered so they don't all fire at once. */
function armRoutines(routines: Routine[], now: number, speed: number): Routine[] {
  return routines.map((r) => {
    if (r.status !== "on") return r;
    if (r.trigger.kind === "event") return { ...r, nextRunAt: 0 };
    // Keep countdowns that are still ahead (a reload shouldn't reset them).
    if (r.nextRunAt && r.nextRunAt > now) return r;
    return { ...r, nextRunAt: scheduleNext(r, now, speed, true) };
  });
}

function summarize(res: SimStep, from: number, to: number, checks: number): AwaySummary {
  const f = res.finds;
  const leads = f.filter((x) => x.kind === "lead");
  const ranked = [...f]
    .filter((x) => x.kind !== "post")
    .sort((a, b) => (b.lead?.temperature === "hot" ? 1 : 0) - (a.lead?.temperature === "hot" ? 1 : 0) || b.at - a.at);
  return {
    from,
    to,
    leads: leads.length,
    hot: leads.filter((x) => x.lead?.temperature === "hot").length,
    posts: f.filter((x) => x.kind === "post").length,
    briefs: f.filter((x) => x.kind === "brief").length,
    opportunities: f.filter((x) => x.kind === "opportunity").length,
    checks,
    top: ranked.slice(0, 3).map((x) => x.id),
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

function seedState(now = clock.now()): WorkspaceState {
  const base = emptyState();
  base.org = SEED_ORG;
  base.onboarded = true;
  base.skills = seedSkills(now);
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
  base.activity.sort((a, b) => b.at - a.at);
  base.connections = { web: true };

  // The bots have been on shift all night: replay from midnight (at least 9 hours).
  base.routines = defaultRoutines(now);
  const from = Math.min(startOfDay(now), now - 9 * 3600e3);
  const cc = base.routines.find((r) => r.engine === "keep-drafted")!;
  base.posts = fillCalendar([], from, from, 8, cc.id, cc.doWithoutAsking);
  // One post a couple of minutes out, so you can watch it go out on the minute.
  const soon = Math.ceil((now + 150e3) / 60e3) * 60e3;
  base.posts = [
    ...base.posts,
    { id: `p-${soon}`, channel: "instagram" as const, scheduledFor: soon, status: "scheduled" as const, caption: "Fresh this week: we rebuilt a bakery's site and online orders doubled. Small changes, big week.", visualHint: "Bakery counter with a phone showing the order page", routineId: "r-post-schedule" },
  ].sort((a, b) => a.scheduledFor - b.scheduledFor);
  const res = backfill(simSlice(base), from, now, { maxFinds: 48 });
  base.routines = res.routines;
  base.posts = res.posts;
  base.feed = res.feed.map((f) => ({ ...f, read: f.at < now - 60 * 60e3 || f.kind === "post" }));
  base.teamChat = res.team.slice(-TEAM_CAP);
  base.notices = mergeNotices([], res.notices.map((n) => ({ ...n, read: n.at < now - 60 * 60e3 }))).slice(0, 20);
  const findEvents = findEmissions(res.finds).filter((e): e is Extract<Emission, { type: "activity" }> => e.type === "activity");
  res.finds.forEach((f, i) => {
    const e = findEvents[i];
    if (e) base.activity.push({ ...e.event, id: uid("ev"), at: f.at });
  });
  base.activity.sort((a, b) => b.at - a.at);
  base.activity = base.activity.slice(0, ACTIVITY_CAP);
  addQuietChecks(
    Object.fromEntries(Object.entries(res.checks).map(([k, v]) => [k, { ...v, n: Math.round(v.n * Math.min(1, (now - startOfDay(now)) / Math.max(1, now - from))) }])),
    now,
    !clock.traveling(),
  );
  base.lastSeenAt = now;
  base.hydrated = true;
  return base;
}

/** Bring v3 data forward: keep what the owner set up, reseed the rest. */
function migrateV3(raw: string, now: number): WorkspaceState | null {
  try {
    const old = JSON.parse(raw) as Partial<WorkspaceState> & { threads?: Record<string, ChatMessage[]> };
    const mapId = (id: string) => LEGACY_BOT_IDS[id] ?? id;
    const fresh = seedState(now);
    const threads: Record<string, ChatMessage[]> = {};
    for (const [k, v] of Object.entries(old.threads ?? {})) {
      if (Array.isArray(v)) threads[mapId(k)] = v.map((m) => ({ ...m, author: mapId(String(m.author)), to: m.to ? mapId(String(m.to)) : m.to }));
    }
    return {
      ...fresh,
      org: old.org ?? fresh.org,
      onboarded: old.onboarded ?? fresh.onboarded,
      memory: old.memory && typeof old.memory === "object" ? old.memory : fresh.memory,
      permissions: Array.isArray(old.permissions) ? old.permissions : fresh.permissions,
      connections: old.connections && typeof old.connections === "object" ? old.connections : fresh.connections,
      interest: Array.isArray(old.interest) ? old.interest : fresh.interest,
      threads,
      pausedAgents: Array.isArray(old.pausedAgents) ? old.pausedAgents.map(mapId) : [],
      settings: { ...DEFAULT_SETTINGS, ...(old.settings ?? {}) },
    };
  } catch {
    return null;
  }
}

/** Parse saved v4 data defensively: anything odd falls back to defaults. */
function loadV4(raw: string): WorkspaceState | null {
  try {
    const saved = JSON.parse(raw) as Partial<WorkspaceState>;
    if (!saved || typeof saved !== "object") return null;
    const base = emptyState();
    const arr = <T,>(v: unknown, d: T[]): T[] => (Array.isArray(v) ? (v as T[]) : d);
    return {
      ...base,
      ...saved,
      routines: arr(saved.routines, base.routines).map((r) => ({ ...r, stats: { ...emptyStats(), ...(r.stats ?? {}) } })),
      feed: arr(saved.feed, []),
      posts: arr(saved.posts, []),
      teamChat: arr(saved.teamChat, []),
      skills: arr(saved.skills, base.skills),
      customBots: arr(saved.customBots, []),
      notices: arr(saved.notices, []),
      activity: arr(saved.activity, []),
      chat: arr(saved.chat, []),
      missionOrder: arr(saved.missionOrder, []),
      settings: { ...DEFAULT_SETTINGS, ...(saved.settings ?? {}) },
      nicknames: saved.nicknames ?? {},
      hydrated: true,
      thinking: false,
      traveling: null,
      away: saved.away ?? null,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Clock-driven work (heartbeats and routines)                          */
/* ------------------------------------------------------------------ */

const nextBeatAt: Record<string, number> = {};
const beatCount: Record<string, number> = {};

function beatGap(botId: string, n: number, speed: number) {
  const r = prng(hashString(`${botId}:hb:${n}`));
  return (2600 + r() * 4200) / Math.max(1, speed);
}

/** Every bot on shift checks something every few seconds. */
function runHeartbeats(s: WorkspaceState, now: number) {
  const onShift = new Map<string, Routine[]>();
  for (const r of s.routines) {
    if (r.status !== "on" || s.pausedAgents.includes(r.botId)) continue;
    onShift.set(r.botId, [...(onShift.get(r.botId) ?? []), r]);
  }
  for (const [botId, list] of onShift) {
    if (!nextBeatAt[botId]) {
      nextBeatAt[botId] = now + 300 + Math.random() * 1800;
      continue;
    }
    if (now < nextBeatAt[botId]) continue;
    const n = (beatCount[botId] = (beatCount[botId] ?? 0) + 1);
    const routine = list[n % list.length];
    pushBeat(makeBeat(routine, n + Math.floor(now / 1000), now), !s.traveling);
    nextBeatAt[botId] = now + beatGap(botId, n, s.settings.demoSpeed);
  }
}

function applySimStep(res: SimStep, s: WorkspaceState, now: number, live: boolean): Partial<WorkspaceState> {
  const patch: Partial<WorkspaceState> = {
    routines: res.routines,
    feed: res.feed,
    posts: res.posts,
    teamChat: appendTeam(s.teamChat, res.team),
    notices: mergeNotices(s.notices, res.notices),
  };
  if (!live) return patch;
  return { ...patch, ...applyEmissions(findEmissions(res.finds), { ...s, ...patch }, now) };
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

function chatMessage(m: Omit<ChatMessage, "id" | "at">): ChatMessage {
  return { ...m, id: uid("msg"), at: Date.now() };
}

/** Catch up on everything that happened between `from` and now. */
function catchUp(from: number, now: number, showAway: boolean) {
  const s = state;
  const res = backfill(simSlice(s), from, now, { maxFinds: 40 });
  const checks = Object.values(res.checks).reduce((a, c) => a + c.n, 0);
  addQuietChecks(res.checks, now, !s.traveling);
  const patch = applySimStep(res, s, now, false);
  const away = showAway && (res.finds.length || checks) ? summarize(res, from, now, checks) : s.away;
  // Backfilled activity uses the time it happened.
  const backfilledActivity = findEmissions(res.finds)
    .filter((e): e is Extract<Emission, { type: "activity" }> => e.type === "activity")
    .map((e, i) => ({ ...e.event, id: uid("ev"), at: res.finds[i]?.at ?? now }));
  state = {
    ...state,
    ...patch,
    activity: [...backfilledActivity.reverse(), ...s.activity].sort((a, b) => b.at - a.at).slice(0, ACTIVITY_CAP),
    routines: armRoutines(patch.routines ?? s.routines, now, s.settings.demoSpeed),
    lastSeenAt: now,
    away,
  };
}

let hiddenSince = 0;

/** "text me about my leads" → "text you about your leads", lower-cased first letter. */
function toYou(t: string) {
  const s = t.replace(/\bme\b/gi, "you").replace(/\bmy\b/gi, "your").replace(/\bI\b/g, "you");
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Manager's reply for routines and new bots, or null to fall through to planning. */
function managerQuickReply(t: string): Omit<ChatMessage, "id" | "at"> | null {
  if (/^(please )?(create|make|build|add|set up|i want|i need)( me)? (a |an |my own )?(new )?bot\b/i.test(t)) {
    const b = parseBotSpec(t);
    return {
      author: "manager",
      text: `Here's the bot I'd make.\n\n${b.name}: ${b.job.charAt(0).toLowerCase()}${b.job.slice(1)}. ${describeTrigger(b.trigger)}.\n\nIt goes on shift the moment you say so. Anything it sends waits for your yes.`,
      actions: [{ kind: "confirm-bot", ...b }],
    };
  }
  if (isRoutineRequest(t)) {
    const r = parseRoutine(t);
    const who = botName(state, r.botId);
    return {
      author: "manager",
      text: `That's ongoing, so I'll make it a routine.\n\n${who} will: ${toYou(r.title)}. ${describeTrigger(r.trigger)}.\n\nStart it?`,
      actions: [{ kind: "confirm-routine", ...r }],
    };
  }
  return null;
}

export const workspace = {
  /** Load persisted workspace (or seed the demo). Call once on the client. */
  init() {
    if (state.hydrated) return;
    const travel = clock.travelFromUrl();
    const now = clock.now();
    let loaded: WorkspaceState | null = null;
    if (!travel) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) loaded = loadV4(raw);
        else {
          const legacy = localStorage.getItem(LEGACY_KEY);
          if (legacy) loaded = migrateV3(legacy, now);
        }
      } catch {
        loaded = null;
      }
      loadBeatCounts(now);
    }
    if (travel) resetBeats();
    state = loaded ?? seedState(now);
    state = { ...state, hydrated: true, traveling: travel };
    registerCustomBots(state.customBots.map(specToAgent));
    if (loaded && state.lastSeenAt && now - state.lastSeenAt > AWAY_MS) {
      catchUp(state.lastSeenAt, now, true);
    } else {
      state = { ...state, routines: armRoutines(state.routines, now, state.settings.demoSpeed), lastSeenAt: now };
    }
    emit();
    schedulePersist();
  },

  /** The tab was hidden or shown. Hidden pauses the clock; showing again catches up. */
  visibility(hidden: boolean) {
    if (!state.hydrated) return;
    const now = clock.now();
    if (hidden) {
      hiddenSince = now;
      setState({ lastSeenAt: now });
      return;
    }
    const from = hiddenSince || state.lastSeenAt;
    hiddenSince = 0;
    if (from && now - from > AWAY_MS) {
      catchUp(from, now, true);
      emit();
      schedulePersist();
    } else setState((s) => ({ routines: armRoutines(s.routines, now, s.settings.demoSpeed).map((r, i) => (s.routines[i].nextRunAt > now ? s.routines[i] : r)), lastSeenAt: now }));
  },

  /** Advance running jobs and the bots' routines. Called every 200ms. */
  tick(dt: number) {
    if (!state.hydrated || clock.tabHidden()) return;
    const s = state;
    const now = clock.now();
    runHeartbeats(s, now);

    const running = s.missionOrder.filter((id) => s.missions[id]?.status === "running");
    const due = s.routines.some((r) => r.status === "on" && r.nextRunAt > 0 && now >= r.nextRunAt && !s.pausedAgents.includes(r.botId));
    const postDue = s.posts.some((p) => (p.status === "scheduled" && p.scheduledFor <= now) || (p.status === "needs-ok" && now >= p.scheduledFor - 2 * 3600e3));
    const seen = now - s.lastSeenAt > 5000;
    if (!running.length && !due && !postDue && !seen) return;

    let patch: Partial<WorkspaceState> = {};
    if (running.length) {
      const missions = { ...s.missions };
      const all: Emission[] = [];
      for (const id of running) {
        const r = advanceMission(missions[id], dt * s.settings.demoSpeed, s.pausedAgents);
        missions[id] = r.mission;
        all.push(...r.emissions);
      }
      patch = { missions, ...applyEmissions(all, s) };
    }

    let hot: FeedItem[] = [];
    if (due || postDue) {
      const res = step(simSlice({ ...s, ...patch }), now, s.settings.demoSpeed);
      const changed = res.finds.length || res.team.length || res.routines !== s.routines || res.posts !== s.posts || res.notices.some((n) => !s.notices.some((x) => x.id === n.id));
      if (changed) {
        patch = { ...patch, ...applySimStep(res, { ...s, ...patch }, now, true) };
        for (const f of res.finds) {
          pushBeat({ id: uid("hb"), botId: f.botId, routineId: f.routineId ?? "", at: now, text: `Found one: ${f.title}.`, url: f.lead?.currentWebsite && f.lead.currentWebsite !== "None" ? f.lead.currentWebsite : "z80.si/live" }, !s.traveling);
        }
        hot = res.finds.filter((f) => f.lead?.temperature === "hot");
      }
    }
    if (seen) patch.lastSeenAt = now;
    if (Object.keys(patch).length) setState(patch);

    // Hot leads get an opener either way. With "Do it without asking" on, an outreach job starts too
    // (sending still follows your permissions). Off, you tap Start outreach yourself.
    const openers = state.routines.find((r) => r.engine === "lead-openers" && r.status === "on" && r.doWithoutAsking);
    if (openers && !state.pausedAgents.includes(openers.botId)) for (const f of hot) workspace.deploySignal(f.id, { auto: true });
  },

  /** Send a message in the Command conversation. */
  async sendCommand(text: string) {
    const t = text.trim();
    if (!t) return;
    setState((s) => ({ chat: [...s.chat, chatMessage({ author: "user", text: t })], thinking: true }));
    // Ongoing asks become routines; "a bot that…" becomes a new bot. Both wait for a tap to start.
    const quick = managerQuickReply(t);
    if (quick) {
      await new Promise((r) => setTimeout(r, 900));
      setState((cur) => ({ chat: [...cur.chat, chatMessage(quick)], thinking: false }));
      playSound("message", state.settings.sound);
      return;
    }
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
        author: "manager",
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
      ...trimPlans(s.plans, { ...s.deployedPlans, [planId]: mission.id }),
      ...trimJobs({ ...s.missions, [mission.id]: mission }, [mission.id, ...s.missionOrder.filter((id) => id !== mission.id)]),
      nextMissionNumber: number + 1,
      chat: [
        ...s.chat,
        chatMessage({
          author: "manager",
          text: `Your bots are on it. ${jobLabel(number)} is running with ${names === 1 ? "one bot" : `${names} bots`}. They work on their own from here. I'll only interrupt you for a yes.`,
          missionId: mission.id,
          actions: [{ kind: "open-mission", missionId: mission.id }],
        }),
      ],
      activity: [
        { id: uid("ev"), actor: "user", kind: "system", at: Date.now(), missionId: mission.id, message: `Started ${jobLabel(number)}: ${plan.title}.` },
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
          { id: uid("ev"), actor: "user", to: agentId, kind: "system", at: Date.now(), message: paused ? "Back on shift." : "Paused." },
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

  /** Morning text and recap times also move their routines. */
  setReachTimes(patch: { morningTextAt?: string; recapAt?: string; quietFrom?: string; quietTo?: string }) {
    const now = clock.now();
    setState((s) => ({
      settings: { ...s.settings, ...patch },
      routines: s.routines.map((r) => {
        const t = r.engine === "morning-text" ? patch.morningTextAt : r.engine === "evening-recap" ? patch.recapAt : undefined;
        if (!t || r.trigger.kind !== "schedule") return r;
        const next = { ...r, trigger: { ...r.trigger, times: [t] } };
        return { ...next, nextRunAt: scheduleNext(next, now) };
      }),
    }));
  },

  clearConversation() {
    setState({ chat: [] });
  },

  /** Turn a lead into a one-lead outreach job. Returns the job id. */
  deploySignal(signalId: string, opts: { auto?: boolean } = {}): string | null {
    const sig = state.feed.find((x) => x.id === signalId);
    if (!sig?.lead) return null;
    if (sig.missionId && state.missions[sig.missionId]) return sig.missionId;
    const plan = createLeadPlan(sig.id, sig.lead);
    setState((cur) => ({ plans: { ...cur.plans, [plan.id]: plan } }));
    const missionId = workspace.deploy(plan.id);
    if (!missionId) return null;
    setState((cur) => ({
      feed: cur.feed.map((x) => (x.id === signalId ? { ...x, missionId, read: true } : x)),
      ...(opts.auto
        ? {
            chat: [
              ...cur.chat,
              chatMessage({
                author: "manager",
                text: `${sig.lead!.business} is a hot lead (${sig.trigger.toLowerCase()}). Content Creator wrote the opener and I started a job for it. Nothing gets sent until you say yes.`,
                missionId,
                actions: [{ kind: "open-mission", missionId }, { kind: "open-signal", signalId }],
              }),
            ],
          }
        : {}),
    }));
    return missionId;
  },

  /** Tap "Start it" on a routine or bot Manager proposed in Chat. */
  confirmChatAction(messageId: string) {
    const m = state.chat.find((x) => x.id === messageId);
    const a = m?.actions?.find((x) => x.kind === "confirm-routine" || x.kind === "confirm-bot");
    if (!m || !a || (a.kind !== "confirm-routine" && a.kind !== "confirm-bot") || a.done) return;
    let done = "";
    if (a.kind === "confirm-routine") done = workspace.addRoutine({ botId: a.botId, title: a.title, trigger: a.trigger, engine: a.engine }).id;
    else done = workspace.createBot({ name: a.name, job: a.job, keepDoing: a.keepDoing, trigger: a.trigger });
    setState((s) => ({ chat: s.chat.map((x) => (x.id === messageId ? { ...x, actions: x.actions?.map((y) => (y === a ? { ...a, done } : y)) } : x)) }));
  },

  /** Say something in Team chat. Manager passes it to the right bot. */
  sendTeamMessage(text: string) {
    const t = text.trim();
    if (!t) return;
    const now = clock.now();
    const to = parseRoutine(t).botId;
    const toName = botName(state, to);
    setState((s) => ({ teamChat: appendTeam(s.teamChat, [{ id: uid("tm"), author: "user", at: now, text: t }]) }));
    setTimeout(() => {
      const at = clock.now();
      const replies: TeamMessage[] = [{ id: uid("tm"), author: "manager", to, at, text: to === "manager" ? "Got it. I'll take care of it." : `Passing this to ${toName}.` }];
      if (to !== "manager") replies.push({ id: uid("tm"), author: to, to: "user", at: at + 1500, text: "On it. I'll post here when I have something." });
      setState((s) => ({ teamChat: appendTeam(s.teamChat, replies) }));
      playSound("message", state.settings.sound);
    }, 900);
  },

  markSignalRead(id: string) {
    if (!state.feed.some((x) => x.id === id && !x.read)) return;
    setState((s) => ({ feed: s.feed.map((x) => (x.id === id ? { ...x, read: true } : x)) }));
  },

  markAllSignalsRead() {
    setState((s) => ({ feed: s.feed.map((x) => (x.read ? x : { ...x, read: true })) }));
  },

  toggleSaveSignal(id: string) {
    setState((s) => ({ feed: s.feed.map((x) => (x.id === id ? { ...x, saved: !x.saved } : x)) }));
  },

  dismissSignal(id: string) {
    setState((s) => ({ feed: s.feed.map((x) => (x.id === id ? { ...x, dismissed: true, read: true } : x)) }));
  },

  dismissAway() {
    setState({ away: null });
  },

  /* Routines ---------------------------------------------------------- */

  toggleRoutine(id: string) {
    const now = clock.now();
    setState((s) => ({
      routines: s.routines.map((r) => {
        if (r.id !== id) return r;
        const on = r.status !== "on";
        const next = { ...r, status: on ? ("on" as const) : ("paused" as const) };
        return on ? { ...next, nextRunAt: scheduleNext(next, now, s.settings.demoSpeed, true) } : next;
      }),
    }));
  },

  setDoWithoutAsking(id: string, on: boolean) {
    setState((s) => ({ routines: s.routines.map((r) => (r.id === id ? { ...r, doWithoutAsking: on } : r)) }));
  },

  /** Demo control: make a routine run on the next tick. */
  runNow(id: string) {
    const now = clock.now();
    setState((s) => ({ routines: s.routines.map((r) => (r.id === id ? { ...r, status: "on", nextRunAt: now } : r)) }));
  },

  /** Add a routine. It starts within a couple of seconds. */
  addRoutine(input: { botId: string; title: string; trigger: Trigger; engine?: RoutineEngine; doWithoutAsking?: boolean }): Routine {
    const now = clock.now();
    const r: Routine = {
      id: uid("r"),
      botId: input.botId,
      title: input.title,
      trigger: input.trigger,
      engine: input.engine ?? "custom",
      status: "on",
      doWithoutAsking: input.doWithoutAsking ?? false,
      createdAt: now,
      nextRunAt: 0,
      stats: emptyStats(),
    };
    const armed = { ...r, nextRunAt: r.trigger.kind === "schedule" ? scheduleNext(r, now) : r.trigger.kind === "event" ? 0 : now + 2500 };
    nextBeatAt[r.botId] = Math.min(nextBeatAt[r.botId] ?? Infinity, now + 1200);
    setState((s) => ({
      routines: [...s.routines, armed],
      teamChat: appendTeam(s.teamChat, [{ id: uid("tm"), author: r.botId, to: "user", at: now, text: `Got it. I'll ${r.title.charAt(0).toLowerCase()}${r.title.slice(1)}. Starting now.` }]),
      activity: [{ id: uid("ev"), actor: "user", to: r.botId, kind: "system" as const, at: now, message: `New routine: ${r.title}.` }, ...s.activity],
    }));
    return armed;
  },

  removeRoutine(id: string) {
    setState((s) => ({ routines: s.routines.filter((r) => r.id !== id) }));
  },

  /* Content calendar -------------------------------------------------- */

  approvePost(id: string) {
    const now = clock.now();
    setState((s) => {
      const p = s.posts.find((x) => x.id === id);
      if (!p || (p.status !== "needs-ok" && p.status !== "draft" && p.status !== "missed")) return {};
      // Past its time: it goes out now (late), otherwise it waits for its minute.
      const late = p.scheduledFor <= now;
      return {
        posts: s.posts.map((x) => (x.id === id ? (late ? { ...x, status: "posted" as const, postedAt: now } : { ...x, status: "scheduled" as const }) : x)),
        notices: s.notices.map((n) => (n.id === `n-ok-${id}` ? { ...n, read: true } : n)),
      };
    });
  },

  skipPost(id: string) {
    setState((s) => ({ posts: s.posts.map((x) => (x.id === id && x.status !== "posted" ? { ...x, status: "skipped" as const } : x)) }));
  },

  editPost(id: string, caption: string) {
    const t = caption.trim();
    if (!t) return;
    setState((s) => ({
      posts: s.posts.map((x) => (x.id === id ? { ...x, caption: t } : x)),
      skills: s.skills.some((k) => k.botId === "content-creator" && k.learned === "edits")
        ? s.skills
        : [...s.skills, { id: uid("sk"), botId: "content-creator", name: "Learned from your edits", how: "Keeps captions closer to how you rewrite them.", learned: "edits" as const, createdAt: clock.now() }],
    }));
  },

  /** Demo control: add a post one minute from now to watch it go out on the minute. */
  schedulePostSoon() {
    const now = clock.now();
    const at = Math.ceil((now + 60e3) / 60e3) * 60e3;
    const post: ScheduledPost = { id: `p-${at}-${uid()}`, channel: "linkedin", scheduledFor: at, status: "scheduled", caption: "Small businesses: your website should work as hard as you do. Ours get checked every few minutes, all night.", visualHint: "Night skyline with a lit window", routineId: "r-post-schedule" };
    setState((s) => ({ posts: [...s.posts, post].sort((a, b) => a.scheduledFor - b.scheduledFor) }));
    return post;
  },

  /* Notices ----------------------------------------------------------- */

  markNoticeRead(id: string) {
    setState((s) => ({ notices: s.notices.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  },

  markAllNoticesRead() {
    setState((s) => ({ notices: s.notices.map((n) => (n.read ? n : { ...n, read: true })) }));
  },

  /* Bots -------------------------------------------------------------- */

  /** Give a bot a nickname. Empty clears it. */
  renameBot(botId: string, nickname: string) {
    const t = nickname.trim().slice(0, 24);
    setState((s) => {
      const next = { ...s.nicknames };
      if (t) next[botId] = t;
      else delete next[botId];
      return { nicknames: next };
    });
  },

  /** Teach a bot a way of doing something. */
  teachSkill(botId: string, name: string, how: string) {
    const n = name.trim();
    if (!n) return;
    const now = clock.now();
    setState((s) => ({
      skills: [...s.skills, { id: uid("sk"), botId, name: n, how: how.trim() || n, learned: "taught" as const, createdAt: now }],
      teamChat: appendTeam(s.teamChat, [{ id: uid("tm"), author: botId, to: "user", at: now, text: `Learned "${n}". I'll use it from now on.` }]),
    }));
  },

  /** Build your own bot. It goes on shift right away with its first routine. */
  createBot(input: { name: string; job: string; keepDoing: string; trigger?: Trigger; colorIndex?: number; visual?: AgentVisual }): string {
    const now = clock.now();
    const name = input.name.trim() || "New bot";
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "bot";
    const taken = new Set([...state.customBots.map((b) => b.id), "manager", "lead-hunter", "content-creator", "researcher", "reporter", "receptionist", "bookkeeper"]);
    let id = base;
    for (let i = 2; taken.has(id); i++) id = `${base}-${i}`;
    const spec: CustomBotSpec = {
      id,
      name,
      job: input.job.trim() || input.keepDoing.trim(),
      colorIndex: input.colorIndex ?? state.customBots.length % CUSTOM_COLORS.length,
      visual: input.visual ?? "orbit",
      createdAt: now,
    };
    const customBots = [...state.customBots, spec];
    registerCustomBots(customBots.map(specToAgent));
    setState((s) => ({
      customBots,
      teamChat: appendTeam(s.teamChat, [{ id: uid("tm"), author: "manager", to: id, at: now, text: `Welcome to the team, ${name}. You're on shift now.` }]),
    }));
    const title = input.keepDoing.trim().replace(/\.$/, "") || spec.job;
    workspace.addRoutine({ botId: id, title: title.charAt(0).toUpperCase() + title.slice(1), trigger: input.trigger ?? { kind: "always" } });
    return id;
  },

  /* Time travel ------------------------------------------------------- */

  /** Demo: jump to a local time today. Reloads into a fresh, unsaved workspace. */
  travel(at: string | null) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (at) url.searchParams.set("at", at);
    else url.searchParams.delete("at");
    window.location.assign(url.toString());
  },

  /** Restore the seeded demo workspace. */
  resetDemo() {
    const settings = state.settings;
    resetBeats();
    for (const k of Object.keys(nextBeatAt)) delete nextBeatAt[k];
    registerCustomBots([]);
    const now = clock.now();
    const fresh = seedState(now);
    state = { ...fresh, settings, traveling: state.traveling, routines: armRoutines(fresh.routines, now, settings.demoSpeed) };
    emit();
    schedulePersist();
  },

  /** Empty workspace: shows the product's empty states. The bots stay on shift. */
  clearWorkspace() {
    const settings = state.settings;
    const now = clock.now();
    resetBeats();
    registerCustomBots([]);
    state = {
      ...emptyState(),
      hydrated: true,
      settings,
      org: state.org,
      onboarded: state.onboarded,
      traveling: state.traveling,
      lastSeenAt: now,
      routines: armRoutines(defaultRoutines(now), now, settings.demoSpeed),
      posts: fillCalendar([], now, now, 7, "r-keep-drafted", false),
      skills: seedSkills(now),
    };
    emit();
    schedulePersist();
  },
};

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export const selectMissions = (s: WorkspaceState) => s.missionOrder.map((id) => s.missions[id]).filter(Boolean);
export const selectVisibleFeed = (s: WorkspaceState) => s.feed.filter((x) => !x.dismissed);
/** Old name. */
export const selectVisibleSignals = selectVisibleFeed;
export const selectUnreadHot = (s: WorkspaceState) => s.feed.filter((x) => !x.read && !x.dismissed && x.lead?.temperature === "hot").length;
export const selectUnreadNotices = (s: WorkspaceState) => s.notices.filter((n) => !n.read).length;
/** The name to show for a bot: its nickname if it has one. */
export function botName(s: WorkspaceState, id: string) {
  return s.nicknames[id] ?? agentOrFallback(id).name;
}
export function postLabel(p: ScheduledPost) {
  return channelLabel(p.channel);
}

export const selectPendingApprovals = (s: WorkspaceState) =>
  Object.values(s.approvals)
    .filter((a) => a.status === "pending")
    .sort((a, b) => b.createdAt - a.createdAt);
