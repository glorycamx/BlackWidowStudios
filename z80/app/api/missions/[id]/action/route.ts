/**
 * POST /api/missions/:id/action
 * in:  { action: "approve" | "deny" | "pause" | "resume" | "reconnect" | "continue", approvalId?: string }
 * out: { accepted: true, id, action }
 *
 * MOCK: acknowledges the action. In the demo, mission state lives in the
 * client store; a real backend would load the mission, apply
 * resolveMissionApproval / recoverMission, persist and stream the emissions.
 */
import { NextResponse } from "next/server";

const ACTIONS = new Set(["approve", "deny", "pause", "resume", "reconnect", "continue"]);

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: { action?: string; approvalId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.action || !ACTIONS.has(body.action)) {
    return NextResponse.json({ error: `Unknown action. Use one of: ${[...ACTIONS].join(", ")}.` }, { status: 422 });
  }
  return NextResponse.json({ accepted: true, id, action: body.action, approvalId: body.approvalId ?? null });
}
