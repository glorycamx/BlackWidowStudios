/**
 * POST /api/chat
 * in:  { message: string, context: { org, missions, approvals } }
 * out: { reply: { text, plan? }, provider }
 */
import { NextResponse } from "next/server";
import { getChatResponder, providerName } from "@/lib/ai/provider";
import type { ChatContext } from "@/lib/services/chatService";

export async function POST(req: Request) {
  let body: { message?: unknown; context?: Partial<ChatContext> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 4000) {
    return NextResponse.json({ error: "Message must be between 1 and 4000 characters." }, { status: 422 });
  }
  const ctx: ChatContext = {
    org: body.context?.org ?? null,
    missions: Array.isArray(body.context?.missions) ? body.context!.missions : [],
    approvals: Array.isArray(body.context?.approvals) ? body.context!.approvals : [],
  };
  const reply = await getChatResponder()(message, ctx);
  return NextResponse.json({ reply, provider: providerName() });
}
