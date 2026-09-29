import express, { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { and, asc, desc, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { db, schema } from "./db.js";
import { hashPassword, publicUser, requireRole, verifyLogin } from "./auth.js";
import { notifyClient, notifyTeam, vapidPublicKey } from "./notify.js";
import { botEnabled, handleClientMessage, recordTeamReply } from "./bot.js";
import {
  accountOverview,
  checkSite,
  createRevision,
  createUpgradeRequest,
  describeItem,
  getClient,
  markReferralSigned,
  referralSummary,
  setRevisionStatus,
  websiteStats,
} from "./services.js";
import { ADDONS, PLANS, REFERRAL, REFERRAL_CREDIT } from "../shared/plans.js";

export const api = Router();

// Wrap async handlers so thrown errors become 400/500 JSON
const h =
  (fn: (req: express.Request, res: express.Response) => Promise<unknown>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) =>
    fn(req, res).catch((err) => {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.issues[0]?.message || "Invalid input" });
      next(err);
    });

const id = (v: string) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new z.ZodError([{ code: "custom", message: "Bad id", path: [] }]);
  return n;
};

// ---------- Auth ----------

api.post(
  "/auth/login",
  h(async (req, res) => {
    const { email, password } = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = await verifyLogin(email, password);
    if (!user) return res.status(401).json({ error: "Wrong email or password" });
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: "Could not sign in" });
      req.session.userId = user.id;
      res.json({ user: publicUser(user) });
    });
  }),
);

api.post("/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

api.get(
  "/me",
  h(async (req, res) => {
    if (!req.user) return res.json({ user: null });
    const client = req.user.clientId ? await getClient(req.user.clientId) : null;
    res.json({
      user: publicUser(req.user),
      client: client && { id: client.id, businessName: client.businessName, ownerName: client.ownerName, tier: client.tier, status: client.status },
      botEnabled,
    });
  }),
);

// ---------- Notifications + push ----------

api.get("/push/key", (_req, res) => res.json({ key: vapidPublicKey }));

api.post(
  "/push/subscribe",
  h(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Please sign in" });
    const sub = z
      .object({ endpoint: z.string().url(), keys: z.object({ p256dh: z.string(), auth: z.string() }) })
      .parse(req.body);
    await db
      .insert(schema.pushSubscriptions)
      .values({ userId: req.user.id, endpoint: sub.endpoint, keys: sub.keys })
      .onConflictDoUpdate({ target: schema.pushSubscriptions.endpoint, set: { userId: req.user.id, keys: sub.keys } });
    res.json({ ok: true });
  }),
);

api.post(
  "/push/test",
  h(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Please sign in" });
    const n = { kind: "offer" as const, title: "Buzz check", body: "Notifications are on. This is what a new lead feels like.", url: "/", buzz: "money" as const };
    if (req.user.clientId) await notifyClient(req.user.clientId, n);
    else await notifyTeam(n);
    res.json({ ok: true });
  }),
);

api.get(
  "/notifications",
  h(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Please sign in" });
    const after = Number(req.query.after) || 0;
    const rows = await db
      .select()
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, req.user.id), gt(schema.notifications.id, after)))
      .orderBy(desc(schema.notifications.id))
      .limit(50);
    const [{ unread }] = await db
      .select({ unread: sql<number>`count(*)`.mapWith(Number) })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, req.user.id), eq(schema.notifications.read, false)));
    res.json({ notifications: rows, unread });
  }),
);

api.post(
  "/notifications/read-all",
  h(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Please sign in" });
    await db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.userId, req.user.id));
    res.json({ ok: true });
  }),
);

// ---------- Lead webhook (the client's website form posts here) ----------

const hookCors: express.RequestHandler = (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
};

api.options("/hooks/lead/:siteKey", hookCors);
api.post(
  "/hooks/lead/:siteKey",
  hookCors,
  h(async (req, res) => {
    const [client] = await db.select().from(schema.clients).where(eq(schema.clients.siteKey, String(req.params.siteKey)));
    if (!client) return res.status(404).json({ error: "Unknown site key" });
    const body = req.body || {};
    if (body._gotcha) return res.json({ ok: true }); // honeypot: bots fill hidden fields
    const pick = (...keys: string[]) => {
      for (const k of keys) if (typeof body[k] === "string" && body[k].trim()) return body[k].trim().slice(0, 2000);
      return null;
    };
    const name = pick("name", "full_name", "fullName", "first_name");
    const phone = pick("phone", "tel", "phone_number");
    const email = pick("email", "email_address");
    const message = pick("message", "details", "comments", "service", "notes");
    if (!name && !phone && !email) return res.status(400).json({ error: "Need at least a name, phone or email" });
    const [lead] = await db
      .insert(schema.leads)
      .values({ clientId: client.id, name, phone, email, message, source: pick("source") || "Website form" })
      .returning();
    await notifyClient(client.id, {
      kind: "lead",
      title: `New lead: ${name || phone || email}`,
      body: message ? message.slice(0, 120) : "Tap to call them back while they're hot.",
      url: `/leads/${lead.id}`,
      buzz: "money",
    });
    if (typeof body._redirect === "string" && /^https?:\/\//.test(body._redirect)) return res.redirect(303, body._redirect);
    res.json({ ok: true });
  }),
);

// ---------- Tracking snippet for client websites ----------
// <script src="https://APP/api/hooks/t/SITEKEY.js" defer></script> counts visits, call/text/email taps and form sends.

api.get("/hooks/t/:siteKey.js", (req, res) => {
  const key = String(req.params.siteKey).replace(/[^\w-]/g, "");
  const endpoint = `${req.protocol}://${req.get("host")}/api/hooks/event/${key}`;
  res.type("application/javascript").set("Cache-Control", "public, max-age=3600").send(`(function(){
  var U=${JSON.stringify(endpoint)};
  function s(k){try{var b=JSON.stringify({kind:k,path:location.pathname});if(navigator.sendBeacon){navigator.sendBeacon(U,new Blob([b],{type:"text/plain"}))}else{fetch(U,{method:"POST",body:b,keepalive:true})}}catch(e){}}
  s("view");
  document.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest("a[href]");if(!a)return;var h=a.getAttribute("href")||"";if(h.indexOf("tel:")==0)s("call");else if(h.indexOf("sms:")==0)s("text");else if(h.indexOf("mailto:")==0)s("email")},true);
  document.addEventListener("submit",function(){s("form")},true);
})();`);
});

api.options("/hooks/event/:siteKey", hookCors);
api.post(
  "/hooks/event/:siteKey",
  hookCors,
  express.text({ type: "*/*", limit: "2kb" }),
  h(async (req, res) => {
    const [client] = await db.select({ id: schema.clients.id }).from(schema.clients).where(eq(schema.clients.siteKey, String(req.params.siteKey)));
    if (!client) return res.sendStatus(404);
    let body: any = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const kind = ["view", "call", "text", "email", "form"].includes(body?.kind) ? body.kind : null;
    if (!kind) return res.sendStatus(400);
    await db.insert(schema.siteEvents).values({ clientId: client.id, kind, path: typeof body.path === "string" ? body.path.slice(0, 200) : null });
    res.sendStatus(204);
  }),
);

// ---------- Public referral page (/r/:code) ----------

api.get(
  "/public/ref/:code",
  h(async (req, res) => {
    const [c] = await db.select().from(schema.clients).where(eq(schema.clients.referralCode, String(req.params.code).toUpperCase()));
    if (!c) return res.status(404).json({ error: "This referral link isn't active." });
    res.json({ business: c.businessName.replace(/\s*\(.*?\)\s*/g, " ").trim(), owner: c.ownerName.split(" ")[0], offer: REFERRAL.friendOffer });
  }),
);

api.post(
  "/public/ref/:code",
  h(async (req, res) => {
    const [c] = await db.select().from(schema.clients).where(eq(schema.clients.referralCode, String(req.params.code).toUpperCase()));
    if (!c) return res.status(404).json({ error: "This referral link isn't active." });
    if (req.body?._gotcha) return res.json({ ok: true });
    const input = z
      .object({
        name: z.string().trim().min(2, "Please add your name").max(120),
        business: z.string().trim().max(160).nullish(),
        phone: z.string().trim().max(40).nullish(),
        email: z.string().trim().email("That email doesn't look right").max(200).nullish().or(z.literal("")),
        note: z.string().trim().max(1000).nullish(),
      })
      .refine((v) => v.phone || v.email, { message: "Add a phone number or email so we can reach you" })
      .parse(req.body);
    await db.insert(schema.referrals).values({ clientId: c.id, ...input, email: input.email || null, source: "link" });
    await notifyClient(c.id, {
      kind: "referral",
      title: `${input.name} just used your link!`,
      body: `${input.business || "They"} asked about a website. You'll earn $${REFERRAL.perSignup} if they sign.`,
      url: "/refer",
      buzz: "money",
    });
    await notifyTeam(
      {
        kind: "referral",
        title: `Referral via ${c.businessName}'s link`,
        body: `${input.name}${input.business ? ` (${input.business})` : ""} ${input.phone || input.email}. Warm lead, call now.`,
        url: `/team/clients/${c.id}`,
        buzz: "money",
      },
      { email: true },
    );
    res.json({ ok: true });
  }),
);

// Job photos: visible to the client who sent them and the team
api.get(
  "/photos/:id",
  h(async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const [p] = await db.select().from(schema.sitePhotos).where(eq(schema.sitePhotos.id, id(String(req.params.id))));
    if (!p || (req.user.role !== "team" && req.user.clientId !== p.clientId)) return res.sendStatus(404);
    res.type(p.mime).set("Cache-Control", "private, max-age=86400").send(p.data);
  }),
);

// ---------- Client app ----------

const client = Router();
client.use(requireRole("client"));
const cid = (req: express.Request) => req.user!.clientId!;

client.get(
  "/overview",
  h(async (req, res) => {
    const overview = await accountOverview(cid(req));
    const [pendingUpgrade] = await db
      .select()
      .from(schema.upgradeRequests)
      .where(and(eq(schema.upgradeRequests.clientId, cid(req)), eq(schema.upgradeRequests.status, "new")))
      .limit(1);
    const c = await getClient(cid(req));
    res.json({ ...overview, pendingUpgrade: pendingUpgrade || null, reviewUrl: c.googleReviewUrl });
  }),
);

client.get(
  "/leads",
  h(async (req, res) => {
    const rows = await db
      .select()
      .from(schema.leads)
      .where(eq(schema.leads.clientId, cid(req)))
      .orderBy(desc(schema.leads.createdAt))
      .limit(200);
    res.json({ leads: rows });
  }),
);

client.patch(
  "/leads/:id",
  h(async (req, res) => {
    const { status } = z.object({ status: z.enum(["new", "contacted", "won", "lost"]) }).parse(req.body);
    const [lead] = await db
      .update(schema.leads)
      .set({ status })
      .where(and(eq(schema.leads.id, id(String(req.params.id))), eq(schema.leads.clientId, cid(req))))
      .returning();
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    if (status === "won") {
      const c = await getClient(cid(req));
      await notifyTeam({ kind: "lead", title: `${c.businessName} won a job`, body: `From ${lead.name || "a website lead"}. Good time for a review or referral ask.`, url: `/team/clients/${c.id}`, buzz: "money" });
    }
    res.json({ lead });
  }),
);

client.get(
  "/revisions",
  h(async (req, res) => {
    const rows = await db
      .select()
      .from(schema.revisions)
      .where(eq(schema.revisions.clientId, cid(req)))
      .orderBy(desc(schema.revisions.createdAt));
    res.json({ revisions: rows });
  }),
);

client.post(
  "/revisions",
  h(async (req, res) => {
    const input = z
      .object({ title: z.string().min(3).max(140), details: z.string().min(3).max(4000), page: z.string().max(80).nullish() })
      .parse(req.body);
    res.json({ revision: await createRevision(cid(req), input, "client") });
  }),
);

client.get(
  "/chat",
  h(async (req, res) => {
    const after = Number(req.query.after) || 0;
    const rows = await db
      .select()
      .from(schema.chatMessages)
      .where(and(eq(schema.chatMessages.clientId, cid(req)), gt(schema.chatMessages.id, after)))
      .orderBy(asc(schema.chatMessages.id))
      .limit(300);
    res.json({ messages: rows });
  }),
);

client.post(
  "/chat",
  h(async (req, res) => {
    const { body } = z.object({ body: z.string().trim().min(1).max(4000) }).parse(req.body);
    const [msg] = await db
      .insert(schema.chatMessages)
      .values({ clientId: cid(req), sender: "client", authorName: req.user!.name, body })
      .returning();
    res.json({ message: msg });
    // The bot answers in the background; the app polls for new messages
    handleClientMessage(cid(req), req.user!.name, body).catch((err) => console.error("[chat]", err));
  }),
);

client.post(
  "/upgrades",
  h(async (req, res) => {
    const { item, note } = z
      .object({ item: z.enum(["tier-2", "tier-3", "tier-4", ...ADDONS.map((a) => a.id)] as [string, ...string[]]), note: z.string().max(1000).nullish() })
      .parse(req.body);
    await createUpgradeRequest(cid(req), item, note || null, "app");
    res.json({ ok: true, message: `${describeItem(item)}: Cam will reach out shortly.` });
  }),
);

client.get("/referrals", h(async (req, res) => res.json(await referralSummary(cid(req)))));

client.post(
  "/referrals",
  h(async (req, res) => {
    const input = z
      .object({ name: z.string().min(2).max(120), business: z.string().max(160).nullish(), phone: z.string().max(40).nullish(), note: z.string().max(1000).nullish() })
      .parse(req.body);
    const [ref] = await db.insert(schema.referrals).values({ clientId: cid(req), ...input }).returning();
    const c = await getClient(cid(req));
    await notifyTeam(
      { kind: "referral", title: `Referral from ${c.businessName}`, body: `${input.name}${input.business ? ` (${input.business})` : ""}${input.phone ? `, ${input.phone}` : ""}. Warm lead, call today.`, url: `/team/clients/${c.id}`, buzz: "money" },
      { email: true },
    );
    res.json({ referral: ref });
  }),
);

client.get("/website", h(async (req, res) => res.json(await websiteStats(cid(req)))));

client.post(
  "/photos",
  h(async (req, res) => {
    const input = z
      .object({
        photos: z.array(z.object({ dataUrl: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/, "Photos must be JPEG, PNG or WebP") })).min(1).max(10),
        note: z.string().max(1000).nullish(),
      })
      .parse(req.body);
    const rows = input.photos.map((p) => {
      const [head, b64] = p.dataUrl.split(",");
      const data = Buffer.from(b64, "base64");
      if (data.length > 4 * 1024 * 1024) throw new z.ZodError([{ code: "custom", message: "Each photo must be under 4 MB", path: [] }]);
      return { clientId: cid(req), mime: head.slice(5, head.indexOf(";")), data, note: input.note || null };
    });
    await db.insert(schema.sitePhotos).values(rows);
    const n = rows.length;
    await createRevision(
      cid(req),
      { title: `Add ${n} new photo${n > 1 ? "s" : ""} to the site`, details: input.note || "Client sent new job photos from the app. Pick the best spots for them.", page: null },
      "client",
    );
    res.json({ ok: true, count: n });
  }),
);

client.post(
  "/site-check",
  h(async (req, res) => {
    const c = await getClient(cid(req));
    res.json(await checkSite(c.siteUrl));
  }),
);

api.use("/client", client);

// ---------- Team (Cam + Trae) ----------

const team = Router();
team.use(requireRole("team"));

team.get(
  "/inbox",
  h(async (_req, res) => {
    const clientCols = { businessName: schema.clients.businessName, tier: schema.clients.tier };
    const escalations = await db
      .select({ e: schema.escalations, c: clientCols })
      .from(schema.escalations)
      .innerJoin(schema.clients, eq(schema.clients.id, schema.escalations.clientId))
      .where(eq(schema.escalations.status, "open"))
      .orderBy(desc(schema.escalations.urgency), asc(schema.escalations.createdAt));
    const revisions = await db
      .select({ r: schema.revisions, c: clientCols })
      .from(schema.revisions)
      .innerJoin(schema.clients, eq(schema.clients.id, schema.revisions.clientId))
      .where(ne(schema.revisions.status, "done"))
      .orderBy(asc(schema.revisions.dueAt));
    const upgrades = await db
      .select({ u: schema.upgradeRequests, c: clientCols })
      .from(schema.upgradeRequests)
      .innerJoin(schema.clients, eq(schema.clients.id, schema.upgradeRequests.clientId))
      .where(eq(schema.upgradeRequests.status, "new"))
      .orderBy(desc(schema.upgradeRequests.createdAt));
    const referrals = await db
      .select({ r: schema.referrals, c: clientCols })
      .from(schema.referrals)
      .innerJoin(schema.clients, eq(schema.clients.id, schema.referrals.clientId))
      .where(inArray(schema.referrals.status, ["new", "contacted"]))
      .orderBy(desc(schema.referrals.createdAt));
    const [mrr] = await db
      .select({
        clients: sql<number>`count(*)`.mapWith(Number),
        live: sql<number>`count(*) filter (where ${schema.clients.status} = 'live')`.mapWith(Number),
        mrr: sql<number>`coalesce(sum(case ${schema.clients.tier} when 1 then 49 when 2 then 97 when 3 then 297 when 4 then 597 end) filter (where ${schema.clients.status} = 'live'), 0)`.mapWith(Number),
      })
      .from(schema.clients);
    res.json({
      stats: mrr,
      escalations: escalations.map((x) => ({ ...x.e, client: x.c })),
      revisions: revisions.map((x) => ({ ...x.r, client: x.c })),
      upgrades: upgrades.map((x) => ({ ...x.u, label: describeItem(x.u.item), client: x.c })),
      referrals: referrals.map((x) => ({ ...x.r, client: x.c })),
    });
  }),
);

team.get(
  "/clients",
  h(async (_req, res) => {
    const rows = await db
      .select({
        c: schema.clients,
        openRevisions: sql<number>`(select count(*) from revisions r where r.client_id = ${schema.clients.id} and r.status <> 'done')`.mapWith(Number),
        openEscalations: sql<number>`(select count(*) from escalations e where e.client_id = ${schema.clients.id} and e.status = 'open')`.mapWith(Number),
        leads30: sql<number>`(select count(*) from leads l where l.client_id = ${schema.clients.id} and l.created_at > now() - interval '30 days')`.mapWith(Number),
      })
      .from(schema.clients)
      .orderBy(asc(schema.clients.businessName));
    res.json({ clients: rows.map((r) => ({ ...r.c, openRevisions: r.openRevisions, openEscalations: r.openEscalations, leads30: r.leads30 })) });
  }),
);

const clientInput = z.object({
  businessName: z.string().min(2).max(160),
  ownerName: z.string().min(1).max(120),
  phone: z.string().max(40).nullish(),
  email: z.string().email().nullish().or(z.literal("")),
  tier: z.coerce.number().int().min(1).max(4),
  siteUrl: z.string().max(300).nullish(),
  status: z.enum(["build", "phase1", "live"]),
  goLiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().or(z.literal("")),
  niche: z.string().max(80).nullish(),
  notes: z.string().max(5000).nullish(),
  googleReviewUrl: z.string().url().max(500).nullish().or(z.literal("")),
});

const clean = (v: z.infer<typeof clientInput>) => ({ ...v, email: v.email || null, goLiveDate: v.goLiveDate || null, googleReviewUrl: v.googleReviewUrl || null });

team.post(
  "/clients",
  h(async (req, res) => {
    const input = clean(clientInput.parse(req.body));
    const [c] = await db
      .insert(schema.clients)
      .values({ ...input, siteKey: crypto.randomBytes(12).toString("base64url") })
      .returning();
    res.json({ client: c });
  }),
);

team.get(
  "/clients/:id",
  h(async (req, res) => {
    const clientId = id(String(req.params.id));
    const c = await getClient(clientId);
    const [chat, revisions, leads, escalations, upgrades, referrals, logins] = await Promise.all([
      db.select().from(schema.chatMessages).where(eq(schema.chatMessages.clientId, clientId)).orderBy(asc(schema.chatMessages.id)),
      db.select().from(schema.revisions).where(eq(schema.revisions.clientId, clientId)).orderBy(desc(schema.revisions.createdAt)),
      db.select().from(schema.leads).where(eq(schema.leads.clientId, clientId)).orderBy(desc(schema.leads.createdAt)).limit(100),
      db.select().from(schema.escalations).where(eq(schema.escalations.clientId, clientId)).orderBy(desc(schema.escalations.createdAt)),
      db.select().from(schema.upgradeRequests).where(eq(schema.upgradeRequests.clientId, clientId)).orderBy(desc(schema.upgradeRequests.createdAt)),
      db.select().from(schema.referrals).where(eq(schema.referrals.clientId, clientId)).orderBy(desc(schema.referrals.createdAt)),
      db.select({ id: schema.users.id, email: schema.users.email, name: schema.users.name }).from(schema.users).where(eq(schema.users.clientId, clientId)),
    ]);
    const website = await websiteStats(clientId);
    res.json({
      client: c,
      chat,
      revisions,
      leads,
      escalations,
      upgrades: upgrades.map((u) => ({ ...u, label: describeItem(u.item) })),
      referrals,
      logins,
      website,
    });
  }),
);

team.patch(
  "/clients/:id",
  h(async (req, res) => {
    const clientId = id(String(req.params.id));
    const before = await getClient(clientId);
    const input = clean(clientInput.parse(req.body));
    const [c] = await db.update(schema.clients).set(input).where(eq(schema.clients.id, clientId)).returning();
    if (before.status !== "live" && c.status === "live") {
      // Referral ask #1: go-live is peak emotion (Ops Manual, Section 6)
      await notifyClient(clientId, {
        kind: "site_live",
        title: "Your new site is live",
        body: `Go take a look! Know someone who needs one? Refer them and get $${REFERRAL_CREDIT} off your next month.`,
        url: "/",
        buzz: "money",
      });
    }
    if (before.tier !== c.tier && c.tier > before.tier) {
      await notifyClient(clientId, {
        kind: "offer",
        title: `Welcome to ${PLANS[c.tier as 1 | 2 | 3 | 4].name}`,
        body: `Your edits now turn around in ${PLANS[c.tier as 1 | 2 | 3 | 4].revisionLabel.toLowerCase()} time.`,
        url: "/plan",
        buzz: "money",
      });
    }
    res.json({ client: c });
  }),
);

team.delete(
  "/clients/:id",
  h(async (req, res) => {
    await db.delete(schema.clients).where(eq(schema.clients.id, id(String(req.params.id))));
    res.json({ ok: true });
  }),
);

team.post(
  "/clients/:id/logins",
  h(async (req, res) => {
    const clientId = id(String(req.params.id));
    await getClient(clientId);
    const input = z.object({ name: z.string().min(1).max(120), email: z.string().email(), password: z.string().min(8).max(200) }).parse(req.body);
    const email = input.email.trim().toLowerCase();
    const [exists] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
    if (exists) return res.status(409).json({ error: "That email already has a login" });
    const [u] = await db
      .insert(schema.users)
      .values({ email, name: input.name, role: "client", clientId, passwordHash: await hashPassword(input.password) })
      .returning();
    res.json({ user: publicUser(u) });
  }),
);

team.post(
  "/clients/:id/chat",
  h(async (req, res) => {
    const clientId = id(String(req.params.id));
    const { body } = z.object({ body: z.string().trim().min(1).max(4000) }).parse(req.body);
    const [msg] = await db
      .insert(schema.chatMessages)
      .values({ clientId, sender: "team", authorName: req.user!.name, body })
      .returning();
    await recordTeamReply(clientId, req.user!.name, body);
    await notifyClient(clientId, {
      kind: "team_reply",
      title: `${req.user!.name} from Black Widow`,
      body: body.slice(0, 140),
      url: "/help",
      buzz: "normal",
    });
    res.json({ message: msg });
  }),
);

// Push an upsell or announcement straight to the client's phone
team.post(
  "/clients/:id/nudge",
  h(async (req, res) => {
    const clientId = id(String(req.params.id));
    const input = z.object({ title: z.string().min(2).max(80), body: z.string().min(2).max(200), url: z.string().max(100).default("/plan") }).parse(req.body);
    await notifyClient(clientId, { kind: "offer", ...input, buzz: "money" });
    res.json({ ok: true });
  }),
);

team.patch(
  "/revisions/:id",
  h(async (req, res) => {
    const { status } = z.object({ status: z.enum(["open", "in_progress", "done"]) }).parse(req.body);
    const rev = await setRevisionStatus(id(String(req.params.id)), status);
    if (!rev) return res.status(404).json({ error: "Not found" });
    res.json({ revision: rev });
  }),
);

team.post(
  "/clients/:id/revisions",
  h(async (req, res) => {
    const input = z.object({ title: z.string().min(3).max(140), details: z.string().min(3).max(4000), page: z.string().max(80).nullish() }).parse(req.body);
    res.json({ revision: await createRevision(id(String(req.params.id)), input, "team") });
  }),
);

team.patch(
  "/escalations/:id",
  h(async (req, res) => {
    const { status } = z.object({ status: z.enum(["open", "resolved"]) }).parse(req.body);
    const [e] = await db
      .update(schema.escalations)
      .set({ status, resolvedBy: status === "resolved" ? req.user!.name : null, resolvedAt: status === "resolved" ? new Date() : null })
      .where(eq(schema.escalations.id, id(String(req.params.id))))
      .returning();
    res.json({ escalation: e });
  }),
);

team.patch(
  "/upgrades/:id",
  h(async (req, res) => {
    const { status } = z.object({ status: z.enum(["new", "contacted", "won", "lost"]) }).parse(req.body);
    const [u] = await db.update(schema.upgradeRequests).set({ status }).where(eq(schema.upgradeRequests.id, id(String(req.params.id)))).returning();
    res.json({ upgrade: u });
  }),
);

team.patch(
  "/referrals/:id",
  h(async (req, res) => {
    const { status } = z.object({ status: z.enum(["new", "contacted", "signed", "lost"]) }).parse(req.body);
    const refId = id(String(req.params.id));
    if (status === "signed") return res.json({ referral: await markReferralSigned(refId) });
    const [r] = await db
      .update(schema.referrals)
      .set({ status, signedAt: null, creditAmount: 0, creditStatus: "none" })
      .where(and(eq(schema.referrals.id, refId), ne(schema.referrals.status, "signed")))
      .returning();
    if (r && status === "contacted") {
      await notifyClient(r.clientId, { kind: "referral", title: "We're talking to your referral", body: `Cam reached out to ${r.name}. Fingers crossed for your $${REFERRAL.perSignup}!`, url: "/refer" });
    }
    res.json({ referral: r || null });
  }),
);

// Mark a referral credit as taken off the client's bill
team.patch(
  "/referrals/:id/credit",
  h(async (req, res) => {
    const [r] = await db
      .update(schema.referrals)
      .set({ creditStatus: "applied" })
      .where(and(eq(schema.referrals.id, id(String(req.params.id))), eq(schema.referrals.creditStatus, "pending")))
      .returning();
    if (r) await notifyClient(r.clientId, { kind: "referral", title: `$${r.creditAmount} credit applied`, body: `Thanks to ${r.name}, your bill just got smaller. Who's next?`, url: "/refer", buzz: "money" });
    res.json({ referral: r || null });
  }),
);

api.use("/team", team);
