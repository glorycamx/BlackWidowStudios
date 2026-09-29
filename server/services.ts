import crypto from "node:crypto";
import dns from "node:dns/promises";
import net from "node:net";
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import { db, schema } from "./db.js";
import { notifyClient, notifyTeam } from "./notify.js";
import { PLANS, nextPlan, ADDONS, REFERRAL, creditForSignup, type Tier } from "../shared/plans.js";

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
  const [lastCheck] = await db
    .select({ ok: schema.siteChecks.ok })
    .from(schema.siteChecks)
    .where(eq(schema.siteChecks.clientId, clientId))
    .orderBy(desc(schema.siteChecks.createdAt))
    .limit(1);
  return {
    siteUp: lastCheck ? lastCheck.ok : null,
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
      title: "Your edit is live",
      body: rev.title,
      url: "/revisions",
      buzz: "money",
    });
  } else if (status === "in_progress") {
    await notifyClient(rev.clientId, {
      kind: "revision_update",
      title: "We're on it",
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
      title: `${input.urgency === "urgent" ? "Urgent" : "Needs you"}: ${c.businessName}`,
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
      title: `Upsell: ${c.businessName}`,
      body: `${describeItem(item)}${note ? `: "${note}"` : ""}. Call them while it's hot.`,
      url: `/team/clients/${clientId}`,
      buzz: "money",
    },
    { email: true },
  );
  return reqRow;
}

function isPrivateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7));
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

// Only public web addresses may be checked (blocks probing internal services)
async function assertPublicUrl(u: URL) {
  if (!/^https?:$/.test(u.protocol)) throw new Error("Only http and https sites can be checked");
  const addrs = await dns.lookup(u.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("That address isn't a public website");
}

export async function checkSite(url: string | null) {
  if (!url) return { ok: false, detail: "No live site URL on file yet." };
  const started = Date.now();
  try {
    let target = new URL(/^https?:\/\//.test(url) ? url : `https://${url}`);
    for (let hop = 0; hop < 5; hop++) {
      await assertPublicUrl(target);
      const res = await fetch(target, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
      const loc = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && loc) {
        target = new URL(loc, target);
        continue;
      }
      const ms = Date.now() - started;
      return {
        ok: res.status < 500,
        status: res.status,
        responseMs: ms,
        detail: res.status < 400 ? `Up (HTTP ${res.status}, ${ms} ms)` : `Responded with HTTP ${res.status}`,
      };
    }
    return { ok: false, detail: "Too many redirects" };
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

// ---------- Referrals ----------

export async function ensureReferralCode(c: Client): Promise<string> {
  if (c.referralCode) return c.referralCode;
  const base = (c.businessName.replace(/\(.*?\)/g, "").match(/[A-Za-z]+/g) || ["BW"])[0].toUpperCase().slice(0, 10);
  for (let i = 0; i < 20; i++) {
    const code = `${base}${crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 4)}`;
    const updated = await db
      .update(schema.clients)
      .set({ referralCode: code })
      .where(and(eq(schema.clients.id, c.id), sql`${schema.clients.referralCode} is null`))
      .returning()
      .catch(() => []); // unique clash: try another code
    if (updated.length) return code;
    const fresh = await getClient(c.id);
    if (fresh.referralCode) return fresh.referralCode;
  }
  throw new Error("Could not create a referral code");
}

export async function referralSummary(clientId: number) {
  const c = await getClient(clientId);
  const code = await ensureReferralCode(c);
  const rows = await db
    .select()
    .from(schema.referrals)
    .where(eq(schema.referrals.clientId, clientId))
    .orderBy(desc(schema.referrals.createdAt));
  const signed = rows.filter((r) => r.status === "signed");
  const earned = signed.reduce((s, r) => s + r.creditAmount, 0);
  const pending = signed.filter((r) => r.creditStatus === "pending").reduce((s, r) => s + r.creditAmount, 0);
  const inPlay = rows.filter((r) => r.status === "new" || r.status === "contacted").length;
  return {
    code,
    link: appUrlFor(`/r/${code}`),
    referrals: rows,
    stats: {
      earned,
      pending,
      applied: earned - pending,
      signedCount: signed.length,
      inPlay,
      potential: inPlay * REFERRAL.perSignup,
    },
    program: REFERRAL,
  };
}

function appUrlFor(path: string) {
  return `${(process.env.APP_URL || "").replace(/\/$/, "")}${path}`;
}

export async function markReferralSigned(referralId: number) {
  // One transaction, with the referring client's row locked, so double taps or two signings at
  // once can't double-pay a card bonus or send two "you earned" alerts
  const result = await db.transaction(async (tx) => {
    const [ref] = await tx.select().from(schema.referrals).where(eq(schema.referrals.id, referralId));
    if (!ref) return null;
    await tx.execute(sql`select id from clients where id = ${ref.clientId} for update`);
    const [{ n }] = await tx
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.referrals)
      .where(and(eq(schema.referrals.clientId, ref.clientId), eq(schema.referrals.status, "signed")));
    const nth = n + 1;
    const credit = creditForSignup(nth);
    const [updated] = await tx
      .update(schema.referrals)
      .set({ status: "signed", signedAt: new Date(), creditAmount: credit, creditStatus: "pending" })
      .where(and(eq(schema.referrals.id, referralId), ne(schema.referrals.status, "signed")))
      .returning();
    return updated ? { ref: updated, nth, credit } : { ref, nth: 0, credit: 0, already: true };
  });
  if (!result) return undefined;
  if ("already" in result) return result.ref;
  const { ref, nth, credit } = result;
  const updated = ref;
  const filledCard = nth % REFERRAL.cardSlots === 0;
  await notifyClient(ref.clientId, {
    kind: "referral",
    title: filledCard ? `Card complete: +$${credit}` : `You just earned $${credit}`,
    body: filledCard
      ? `${ref.name} signed, and that fills your punch card. $${REFERRAL.perSignup} + a $${REFERRAL.cardBonus} bonus off your bill.`
      : `${ref.name} signed with Black Widow. $${credit} comes off your next month. ${REFERRAL.cardSlots - (nth % REFERRAL.cardSlots)} more to fill your card!`,
    url: "/refer",
    buzz: "money",
  });
  return updated;
}

// ---------- Website ----------

export async function websiteStats(clientId: number) {
  const c = await getClient(clientId);
  const since = new Date(Date.now() - 30 * 86400_000);
  const events = await db
    .select({ kind: schema.siteEvents.kind, path: schema.siteEvents.path, createdAt: schema.siteEvents.createdAt })
    .from(schema.siteEvents)
    .where(and(eq(schema.siteEvents.clientId, clientId), gte(schema.siteEvents.createdAt, since)));
  const count = (k: string) => events.filter((e) => e.kind === k).length;
  const pages = new Map<string, number>();
  for (const e of events) if (e.kind === "view") pages.set(e.path || "/", (pages.get(e.path || "/") || 0) + 1);
  const checks = await db
    .select()
    .from(schema.siteChecks)
    .where(and(eq(schema.siteChecks.clientId, clientId), gte(schema.siteChecks.createdAt, since)))
    .orderBy(desc(schema.siteChecks.createdAt));
  const photos = await db
    .select({ id: schema.sitePhotos.id, note: schema.sitePhotos.note, createdAt: schema.sitePhotos.createdAt })
    .from(schema.sitePhotos)
    .where(eq(schema.sitePhotos.clientId, clientId))
    .orderBy(desc(schema.sitePhotos.createdAt))
    .limit(12);
  return {
    siteUrl: c.siteUrl,
    status: c.status,
    tracking: events.length > 0,
    traffic: {
      views: count("view"),
      calls: count("call"),
      texts: count("text"),
      forms: count("form"),
      dailyViews: events.filter((e) => e.kind === "view").map((e) => e.createdAt),
      topPages: [...pages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, views]) => ({ path, views })),
    },
    health: {
      checkedAt: checks[0]?.createdAt || null,
      up: checks[0]?.ok ?? null,
      responseMs: checks[0]?.ok ? checks[0].responseMs : null,
      // Only report a percentage once there's about an hour of checks, so one bad first check doesn't read as 0%
      uptime: checks.length >= 4 ? Math.round((checks.filter((x) => x.ok).length / checks.length) * 1000) / 10 : null,
      https: c.siteUrl ? !/^http:\/\//.test(c.siteUrl) : null,
    },
    photos,
  };
}

export async function recordSiteCheck(c: Client) {
  const r = await checkSite(c.siteUrl);
  const [prev] = await db
    .select()
    .from(schema.siteChecks)
    .where(eq(schema.siteChecks.clientId, c.id))
    .orderBy(desc(schema.siteChecks.createdAt))
    .limit(1);
  await db.insert(schema.siteChecks).values({ clientId: c.id, ok: r.ok, status: (r as any).status ?? null, responseMs: (r as any).responseMs ?? null });
  // Went down (or failed its very first check): alert the team and put it in their Needs-you list
  if ((!prev || prev.ok) && !r.ok) {
    await db.insert(schema.escalations).values({ clientId: c.id, category: "site_down", urgency: "urgent", summary: `Website down: ${c.siteUrl}. ${r.detail}` });
    await notifyTeam(
      { kind: "escalation", title: `Site down: ${c.businessName}`, body: `${c.siteUrl}: ${r.detail}`, url: `/team/clients/${c.id}`, buzz: "urgent" },
      { email: true },
    );
  } else if (prev && !prev.ok && r.ok) {
    await db
      .update(schema.escalations)
      .set({ status: "resolved", resolvedBy: "Uptime monitor", resolvedAt: new Date() })
      .where(and(eq(schema.escalations.clientId, c.id), eq(schema.escalations.category, "site_down"), eq(schema.escalations.status, "open")));
    await notifyTeam({ kind: "escalation", title: `Back up: ${c.businessName}`, body: `${c.siteUrl} is responding again.`, url: `/team/clients/${c.id}` });
  }
  return r;
}
