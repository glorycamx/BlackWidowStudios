/**
 * POST /api/z80/plan
 * in:  { objective: string, organizationContext?: Organization }
 * out: { plan: Plan, provider: string }
 *
 * Plan = { analysis, agents (recommendedAgents), tasks, reasoningSummary, ... }
 */
import { NextResponse } from "next/server";
import { getPlanner, providerName } from "@/lib/ai/provider";
import type { Organization } from "@/types";

export async function POST(req: Request) {
  let body: { objective?: unknown; organizationContext?: Organization | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const objective = typeof body.objective === "string" ? body.objective.trim() : "";
  if (objective.length < 3 || objective.length > 2000) {
    return NextResponse.json({ error: "Objective must be between 3 and 2000 characters." }, { status: 422 });
  }
  const plan = await getPlanner()(objective, body.organizationContext ?? null);
  return NextResponse.json({ plan, provider: providerName() });
}
