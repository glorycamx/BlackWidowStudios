import { and, eq, isNull, lt, ne, sql } from "drizzle-orm";
import { db, schema } from "./db.js";
import { notifyClient, notifyTeam } from "./notify.js";
import { PLANS, REFERRAL_CREDIT, nextPlan, type Tier } from "../shared/plans.js";
import { recordSiteCheck } from "./services.js";

// Runs every 15 minutes. Each scheduled alert is keyed in job_log so it fires once.
async function once(key: string, fn: () => Promise<void>) {
  const inserted = await db.insert(schema.jobLog).values({ key }).onConflictDoNothing().returning();
  if (inserted.length) await fn();
}

function easternNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24 };
}

async function leadNudges() {
  // Leads nobody has marked contacted after 2 hours: buzz the owner once
  const cutoff = new Date(Date.now() - 2 * 3600_000);
  const stale = await db
    .select()
    .from(schema.leads)
    .where(and(eq(schema.leads.status, "new"), isNull(schema.leads.nudgedAt), lt(schema.leads.createdAt, cutoff)));
  for (const lead of stale) {
    await db.update(schema.leads).set({ nudgedAt: new Date() }).where(eq(schema.leads.id, lead.id));
    await notifyClient(lead.clientId, {
      kind: "lead",
      title: `${lead.name || "A lead"} is still waiting`,
      body: "Leads called back in the first hour book way more often. Tap to call.",
      url: `/leads/${lead.id}`,
      buzz: "urgent",
    });
  }
}

async function overdueRevisions() {
  const overdue = await db
    .select({ r: schema.revisions, name: schema.clients.businessName })
    .from(schema.revisions)
    .innerJoin(schema.clients, eq(schema.clients.id, schema.revisions.clientId))
    .where(and(ne(schema.revisions.status, "done"), lt(schema.revisions.dueAt, new Date())));
  for (const { r, name } of overdue) {
    await once(`overdue-rev-${r.id}`, () =>
      notifyTeam({ kind: "revision_created", title: `Overdue: ${name}`, body: r.title, url: `/team/clients/${r.clientId}`, buzz: "urgent" }),
    );
  }
}

async function monthlyReports() {
  const now = easternNow();
  if (now.day !== 1 || now.hour < 9) return;
  const month = `${now.year}-${String(now.month).padStart(2, "0")}`;
  const clients = await db.select().from(schema.clients).where(eq(schema.clients.status, "live"));
  for (const c of clients) {
    await once(`report-${month}-${c.id}`, async () => {
      const [{ n }] = await db
        .select({ n: sql<number>`count(*)`.mapWith(Number) })
        .from(schema.leads)
        .where(and(eq(schema.leads.clientId, c.id), sql`${schema.leads.createdAt} >= date_trunc('month', now() - interval '1 month') and ${schema.leads.createdAt} < date_trunc('month', now())`));
      const up = nextPlan(c.tier as Tier);
      await notifyClient(c.id, {
        kind: "report",
        title: `Your ${new Date(now.year, now.month - 2, 1).toLocaleString("en-US", { month: "long" })} report`,
        body: `${n} lead${n === 1 ? "" : "s"} came through your site.${up ? ` Want more? ${up.name} gets you ${up.revisionLabel.toLowerCase()} edits and more.` : ""}`,
        url: "/leads",
        buzz: "money",
      });
    });
  }
}

async function day30ReferralAsk() {
  // Referral ask #2, about 30 days after go-live (Ops Manual, Section 6)
  const due = await db
    .select()
    .from(schema.clients)
    .where(and(eq(schema.clients.status, "live"), sql`${schema.clients.goLiveDate} <= current_date - 30`, sql`${schema.clients.goLiveDate} > current_date - 60`));
  for (const c of due) {
    await once(`referral-day30-${c.id}`, () =>
      notifyClient(c.id, {
        kind: "offer",
        title: "One month live!",
        body: `How are the leads looking? Send us a business owner you know and get $${REFERRAL_CREDIT} off when they sign.`,
        url: "/refer",
        buzz: "normal",
      }),
    );
  }
}

async function upgradeTeaser() {
  // 60 days after go-live, a gentle plan upgrade nudge for anyone not on the top tier
  const due = await db
    .select()
    .from(schema.clients)
    .where(and(eq(schema.clients.status, "live"), lt(schema.clients.tier, 4), sql`${schema.clients.goLiveDate} <= current_date - 60`));
  for (const c of due) {
    const up = nextPlan(c.tier as Tier)!;
    await once(`upgrade-teaser-${c.id}-t${c.tier}`, () =>
      notifyClient(c.id, {
        kind: "offer",
        title: `Ready for ${up.name}?`,
        body: `${up.features[1] || up.features[0]}, plus ${up.revisionLabel.toLowerCase()} edits. Tap to see what changes.`,
        url: "/plan",
        buzz: "normal",
      }),
    );
  }
}

async function uptimeMonitor() {
  const live = await db.select().from(schema.clients).where(and(eq(schema.clients.status, "live"), sql`${schema.clients.siteUrl} is not null`));
  await Promise.all(live.map((c) => recordSiteCheck(c).catch((err) => console.error("[jobs] check failed", c.id, err))));
  // Keep 45 days of checks and 400 days of traffic events
  await db.delete(schema.siteChecks).where(lt(schema.siteChecks.createdAt, new Date(Date.now() - 45 * 86400_000)));
  await db.delete(schema.siteEvents).where(lt(schema.siteEvents.createdAt, new Date(Date.now() - 400 * 86400_000)));
}

export function startJobs() {
  const run = async () => {
    for (const job of [uptimeMonitor, leadNudges, overdueRevisions, monthlyReports, day30ReferralAsk, upgradeTeaser]) {
      try {
        await job();
      } catch (err) {
        console.error(`[jobs] ${job.name} failed`, err);
      }
    }
  };
  setTimeout(run, 10_000);
  setInterval(run, 15 * 60_000);
}

export { PLANS };
