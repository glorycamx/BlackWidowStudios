/**
 * planService — turns a natural-language objective into a Plan.
 *
 * MOCK IMPLEMENTATION. This is a deterministic, rule-based planner so the demo
 * works offline and identically on server and client. A real model-backed
 * planner implements the same `Planner` signature (see lib/ai/provider.ts)
 * and returns the same Plan shape — no UI changes required.
 */
import { getAgent } from "@/data/agents";
import { defaultPermissions } from "@/data/permissions";
import type {
  AgentAssignment,
  AgentId,
  Intent,
  ObjectiveEntities,
  Organization,
  Plan,
  PlannedStep,
  PlannedTask,
  ResultKind,
} from "@/types";
import { hashString, prng, titleCase, uid } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Objective analysis                                                  */
/* ------------------------------------------------------------------ */

const INTENT_PATTERNS: Record<Intent, RegExp> = {
  sales:
    /\b(leads?|prospects?|pipeline|sales|customers|clients|jobs|deals|accounts|appointments|book(ed|ings)?|cold|find \d+|businesses|companies|need (a|our)|outbound)\b/i,
  research: /\b(research|competitors?|market|analy[sz]e|analysis|intel|investigate|compare|monitor|trends?|where we can win)\b/i,
  creative:
    /\b(campaign|content|copy|ads?|brand(ing)?|posts?|emails?|newsletter|landing|scripts?|creative|messaging|outreach|launch|write|concepts?|social)\b/i,
  operations:
    /\b(organi[sz]e|reports?|coordinate|follow[- ]?ups?|schedule|process(es)?|admin|status|manage|operations?|prepare|calendar|crm|weekly|every (day|week|monday|friday))\b/i,
};

const TARGET_NOUNS =
  "companies|businesses|agencies|firms|stores|shops|restaurants|contractors|clinics|practices|brands|startups|leads|prospects|accounts|customers|competitors|operators|owners|dealers|studios|gyms|salons|dentists|builders";

const STOP = new Set(["the", "my", "our", "top", "of", "a", "an", "more", "new", "all", "every", "some", "that", "in", "for", "find", "with", "and", "local"]);

export function analyzeObjective(objective: string): ObjectiveEntities {
  const text = objective.trim();
  const intents = (Object.keys(INTENT_PATTERNS) as Intent[]).filter((k) => INTENT_PATTERNS[k].test(text));

  let count: number | undefined;
  const countMatch = text.match(new RegExp(`\\b(\\d{1,4})\\s+(?:[a-z-]+\\s+){0,3}?(?:${TARGET_NOUNS})\\b`, "i"));
  if (countMatch) count = Math.min(5000, parseInt(countMatch[1], 10));

  let target: string | undefined;
  const targetMatch = text.match(new RegExp(`((?:[A-Za-z-]+\\s+){0,2})(${TARGET_NOUNS})\\b`, "i"));
  if (targetMatch) {
    const prefix = targetMatch[1]
      .trim()
      .split(/\s+/)
      .filter((w) => w && !STOP.has(w.toLowerCase()) && !/^\d+$/.test(w));
    target = [...prefix, targetMatch[2]].join(" ").toLowerCase();
  }

  let location: string | undefined;
  if (/\b(in|around|near) (my|our) (area|city|town|region)\b|\bnear me\b|\blocal\b/i.test(text)) {
    location = "your area";
  }
  const locMatch = text.match(/\b(?:in|across|around|near)\s+((?:[A-Z][A-Za-z.'-]+)(?:\s+[A-Z][A-Za-z.'-]+){0,3})/);
  if (locMatch) location = locMatch[1];

  return {
    count,
    target,
    location,
    intents: intents.length ? intents : ["operations"],
    mentionsCrm: /\b(crm|cold leads?|existing (customers|leads|contacts)|re-?engage|recover)\b/i.test(text),
    outbound: /\b(outreach|emails?|send|campaign|contact|reach out|follow[- ]?up|message|sequence|re-?engage|recover)\b/i.test(text),
  };
}

/* ------------------------------------------------------------------ */
/* Plan construction                                                   */
/* ------------------------------------------------------------------ */

function step(message: string, delay = 1600, detail?: string[]): PlannedStep {
  return { message, delay, detail };
}

function resultKindFor(e: ObjectiveEntities): ResultKind {
  if (e.intents.includes("sales") && (e.count || e.target || e.mentionsCrm)) return "prospects";
  if (e.intents.includes("research") && !e.intents.includes("creative")) return "brief";
  if (e.intents.includes("creative")) return "campaign";
  if (e.intents.includes("research")) return "brief";
  return "generic";
}

function chooseAgents(e: ObjectiveEntities, kind: ResultKind): AgentId[] {
  const set = new Set<AgentId>();
  if (kind === "prospects" || e.intents.includes("research") || e.intents.includes("sales")) set.add("grok");
  if (e.intents.includes("creative") || (kind === "prospects" && e.outbound) || kind === "campaign") set.add("muse");
  if (set.size !== 1 || e.intents.includes("operations") || kind === "prospects") set.add("dots");
  // Coordinator always reads first.
  return ["dots", "grok", "muse"].filter((id) => set.has(id));
}

interface Ctx {
  e: ObjectiveEntities;
  n: number;
  target: string;
  where: string;
  r: () => number;
}

function prospectTasks(c: Ctx): PlannedTask[] {
  const discovered = Math.round(c.n * (4.2 + c.r() * 1.4));
  const qualified = Math.round(c.n * (1.25 + c.r() * 0.2));
  const outdated = Math.round(discovered * (0.3 + c.r() * 0.15));
  const tasks: PlannedTask[] = [];
  if (c.e.mentionsCrm) {
    tasks.push({
      id: "crm",
      label: "CRM access",
      agentId: "grok",
      kind: "approval",
      dependsOn: [],
      steps: [step("Requesting read access to CRM contact records.", 1200)],
      approval: {
        kind: "access",
        title: "Requests permission to access CRM contact records",
        detail: "Read-only. Used to exclude existing customers and avoid duplicate outreach.",
        blocking: true,
      },
    });
  }
  tasks.push(
    {
      id: "discover",
      label: `Find ${c.target}`,
      agentId: "grok",
      kind: "discover",
      dependsOn: [],
      steps: [
        step(`Scanning ${c.where} for ${c.target}.`, 1500),
        step("Cross-referencing maps listings, directories and registries.", 2000, ["Sources: maps listings, business directories, state registry"]),
        step(`${discovered} companies identified.`, 2200),
      ],
      output: `${discovered} companies`,
    },
    {
      id: "qualify",
      label: "Qualify companies",
      agentId: "grok",
      kind: "qualify",
      dependsOn: ["discover"],
      steps: [
        step("Auditing websites for speed, mobile layout and booking.", 1700),
        step(`Detected outdated mobile layout on ${outdated} sites.`, 1900, ["Signals: no responsive layout, copyright older than 3 years, no online booking, load time over 4s"]),
        step(`${qualified} passed initial qualification.`, 1800),
      ],
      handoff: { to: "muse", message: `${qualified} companies qualified. Sending website weaknesses and owner data.` },
      output: `${qualified} qualified`,
    },
    {
      id: "enrich",
      label: "Identify decision makers",
      agentId: "grok",
      kind: "enrich",
      dependsOn: ["qualify"],
      steps: [
        step("Researching owners and decision makers.", 1600),
        step(`${c.n} owners identified with verified contact paths.`, 2000),
      ],
      output: `${c.n} decision makers`,
    },
  );
  if (c.e.outbound || c.e.intents.includes("creative")) {
    tasks.push(
      {
        id: "analyze",
        label: "Analyze positioning",
        agentId: "muse",
        kind: "analyze",
        dependsOn: ["qualify"],
        steps: [
          step("Analyzing each company's positioning.", 1500),
          step("Reading reviews, service pages and local competitors.", 1900),
        ],
      },
      {
        id: "create",
        label: "Write personalized outreach",
        agentId: "muse",
        kind: "create",
        dependsOn: ["analyze", "enrich"],
        steps: [
          step("Creating personalized opening lines.", 1600),
          step("Drafting a 3-touch sequence in your brand voice.", 2000, ["Touch 1: specific observation", "Touch 2: proof from a similar business", "Touch 3: short, direct ask"]),
          step(`${c.n} personalized messages written.`, 1800),
        ],
        handoff: { to: "dots", message: "Personalized outreach generated. Ready for approval." },
        output: `${c.n} messages`,
      },
    );
  }
  tasks.push({
    id: "organize",
    label: "Prepare lead list",
    agentId: "dots",
    kind: "organize",
    dependsOn: tasks.some((t) => t.id === "create") ? ["create"] : ["enrich"],
    steps: [
      step("Structuring lead list and removing duplicates.", 1400),
      step("Validating contact data.", 1500),
      step(`${c.n} prospects prepared.`, 1300),
    ],
    output: `${c.n} prospects`,
  });
  if (c.e.outbound) {
    tasks.push(
      {
        id: "approval",
        label: "Human approval",
        agentId: "dots",
        kind: "approval",
        dependsOn: ["organize"],
        steps: [step("Campaign prepared. Requesting approval before anything is sent.", 1200)],
        approval: {
          kind: "review",
          title: "Review outreach campaign",
          detail: `${c.n} prospects and personalized messages are ready. Nothing is sent until you approve.`,
          blocking: true,
        },
        handoff: { to: "user", message: "Campaign prepared. Review before deployment?" },
      },
      {
        id: "launch",
        label: "Launch",
        agentId: "dots",
        kind: "launch",
        dependsOn: ["approval"],
        steps: [
          step("Scheduling first touch for tomorrow, 9:00 AM recipient time.", 1400),
          step(`CRM updated with ${c.n} new contacts.`, 1400),
        ],
      },
    );
  }
  return tasks;
}

function campaignTasks(c: Ctx, agents: AgentId[]): PlannedTask[] {
  const researcher = agents.includes("grok") ? "grok" : "muse";
  return [
    {
      id: "research",
      label: "Research audience",
      agentId: researcher,
      kind: "research",
      dependsOn: [],
      steps: [
        step("Reviewing brand memory and past campaigns.", 1500),
        step("Mapping audience motivations and competitor messaging.", 2100),
        step("4 messaging gaps identified.", 1700),
      ],
      handoff: researcher === "grok" ? { to: "muse", message: "Audience map ready. Competitors all lead with price — nobody owns speed." } : undefined,
    },
    {
      id: "concepts",
      label: "Generate concepts",
      agentId: "muse",
      kind: "create",
      dependsOn: ["research"],
      steps: [
        step("Exploring creative territories.", 1600),
        step("3 campaign directions developed.", 2200, ["Direction A: proof-led", "Direction B: speed-led", "Direction C: local pride"]),
      ],
      output: "3 directions",
    },
    {
      id: "assets",
      label: "Create campaign",
      agentId: "muse",
      kind: "create",
      dependsOn: ["concepts"],
      steps: [
        step("Writing headlines, ad copy and email variants.", 2000),
        step("12 assets drafted across 3 channels.", 1800),
      ],
      handoff: { to: "dots", message: "Campaign assets drafted. Ready to schedule." },
      output: "12 assets",
    },
    {
      id: "schedule",
      label: "Plan schedule",
      agentId: agents.includes("dots") ? "dots" : "muse",
      kind: "organize",
      dependsOn: ["assets"],
      steps: [step("Building a 4-week launch calendar.", 1600), step("Calendar prepared.", 1200)],
    },
    {
      id: "approval",
      label: "Human approval",
      agentId: "muse",
      kind: "approval",
      dependsOn: ["schedule"],
      steps: [step("Requesting approval before anything is published.", 1200)],
      approval: {
        kind: "review",
        title: "Campaign copy ready",
        detail: "3 directions and 12 assets are ready for review. Nothing is published until you approve.",
        blocking: true,
      },
      handoff: { to: "user", message: "Campaign ready. Review before launch?" },
    },
    {
      id: "launch",
      label: "Launch",
      agentId: agents.includes("dots") ? "dots" : "muse",
      kind: "launch",
      dependsOn: ["approval"],
      steps: [step("Campaign queued for Monday, 8:00 AM.", 1400)],
    },
  ];
}

function briefTasks(c: Ctx, agents: AgentId[]): PlannedTask[] {
  const writer = agents.includes("muse") ? "muse" : "dots";
  return [
    {
      id: "map",
      label: "Map the market",
      agentId: "grok",
      kind: "research",
      dependsOn: [],
      steps: [
        step(`Identifying ${c.target} ${c.where === "the market" ? "" : `in ${c.where}`}`.trim() + ".", 1500),
        step("5 primary competitors mapped.", 2000),
      ],
    },
    {
      id: "analyze",
      label: "Analyze positioning",
      agentId: "grok",
      kind: "analyze",
      dependsOn: ["map"],
      steps: [
        step("Reading websites, pricing pages and reviews.", 1900),
        step("Comparing offers, guarantees and response times.", 2000),
      ],
    },
    {
      id: "gaps",
      label: "Find gaps",
      agentId: "grok",
      kind: "analyze",
      dependsOn: ["analyze"],
      steps: [step("3 exploitable gaps found.", 1800)],
      handoff: { to: writer, message: "3 gaps confirmed. Sending evidence for the brief." },
    },
    {
      id: "brief",
      label: "Write brief",
      agentId: writer,
      kind: "report",
      dependsOn: ["gaps"],
      steps: [step("Writing recommendations.", 1700), step("Brief complete.", 1300)],
    },
  ];
}

function genericTasks(c: Ctx, agents: AgentId[], objective: string): PlannedTask[] {
  const tasks: PlannedTask[] = [];
  const short = objective.length > 60 ? `${objective.slice(0, 57).trim()}…` : objective;
  if (agents.includes("grok")) {
    tasks.push({
      id: "gather",
      label: "Gather context",
      agentId: "grok",
      kind: "research",
      dependsOn: [],
      steps: [step("Collecting relevant information.", 1600), step("Context assembled.", 1500)],
    });
  }
  tasks.push({
    id: "organize",
    label: "Organize the work",
    agentId: "dots",
    kind: "organize",
    dependsOn: tasks.length ? ["gather"] : [],
    steps: [step(`Working on: ${short}`, 1600), step("Work items structured and assigned.", 1700)],
  });
  if (agents.includes("muse")) {
    tasks.push({
      id: "draft",
      label: "Draft deliverables",
      agentId: "muse",
      kind: "create",
      dependsOn: ["organize"],
      steps: [step("Drafting deliverables in your brand voice.", 1900), step("Drafts complete.", 1500)],
    });
  }
  if (c.e.outbound) {
    tasks.push({
      id: "approval",
      label: "Human approval",
      agentId: "dots",
      kind: "approval",
      dependsOn: [tasks[tasks.length - 1].id],
      steps: [step("Requesting approval before anything leaves the company.", 1200)],
      approval: { kind: "review", title: "Review before sending", detail: "Everything is drafted. Nothing is sent until you approve.", blocking: true },
      handoff: { to: "user", message: "Ready for your review." },
    });
  }
  tasks.push({
    id: "report",
    label: "Report",
    agentId: "dots",
    kind: "report",
    dependsOn: [tasks[tasks.length - 1].id],
    steps: [step("Summarizing results.", 1400)],
  });
  return tasks;
}

const WHY: Record<string, Partial<Record<ResultKind, string>> & { default: string }> = {
  dots: {
    prospects: "Multi-step mission with handoffs and an approval gate. Dots keeps it coordinated and validates the final list.",
    campaign: "Campaigns need a schedule and a human checkpoint. Dots owns both.",
    brief: "Dots structures findings into a brief you can act on.",
    default: "Breaks the objective into tasks and keeps the work moving.",
  },
  grok: {
    prospects: "Finding and qualifying companies is research-heavy. Grok Bot is the fastest researcher in the workforce.",
    campaign: "Strong creative starts with knowing the audience and the competition.",
    brief: "Competitive research is Grok Bot's core specialty.",
    default: "Gathers the information the rest of the team needs.",
  },
  muse: {
    prospects: "Personalized outreach converts. Muse writes a specific reason to reply for every company.",
    campaign: "Creative direction and copy are Muse's core specialty.",
    brief: "Muse turns research into a clear, persuasive brief.",
    default: "Produces the writing and creative work.",
  },
};

const OUTPUT: Record<string, (c: Ctx, kind: ResultKind) => string> = {
  dots: (c, k) => (k === "prospects" ? `Validated list of ${c.n} prospects, CRM-ready` : k === "brief" ? "Structured brief and next steps" : "Coordinated plan, schedule and status reports"),
  grok: (c, k) => (k === "prospects" ? `${c.n} qualified companies with decision makers` : k === "brief" ? "Competitor map and 3 gaps" : "Audience and competitor research"),
  muse: (c, k) => (k === "prospects" ? `${c.n} personalized openers + 3-touch sequence` : k === "brief" ? "Readable recommendations" : "3 directions, 12 campaign assets"),
};

const TOOL_RELEVANCE: Record<ResultKind, string[]> = {
  prospects: ["web", "google", "hubspot", "gmail", "gdrive"],
  campaign: ["gdrive", "meta", "instagram", "gmail", "web"],
  brief: ["web", "google", "notion", "gdrive"],
  generic: ["gdrive", "slack", "gmail", "notion", "web"],
};

function assignmentFor(agentId: AgentId, tasks: PlannedTask[], c: Ctx, kind: ResultKind): AgentAssignment {
  const agent = getAgent(agentId);
  const own = tasks.filter((t) => t.agentId === agentId);
  const objectives = own.filter((t) => t.kind !== "approval").map((t) => t.label);
  if (agentId === "dots") objectives.unshift("Coordinate the operation");
  if (agentId === "dots" && own.some((t) => t.kind === "approval")) objectives.push("Request your approval");
  if (!objectives.length) objectives.push("Support the mission on request");
  const relevant = TOOL_RELEVANCE[kind];
  const tools = (agent?.tools ?? []).filter((t) => relevant.includes(t)).slice(0, 3);
  const perms = new Set<string>();
  for (const t of own) {
    if (["discover", "qualify", "enrich", "research", "analyze"].includes(t.kind)) perms.add("research-public");
    if (t.kind === "create") perms.add("generate-drafts");
    if (t.kind === "organize" || t.kind === "launch") perms.add("update-crm");
    if (t.kind === "launch") perms.add("send-email");
    if (t.approval?.kind === "access") perms.add("read-crm");
  }
  const permissions = [...perms].map((id) => {
    const rule = defaultPermissions.find((p) => p.id === id);
    return rule ? `${rule.action} · ${rule.level === "approval" ? "ask first" : rule.level}` : id;
  });
  return {
    agentId,
    roleId: agent?.roles[0]?.id ?? "default",
    why: WHY[agentId]?.[kind] ?? WHY[agentId]?.default ?? "Selected for this mission.",
    objectives: [...new Set(objectives)],
    tools,
    permissions,
    estimatedOutput: OUTPUT[agentId]?.(c, kind) ?? "Mission deliverables",
  };
}

function makeTitle(e: ObjectiveEntities, kind: ResultKind, objective: string): string {
  const target = e.target ?? "new accounts";
  if (kind === "prospects") {
    if (e.mentionsCrm && /cold|re-?engage|recover/i.test(objective)) return "Re-engage cold leads";
    return e.outbound ? `Build outbound pipeline for ${target}` : `Find ${e.count ?? ""} ${target}`.replace(/\s+/g, " ").trim();
  }
  if (kind === "campaign") return /content|posts?|calendar/i.test(objective) ? "Run the content operation" : "Launch the next campaign";
  if (kind === "brief") return /competitor/i.test(objective) ? "Competitive intelligence brief" : "Market research brief";
  const clean = objective.replace(/[.!?]+$/, "");
  const words = clean.split(/\s+/).slice(0, 7).join(" ");
  return titleCase(words.charAt(0).toLowerCase() + words.slice(1)).replace(/^./, (m) => m.toUpperCase());
}

/** Build a full Plan for an objective. Deterministic for a given objective. */
export function createPlan(objective: string, org?: Organization | null): Plan {
  const e = analyzeObjective(objective);
  const kind = resultKindFor(e);
  const agents = chooseAgents(e, kind);
  const r = prng(hashString(objective));
  const c: Ctx = {
    e,
    n: e.count ?? (kind === "prospects" ? 50 : 10),
    target: e.target ?? (kind === "brief" ? "competitors" : "businesses"),
    where: e.location ?? (kind === "brief" ? "the market" : "your target market"),
    r,
  };

  let body: PlannedTask[];
  if (kind === "prospects") body = prospectTasks(c);
  else if (kind === "campaign") body = campaignTasks(c, agents);
  else if (kind === "brief") body = briefTasks(c, agents);
  else body = genericTasks(c, agents, objective);

  // Drop tasks owned by agents not on the team (e.g. single-agent missions).
  body = body.filter((t) => agents.includes(t.agentId));

  const tasks: PlannedTask[] = [];
  if (agents.includes("dots")) {
    tasks.push({
      id: "decompose",
      label: "Decompose objective",
      agentId: "dots",
      kind: "decompose",
      dependsOn: [],
      steps: [step(`Mission decomposed into ${body.length + 1} tasks.`, 900)],
    });
  }
  tasks.push(...body);

  const assignments = agents.map((id) => assignmentFor(id, tasks, c, kind));
  const totalMs = tasks.reduce((s, t) => s + t.steps.reduce((a, b) => a + b.delay, 0) + 600, 0);
  const lead = tasks.filter((t) => t.kind !== "decompose" && t.kind !== "approval").slice(0, 3).map((t) => t.label.toLowerCase());
  const orgLine = org?.name ? ` for ${org.name}` : "";

  return {
    id: uid("plan"),
    objective: objective.trim(),
    title: makeTitle(e, kind, objective),
    analysis: `${agents.length === 1 ? "1 intelligence" : `${agents.length} intelligences`} recommended${orgLine}.`,
    reasoningSummary: `I'd start by ${lead.slice(0, -1).join(", ")}${lead.length > 1 ? ", then " : ""}${lead[lead.length - 1] ?? "organizing the work"}.${
      tasks.some((t) => t.approval?.kind === "review") ? " Nothing leaves the company until you approve it." : ""
    }`,
    entities: e,
    agents: assignments,
    tasks,
    resultKind: kind,
    estimatedMinutes: Math.max(3, Math.round(totalMs / 4000)),
  };
}

/** Rebuild assignments after the user edits the team (add/remove/role). */
export function retargetPlan(plan: Plan, agentIds: AgentId[], roles: Record<AgentId, string> = {}): Plan {
  const fresh = createPlan(plan.objective);
  const keep = agentIds.filter((id) => getAgent(id)?.availability === "available");
  let tasks = fresh.tasks;
  // Reassign orphaned tasks to the first remaining agent so the mission still completes.
  if (keep.length) {
    tasks = tasks.map((t) => (keep.includes(t.agentId) ? t : { ...t, agentId: keep.includes("dots") ? "dots" : keep[0] }));
  }
  const c: Ctx = {
    e: fresh.entities,
    n: fresh.entities.count ?? (fresh.resultKind === "prospects" ? 50 : 10),
    target: fresh.entities.target ?? "businesses",
    where: fresh.entities.location ?? "your target market",
    r: prng(hashString(plan.objective)),
  };
  const assignments = keep.map((id) => {
    const existing = plan.agents.find((a) => a.agentId === id);
    const base = existing ?? assignmentFor(id, tasks, c, fresh.resultKind);
    const roleId = roles[id] ?? base.roleId;
    return { ...assignmentFor(id, tasks, c, fresh.resultKind), why: base.why, roleId };
  });
  return {
    ...plan,
    tasks,
    agents: assignments,
    analysis: `${keep.length === 1 ? "1 intelligence" : `${keep.length} intelligences`} assigned.`,
  };
}
