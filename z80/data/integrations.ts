import type { Integration, IntegrationStatus } from "@/types";

/**
 * Integration catalog.
 *
 * STATUS IS THE SOURCE OF TRUTH FOR WHAT THE SITE CLAIMS.
 * Nothing is connected to a real third-party API in this build, so every
 * entry is "coming-soon" or "planned". When an integration ships, flip it to
 * "live" here and every surface (marketing, Connections, agent profiles)
 * updates. Monograms are used instead of third-party logos on purpose.
 */
export const integrations: Integration[] = [
  { id: "gmail", name: "Gmail", category: "communication", status: "coming-soon", mono: "GM", description: "Read threads, draft and send email." },
  { id: "gcal", name: "Google Calendar", category: "productivity", status: "coming-soon", mono: "GC", description: "Check availability, book meetings." },
  { id: "gdrive", name: "Google Drive", category: "productivity", status: "coming-soon", mono: "GD", description: "Read briefs, store deliverables." },
  { id: "slack", name: "Slack", category: "communication", status: "coming-soon", mono: "SL", description: "Report progress, request approvals." },
  { id: "hubspot", name: "HubSpot", category: "crm", status: "coming-soon", mono: "HS", description: "Create and update contacts and deals." },
  { id: "ghl", name: "GoHighLevel", category: "crm", status: "planned", mono: "HL", description: "Pipelines, contacts and campaigns." },
  { id: "salesforce", name: "Salesforce", category: "crm", status: "planned", mono: "SF", description: "Accounts, leads and opportunities." },
  { id: "stripe", name: "Stripe", category: "commerce", status: "planned", mono: "ST", description: "Invoices, payments and revenue data." },
  { id: "shopify", name: "Shopify", category: "commerce", status: "planned", mono: "SH", description: "Products, orders and customers." },
  { id: "meta", name: "Meta Ads", category: "social", status: "planned", mono: "MA", description: "Draft and manage ad campaigns." },
  { id: "instagram", name: "Instagram", category: "social", status: "planned", mono: "IG", description: "Plan and publish posts." },
  { id: "x", name: "X", category: "social", status: "planned", mono: "X", description: "Monitor conversations, publish posts." },
  { id: "notion", name: "Notion", category: "productivity", status: "planned", mono: "NO", description: "Read docs, write reports." },
  { id: "web", name: "Public Web", category: "web", status: "preview", mono: "WW", description: "Browse and read public websites." },
  { id: "google", name: "Google Search", category: "web", status: "planned", mono: "GS", description: "Search the open web." },
];

export const integrationStatusLabel: Record<IntegrationStatus, string> = {
  live: "Live",
  preview: "Preview",
  "coming-soon": "Coming soon",
  planned: "Planned",
};

export function getIntegration(id: string): Integration | undefined {
  return integrations.find((i) => i.id === id);
}

export function integrationName(id: string): string {
  return getIntegration(id)?.name ?? id;
}
