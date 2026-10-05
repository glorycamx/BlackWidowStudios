/**
 * Generators: what each routine finds when it runs. Pure functions of
 * (routine, run number, time, recent state), so the same run always
 * produces the same find. Everything here is sample data: businesses use
 * the reserved .example domain and 555-01xx phone numbers. A real backend
 * swaps these for live monitors that return the same FeedItem shape.
 */
import { aiLead, businessName, NEWS, person, TOWNS, websiteLead } from "@/lib/services/signalService";
import { formatLocalTime } from "@/lib/time";
import { hashString, pick, prng, uid } from "@/lib/utils";
import type { FeedItem, PostChannel, Routine, RoutineEngine, ScheduledPost } from "@/types";

export interface GenContext {
  now: number;
  seq: number;
  /** Newest first. */
  feed: FeedItem[];
  posts: ScheduledPost[];
  pendingApprovals: number;
  /** For digests: the window the digest covers. */
  since?: number;
}

export function rngFor(routineId: string, seq: number, salt = "") {
  return prng(hashString(`${routineId}:${seq}:${salt}`));
}

/** How long before the bot caught it that the thing actually happened. */
function lag(r: () => number) {
  return Math.round((60 + r() * 300) * 1000);
}

function base(routine: Routine, at: number, r: () => number, withLag = true): Omit<FeedItem, "kind" | "trigger" | "title" | "summary"> {
  return {
    id: uid("f"),
    botId: routine.botId,
    routineId: routine.id,
    at,
    foundAt: at,
    happenedAt: withLag ? at - lag(r) : undefined,
    read: false,
    saved: false,
    dismissed: false,
  };
}

/* ------------------------------------------------------------------ */
/* Lead Hunter                                                          */
/* ------------------------------------------------------------------ */

const LEAD_SOURCES: Partial<Record<RoutineEngine, { web?: string[]; ai?: string[] }>> = {
  "website-down": { web: ["Website went down", "Site fails on mobile"] },
  "changed-hands": { web: ["Business changed hands"] },
  "new-business": { web: ["New business registered"], ai: ["Opening a new location"] },
  "review-spike": { web: ["Review surge"], ai: ["Reviews mention slow replies"] },
  "domain-expiring": { web: ["Domain about to expire"] },
  hiring: { web: ["Hiring for marketing"], ai: ["Hiring for repetitive roles", "Manual quote process", "Paper or phone-only booking"] },
};

function leadFind(routine: Routine, ctx: GenContext): FeedItem {
  const r = rngFor(routine.id, ctx.seq);
  const src = LEAD_SOURCES[routine.engine] ?? { web: ["Website went down"] };
  const options = [...(src.web ?? []).map((t) => ["web", t] as const), ...(src.ai ?? []).map((t) => ["ai", t] as const)];
  const [kind, trig] = pick(r, options);
  const s = kind === "web" ? websiteLead(r, trig) : aiLead(r, trig);
  return { ...base(routine, ctx.now, r), kind: "lead", trigger: s.trigger, title: s.title, summary: s.summary, lead: s.lead };
}

/* ------------------------------------------------------------------ */
/* Researcher                                                           */
/* ------------------------------------------------------------------ */

const CLIENT_INDUSTRIES = ["Roofing", "Dental", "Bakery", "HVAC", "Law Office", "Landscaping", "Fitness", "Auto Repair"];

const UPSELLS = [
  { trigger: "Client's reviews jumped", title: (c: string) => `${c} could use a review widget`, why: "They got 9 new reviews in two weeks and none show on their site.", next: "Offer the review widget add-on. Takes a day to set up.", value: "$49/mo" },
  { trigger: "Client added a service", title: (c: string) => `${c} added a new service with no page`, why: "Their Google profile lists it, but nobody can find it on the website.", next: "Pitch a landing page for the new service.", value: "$600 one-time" },
  { trigger: "Client is busy on weekends", title: (c: string) => `${c} misses weekend calls`, why: "Reviews mention nobody answers on Saturdays.", next: "Offer online booking so weekend customers can book themselves.", value: "$39/mo" },
  { trigger: "Client's site slowed down", title: (c: string) => `${c}'s site got slower`, why: "Load time went from 2.1s to 4.6s after their last photo upload.", next: "Offer a speed tune-up as part of the care plan.", value: "$250 one-time" },
  { trigger: "Client opened a second location", title: (c: string) => `${c} is opening a second spot`, why: "A permit was filed last week. Their site still shows one address.", next: "Offer a locations page and a second Google profile setup.", value: "$900 one-time" },
];

const COMPETITORS = [
  { trigger: "Competitor raised prices", title: "A competitor raised their website price by 20%", why: "Their starter site went from $2,500 to $3,000.", next: "You can hold your price and say so in this week's posts." },
  { trigger: "Competitor dropped a service", title: "A competitor stopped offering care plans", why: "Their pricing page no longer lists monthly maintenance.", next: "Reach out to their clients with your care plan." },
  { trigger: "Competitor launched an offer", title: "A competitor is running a free audit offer", why: "They are advertising free website audits in your area.", next: "Lead with a free 3-minute video audit instead. It feels more personal." },
  { trigger: "Competitor's reviews dipped", title: "A competitor got 4 one-star reviews this week", why: "All mention slow replies after the sale.", next: "Make fast replies a headline in your next post." },
];

const TRENDS = [
  { term: "AI receptionist", why: "Searches near you are up 3x since last month.", next: "Add an AI receptionist setup to your offers page." },
  { term: "website for new business", why: "Climbing every week this quarter.", next: "Post a new-business launch package." },
  { term: "ADA compliant website", why: "Up sharply after recent news coverage.", next: "Offer an accessibility check on every site you quote." },
  { term: "online booking for salons", why: "Steady climb for 6 weeks.", next: "Package booking setup for salons and spas." },
];

function clientName(r: () => number) {
  return businessName(r, pick(r, CLIENT_INDUSTRIES));
}

function researcherFind(routine: Routine, ctx: GenContext): FeedItem {
  const r = rngFor(routine.id, ctx.seq);
  if (routine.engine === "upsells") {
    const u = pick(r, UPSELLS);
    const c = clientName(r);
    return { ...base(routine, ctx.now, r), kind: "opportunity", trigger: u.trigger, title: u.title(c), summary: u.why, opportunity: { client: c, whyItMatters: u.why, nextStep: u.next, value: u.value } };
  }
  if (routine.engine === "competitors") {
    const c = pick(r, COMPETITORS);
    return { ...base(routine, ctx.now, r), kind: "opportunity", trigger: c.trigger, title: c.title, summary: c.why, opportunity: { whyItMatters: c.why, nextStep: c.next } };
  }
  const t = pick(r, TRENDS);
  return { ...base(routine, ctx.now, r, false), kind: "opportunity", trigger: "Search trend", title: `People are searching for "${t.term}"`, summary: t.why, opportunity: { whyItMatters: t.why, nextStep: t.next } };
}

/* ------------------------------------------------------------------ */
/* Reporter                                                             */
/* ------------------------------------------------------------------ */

const NICHE = [
  { title: "Google is testing a new layout for local results", summary: "Some searches now show photos before the map.", why: "Clients with few photos will slide down the page.", todo: "Add a photo refresh to every care plan this month." },
  { title: "A big website builder raised its prices", summary: "Plans went up 15 to 30 percent for small businesses.", why: "Their customers are looking around right now.", todo: "Post a simple switch offer this week." },
  { title: "Your state updated its rules for online reviews", summary: "Businesses must not hide negative reviews on their sites.", why: "Some review widgets filter by star rating.", todo: "Check client review widgets show all ratings." },
  { title: "Phone searches for local services hit a new high", summary: "Most local searches now happen on phones.", why: "Sites that break on mobile are losing more calls than ever.", todo: "Lead with mobile fixes in your openers this week." },
];

function reporterFind(routine: Routine, ctx: GenContext): FeedItem {
  const r = rngFor(routine.id, ctx.seq);
  if (routine.engine === "ai-news") {
    const n = NEWS[ctx.seq % NEWS.length];
    return { ...base(routine, ctx.now, r), kind: "brief", trigger: "AI news", title: n.title, summary: n.summary, brief: { whyItMatters: n.why, whatToDo: "Save it for your next client call.", source: "Sample feed" } };
  }
  if (routine.engine === "niche-breaking") {
    const n = pick(r, NICHE);
    return { ...base(routine, ctx.now, r), kind: "brief", trigger: "Breaking in your niche", title: n.title, summary: n.summary, brief: { whyItMatters: n.why, whatToDo: n.todo, source: "Sample feed" } };
  }
  // Morning brief
  const niche = pick(r, NICHE);
  const ai = NEWS[ctx.seq % NEWS.length];
  return {
    ...base(routine, ctx.now, r, false),
    kind: "brief",
    trigger: "Morning brief",
    title: "Your morning brief",
    summary: "Two things worth knowing before you start.",
    brief: { whyItMatters: niche.why, whatToDo: niche.todo, source: "Sample feed" },
    digest: { lines: [{ text: niche.title }, { text: ai.title }] },
  };
}

/* ------------------------------------------------------------------ */
/* Manager                                                              */
/* ------------------------------------------------------------------ */

function digestFind(routine: Routine, ctx: GenContext): FeedItem {
  const r = rngFor(routine.id, ctx.seq);
  const since = ctx.since ?? ctx.now - 12 * 3600e3;
  const window = ctx.feed.filter((f) => f.at > since && f.at <= ctx.now && f.kind !== "digest");
  const leads = window.filter((f) => f.kind === "lead");
  const hot = leads.filter((f) => f.lead?.temperature === "hot");
  const posted = ctx.posts.filter((p) => p.status === "posted" && (p.postedAt ?? 0) > since && (p.postedAt ?? 0) <= ctx.now);
  const opps = window.filter((f) => f.kind === "opportunity");
  const briefs = window.filter((f) => f.kind === "brief");
  const nextPost = ctx.posts.filter((p) => p.scheduledFor > ctx.now && (p.status === "scheduled" || p.status === "needs-ok")).sort((a, b) => a.scheduledFor - b.scheduledFor)[0];
  const morning = routine.engine === "morning-text";
  const lines: { text: string; href?: string }[] = [];
  if (leads.length) {
    const top = hot[0] ?? leads[0];
    lines.push({ text: `${leads.length} new lead${leads.length === 1 ? "" : "s"}${hot.length ? `, ${hot.length} hot` : ""}. Top one: ${top.title} (${top.trigger.toLowerCase()} at ${formatLocalTime(top.happenedAt ?? top.at)}).`, href: `/live?id=${top.id}` });
  } else lines.push({ text: "No new leads. Lead Hunter kept checking all night." });
  if (posted.length) lines.push({ text: `${posted.length} post${posted.length === 1 ? "" : "s"} went out on time.`, href: "/calendar" });
  if (nextPost) lines.push({ text: `Next post: ${formatLocalTime(nextPost.scheduledFor)}${nextPost.status === "needs-ok" ? ", needs your OK" : ""}.`, href: "/calendar" });
  if (opps.length) lines.push({ text: `Researcher found ${opps.length} way${opps.length === 1 ? "" : "s"} to make more money.`, href: "/live" });
  if (briefs.length && morning) lines.push({ text: "Reporter's brief is ready.", href: "/live" });
  if (ctx.pendingApprovals) lines.push({ text: `${ctx.pendingApprovals} thing${ctx.pendingApprovals === 1 ? "" : "s"} need${ctx.pendingApprovals === 1 ? "s" : ""} your yes.`, href: "/approvals" });
  return {
    ...base(routine, ctx.now, r, false),
    kind: "digest",
    trigger: morning ? "Morning text" : "Evening recap",
    title: morning ? "Good morning. Here's your night." : "Here's your day.",
    summary: lines[0].text,
    digest: { lines },
  };
}

function followUpFind(routine: Routine, ctx: GenContext): FeedItem | null {
  const r = rngFor(routine.id, ctx.seq);
  const leads = ctx.feed.filter((x) => x.kind === "lead" && x.lead && !x.dismissed);
  if (!leads.length) return null;
  const target = leads[Math.floor(r() * leads.length)];
  const l = target.lead!;
  const first = l.owner.split(" ")[0];
  const rem = [
    { trigger: "Follow-up due", title: `Follow up with ${first} at ${l.business}`, summary: "Opener sent 3 days ago, no reply yet. A short call usually closes the gap.", due: "Today, 4:00 PM" },
    { trigger: "Proposal expiring", title: `Proposal for ${l.business} expires tomorrow`, summary: `${l.recommended.offer} at ${l.recommended.price}. Nudge before it lapses.`, due: "Tomorrow" },
    { trigger: "Lead went quiet", title: `${l.business} went quiet`, summary: "5 days since the last reply. Try a different angle: lead with the review count.", due: "This week" },
  ][Math.floor(r() * 3)];
  return { ...base(routine, ctx.now, r, false), kind: "reminder", trigger: rem.trigger, title: rem.title, summary: rem.summary, reminder: { due: rem.due, relatedId: target.id } };
}

/* ------------------------------------------------------------------ */
/* Custom bots                                                          */
/* ------------------------------------------------------------------ */

function customFind(routine: Routine, ctx: GenContext): FeedItem {
  const r = rngFor(routine.id, ctx.seq);
  const ind = pick(r, CLIENT_INDUSTRIES);
  const biz = businessName(r, ind);
  const { first } = person(r);
  const town = pick(r, TOWNS);
  const what = routine.title.replace(/^(keep |always |every \w+ )/i, "");
  return {
    ...base(routine, ctx.now, r),
    kind: "opportunity",
    trigger: "New match",
    title: `${biz} in ${town}`,
    summary: `Matches "${what}".`,
    opportunity: { client: biz, whyItMatters: `Found while working on: ${routine.title.toLowerCase()}.`, nextStep: `Reach out to ${first}, the owner.` },
  };
}

/** Run a routine once. Returns a find, or null for a quiet check. */
export function runEngine(routine: Routine, ctx: GenContext): FeedItem | null {
  switch (routine.engine) {
    case "website-down":
    case "changed-hands":
    case "new-business":
    case "review-spike":
    case "domain-expiring":
    case "hiring":
      return leadFind(routine, ctx);
    case "upsells":
    case "competitors":
    case "trends":
      return researcherFind(routine, ctx);
    case "ai-news":
    case "niche-breaking":
    case "morning-brief":
      return reporterFind(routine, ctx);
    case "morning-text":
    case "evening-recap":
      return digestFind(routine, ctx);
    case "follow-ups":
      return followUpFind(routine, ctx);
    case "custom":
      return customFind(routine, ctx);
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Content calendar                                                      */
/* ------------------------------------------------------------------ */

const CHANNELS: PostChannel[] = ["instagram", "linkedin", "facebook", "google-business", "x"];
/** Odd minutes on purpose: "on the minute" means the exact minute you picked. */
const SLOTS = ["07:58", "12:14", "19:42"];

const CAPTIONS = [
  { caption: "Your website is your hardest-working employee. Is yours showing up to work? We check every client site every 5 minutes.", visual: "Phone showing a fast-loading site" },
  { caption: "Before and after: a roofing site that loaded in 7 seconds now loads in 1.4. Calls went up the same week.", visual: "Split screen, old site vs new" },
  { caption: "3 signs your website is costing you jobs: no tap-to-call, no reviews, no prices. Fixing all three takes a week.", visual: "Checklist card" },
  { caption: "New business in town? Your Google profile needs a website to link to. We launch in about a week.", visual: "Storefront with a ribbon" },
  { caption: "We answered 100% of client requests within an hour last month. Boring? Maybe. Our clients like boring.", visual: "Clock and a check mark" },
  { caption: "Reviews are the new homepage. Put your best ones where people decide to call.", visual: "Five stars on a phone screen" },
  { caption: "Quick tip: add your service area to every page title. Local search loves it.", visual: "Map pin over a town" },
  { caption: "Behind the scenes: how we build a site in a week, from first call to launch.", visual: "Timeline with 5 steps" },
  { caption: "Your domain renews once a year. If you forget, your website and email go dark. Our care plan never forgets.", visual: "Calendar with a lock" },
];

export function channelLabel(c: PostChannel) {
  return { instagram: "Instagram", linkedin: "LinkedIn", facebook: "Facebook", "google-business": "Google Business", x: "X" }[c];
}

function slotTime(day: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).getTime();
}

/**
 * Make sure every slot from `from` through `days` days out has a post.
 * Past slots come back as posted on the minute; near ones are scheduled;
 * later ones wait for your OK unless the routine may post without asking.
 */
export function fillCalendar(existing: ScheduledPost[], from: number, now: number, days: number, routineId: string, autoPost: boolean): ScheduledPost[] {
  const have = new Set(existing.map((p) => p.scheduledFor));
  const out = [...existing];
  const start = new Date(from);
  for (let d = 0; d <= days; d++) {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + d);
    SLOTS.forEach((slot, i) => {
      const at = slotTime(day, slot);
      if (at < from || have.has(at)) return;
      // Not every slot gets a post: two most days, three on Tuesdays and Thursdays.
      if (i === 1 && day.getDay() !== 2 && day.getDay() !== 4) return;
      const r = prng(hashString(`post:${at}`));
      const c = pick(r, CAPTIONS);
      const past = at <= now;
      const soon = at - now < 36 * 3600e3;
      out.push({
        id: `p-${at}`,
        channel: CHANNELS[(d + i) % CHANNELS.length],
        scheduledFor: at,
        status: past ? "posted" : autoPost || soon ? "scheduled" : "needs-ok",
        postedAt: past ? at : undefined,
        caption: c.caption,
        visualHint: c.visual,
        routineId,
      });
    });
  }
  return out.sort((a, b) => a.scheduledFor - b.scheduledFor);
}

export function postFeedItem(p: ScheduledPost, botId: string, routineId: string | undefined): FeedItem {
  return {
    id: uid("f"),
    botId,
    routineId,
    kind: "post",
    at: p.postedAt ?? p.scheduledFor,
    trigger: "Posted on time",
    title: `Posted to ${channelLabel(p.channel)}`,
    summary: p.caption,
    happenedAt: p.scheduledFor,
    foundAt: p.postedAt,
    read: true,
    saved: false,
    dismissed: false,
    post: { postId: p.id },
  };
}
