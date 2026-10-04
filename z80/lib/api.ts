/**
 * Client API wrapper. Calls the Next.js API routes and falls back to the
 * local mock services if the network call fails, so the demo never dead-ends.
 */
import { respond, type ChatContext, type ChatReply } from "@/lib/services/chatService";
import { createPlan } from "@/lib/services/planService";
import type { Organization, Plan } from "@/types";

async function post<T>(url: string, body: unknown, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function requestPlan(objective: string, org?: Organization | null): Promise<Plan> {
  try {
    const { plan } = await post<{ plan: Plan }>("/api/z80/plan", { objective, organizationContext: org ?? null });
    return plan;
  } catch {
    return createPlan(objective, org);
  }
}

export async function requestChat(message: string, ctx: ChatContext): Promise<ChatReply> {
  const slim: ChatContext = {
    org: ctx.org,
    // The mock responder only needs summaries; strip simulation scripts.
    missions: ctx.missions.map((m) => ({ ...m, script: [] })),
    approvals: ctx.approvals,
  };
  try {
    const { reply } = await post<{ reply: ChatReply }>("/api/chat", { message, context: slim });
    return reply;
  } catch {
    return respond(message, ctx);
  }
}
