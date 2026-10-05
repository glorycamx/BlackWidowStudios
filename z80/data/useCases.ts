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
      { label: "Find leads", agents: ["lead-hunter"], detail: "Scan the market for companies that fit." },
      { label: "Research accounts", agents: ["lead-hunter"], detail: "Owners, buying moments, timing." },
      { label: "Personalize outreach", agents: ["content-creator"], detail: "A real reason to reply, per company." },
      { label: "Update CRM", agents: ["manager"], detail: "Clean records, right stages." },
      { label: "Alert salesperson", agents: ["manager"], detail: "Hot accounts, ready for a call." },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    outcome: "Campaigns that learn.",
    prompt: "Research our market and launch our next campaign.",
    steps: [
      { label: "Research market", agents: ["lead-hunter"], detail: "Audience, competitors, gaps." },
      { label: "Generate concepts", agents: ["content-creator"], detail: "Three distinct creative directions." },
      { label: "Create campaign", agents: ["content-creator", "manager"], detail: "Copy, assets, schedule." },
      { label: "Review performance", agents: ["manager"], detail: "What worked, what didn't." },
      { label: "Generate iteration", agents: ["content-creator"], detail: "The next, better version." },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    outcome: "Work that moves while you don't.",
    prompt: "Organize our open projects and send me a status report every Friday.",
    steps: [
      { label: "Collect status", agents: ["manager"], detail: "Every open project, every owner." },
      { label: "Flag blockers", agents: ["manager"], detail: "What is late and why." },
      { label: "Follow up", agents: ["manager"], detail: "Polite nudges to the right people." },
      { label: "Report", agents: ["manager", "content-creator"], detail: "One readable summary." },
    ],
  },
  {
    id: "research",
    label: "Research",
    outcome: "Know more than your competitors.",
    prompt: "Research my top five competitors and tell me where we can win.",
    steps: [
      { label: "Map competitors", agents: ["lead-hunter"], detail: "Who, where, how they sell." },
      { label: "Analyze positioning", agents: ["lead-hunter", "content-creator"], detail: "Messaging, pricing, offers." },
      { label: "Find gaps", agents: ["lead-hunter"], detail: "Where they are weak." },
      { label: "Brief", agents: ["manager"], detail: "Clear recommendations." },
    ],
  },
  {
    id: "cx",
    label: "Customer Experience",
    outcome: "Every customer followed up.",
    prompt: "Follow up with every customer from last month and ask happy ones for a review.",
    steps: [
      { label: "Pull customers", agents: ["manager"], detail: "Everyone served last month." },
      { label: "Write follow-ups", agents: ["content-creator"], detail: "Personal, short, in your voice." },
      { label: "Approve & send", agents: ["manager"], detail: "You approve before anything goes out." },
      { label: "Route replies", agents: ["manager"], detail: "Issues to you, praise to reviews." },
    ],
  },
  {
    id: "content",
    label: "Content",
    outcome: "A content operation, not a to-do.",
    prompt: "Run our content operation: plan a month of posts and write the first week.",
    steps: [
      { label: "Find topics", agents: ["lead-hunter"], detail: "What your customers are asking." },
      { label: "Plan calendar", agents: ["manager"], detail: "A month, by channel." },
      { label: "Write posts", agents: ["content-creator"], detail: "In your brand voice." },
      { label: "Schedule", agents: ["manager"], detail: "Queued for your approval." },
    ],
  },
];
