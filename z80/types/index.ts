/**
 * Z80 domain model.
 *
 * Everything the interface renders is described by these types, so the mock
 * service layer in lib/services can be replaced by real APIs without touching
 * components.
 */

/* ------------------------------------------------------------------ */
/* Agents                                                              */
/* ------------------------------------------------------------------ */

export type AgentId = string;

/** Visual signature used by AgentGlyph and the particle scene. */
export type AgentVisual = "lattice" | "scanner" | "fluid" | "orbit" | "pulse";

export type AgentAvailability = "available" | "coming-soon";

/** Live state of an intelligence inside a workspace. */
export type AgentState = "active" | "working" | "waiting" | "idle" | "paused";

export interface AgentAccent {
  /** Primary accent (status dot, node ring). */
  hex: string;
  /** Lighter tint for text on black. */
  tint: string;
  /** RGB triplet for rgba() glows: "110 155 255". */
  rgb: string;
}

export interface AgentRole {
  id: string;
  label: string;
  summary: string;
}

export interface Agent {
  id: AgentId;
  slug: string;
  name: string;
  /** Short system designation, e.g. "Z80-OPS". */
  designation: string;
  /** "Operations Intelligence" */
  role: string;
  /** "Research + Orchestration" — used in team recommendations. */
  domain: string;
  tagline: string;
  shortDescription: string;
  description: string;
  personality: string[];
  /** Showcase keywords (uppercase in UI). */
  capabilities: string[];
  specialties: string[];
  roles: AgentRole[];
  /** Integration ids the agent can use. */
  tools: string[];
  /** Memory domain ids the agent reads from. */
  memory: string[];
  collaborators: AgentId[];
  accent: AgentAccent;
  visual: AgentVisual;
  /** Particle-scene cluster index (0-4), one per core bot. */
  sceneGroup?: 0 | 1 | 2 | 3 | 4;
  /** Optional name the owner gives this bot. The job title still shows. */
  nickname?: string;
  /** Made by the owner in the app. */
  custom?: boolean;
  availability: AgentAvailability;
  /** Contextual loading copy: "Lookout is researching…" */
  workingVerb: string;
}

/* ------------------------------------------------------------------ */
/* Integrations, permissions, memory                                   */
/* ------------------------------------------------------------------ */

/**
 * live        — implemented against the real API
 * preview     — limited / simulated in this build
 * coming-soon — on the roadmap, actively being built
 * planned     — on the roadmap
 */
export type IntegrationStatus = "live" | "preview" | "coming-soon" | "planned";

export interface Integration {
  id: string;
  name: string;
  category: "communication" | "productivity" | "crm" | "commerce" | "social" | "web";
  status: IntegrationStatus;
  description: string;
  /** Two-letter monogram used instead of third-party logos. */
  mono: string;
}

export type PermissionLevel = "autonomous" | "approval" | "disabled";

export interface PermissionRule {
  id: string;
  action: string;
  detail: string;
  category: "research" | "content" | "data" | "outreach" | "spend" | "admin";
  level: PermissionLevel;
}

export interface MemoryDomain {
  id: string;
  label: string;
  summary: string;
  items: string[];
}

/* ------------------------------------------------------------------ */
/* Planning                                                            */
/* ------------------------------------------------------------------ */

export type Intent = "sales" | "research" | "creative" | "operations";

export interface ObjectiveEntities {
  count?: number;
  target?: string;
  location?: string;
  intents: Intent[];
  mentionsCrm: boolean;
  outbound: boolean;
}

export interface AgentAssignment {
  agentId: AgentId;
  roleId: string;
  why: string;
  objectives: string[];
  tools: string[];
  permissions: string[];
  estimatedOutput: string;
}

export type TaskKind =
  | "decompose"
  | "research"
  | "discover"
  | "qualify"
  | "enrich"
  | "analyze"
  | "create"
  | "organize"
  | "approval"
  | "launch"
  | "report";

export interface PlannedStep {
  message: string;
  /** ms after the previous step (at speed 1). */
  delay: number;
  detail?: string[];
}

export interface PlannedTask {
  id: string;
  label: string;
  agentId: AgentId;
  kind: TaskKind;
  dependsOn: string[];
  steps: PlannedStep[];
  /** Message posted to the next agent / user when the task completes. */
  handoff?: { to: AgentId | "user"; message: string };
  /** Approval tasks pause execution until a human decides. */
  approval?: { kind: "review" | "access"; title: string; detail: string; blocking: boolean };
  output?: string;
}

export type ResultKind = "prospects" | "campaign" | "brief" | "outreach" | "generic";

export interface Plan {
  id: string;
  objective: string;
  title: string;
  analysis: string;
  reasoningSummary: string;
  entities: ObjectiveEntities;
  agents: AgentAssignment[];
  tasks: PlannedTask[];
  resultKind: ResultKind;
  estimatedMinutes: number;
  lead?: { signalId: string; business: string; owner: string; script: string };
}

/* ------------------------------------------------------------------ */
/* Missions                                                            */
/* ------------------------------------------------------------------ */

export type MissionStatus =
  | "running"
  | "awaiting-approval"
  | "paused"
  | "complete"
  | "interrupted";

export type TaskStatus = "waiting" | "running" | "complete" | "blocked" | "skipped";

export interface MissionTask {
  id: string;
  label: string;
  agentId: AgentId;
  kind: TaskKind;
  dependsOn: string[];
  status: TaskStatus;
  output?: string;
}

export type ApprovalStatus = "pending" | "approved" | "denied";

export interface Approval {
  id: string;
  missionId: string;
  taskId: string;
  agentId: AgentId;
  kind: "review" | "access";
  title: string;
  detail: string;
  status: ApprovalStatus;
  createdAt: number;
  resolvedAt?: number;
}

/** One scripted beat of a simulated mission. */
export type ScriptEvent =
  | { type: "task-start"; at: number; taskId: string }
  | { type: "step"; at: number; taskId: string; agentId: AgentId; message: string; detail?: string[] }
  | { type: "task-complete"; at: number; taskId: string; output?: string }
  | { type: "handoff"; at: number; from: AgentId; to: AgentId | "user"; message: string }
  | { type: "approval"; at: number; taskId: string }
  | { type: "complete"; at: number };

export interface Prospect {
  id: string;
  company: string;
  location: string;
  owner: string;
  title: string;
  signal: string;
  score: number;
  opener: string;
}

export interface CampaignConcept {
  id: string;
  name: string;
  hook: string;
  body: string;
  channels: string[];
}

export interface BriefFinding {
  id: string;
  subject: string;
  finding: string;
  implication: string;
}

export interface MissionResults {
  kind: ResultKind;
  headline: string;
  summary: string;
  prospects?: Prospect[];
  concepts?: CampaignConcept[];
  findings?: BriefFinding[];
  outreach?: { to: string; business: string; script: string };
}

export interface Mission {
  id: string;
  number: number;
  title: string;
  objective: string;
  status: MissionStatus;
  agents: AgentAssignment[];
  tasks: MissionTask[];
  approvals: string[];
  createdAt: number;
  completedAt?: number;
  /** 0–1 */
  progress: number;
  /** Simulation clock (ms of mission time elapsed). */
  elapsed: number;
  speed: number;
  script: ScriptEvent[];
  cursor: number;
  outreachHeld?: boolean;
  results?: MissionResults;
  resultKind: ResultKind;
  entities: ObjectiveEntities;
  interruption?: { agentId: AgentId; integration: string; message: string };
  /** Approval checkpoints from the plan, keyed by task id. */
  plannedApprovals: Record<string, { kind: "review" | "access"; title: string; detail: string }>;
  /** Single-lead outreach missions created from a signal. */
  lead?: { signalId: string; business: string; owner: string; script: string };
}

/* ------------------------------------------------------------------ */
/* Activity & conversation                                             */
/* ------------------------------------------------------------------ */

export type Actor = AgentId | "z80" | "user";

export interface ActivityEvent {
  id: string;
  missionId?: string;
  taskId?: string;
  actor: Actor;
  /** For agent-to-agent communication. */
  to?: Actor;
  at: number;
  kind: "action" | "result" | "handoff" | "approval" | "system";
  message: string;
  detail?: string[];
}

export type ChatAction =
  | { kind: "review-plan"; planId: string }
  | { kind: "deploy-plan"; planId: string }
  | { kind: "open-mission"; missionId: string }
  | { kind: "view-results"; missionId: string }
  | { kind: "new-mission" }
  | { kind: "approval"; approvalId: string }
  | { kind: "open-signal"; signalId: string };

export interface ChatMessage {
  id: string;
  author: Actor;
  /** Agent-to-agent messages surfaced in the command thread. */
  to?: Actor;
  text: string;
  at: number;
  missionId?: string;
  planId?: string;
  actions?: ChatAction[];
  /** Agent ids shown as a recommended team chip row. */
  team?: AgentId[];
}

/* ------------------------------------------------------------------ */
/* Workspace                                                           */
/* ------------------------------------------------------------------ */

export interface Organization {
  name: string;
  description: string;
  focus: string;
}

export interface WorkspaceSettings {
  sound: boolean;
  /** Global simulation speed multiplier for the demo. */
  demoSpeed: number;
  /** How your bots reach you. Local "HH:MM". */
  morningTextAt?: string;
  recapAt?: string;
  quietFrom?: string;
  quietTo?: string;
  /** Opted in to browser alerts (demo). */
  browserAlerts?: boolean;
}

/** What happened while the app was closed or the tab was hidden. */
export interface AwaySummary {
  from: number;
  to: number;
  leads: number;
  hot: number;
  posts: number;
  briefs: number;
  opportunities: number;
  checks: number;
  /** Feed ids, newest first, worth a look. */
  top: string[];
}

/* ------------------------------------------------------------------ */
/* Always-on bots: routines, heartbeats, the live feed                 */
/* ------------------------------------------------------------------ */

export type BotId = string;

/** When a routine runs. */
export type Trigger =
  | { kind: "always" }
  | { kind: "every"; minutes: number }
  | { kind: "schedule"; days: number[]; times: string[] }
  | { kind: "event"; event: string };

/** Which simulated behaviour powers a routine (swapped for real work later). */
export type RoutineEngine =
  | "website-down"
  | "changed-hands"
  | "new-business"
  | "review-spike"
  | "domain-expiring"
  | "hiring"
  | "post-schedule"
  | "keep-drafted"
  | "lead-openers"
  | "upsells"
  | "competitors"
  | "trends"
  | "morning-brief"
  | "niche-breaking"
  | "ai-news"
  | "morning-text"
  | "evening-recap"
  | "follow-ups"
  | "chase-approvals"
  | "custom";

/** A job a bot keeps doing, around the clock or on a schedule. */
export interface Routine {
  id: string;
  botId: BotId;
  title: string;
  trigger: Trigger;
  engine: RoutineEngine;
  status: "on" | "paused";
  /** Lets the routine send or post on its own. Off means it waits for a yes. */
  doWithoutAsking: boolean;
  createdAt: number;
  lastRunAt?: number;
  /** Demo clock: when it next produces something. */
  nextRunAt: number;
  stats: { runs: number; checks: number; finds: number; onTime: number; missed: number };
}

/** Quiet proof of work. Not a feed item. */
export interface Heartbeat {
  id: string;
  botId: BotId;
  routineId: string;
  at: number;
  text: string;
  /** "What it's looking at" for the Watch it work screen. */
  url: string;
}

export type LeadTemperature = "hot" | "warm" | "cool";

/** Everything needed to act on a lead, in one card. */
export interface LeadDossier {
  opportunity: "website" | "ai";
  business: string;
  industry: string;
  owner: string;
  ownerTitle: string;
  location: string;
  phone: string;
  email: string;
  currentWebsite: string;
  priority: 1 | 2 | 3;
  temperature: LeadTemperature;
  problems: string[];
  google: { rating: number; reviews: number; profile: "Claimed" | "Unclaimed"; mapPack: string };
  reviewsSummary: string;
  businessValue: string;
  demoAngle: string;
  recommended: { offer: string; price: string };
  upsells: string[];
  outreachScript: string;
  nextMove: string;
}

export type FeedKind = "lead" | "post" | "opportunity" | "brief" | "reminder" | "handoff" | "approval" | "digest";

/** Something a bot found or did that is worth your attention. */
export interface FeedItem {
  id: string;
  botId: BotId;
  routineId?: string;
  kind: FeedKind;
  at: number;
  /** What happened in the world. */
  trigger: string;
  title: string;
  summary: string;
  /** When the real-world thing happened, and when the bot caught it. */
  happenedAt?: number;
  foundAt?: number;
  read: boolean;
  saved: boolean;
  dismissed: boolean;
  /** Job started from this item, if any. */
  missionId?: string;
  lead?: LeadDossier;
  post?: { postId: string };
  opportunity?: { client?: string; whyItMatters: string; nextStep: string; value?: string };
  brief?: { whyItMatters: string; whatToDo: string; source: string };
  reminder?: { due: string; relatedId?: string };
  digest?: { lines: { text: string; href?: string }[] };
}

/** Old name kept so existing components compile while they move over. */
export type Signal = FeedItem;

export type PostChannel = "instagram" | "facebook" | "linkedin" | "x" | "google-business";

export interface ScheduledPost {
  id: string;
  channel: PostChannel;
  scheduledFor: number;
  status: "draft" | "needs-ok" | "scheduled" | "posted" | "missed" | "skipped";
  postedAt?: number;
  caption: string;
  visualHint: string;
  routineId?: string;
}

/** Bots talking to each other (and you) in plain sentences. */
export interface TeamMessage {
  id: string;
  author: BotId | "user";
  to?: BotId | "user";
  at: number;
  text: string;
  ref?: { feedItemId?: string; jobId?: string; approvalId?: string; postId?: string };
}

/** A way of doing something the bot keeps using. */
export interface Skill {
  id: string;
  botId: BotId;
  name: string;
  how: string;
  learned: "taught" | "edits" | "built-in";
  createdAt: number;
}

/** A bot the owner made. Stored with the workspace. */
export interface CustomBotSpec {
  id: string;
  name: string;
  job: string;
  colorIndex: number;
  visual: AgentVisual;
  createdAt: number;
}

/** In-app notification (bell + toasts). */
export interface Notice {
  id: string;
  at: number;
  botId: BotId;
  title: string;
  body: string;
  href?: string;
  tone: "hot" | "needs-you" | "info";
  read: boolean;
}
