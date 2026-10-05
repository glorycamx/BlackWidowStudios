import type { Agent, CustomBotSpec } from "@/types";

/**
 * The bot roster. One place for every name, job line, color and glyph.
 * Add an entry here and it appears everywhere: team, chat, routines, the
 * homepage and the bot pages. Custom bots made in the app are added at
 * runtime (see lib/store/workspace.ts) and use the same shape.
 *
 * `role` is the one-line job shown under the name. `sceneGroup` (0-4) binds a
 * bot to its particle cluster on the homepage.
 */
export const bots: Agent[] = [
  {
    id: "manager",
    slug: "manager",
    name: "Manager",
    designation: "",
    role: "Runs your team and keeps you in the loop",
    domain: "Team and updates",
    tagline: "Runs your team. Day and night.",
    shortDescription: "Hands each request to the right bot, sends your morning text and evening recap, and chases anything waiting on you.",
    description:
      "Manager runs the team. It hands your requests to the right bot, keeps the work moving between them, sends you a morning text and an evening recap, reminds you about follow-ups, and only interrupts you when something needs a yes.",
    personality: ["Calm", "Organized", "On time", "Clear"],
    capabilities: ["Morning text", "Evening recap", "Follow-ups", "Reminders", "Approvals", "Team chat"],
    specialties: ["Routing requests", "Morning text and evening recap", "Follow-up reminders", "Chasing approvals", "Keeping the team in sync"],
    roles: [
      { id: "coordinator", label: "Team lead", summary: "Runs the work end to end." },
      { id: "organizer", label: "Organizer", summary: "Keeps lists clean and checked." },
      { id: "reporter", label: "Updates", summary: "Tells you what happened." },
    ],
    tools: ["slack", "gmail", "gcal", "gdrive", "notion", "hubspot"],
    memory: ["processes", "projects", "team"],
    collaborators: ["lead-hunter", "content-creator", "researcher", "reporter"],
    accent: { hex: "#E6E8F2", tint: "#F5F6FA", rgb: "230 232 242" },
    visual: "lattice",
    sceneGroup: 0,
    availability: "available",
    workingVerb: "is keeping the team on track",
  },
  {
    id: "lead-hunter",
    slug: "lead-hunter",
    name: "Lead Hunter",
    designation: "",
    role: "Finds hot leads the minute they happen",
    domain: "Leads",
    tagline: "Never stops looking. Finds it first.",
    shortDescription: "Watches for buying moments around the clock, researches the owner, and scores every lead.",
    description:
      "Lead Hunter is always watching for the moment a business needs you: a website goes down, a business changes hands, a new business opens, reviews spike, a domain is about to expire. It researches the owner, scores the lead, and hands it to Content Creator for an opener.",
    personality: ["Fast", "Curious", "Relentless", "First to know"],
    capabilities: ["Websites going down", "New owners", "New businesses", "Review spikes", "Expiring domains", "Hiring"],
    specialties: ["Catching buying moments", "Researching owners", "Scoring leads", "Finding contact details"],
    roles: [
      { id: "prospector", label: "Lead finder", summary: "Finds and checks new leads." },
      { id: "analyst", label: "Market scout", summary: "Maps who is out there." },
      { id: "monitor", label: "Watcher", summary: "Watches accounts for buying moments." },
    ],
    tools: ["web", "google", "hubspot", "salesforce", "ghl", "x"],
    memory: ["customers", "offers", "knowledge"],
    collaborators: ["manager", "content-creator"],
    accent: { hex: "#7A6BFF", tint: "#CEC8FF", rgb: "122 107 255" },
    visual: "scanner",
    sceneGroup: 1,
    availability: "available",
    workingVerb: "is hunting",
  },
  {
    id: "content-creator",
    slug: "content-creator",
    name: "Content Creator",
    designation: "",
    role: "Writes and posts your content, on time, every time",
    domain: "Posts and outreach",
    tagline: "Writes while you sleep. Posts on the minute.",
    shortDescription: "Keeps your posting calendar full, writes in your voice, posts at the exact minute, and writes every lead opener.",
    description:
      "Content Creator keeps your calendar full. It drafts posts in your voice, posts at the exact scheduled minute, writes the openers for every new lead, and tells you which posts did well.",
    personality: ["Creative", "Reliable", "Persuasive", "On brand"],
    capabilities: ["Posts", "Captions", "Lead openers", "Emails", "Ads", "Calendar"],
    specialties: ["Posting on schedule", "Writing in your voice", "Lead openers", "Campaign ideas", "Performance notes"],
    roles: [
      { id: "messaging", label: "Outreach writer", summary: "Writes openers and emails." },
      { id: "director", label: "Creative lead", summary: "Owns ideas and direction." },
      { id: "content", label: "Poster", summary: "Keeps the calendar full and on time." },
    ],
    tools: ["gdrive", "gmail", "meta", "instagram", "x", "web"],
    memory: ["brand", "customers", "offers"],
    collaborators: ["manager", "lead-hunter"],
    accent: { hex: "#C252F2", tint: "#EBC6FF", rgb: "194 82 242" },
    visual: "fluid",
    sceneGroup: 2,
    availability: "available",
    workingVerb: "is writing",
  },
  {
    id: "researcher",
    slug: "researcher",
    name: "Researcher",
    designation: "",
    role: "Watches your market for money you are missing",
    domain: "Market and upsells",
    tagline: "Finds the money you are leaving on the table.",
    shortDescription: "Spots upsells for your clients, competitor price changes, and services people are starting to search for.",
    description:
      "Researcher watches your market for money you are missing: upsells for clients you already have, competitor price and offer changes, services people are starting to search for, and new offers worth adding.",
    personality: ["Thorough", "Sharp", "Practical", "Patient"],
    capabilities: ["Upsells", "Competitors", "Prices", "Trends", "New offers"],
    specialties: ["Upsells for current clients", "Competitor watch", "Search trends", "Offer ideas"],
    roles: [
      { id: "analyst", label: "Market watcher", summary: "Watches competitors and trends." },
      { id: "upsell", label: "Upsell finder", summary: "Finds more to offer current clients." },
    ],
    tools: ["web", "google", "hubspot"],
    memory: ["customers", "offers", "knowledge"],
    collaborators: ["manager", "content-creator"],
    accent: { hex: "#6E9BFF", tint: "#C9D8FF", rgb: "110 155 255" },
    visual: "orbit",
    sceneGroup: 3,
    availability: "available",
    workingVerb: "is researching",
  },
  {
    id: "reporter",
    slug: "reporter",
    name: "Reporter",
    designation: "",
    role: "Tells you what changed and why it matters",
    domain: "News and briefs",
    tagline: "What changed, and what to do about it.",
    shortDescription: "Writes your morning brief and flags breaking news in your niche and in AI, with what it means for you.",
    description:
      "Reporter reads the news so you don't have to. Every morning it writes you a short brief, and when something breaks in your niche or in AI it tells you right away. Every story ends with why it matters to you and what to do.",
    personality: ["Clear", "Quick", "Plain-spoken", "Useful"],
    capabilities: ["Morning brief", "Breaking news", "AI news", "What to do"],
    specialties: ["Morning brief", "Breaking items in your niche", "AI news worth knowing"],
    roles: [{ id: "briefer", label: "Briefer", summary: "Writes your daily brief." }],
    tools: ["web", "google"],
    memory: ["knowledge", "customers"],
    collaborators: ["manager"],
    accent: { hex: "#5FC8E8", tint: "#C4ECF7", rgb: "95 200 232" },
    visual: "pulse",
    sceneGroup: 4,
    availability: "available",
    workingVerb: "is reading",
  },
  {
    id: "receptionist",
    slug: "receptionist",
    name: "Receptionist",
    designation: "",
    role: "Answers calls and messages, books jobs",
    domain: "Calls and booking",
    tagline: "Every call answered.",
    shortDescription: "Answers calls and messages in your voice and books jobs into your calendar.",
    description: "Receptionist is coming soon. It will answer calls and messages, and book jobs straight into your calendar.",
    personality: ["Warm", "Patient", "Always there"],
    capabilities: ["Calls", "Messages", "Booking"],
    specialties: ["Answering calls", "Booking jobs", "Replying to messages"],
    roles: [{ id: "support", label: "Front desk", summary: "Answers and books." }],
    tools: ["gmail", "gcal"],
    memory: ["customers", "brand"],
    collaborators: ["manager"],
    accent: { hex: "#8E93A8", tint: "#D4D6E0", rgb: "142 147 168" },
    visual: "pulse",
    availability: "coming-soon",
    workingVerb: "is answering",
  },
  {
    id: "bookkeeper",
    slug: "bookkeeper",
    name: "Bookkeeper",
    designation: "",
    role: "Sends invoices and chases unpaid bills",
    domain: "Invoices",
    tagline: "Get paid on time.",
    shortDescription: "Sends invoices and follows up on unpaid bills.",
    description: "Bookkeeper is coming soon. It will send invoices and follow up on unpaid bills.",
    personality: ["Exact", "Polite", "Persistent"],
    capabilities: ["Invoices", "Reminders", "Payments"],
    specialties: ["Sending invoices", "Following up on unpaid bills"],
    roles: [{ id: "finance", label: "Billing", summary: "Invoices and follow-ups." }],
    tools: ["stripe", "gmail"],
    memory: ["offers", "customers"],
    collaborators: ["manager"],
    accent: { hex: "#8E93A8", tint: "#D4D6E0", rgb: "142 147 168" },
    visual: "orbit",
    availability: "coming-soon",
    workingVerb: "is reconciling",
  },
];

/* ------------------------------------------------------------------ */
/* Custom bots: created by the user, registered at runtime              */
/* ------------------------------------------------------------------ */

let custom: Agent[] = [];

/** Replace the runtime list of user-made bots (called by the store). */
export function registerCustomBots(list: Agent[]) {
  custom = list;
}

function all(): Agent[] {
  return [...bots, ...custom];
}

/** Back-compat name used across the codebase. */
export const agents = bots;

export function allBots(): Agent[] {
  return all();
}

export const availableAgents = bots.filter((a) => a.availability === "available");

export function getAgent(id: string): Agent | undefined {
  return all().find((a) => a.id === id);
}

export function getAgentBySlug(slug: string): Agent | undefined {
  return all().find((a) => a.slug === slug);
}

/** Safe lookup for render paths. Falls back to Manager's shape with the given id. */
export function agentOrFallback(id: string): Agent {
  return getAgent(id) ?? { ...bots[0], id, name: id, slug: id };
}

/** Colors offered when someone builds their own bot (brand range only). */
export const CUSTOM_COLORS = [
  { hex: "#9AA5FF", tint: "#D9DEFF", rgb: "154 165 255" },
  { hex: "#8B7CFF", tint: "#D6D0FF", rgb: "139 124 255" },
  { hex: "#B06BFF", tint: "#E3CCFF", rgb: "176 107 255" },
  { hex: "#5FA8FF", tint: "#C7E0FF", rgb: "95 168 255" },
  { hex: "#7FD4E8", tint: "#D2F1F8", rgb: "127 212 232" },
];

/** Turn a saved custom bot into a full roster entry. */
export function specToAgent(spec: CustomBotSpec): Agent {
  const accent = CUSTOM_COLORS[spec.colorIndex % CUSTOM_COLORS.length];
  return {
    id: spec.id,
    slug: spec.id,
    name: spec.name,
    designation: "",
    role: spec.job,
    domain: "Your bot",
    tagline: spec.job,
    shortDescription: spec.job,
    description: `${spec.name} is a bot you made. ${spec.job}`,
    personality: ["Tireless", "Focused"],
    capabilities: [spec.job],
    specialties: [spec.job],
    roles: [{ id: "custom", label: "Your bot", summary: spec.job }],
    tools: ["web"],
    memory: ["knowledge", "customers"],
    collaborators: ["manager"],
    accent,
    visual: spec.visual,
    availability: "available",
    workingVerb: "is working",
    custom: true,
  };
}
