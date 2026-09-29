import crypto from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "./db.js";
import { hashPassword } from "./auth.js";

// First run only: team logins from TEAM_SEED, plus an optional demo client
export async function seed() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(schema.users).where(eq(schema.users.role, "team"));
  if (n === 0) {
    const entries = (process.env.TEAM_SEED || "Cam:admin@blackwidow.studio")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const entry of entries) {
      const [name, email] = entry.split(":").map((s) => s.trim());
      if (!name || !email) continue;
      const password = crypto.randomBytes(9).toString("base64url");
      await db.insert(schema.users).values({ name, email: email.toLowerCase(), role: "team", passwordHash: await hashPassword(password) });
      console.log(`[seed] Team login created: ${email} / ${password}  (save this, it is only shown once)`);
    }
  }

  // Sample client is for local development only, never on the live site
  if (process.env.SEED_DEMO !== "1" || process.env.NODE_ENV === "production") return;
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, "demo@blackwidow.studio"));
  if (existing) return;

  const goLive = new Date(Date.now() - 12 * 86400_000).toISOString().slice(0, 10);
  const [c] = await db
    .insert(schema.clients)
    .values({
      businessName: "Granite State Irrigation (Demo)",
      ownerName: "Dan",
      phone: "603-555-0142",
      tier: 2,
      siteUrl: "https://blackwidow.studio",
      status: "live",
      goLiveDate: goLive,
      niche: "irrigation",
      siteKey: "demo-site-key",
      referralCode: "GRANITE42",
      googleReviewUrl: "https://g.page/r/demo/review",
    })
    .returning();
  await db.insert(schema.users).values({ name: "Dan", email: "demo@blackwidow.studio", role: "client", clientId: c.id, passwordHash: await hashPassword("demo1234") });
  const ago = (h: number) => new Date(Date.now() - h * 3600_000);
  await db.insert(schema.leads).values([
    { clientId: c.id, name: "Karen Whitfield", phone: "603-555-0199", email: "karen@example.com", message: "Need a spring startup and two zones aren't coming on. Londonderry.", createdAt: ago(1) },
    { clientId: c.id, name: "Mike Doucette", phone: "978-555-0110", message: "Quote for a new system, about half an acre in Salem NH.", status: "contacted", createdAt: ago(20) },
    { clientId: c.id, name: "Priya Shah", email: "priya@example.com", message: "Do you do drip lines for garden beds?", status: "won", createdAt: ago(70) },
    { clientId: c.id, name: "Tom Brennan", phone: "603-555-0175", message: "Winterization for a commercial property in Derry.", status: "new", createdAt: ago(130) },
  ]);
  await db.insert(schema.revisions).values([
    { clientId: c.id, title: "Add fall winterization special to Home page", details: "Banner: 'Book winterization by Oct 31, save $25'.", page: "Home", status: "in_progress", createdBy: "client", dueAt: new Date(Date.now() + 30 * 3600_000) },
    { clientId: c.id, title: "Swap truck photo on About page", details: "Use the new photo texted 9/20.", page: "About", status: "done", createdBy: "bot", dueAt: ago(40), completedAt: ago(50) },
  ]);
  await db.insert(schema.referrals).values([
    { clientId: c.id, name: "Rick Morin", business: "Rick's Landscaping", phone: "603-555-0190", status: "signed", signedAt: ago(24 * 9), creditAmount: 100, creditStatus: "applied", source: "app", createdAt: ago(24 * 20) },
    { clientId: c.id, name: "Maria Santos", business: "Santos Cleaning Co.", phone: "978-555-0161", status: "signed", signedAt: ago(30), creditAmount: 100, creditStatus: "pending", source: "link", createdAt: ago(24 * 6) },
    { clientId: c.id, name: "Jeff Lavoie", business: "Lavoie Paving", phone: "603-555-0114", status: "contacted", source: "link", createdAt: ago(26) },
  ]);
  // A month of sample website traffic and uptime checks
  const events: (typeof schema.siteEvents.$inferInsert)[] = [];
  const paths = ["/", "/", "/", "/services", "/services", "/sprinkler-repair", "/contact", "/about", "/winterization"];
  for (let d = 0; d < 30; d++) {
    const views = 6 + Math.round(Math.random() * 10 + (d % 7 === 1 ? 6 : 0));
    for (let i = 0; i < views; i++) events.push({ clientId: c.id, kind: "view", path: paths[Math.floor(Math.random() * paths.length)], createdAt: ago(d * 24 + Math.random() * 20) });
    if (Math.random() < 0.6) events.push({ clientId: c.id, kind: "call", path: "/contact", createdAt: ago(d * 24 + 3) });
    if (Math.random() < 0.25) events.push({ clientId: c.id, kind: "form", path: "/contact", createdAt: ago(d * 24 + 5) });
  }
  await db.insert(schema.siteEvents).values(events);
  await db.insert(schema.siteChecks).values(
    Array.from({ length: 96 }, (_, i) => ({ clientId: c.id, ok: i !== 40, status: i !== 40 ? 200 : 503, responseMs: 300 + Math.round(Math.random() * 350), createdAt: ago(i * 0.25) })),
  );
  await db.insert(schema.chatMessages).values([
    { clientId: c.id, sender: "bot", authorName: "Black Widow Assistant", body: "Hey Dan! I'm the Black Widow assistant. Ask me for site edits, check if your site's up, or get Cam and Trae on the line. What can I help with?" },
  ]);
  console.log("[seed] Demo client created: demo@blackwidow.studio / demo1234");
}
