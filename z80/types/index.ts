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
export type AgentVisual = "lattice" | "scanner" | "fluid" | "orbit";

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
  /** Particle-scene cluster index (0-2) for the three showcase intelligences. */
  sceneGroup?: 0 | 1 | 2;
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
}

/* ------------------------------------------------------------------ */
/* Watches & signals — the always-on side of the workforce              */
/* ------------------------------------------------------------------ */

export type WatchKind = "website-opportunities" | "ai-opportunities" | "ai-news" | "reminders";

/** A standing order that runs around the clock and produces signals. */
export interface Watch {
  id: string;
  kind: WatchKind;
  name: string;
  agentId: AgentId;
  description: string;
  /** What fires a signal. */
  triggers: string[];
  cadence: string;
  status: "live" | "paused";
  /** Draft an outreach mission automatically for every hot lead (still needs approval to send). */
  autopilot: boolean;
  createdAt: number;
  /** Simulation: when the next signal is due. */
  nextAt: number;
}

export type LeadTemperature = "hot" | "warm" | "cool";

/** Everything needed to act on an opportunity, in one card. */
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

export interface Signal {
  id: string;
  watchId: string;
  kind: "lead" | "news" | "reminder";
  at: number;
  /** What happened in the world that fired this signal. */
  trigger: string;
  title: string;
  summary: string;
  read: boolean;
  saved: boolean;
  dismissed: boolean;
  /** Mission created from this signal, if any. */
  missionId?: string;
  lead?: LeadDossier;
  news?: { source: string; whyItMatters: string };
  reminder?: { due: string; relatedSignalId?: string };
}
