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

  if (process.env.SEED_DEMO !== "1") return;
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
  await db.insert(schema.chatMessages).values([
    { clientId: c.id, sender: "bot", authorName: "Black Widow Assistant", body: "Hey Dan! I'm the Black Widow assistant. Ask me for site edits, check if your site's up, or get Cam and Trae on the line. What can I help with?" },
  ]);
  console.log("[seed] Demo client created: demo@blackwidow.studio / demo1234");
}
