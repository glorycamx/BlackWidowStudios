import type { MemoryDomain } from "@/types";

/**
 * Organization memory domains. Items are demo-workspace examples; in
 * production they are built from onboarding, connected tools and missions.
 */
export const memoryDomains: MemoryDomain[] = [
  { id: "brand", label: "Brand", summary: "Voice, positioning, visual rules.", items: ["Direct, plain-spoken voice", "No discount-first messaging", "Brand guide v3"] },
  { id: "customers", label: "Customers", summary: "Who buys, why, and what they ask.", items: ["Local service businesses, 5–50 staff", "Owner-operated, decides fast", "Top objection: price"] },
  { id: "offers", label: "Offers", summary: "Products, pricing, guarantees.", items: ["Website rebuild", "Monthly care plan", "Local SEO add-on"] },
  { id: "knowledge", label: "Knowledge", summary: "Documents and reference material.", items: ["Case studies (4)", "Sales playbook", "FAQ answers"] },
  { id: "processes", label: "Processes", summary: "How work moves through the company.", items: ["Lead → call within 2h", "Proposal template", "Onboarding checklist"] },
  { id: "projects", label: "Projects", summary: "Past missions and their outcomes.", items: ["Q3 cold-lead recovery", "Spring promo", "Competitor brief (weekly)"] },
  { id: "team", label: "Team", summary: "People, roles, who approves what.", items: ["Founder approves outbound", "Sales owns CRM", "Design reviews creative"] },
];

export function getMemoryDomain(id: string) {
  return memoryDomains.find((m) => m.id === id);
}
