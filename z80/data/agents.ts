import type { Agent } from "@/types";

/**
 * The intelligence roster. Fully data-driven: add an entry here and it
 * appears in the roster, planner, command palette and agent routes.
 * `sceneGroup` binds the three showcase intelligences to the particle scene.
 */
export const agents: Agent[] = [
  {
    id: "helm",
    slug: "helm",
    name: "Helm",
    designation: "Z80-OPS",
    role: "Operations Intelligence",
    domain: "Research + Orchestration",
    tagline: "Turns complex objectives into coordinated action.",
    shortDescription: "Breaks the mission down, routes the work, and makes sure it is finished.",
    description:
      "Helm is the connective intelligence of your workforce. It decomposes objectives into tasks, decides which intelligence handles each one, keeps work moving between them, and tells you when a human decision is needed.",
    personality: ["Precise", "Calm", "Organized", "Analytical"],
    capabilities: ["Orchestration", "Workflows", "Monitoring", "Routing", "Reporting", "Follow-up"],
    specialties: [
      "Task decomposition",
      "Agent routing",
      "Project coordination",
      "Follow-ups",
      "Status reporting",
      "Data organization",
    ],
    roles: [
      { id: "coordinator", label: "Mission Coordinator", summary: "Runs the operation end to end." },
      { id: "organizer", label: "Data Organizer", summary: "Structures and validates every output." },
      { id: "reporter", label: "Reporting Lead", summary: "Summarizes progress and results." },
    ],
    tools: ["slack", "gmail", "gcal", "gdrive", "notion", "hubspot"],
    memory: ["processes", "projects", "team"],
    collaborators: ["lookout", "beacon"],
    accent: { hex: "#6E9BFF", tint: "#C9D8FF", rgb: "110 155 255" },
    visual: "lattice",
    sceneGroup: 0,
    availability: "available",
    workingVerb: "is coordinating execution",
  },
  {
    id: "lookout",
    slug: "lookout",
    name: "Lookout",
    designation: "Z80-GRW",
    role: "Growth Intelligence",
    domain: "Prospecting + Market Intelligence",
    tagline: "Find the opportunity before everyone else does.",
    shortDescription: "Finds, researches and qualifies the companies and people worth your time.",
    description:
      "Lookout is a fast, relentless researcher. It scans markets, identifies companies that fit, finds the decision makers, reads the signals that suggest timing, and scores every opportunity so your team only spends time where it counts.",
    personality: ["Fast", "Curious", "Relentless", "Opportunity-focused"],
    capabilities: ["Prospecting", "Research", "Signals", "Markets", "Competitors", "Leads"],
    specialties: [
      "Lead generation",
      "Company research",
      "Decision-maker discovery",
      "Opportunity scoring",
      "Competitor monitoring",
      "News and signal detection",
    ],
    roles: [
      { id: "prospector", label: "Prospect Intelligence", summary: "Finds and qualifies new accounts." },
      { id: "analyst", label: "Market Analyst", summary: "Maps markets and competitors." },
      { id: "monitor", label: "Signal Monitor", summary: "Watches accounts for buying signals." },
    ],
    tools: ["web", "google", "hubspot", "salesforce", "ghl", "x"],
    memory: ["customers", "offers", "knowledge"],
    collaborators: ["helm", "beacon"],
    accent: { hex: "#7A6BFF", tint: "#CEC8FF", rgb: "122 107 255" },
    visual: "scanner",
    sceneGroup: 1,
    availability: "available",
    workingVerb: "is researching",
  },
  {
    id: "beacon",
    slug: "beacon",
    name: "Beacon",
    designation: "Z80-CRT",
    role: "Creative Intelligence",
    domain: "Creative + Messaging",
    tagline: "Turns information into ideas people act on.",
    shortDescription: "Writes, concepts and directs the work your customers actually see.",
    description:
      "Beacon is your creative director. It studies your brand, your audience and the research the rest of the workforce gathers, then produces campaigns, messaging, copy and concepts that sound like you and give people a reason to respond.",
    personality: ["Inventive", "Culturally aware", "Persuasive", "Opinionated"],
    capabilities: ["Copy", "Branding", "Ads", "Campaigns", "Content", "Creative Strategy"],
    specialties: [
      "Campaign strategy",
      "Copywriting",
      "Creative direction",
      "Brand voice",
      "Ad concepts",
      "Personalized outreach",
    ],
    roles: [
      { id: "messaging", label: "Messaging Lead", summary: "Writes outreach and campaign copy." },
      { id: "director", label: "Creative Director", summary: "Owns concepts and creative direction." },
      { id: "content", label: "Content Engine", summary: "Produces content across channels." },
    ],
    tools: ["gdrive", "gmail", "meta", "instagram", "x", "web"],
    memory: ["brand", "customers", "offers"],
    collaborators: ["helm", "lookout"],
    accent: { hex: "#C252F2", tint: "#EBC6FF", rgb: "194 82 242" },
    visual: "fluid",
    sceneGroup: 2,
    availability: "available",
    workingVerb: "is synthesizing concepts",
  },
  {
    id: "purser",
    slug: "purser",
    name: "Purser",
    designation: "Z80-FIN",
    role: "Finance Intelligence",
    domain: "Billing + Revenue Operations",
    tagline: "Keeps the numbers honest.",
    shortDescription: "Invoices, reconciliation and revenue reporting.",
    description:
      "Purser is on the roadmap. It will handle invoicing follow-ups, reconciliation and revenue reporting alongside the rest of your workforce.",
    personality: ["Exact", "Conservative", "Transparent"],
    capabilities: ["Invoicing", "Reconciliation", "Forecasts"],
    specialties: ["Invoice follow-up", "Revenue reporting", "Reconciliation"],
    roles: [{ id: "finance", label: "Finance Operations", summary: "Billing and revenue." }],
    tools: ["stripe", "gmail"],
    memory: ["offers", "customers"],
    collaborators: ["helm"],
    accent: { hex: "#8E93A8", tint: "#D4D6E0", rgb: "142 147 168" },
    visual: "orbit",
    availability: "coming-soon",
    workingVerb: "is reconciling",
  },
  {
    id: "steward",
    slug: "steward",
    name: "Steward",
    designation: "Z80-CX",
    role: "Customer Intelligence",
    domain: "Support + Customer Experience",
    tagline: "Every customer answered.",
    shortDescription: "Support replies, follow-ups and customer insight.",
    description:
      "Steward is on the roadmap. It will answer customer questions in your voice, follow up after jobs and surface what customers are telling you.",
    personality: ["Warm", "Patient", "Attentive"],
    capabilities: ["Support", "Follow-up", "Insight"],
    specialties: ["Support replies", "Post-job follow-up", "Review requests"],
    roles: [{ id: "support", label: "Customer Support", summary: "Handles customer conversations." }],
    tools: ["gmail", "slack"],
    memory: ["customers", "brand"],
    collaborators: ["helm", "beacon"],
    accent: { hex: "#8E93A8", tint: "#D4D6E0", rgb: "142 147 168" },
    visual: "orbit",
    availability: "coming-soon",
    workingVerb: "is responding",
  },
];

export const availableAgents = agents.filter((a) => a.availability === "available");

export function getAgent(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export function getAgentBySlug(slug: string): Agent | undefined {
  return agents.find((a) => a.slug === slug);
}

/** Safe lookup for render paths — falls back to Helm' shape with the given id. */
export function agentOrFallback(id: string): Agent {
  return getAgent(id) ?? { ...agents[0], id, name: id, slug: id };
}
