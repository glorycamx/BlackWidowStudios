/**
 * AI provider boundary (server-only).
 *
 * API routes call `getPlanner()` / `getChatResponder()`. Today both return the
 * deterministic mock services. To use a real model:
 *   1. Implement `Planner` / `ChatResponder` with your provider's SDK.
 *   2. Read the key from process.env.Z80_AI_API_KEY (never NEXT_PUBLIC_*).
 *   3. Return your implementation below when Z80_AI_PROVIDER matches.
 * The model must return the `Plan` shape from types/index.ts — validate it
 * before returning, and fall back to the mock planner on failure.
 */
import "server-only";
import { createPlan } from "@/lib/services/planService";
import { respond, type ChatContext, type ChatReply } from "@/lib/services/chatService";
import type { Organization, Plan } from "@/types";

export type Planner = (objective: string, org?: Organization | null) => Promise<Plan>;
export type ChatResponder = (message: string, ctx: ChatContext) => Promise<ChatReply>;

export function providerName(): string {
  return process.env.Z80_AI_PROVIDER || "mock";
}

export function getPlanner(): Planner {
  // if (providerName() === "your-provider" && process.env.Z80_AI_API_KEY) return modelPlanner;
  return async (objective, org) => createPlan(objective, org);
}

export function getChatResponder(): ChatResponder {
  return async (message, ctx) => respond(message, ctx);
}
