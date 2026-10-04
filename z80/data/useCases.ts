import type { AgentId } from "@/types";

export interface UseCaseStep {
  label: string;
  agents: AgentId[];
  detail: string;
}

export interface UseCase {
  id: string;
  label: string;
  outcome: string;
  prompt: string;
  steps: UseCaseStep[];
}

/** "What do you want to accelerate?" constellations on the homepage. */
export const useCases: UseCase[] = [
  {
    id: "sales",
    label: "Sales",
    outcome: "A pipeline that fills itself.",
    prompt: "Find 50 businesses in my area that need a new website and build a personalized outreach campaign.",
    steps: [
      { label: "Find leads", agents: ["grok"], detail: "Scan the market for companies that fit." },
      { label: "Research accounts", agents: ["grok"], detail: "Owners, signals, timing." },
      { label: "Personalize outreach", agents: ["muse"], detail: "A real reason to reply, per company." },
      { label: "Update CRM", agents: ["dots"], detail: "Clean records, right stages." },
      { label: "Alert salesperson", agents: ["dots"], detail: "Hot accounts, ready for a call." },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    outcome: "Campaigns that learn.",
    prompt: "Research our market and launch our next campaign.",
    steps: [
      { label: "Research market", agents: ["grok"], detail: "Audience, competitors, gaps." },
      { label: "Generate concepts", agents: ["muse"], detail: "Three distinct creative directions." },
      { label: "Create campaign", agents: ["muse", "dots"], detail: "Copy, assets, schedule." },
      { label: "Review performance", agents: ["dots"], detail: "What worked, what didn't." },
      { label: "Generate iteration", agents: ["muse"], detail: "The next, better version." },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    outcome: "Work that moves while you don't.",
    prompt: "Organize our open projects and send me a status report every Friday.",
    steps: [
      { label: "Collect status", agents: ["dots"], detail: "Every open project, every owner." },
      { label: "Flag blockers", agents: ["dots"], detail: "What is late and why." },
      { label: "Follow up", agents: ["dots"], detail: "Polite nudges to the right people." },
      { label: "Report", agents: ["dots", "muse"], detail: "One readable summary." },
    ],
  },
  {
    id: "research",
    label: "Research",
    outcome: "Know more than your competitors.",
    prompt: "Research my top five competitors and tell me where we can win.",
    steps: [
      { label: "Map competitors", agents: ["grok"], detail: "Who, where, how they sell." },
      { label: "Analyze positioning", agents: ["grok", "muse"], detail: "Messaging, pricing, offers." },
      { label: "Find gaps", agents: ["grok"], detail: "Where they are weak." },
      { label: "Brief", agents: ["dots"], detail: "Clear recommendations." },
    ],
  },
  {
    id: "cx",
    label: "Customer Experience",
    outcome: "Every customer followed up.",
    prompt: "Follow up with every customer from last month and ask happy ones for a review.",
    steps: [
      { label: "Pull customers", agents: ["dots"], detail: "Everyone served last month." },
      { label: "Write follow-ups", agents: ["muse"], detail: "Personal, short, in your voice." },
      { label: "Approve & send", agents: ["dots"], detail: "You approve before anything goes out." },
      { label: "Route replies", agents: ["dots"], detail: "Issues to you, praise to reviews." },
    ],
  },
  {
    id: "content",
    label: "Content",
    outcome: "A content operation, not a to-do.",
    prompt: "Run our content operation: plan a month of posts and write the first week.",
    steps: [
      { label: "Find topics", agents: ["grok"], detail: "What your customers are asking." },
      { label: "Plan calendar", agents: ["dots"], detail: "A month, by channel." },
      { label: "Write posts", agents: ["muse"], detail: "In your brand voice." },
      { label: "Schedule", agents: ["dots"], detail: "Queued for your approval." },
    ],
  },
];
