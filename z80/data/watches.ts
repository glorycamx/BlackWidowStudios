import type { WatchKind } from "@/types";

export interface WatchTemplate {
  kind: WatchKind;
  name: string;
  agentId: string;
  description: string;
  triggers: string[];
  cadence: string;
  /** Demo: average seconds between simulated signals. */
  demoEverySec: number;
}

/**
 * Standing orders the workforce runs around the clock. Each produces
 * signals. In this build signals are simulated (see signalService); a real
 * deployment feeds the same Signal shape from live monitors.
 */
export const watchTemplates: WatchTemplate[] = [
  {
    kind: "website-opportunities",
    name: "Website opportunities",
    agentId: "lead-hunter",
    description: "Local businesses whose website is costing them customers, caught the moment something changes.",
    triggers: [
      "Website goes down",
      "Business changes hands",
      "New business registered",
      "Review surge",
      "Site fails on mobile",
      "Domain about to expire",
      "Hiring for marketing",
    ],
    cadence: "Always on",
    demoEverySec: 34,
  },
  {
    kind: "ai-opportunities",
    name: "AI implementation",
    agentId: "lead-hunter",
    description: "Companies showing signs they need AI and automation: manual processes, hiring for repetitive work, slow response times.",
    triggers: [
      "Hiring for repetitive roles",
      "Reviews mention slow replies",
      "Paper or phone-only booking",
      "Opening a new location",
      "Manual quote process",
    ],
    cadence: "Always on",
    demoEverySec: 58,
  },
  {
    kind: "ai-news",
    name: "AI news",
    agentId: "lead-hunter",
    description: "What changed in AI, filtered for what matters to your business and your clients.",
    triggers: ["Every 5 minutes"],
    cadence: "Every 5 min",
    demoEverySec: 26,
  },
  {
    kind: "reminders",
    name: "Reminders",
    agentId: "manager",
    description: "Follow-ups, expiring proposals and anything a lead is waiting on. Nothing slips.",
    triggers: ["Follow-up due", "Proposal expiring", "Lead went quiet"],
    cadence: "As due",
    demoEverySec: 72,
  },
];

export function getWatchTemplate(kind: WatchKind) {
  return watchTemplates.find((t) => t.kind === kind);
}
