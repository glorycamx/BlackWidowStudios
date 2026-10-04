/**
 * POST /api/missions
 * in:  { plan: Plan, number?: number }
 * out: { mission: Mission }
 *
 * MOCK: missions are created and simulated client-side in the demo (see
 * lib/store/workspace.ts). This endpoint returns the same Mission shape a
 * persistent backend would, so the client can switch to it unchanged.
 */
import { NextResponse } from "next/server";
import { createMission } from "@/lib/services/missionService";
import type { Plan } from "@/types";

export async function POST(req: Request) {
  let body: { plan?: Plan; number?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.plan || !Array.isArray(body.plan.tasks) || !Array.isArray(body.plan.agents)) {
    return NextResponse.json({ error: "A valid plan is required." }, { status: 422 });
  }
  const mission = createMission(body.plan, typeof body.number === "number" ? body.number : 1);
  return NextResponse.json({ mission }, { status: 201 });
}
