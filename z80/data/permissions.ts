import type { PermissionLevel, PermissionRule } from "@/types";

/** Default workspace permission policy. Users edit this in the product. */
export const defaultPermissions: PermissionRule[] = [
  { id: "research-public", action: "Research public companies", detail: "Browse websites, directories and public records.", category: "research", level: "autonomous" },
  { id: "generate-drafts", action: "Generate drafts", detail: "Write copy, concepts and documents for review.", category: "content", level: "autonomous" },
  { id: "update-crm", action: "Update CRM records", detail: "Create contacts, add notes, change stages.", category: "data", level: "autonomous" },
  { id: "read-crm", action: "Read CRM contact records", detail: "Look up existing contacts and history.", category: "data", level: "approval" },
  { id: "send-email", action: "Send outbound emails", detail: "Any message that leaves your company.", category: "outreach", level: "approval" },
  { id: "publish-social", action: "Publish to social", detail: "Posts on your company accounts.", category: "outreach", level: "approval" },
  { id: "spend-budget", action: "Spend advertising budget", detail: "Launch or change paid campaigns.", category: "spend", level: "approval" },
  { id: "delete-data", action: "Delete company data", detail: "Remove records, files or contacts.", category: "admin", level: "disabled" },
];

export const permissionLevels: { id: PermissionLevel; label: string; summary: string }[] = [
  { id: "autonomous", label: "Autonomous", summary: "Agents act without asking." },
  { id: "approval", label: "Ask first", summary: "Agents prepare the work, you approve." },
  { id: "disabled", label: "Blocked", summary: "Agents can never do this." },
];
