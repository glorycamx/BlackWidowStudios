import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import { db, schema } from "./db.js";
import { notifyClient, notifyTeam } from "./notify.js";
import { PLANS, nextPlan, ADDONS, type Tier } from "../shared/plans.js";

export type Client = typeof schema.clients.$inferSelect;

export async function getClient(clientId: number): Promise<Client> {
  const [c] = await db.select().from(schema.clients).where(eq(schema.clients.id, clientId));
  if (!c) throw new Error(`Client ${clientId} not found`);
  return c;
}

export function planFor(c: Client) {
  return PLANS[(c.tier as Tier) || 2];
}

// The monthly starts 30 days after go-live (Ops Manual 3.5)
export function monthlyStartDate(c: Client): string | null {
  if (!c.goLiveDate) return null;
  const d = new Date(`${c.goLiveDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 30);
  return d.toISOString().slice(0, 10);
}

export async function accountOverview(clientId: number) {
  const c = await getClient(clientId);
  const plan = planFor(c);
  const since = new Date(Date.now() - 30 * 86400_000);
  const [leadStats] = await db
    .select({
      last30: sql<number>`count(*) filter (where ${schema.leads.createdAt} >= ${since})`.mapWith(Number),
      newCount: sql<number>`count(*) filter (where ${schema.leads.status} = 'new')`.mapWith(Number),
      total: sql<number>`count(*)`.mapWith(Number),
    })
    .from(schema.leads)
    .where(eq(schema.leads.clientId, clientId));
  const openRevisions = await db
    .select()
    .from(schema.revisions)
    .where(and(eq(schema.revisions.clientId, clientId), ne(schema.revisions.status, "done")))
    .orderBy(schema.revisions.dueAt);
  const next = nextPlan(plan.tier);
  return {
    business: c.businessName,
    owner: c.ownerName,
    siteUrl: c.siteUrl,
    status: c.status,
    goLiveDate: c.goLiveDate,
    monthlyStartsOn: monthlyStartDate(c),
    plan: { tier: plan.tier, name: plan.name, monthly: plan.monthly, pages: plan.pages, revisionTurnaround: plan.revisionLabel, features: plan.features },
    nextPlan: next ? { tier: next.tier, name: next.name, monthly: next.monthly, revisionTurnaround: next.revisionLabel, features: next.features } : null,
    leads: leadStats,
    openRevisions: openRevisions.map((r) => ({ id: r.id, title: r.title, status: r.status, dueAt: r.dueAt })),
  };
}

export async function createRevision(
  clientId: number,
  input: { title: string; details: string; page?: string | null },
  createdBy: "client" | "bot" | "team",
) {
  const c = await getClient(clientId);
  const plan = planFor(c);
  const dueAt = new Date(Date.now() + plan.revisionHours * 3600_000);
  const [rev] = await db
    .insert(schema.revisions)
    .values({ clientId, title: input.title, details: input.details, page: input.page || null, createdBy, dueAt })
    .returning();
  await notifyTeam({
    kind: "revision_created",
    title: `Revision: ${c.businessName}`,
    body: `${input.title} (${plan.revisionLabel}, due ${dueAt.toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "2-digit" })} ET)`,
    url: `/team/clients/${clientId}`,
    buzz: plan.tier === 4 ? "urgent" : "normal",
  });
  return rev;
}

export async function setRevisionStatus(revisionId: number, status: "open" | "in_progress" | "done") {
  const [rev] = await db
    .update(schema.revisions)
    .set({ status, completedAt: status === "done" ? new Date() : null })
    .where(eq(schema.revisions.id, revisionId))
    .returning();
  if (!rev) return null;
  if (status === "done") {
    await notifyClient(rev.clientId, {
      kind: "revision_done",
      title: "Your edit is live ✅",
      body: rev.title,
      url: "/revisions",
      buzz: "money",
    });
  } else if (status === "in_progress") {
    await notifyClient(rev.clientId, {
      kind: "revision_update",
      title: "We're on it 🛠️",
      body: `Started: ${rev.title}`,
      url: "/revisions",
    });
  }
  return rev;
}

export async function createEscalation(
  clientId: number,
  input: { category: string; urgency: "normal" | "urgent"; summary: string },
) {
  const c = await getClient(clientId);
  const [esc] = await db.insert(schema.escalations).values({ clientId, ...input }).returning();
  await db.insert(schema.chatMessages).values({
    clientId,
    sender: "system",
    body:
      input.urgency === "urgent"
        ? "Flagged as urgent for Cam and Trae. You'll get a notification the moment they reply."
        : "Sent to Cam and Trae. You'll get a notification when they reply here.",
  });
  await notifyTeam(
    {
      kind: "escalation",
      title: `${input.urgency === "urgent" ? "🚨 URGENT" : "🕷️ Needs you"}: ${c.businessName}`,
      body: input.summary,
      url: `/team/clients/${clientId}`,
      buzz: input.urgency === "urgent" ? "urgent" : "normal",
    },
    { email: true },
  );
  return esc;
}

export function describeItem(item: string) {
  if (item.startsWith("tier-")) {
    const p = PLANS[Number(item.slice(5)) as Tier];
    return p ? `Upgrade to ${p.name} ($${p.monthly}/mo)` : item;
  }
  return ADDONS.find((a) => a.id === item)?.title || item;
}

export async function createUpgradeRequest(clientId: number, item: string, note: string | null, source: string) {
  const c = await getClient(clientId);
  const [reqRow] = await db.insert(schema.upgradeRequests).values({ clientId, item, note, source }).returning();
  await notifyTeam(
    {
      kind: "upgrade_request",
      title: `💰 Upsell: ${c.businessName}`,
      body: `${describeItem(item)}${note ? `: "${note}"` : ""}. Call them while it's hot.`,
      url: `/team/clients/${clientId}`,
      buzz: "money",
    },
    { email: true },
  );
  return reqRow;
}

export async function checkSite(url: string | null) {
  if (!url) return { ok: false, detail: "No live site URL on file yet." };
  const target = /^https?:\/\//.test(url) ? url : `https://${url}`;
  const started = Date.now();
  try {
    const res = await fetch(target, { redirect: "follow", signal: AbortSignal.timeout(10_000) });
    const ms = Date.now() - started;
    return {
      ok: res.status < 500,
      status: res.status,
      responseMs: ms,
      detail: res.status < 400 ? `Up (HTTP ${res.status}, ${ms} ms)` : `Responded with HTTP ${res.status}`,
    };
  } catch (err: any) {
    return { ok: false, detail: `Could not reach the site: ${err?.name === "TimeoutError" ? "timed out after 10s" : err?.message}` };
  }
}

export async function recentLeads(clientId: number, days: number) {
  const since = new Date(Date.now() - days * 86400_000);
  return db
    .select()
    .from(schema.leads)
    .where(and(eq(schema.leads.clientId, clientId), gte(schema.leads.createdAt, since)))
    .orderBy(desc(schema.leads.createdAt));
}
