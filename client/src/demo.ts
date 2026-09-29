// In-browser fake backend for the clickable preview (VITE_DEMO=1). Mirrors the real API's shapes.
import { PLANS, ADDONS, REFERRAL, creditForSignup, nextPlan, type Tier } from "../../shared/plans";

const now = () => new Date().toISOString();
const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const inH = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
let seq = 1000;
const nid = () => ++seq;

let role: "client" | "team" | null = null;
try {
  role = (localStorage.getItem("bw-demo-role") as any) || null;
} catch {}

const team = { id: 1, email: "admin@blackwidow.studio", name: "Cam", role: "team" as const, clientId: null };
const clientUser = { id: 3, email: "demo@blackwidow.studio", name: "Dan", role: "client" as const, clientId: 1 };

const clients: any[] = [
  { id: 1, businessName: "Granite State Irrigation", ownerName: "Dan", phone: "603-555-0142", email: "dan@example.com", tier: 2, siteUrl: "granitestateirrigation.com", status: "live", goLiveDate: ago(24 * 12).slice(0, 10), niche: "irrigation", siteKey: "demo-site-key", referralCode: "GRANITE42", googleReviewUrl: "https://g.page/r/demo/review", notes: "Referral via Green By Me." },
  { id: 2, businessName: "G. Skin Therapy", ownerName: "Glenda", phone: "978-555-0120", email: null, tier: 3, siteUrl: null, status: "phase1", goLiveDate: null, niche: "aesthetician", siteKey: "k2", notes: null },
  { id: 3, businessName: "Bentleys Stoneworks", ownerName: "Barry", phone: "603-555-0163", email: null, tier: 2, siteUrl: null, status: "build", goLiveDate: null, niche: "masonry", siteKey: "k3", notes: "Waiting on Gabe's domain credentials." },
  { id: 4, businessName: "Kerry Lapierre Septic", ownerName: "Kerry", phone: "603-555-0181", email: null, tier: 2, siteUrl: "lapierreseptic.com", status: "live", goLiveDate: ago(24 * 40).slice(0, 10), niche: "septic", siteKey: "k4", notes: null },
];

const leads: any[] = [
  { id: 1, clientId: 1, name: "Karen Whitfield", phone: "603-555-0199", email: "karen@example.com", message: "Need a spring startup and two zones aren't coming on. Londonderry.", source: "Website form", status: "new", createdAt: ago(0.6) },
  { id: 2, clientId: 1, name: "Mike Doucette", phone: "978-555-0110", email: null, message: "Quote for a new system, about half an acre in Salem NH.", source: "Website form", status: "contacted", createdAt: ago(20) },
  { id: 3, clientId: 1, name: "Priya Shah", phone: null, email: "priya@example.com", message: "Do you do drip lines for garden beds?", source: "Website form", status: "won", createdAt: ago(70) },
  { id: 4, clientId: 1, name: "Tom Brennan", phone: "603-555-0175", email: null, message: "Winterization for a commercial property in Derry.", source: "Google Business Profile", status: "new", createdAt: ago(130) },
  { id: 5, clientId: 1, name: "Alicia Moreno", phone: "603-555-0133", email: null, message: "Backflow test needed before closing on a house.", source: "Website form", status: "won", createdAt: ago(200) },
  { id: 6, clientId: 1, name: "Steve Rourke", phone: "603-555-0102", email: null, message: "Sprinkler head keeps geysering by the driveway.", source: "Website form", status: "lost", createdAt: ago(320) },
];

const revisions: any[] = [
  { id: 1, clientId: 1, title: "Add fall winterization special to Home page", details: "Banner: 'Book winterization by Oct 31, save $25'.", page: "Home", status: "in_progress", createdBy: "client", dueAt: inH(30), completedAt: null, createdAt: ago(18) },
  { id: 2, clientId: 1, title: "Swap truck photo on About page", details: "Use the new photo texted 9/20.", page: "About", status: "done", createdBy: "bot", dueAt: ago(40), completedAt: ago(50), createdAt: ago(90) },
  { id: 3, clientId: 2, title: "Add HydraFacial pricing table", details: "Three packages, prices in Glenda's email.", page: "Services", status: "open", createdBy: "team", dueAt: inH(6), completedAt: null, createdAt: ago(12) },
];

const chat: any[] = [];

const escalations: any[] = [
  { id: 1, clientId: 4, category: "billing", urgency: "normal", summary: "Kerry asked when the $97/mo starts and wants to switch the card on file.", status: "open", createdAt: ago(3) },
  { id: 2, clientId: 2, category: "site_down", urgency: "urgent", summary: "Glenda says the booking form on the preview isn't sending.", status: "open", createdAt: ago(0.4) },
];
const upgrades: any[] = [{ id: 1, clientId: 4, item: "tier-3", note: "Wants help with Google reviews", source: "chatbot", status: "new", createdAt: ago(5) }];
const referrals: any[] = [
  { id: 1, clientId: 1, name: "Rick Morin", business: "Rick's Landscaping", phone: "603-555-0190", email: null, source: "app", status: "signed", signedAt: ago(24 * 9), creditAmount: 100, creditStatus: "applied", createdAt: ago(24 * 20) },
  { id: 2, clientId: 1, name: "Maria Santos", business: "Santos Cleaning Co.", phone: "978-555-0161", email: null, source: "link", status: "signed", signedAt: ago(30), creditAmount: 100, creditStatus: "pending", createdAt: ago(24 * 6) },
  { id: 3, clientId: 1, name: "Jeff Lavoie", business: "Lavoie Paving", phone: "603-555-0114", email: null, source: "link", status: "contacted", signedAt: null, creditAmount: 0, creditStatus: "none", createdAt: ago(26) },
];

// A month of sample site traffic and uptime
const siteEvents: { kind: string; path: string; createdAt: string }[] = [];
{
  const paths = ["/", "/", "/", "/services", "/services", "/sprinkler-repair", "/contact", "/about", "/winterization"];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let d = 0; d < 30; d++) {
    const views = 6 + Math.round(rnd() * 10 + (d % 7 === 1 ? 6 : 0));
    for (let i = 0; i < views; i++) siteEvents.push({ kind: "view", path: paths[Math.floor(rnd() * paths.length)], createdAt: ago(d * 24 + rnd() * 20) });
    if (rnd() < 0.6) siteEvents.push({ kind: "call", path: "/contact", createdAt: ago(d * 24 + 3) });
    if (rnd() < 0.25) siteEvents.push({ kind: "form", path: "/contact", createdAt: ago(d * 24 + 5) });
  }
}
const photos: any[] = [];

function referralSummary(clientId: number) {
  const c = cOf(clientId);
  const rows = referrals.filter((r) => r.clientId === clientId).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const signed = rows.filter((r) => r.status === "signed");
  const earned = signed.reduce((s, r) => s + r.creditAmount, 0);
  const pending = signed.filter((r) => r.creditStatus === "pending").reduce((s, r) => s + r.creditAmount, 0);
  const inPlay = rows.filter((r) => r.status === "new" || r.status === "contacted").length;
  const origin = location.protocol.startsWith("http") ? `${location.origin}${location.pathname}#` : "https://app.blackwidow.studio";
  return {
    code: c.referralCode || "BW10",
    link: `${origin}/r/${c.referralCode || "BW10"}`,
    referrals: rows,
    stats: { earned, pending, applied: earned - pending, signedCount: signed.length, inPlay, potential: inPlay * REFERRAL.perSignup },
    program: REFERRAL,
  };
}

function websiteStats(clientId: number) {
  const c = cOf(clientId);
  const ev = clientId === 1 ? siteEvents : [];
  const pages = new Map<string, number>();
  for (const e of ev) if (e.kind === "view") pages.set(e.path, (pages.get(e.path) || 0) + 1);
  const live = c.status === "live";
  return {
    siteUrl: c.siteUrl, status: c.status, tracking: ev.length > 0,
    traffic: {
      views: ev.filter((e) => e.kind === "view").length, calls: ev.filter((e) => e.kind === "call").length, texts: 0, forms: ev.filter((e) => e.kind === "form").length,
      dailyViews: ev.filter((e) => e.kind === "view").map((e) => e.createdAt),
      topPages: [...pages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, views]) => ({ path, views })),
    },
    health: live ? { checkedAt: ago(0.1), up: true, responseMs: 412, uptime: 99.9, https: true } : { checkedAt: null, up: null, responseMs: null, uptime: null, https: null },
    photos: photos.filter((p) => p.clientId === clientId),
  };
}

const notifs: Record<number, any[]> = {
  3: [
    { id: 14, kind: "lead", title: "New lead: Karen Whitfield", body: "Need a spring startup and two zones aren't coming on.", url: "/leads/1", read: false, createdAt: ago(0.6) },
    { id: 13, kind: "revision_update", title: "We're on it", body: "Started: Add fall winterization special", url: "/revisions", read: false, createdAt: ago(5) },
    { id: 12, kind: "team_reply", title: "Cam from Black Widow", body: "New photo is up, looks great Dan", url: "/help", read: true, createdAt: ago(50) },
    { id: 11, kind: "report", title: "Your August report", body: "11 leads came through your site. Want more? Get Booked gets you 24-hour edits and more.", url: "/leads", read: true, createdAt: ago(24 * 28) },
  ],
  1: [
    { id: 22, kind: "escalation", title: "URGENT: G. Skin Therapy", body: "Booking form on the preview isn't sending.", url: "/team/clients/2", read: false, createdAt: ago(0.4) },
    { id: 21, kind: "upgrade_request", title: "Upsell: Kerry Lapierre Septic", body: "Upgrade to Get Booked ($297/mo). Call them while it's hot.", url: "/team/clients/4", read: false, createdAt: ago(5) },
  ],
};

function notify(userId: number, n: { kind: string; title: string; body: string; url: string }) {
  (notifs[userId] ||= []).unshift({ id: nid(), read: false, createdAt: now(), ...n });
}

const describe = (item: string) =>
  item.startsWith("tier-") ? `Upgrade to ${PLANS[Number(item.slice(5)) as Tier].name} ($${PLANS[Number(item.slice(5)) as Tier].monthly}/mo)` : ADDONS.find((a) => a.id === item)?.title || item;
const cOf = (id: number) => clients.find((c) => c.id === id);
const brief = (id: number) => ({ businessName: cOf(id).businessName, tier: cOf(id).tier });

function overview(clientId: number) {
  const c = cOf(clientId);
  const plan = PLANS[c.tier as Tier];
  const next = nextPlan(c.tier);
  const mine = leads.filter((l) => l.clientId === clientId);
  const monthly = c.goLiveDate ? new Date(new Date(c.goLiveDate).getTime() + 30 * 86400_000).toISOString().slice(0, 10) : null;
  return {
    business: c.businessName, owner: c.ownerName, siteUrl: c.siteUrl, status: c.status, goLiveDate: c.goLiveDate, monthlyStartsOn: monthly,
    plan: { tier: plan.tier, name: plan.name, monthly: plan.monthly, pages: plan.pages, revisionTurnaround: plan.revisionLabel, features: plan.features },
    nextPlan: next && { tier: next.tier, name: next.name, monthly: next.monthly, revisionTurnaround: next.revisionLabel, features: next.features },
    leads: { last30: mine.filter((l) => Date.now() - +new Date(l.createdAt) < 30 * 86400_000).length, newCount: mine.filter((l) => l.status === "new").length, total: mine.length },
    openRevisions: revisions.filter((r) => r.clientId === clientId && r.status !== "done"),
    pendingUpgrade: upgrades.find((u) => u.clientId === clientId && u.status === "new") || null,
    reviewUrl: c.googleReviewUrl || null,
  };
}

// Canned assistant so the preview shows the flows (the real app uses Claude)
function fakeBot(text: string) {
  const t = text.toLowerCase();
  const c = cOf(1);
  const plan = PLANS[c.tier as Tier];
  const say = (body: string) => chat.push({ id: nid(), clientId: 1, sender: "bot", authorName: "Black Widow Assistant", body, createdAt: now() });
  const escalate = (category: string, urgency: string, summary: string) => {
    escalations.push({ id: nid(), clientId: 1, category, urgency, summary, status: "open", createdAt: now() });
    chat.push({ id: nid(), clientId: 1, sender: "system", authorName: null, body: urgency === "urgent" ? "Flagged as urgent for Cam and Trae. You'll get a notification the moment they reply." : "Sent to Cam and Trae. You'll get a notification when they reply here.", createdAt: now() });
    notify(1, { kind: "escalation", title: `${urgency === "urgent" ? "Urgent" : "Needs you"}: ${c.businessName}`, body: summary, url: "/team/clients/1" });
  };
  if (/down|not loading|broken|form|not working/.test(t)) {
    say("I just loaded granitestateirrigation.com. It's up and responded in 412 ms. If a form isn't sending, that still needs eyes, so I'm getting Cam and Trae on it now.");
    escalate("site_down", "urgent", `Dan reports: "${text}". Site loads fine (412 ms); likely form issue.`);
  } else if (/bill|invoice|charge|refund|cancel|price|card/.test(t)) {
    say("Anything billing goes straight to Cam so it's handled right. I've sent it over.");
    escalate("billing", "normal", `Billing question from Dan: "${text}"`);
  } else if (/call|human|person|cam|trae/.test(t)) {
    say("You got it, I'm pinging Cam and Trae now. They pick up until 7:30 PM Eastern.");
    escalate("human_requested", "normal", `Dan asked for a person: "${text}"`);
  } else if (/upgrade|more leads|ads|reviews|yes/.test(t) && !/hour/.test(t)) {
    upgrades.unshift({ id: nid(), clientId: 1, item: "tier-3", note: text, source: "chatbot", status: "new", createdAt: now() });
    notify(1, { kind: "upgrade_request", title: `Upsell: ${c.businessName}`, body: `Upgrade to Get Booked: "${text}"`, url: "/team/clients/1" });
    say("Love it. I've let Cam know you're interested in Get Booked: 24-hour edits, a managed Google profile posting twice a week, and a monthly review blast. He'll reach out today.");
  } else if (/hour|change|update|add|swap|photo|text|price|page|fix/.test(t)) {
    const due = inH(plan.revisionHours);
    revisions.unshift({ id: nid(), clientId: 1, title: text.length > 60 ? text.slice(0, 57) + "…" : text, details: text, page: null, status: "open", createdBy: "bot", dueAt: due, completedAt: null, createdAt: now() });
    say(`Got it, logged for the team. You're on ${plan.name}, so it'll be live within ${plan.revisionHours} hours and your phone will buzz when it's done.\n\nWant it faster next time? Get Booked turns edits around in 24 hours.`);
  } else if (/lead/.test(t)) {
    const o = overview(1);
    say(`${o.leads.last30} leads came in over the last 30 days, and ${o.leads.newCount} are still waiting on a call back. Tap Leads to call them.`);
  } else {
    say("I can make site edits, check if your site's up, pull your lead numbers, or get Cam and Trae on the line. What do you need?");
  }
}

function route(method: string, path: string, body: any): any {
  const [p, qs] = path.split("?");
  const q = new URLSearchParams(qs || "");
  const me = role === "team" ? team : role === "client" ? clientUser : null;
  let m: RegExpMatchArray | null;

  if (p === "/me") return { user: me, client: me?.clientId ? { ...cOf(1) } : null, botEnabled: true };
  if (p === "/auth/login") {
    role = /demo@|dan/.test(String(body?.email)) ? "client" : "team";
    try { localStorage.setItem("bw-demo-role", role); } catch {}
    return { user: role === "team" ? team : clientUser };
  }
  if (p === "/auth/logout") { role = null; try { localStorage.removeItem("bw-demo-role"); } catch {} return { ok: true }; }
  if ((m = p.match(/^\/public\/ref\/(\w+)$/))) {
    const c = clients.find((x) => x.referralCode === m![1].toUpperCase());
    if (!c) throw Object.assign(new Error("This referral link isn't active."), { status: 404 });
    if (method === "GET") return { business: c.businessName, owner: c.ownerName, offer: REFERRAL.friendOffer };
    if (!body?.name || (!body.phone && !body.email)) throw Object.assign(new Error("Add your name and a phone number or email so we can reach you"), { status: 400 });
    referrals.unshift({ id: nid(), clientId: c.id, name: body.name, business: body.business || null, phone: body.phone || null, email: body.email || null, source: "link", status: "new", signedAt: null, creditAmount: 0, creditStatus: "none", createdAt: now() });
    notify(3, { kind: "referral", title: `${body.name} just used your link!`, body: `${body.business || "They"} asked about a website. You'll earn $${REFERRAL.perSignup} if they sign.`, url: "/refer" });
    notify(1, { kind: "referral", title: `Referral via ${c.businessName}'s link`, body: `${body.name}. Warm lead, call now.`, url: `/team/clients/${c.id}` });
    return { ok: true };
  }
  if (!me) throw Object.assign(new Error("Please sign in"), { status: 401 });

  if (p === "/push/key") return { key: "" };
  if (p === "/push/test") { notify(me.id, { kind: "offer", title: "Buzz check", body: "Notifications are on. This is what a new lead feels like.", url: "/" }); return { ok: true }; }
  if (p === "/notifications") {
    const after = Number(q.get("after")) || 0;
    const list = notifs[me.id] || [];
    return { notifications: list.filter((n) => n.id > after).slice(0, 50), unread: list.filter((n) => !n.read).length };
  }
  if (p === "/notifications/read-all") { (notifs[me.id] || []).forEach((n) => (n.read = true)); return { ok: true }; }

  // client
  if (p === "/client/overview") return overview(1);
  if (p === "/client/leads") return { leads: leads.filter((l) => l.clientId === 1) };
  if ((m = p.match(/^\/client\/leads\/(\d+)$/))) { const l = leads.find((x) => x.id === +m![1]); l.status = body.status; return { lead: l }; }
  if (p === "/client/revisions" && method === "GET") return { revisions: revisions.filter((r) => r.clientId === 1) };
  if (p === "/client/revisions") {
    const r = { id: nid(), clientId: 1, ...body, status: "open", createdBy: "client", dueAt: inH(PLANS[cOf(1).tier as Tier].revisionHours), completedAt: null, createdAt: now() };
    revisions.unshift(r);
    notify(1, { kind: "revision_created", title: "Revision: Granite State Irrigation", body: r.title, url: "/team/clients/1" });
    return { revision: r };
  }
  if (p === "/client/chat" && method === "GET") { const after = Number(q.get("after")) || 0; return { messages: chat.filter((x) => x.clientId === 1 && x.id > after) }; }
  if (p === "/client/chat") {
    const msg = { id: nid(), clientId: 1, sender: "client", authorName: "Dan", body: body.body, createdAt: now() };
    chat.push(msg);
    setTimeout(() => fakeBot(body.body), 1400);
    // Show the human handoff: Cam hops into the thread a bit later
    if (!camJoined) {
      camJoined = true;
      setTimeout(() => {
        const text = "Hey Dan, Cam here. Saw this come through. We're on it, holler if you need anything else.";
        chat.push({ id: nid(), clientId: 1, sender: "team", authorName: "Cam", body: text, createdAt: now() });
        notify(3, { kind: "team_reply", title: "Cam from Black Widow", body: text, url: "/help" });
      }, 9000);
    }
    return { message: msg };
  }
  if (p === "/client/upgrades") {
    upgrades.unshift({ id: nid(), clientId: 1, item: body.item, note: body.note || null, source: "app", status: "new", createdAt: now() });
    notify(1, { kind: "upgrade_request", title: "Upsell: Granite State Irrigation", body: `${describe(body.item)}. Call them while it's hot.`, url: "/team/clients/1" });
    return { ok: true, message: `${describe(body.item)}: Cam will reach out shortly.` };
  }
  if (p === "/client/referrals" && method === "GET") return referralSummary(1);
  if (p === "/client/referrals") { const r = { id: nid(), clientId: 1, ...body, source: "app", status: "new", signedAt: null, creditAmount: 0, creditStatus: "none", createdAt: now() }; referrals.unshift(r); return { referral: r }; }
  if (p === "/client/website") return websiteStats(1);
  if (p === "/client/photos") {
    for (const ph of body.photos) photos.unshift({ id: nid(), clientId: 1, note: body.note || null, createdAt: now(), url: ph.dataUrl });
    revisions.unshift({ id: nid(), clientId: 1, title: `Add ${body.photos.length} new photo${body.photos.length > 1 ? "s" : ""} to the site`, details: body.note || "Client sent new job photos from the app.", page: null, status: "open", createdBy: "client", dueAt: inH(48), completedAt: null, createdAt: now() });
    return { ok: true, count: body.photos.length };
  }
  if (p === "/client/site-check") return { ok: true, status: 200, responseMs: 412, detail: "Up (HTTP 200, 412 ms)" };

  // team
  if (p === "/team/inbox") {
    const live = clients.filter((c) => c.status === "live");
    return {
      stats: { clients: clients.length, live: live.length, mrr: live.reduce((s, c) => s + PLANS[c.tier as Tier].monthly, 0) },
      escalations: escalations.filter((e) => e.status === "open").map((e) => ({ ...e, client: brief(e.clientId) })).sort((a, b) => (a.urgency === "urgent" ? -1 : 1) - (b.urgency === "urgent" ? -1 : 1)),
      revisions: revisions.filter((r) => r.status !== "done").map((r) => ({ ...r, client: brief(r.clientId) })).sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt)),
      upgrades: upgrades.filter((u) => u.status === "new").map((u) => ({ ...u, label: describe(u.item), client: brief(u.clientId) })),
      referrals: referrals.filter((r) => r.status !== "signed" && r.status !== "lost").map((r) => ({ ...r, client: brief(r.clientId) })),
    };
  }
  if (p === "/team/clients" && method === "GET")
    return { clients: clients.map((c) => ({ ...c, openRevisions: revisions.filter((r) => r.clientId === c.id && r.status !== "done").length, openEscalations: escalations.filter((e) => e.clientId === c.id && e.status === "open").length, leads30: leads.filter((l) => l.clientId === c.id).length })) };
  if (p === "/team/clients") { const c = { id: nid(), siteKey: Math.random().toString(36).slice(2, 12), ...body, tier: Number(body.tier) }; clients.push(c); return { client: c }; }
  if ((m = p.match(/^\/team\/clients\/(\d+)$/))) {
    const id = +m[1];
    if (method === "PATCH") { Object.assign(cOf(id), body, { tier: Number(body.tier) }); return { client: cOf(id) }; }
    if (method === "DELETE") { clients.splice(clients.indexOf(cOf(id)), 1); return { ok: true }; }
    return {
      client: cOf(id),
      chat: chat.filter((x) => x.clientId === id),
      revisions: revisions.filter((x) => x.clientId === id),
      leads: leads.filter((x) => x.clientId === id),
      escalations: escalations.filter((x) => x.clientId === id),
      upgrades: upgrades.filter((x) => x.clientId === id).map((u) => ({ ...u, label: describe(u.item) })),
      referrals: referrals.filter((x) => x.clientId === id),
      website: websiteStats(id),
      logins: id === 1 ? [{ id: 3, email: "demo@blackwidow.studio", name: "Dan" }] : [],
    };
  }
  if ((m = p.match(/^\/team\/clients\/(\d+)\/chat$/))) {
    const msg = { id: nid(), clientId: +m[1], sender: "team", authorName: "Cam", body: body.body, createdAt: now() };
    chat.push(msg);
    if (+m[1] === 1) notify(3, { kind: "team_reply", title: "Cam from Black Widow", body: body.body, url: "/help" });
    return { message: msg };
  }
  if ((m = p.match(/^\/team\/clients\/(\d+)\/nudge$/))) { if (+m[1] === 1) notify(3, { kind: "offer", ...body }); return { ok: true }; }
  if ((m = p.match(/^\/team\/clients\/(\d+)\/revisions$/))) { const r = { id: nid(), clientId: +m[1], ...body, status: "open", createdBy: "team", dueAt: inH(48), completedAt: null, createdAt: now() }; revisions.unshift(r); return { revision: r }; }
  if ((m = p.match(/^\/team\/clients\/(\d+)\/logins$/))) return { user: { id: nid(), ...body, role: "client" } };
  if ((m = p.match(/^\/team\/revisions\/(\d+)$/))) {
    const r = revisions.find((x) => x.id === +m![1]);
    r.status = body.status;
    r.completedAt = body.status === "done" ? now() : null;
    if (r.clientId === 1 && body.status === "done") notify(3, { kind: "revision_done", title: "Your edit is live", body: r.title, url: "/revisions" });
    return { revision: r };
  }
  if ((m = p.match(/^\/team\/escalations\/(\d+)$/))) { const e = escalations.find((x) => x.id === +m![1]); e.status = body.status; return { escalation: e }; }
  if ((m = p.match(/^\/team\/upgrades\/(\d+)$/))) { const u = upgrades.find((x) => x.id === +m![1]); u.status = body.status; return { upgrade: u }; }
  if ((m = p.match(/^\/team\/referrals\/(\d+)\/credit$/))) {
    const r = referrals.find((x) => x.id === +m![1]);
    if (r.creditStatus === "pending") { r.creditStatus = "applied"; if (r.clientId === 1) notify(3, { kind: "referral", title: `$${r.creditAmount} credit applied`, body: `Thanks to ${r.name}, your bill just got smaller. Who's next?`, url: "/refer" }); }
    return { referral: r };
  }
  if ((m = p.match(/^\/team\/referrals\/(\d+)$/))) {
    const r = referrals.find((x) => x.id === +m![1]);
    if (body.status === "signed" && r.status !== "signed") {
      const nth = referrals.filter((x) => x.clientId === r.clientId && x.status === "signed").length + 1;
      Object.assign(r, { status: "signed", signedAt: now(), creditAmount: creditForSignup(nth), creditStatus: "pending" });
      if (r.clientId === 1) notify(3, { kind: "referral", title: `You just earned $${r.creditAmount}`, body: `${r.name} signed with Black Widow. ${REFERRAL.cardSlots - (nth % REFERRAL.cardSlots)} more to fill your card!`, url: "/refer" });
    } else if (r.status !== "signed") r.status = body.status;
    return { referral: r };
  }

  throw Object.assign(new Error(`Demo: no handler for ${method} ${p}`), { status: 404 });
}

// A fresh lead lands ~20s into the preview so you can feel the buzz
let leadTimer = false;
let camJoined = false;
function scheduleDemoLead() {
  if (leadTimer) return;
  leadTimer = true;
  setTimeout(() => {
    const l = { id: nid(), clientId: 1, name: "Jess Carrier", phone: "603-555-0147", email: null, message: "Can someone blow out my system this week? Hudson NH.", source: "Website form", status: "new", createdAt: now() };
    leads.unshift(l);
    notify(3, { kind: "lead", title: "New lead: Jess Carrier", body: l.message, url: `/leads/${l.id}` });
  }, 20_000);
}

export async function demoRequest(method: string, path: string, body?: unknown) {
  await new Promise((r) => setTimeout(r, 120));
  if (role === "client") scheduleDemoLead();
  return structuredClone(route(method, path, body));
}

export function demoSwitch(to: "client" | "team") {
  role = to;
  try { localStorage.setItem("bw-demo-role", to); } catch {}
}
