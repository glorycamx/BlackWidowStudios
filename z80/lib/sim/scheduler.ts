/**
 * Scheduler: runs routines on their triggers, posts at the exact minute,
 * hands work between bots, and backfills what happened while nobody was
 * watching. Pure: state in, next state out. No React, no storage.
 */
import { ENGINE_META, nextScheduled, scheduledBetween } from "@/data/routines";
import { fillCalendar, postFeedItem, rngFor, runEngine } from "@/lib/sim/generators";
import { formatLocalTime } from "@/lib/time";
import { hashString, prng, uid } from "@/lib/utils";
import type { FeedItem, Notice, Routine, ScheduledPost, TeamMessage } from "@/types";

export const FEED_CAP = 150;
export const TEAM_CAP = 200;
export const NOTICE_CAP = 60;

export interface SimSlice {
  routines: Routine[];
  /** Newest first. */
  feed: FeedItem[];
  posts: ScheduledPost[];
  pendingApprovals: number;
  pausedBots: string[];
}

export interface SimStep {
  routines: Routine[];
  feed: FeedItem[];
  posts: ScheduledPost[];
  /** New finds this step, oldest first. */
  finds: FeedItem[];
  team: TeamMessage[];
  notices: Notice[];
  /** Routine ids that ran a quiet check (no find). */
  quiet: string[];
}

/** Average seconds between live runs for a routine, before speed. */
function liveEveryMs(r: Routine): number {
  if (r.trigger.kind === "every") return r.trigger.minutes * 60e3;
  // Stretched a little so the feed feels alive without turning into noise.
  return (ENGINE_META[r.engine].demoEverySec || 180) * 1600;
}

function jitter(routineId: string, seq: number, ms: number) {
  const r = prng(hashString(`${routineId}:gap:${seq}`));
  return Math.round(ms * (0.6 + r() * 0.8));
}

/** When a routine should next run, counting from `from`. */
export function scheduleNext(r: Routine, from: number, speed = 1, first = false): number {
  switch (r.trigger.kind) {
    case "schedule":
      return nextScheduled(r.trigger, from);
    case "event":
      return 0;
    case "every":
      if (r.trigger.minutes >= 30 && !first) return from + r.trigger.minutes * 60e3;
      return from + jitter(r.id, r.stats.runs, liveEveryMs(r)) / (first ? 4 : speed);
    default:
      return from + jitter(r.id, r.stats.runs, liveEveryMs(r)) / (first ? 4 : speed);
  }
}

function msg(author: string, text: string, at: number, to?: string, ref?: TeamMessage["ref"]): TeamMessage {
  return { id: uid("tm"), author, to, text, at, ref };
}

function notice(n: Omit<Notice, "id" | "read">): Notice {
  return { ...n, id: uid("n"), read: false };
}

/** Team chat and alerts that follow a find. */
function followOn(find: FeedItem, routines: Routine[], at: number, quietHours: boolean): { team: TeamMessage[]; notices: Notice[] } {
  const team: TeamMessage[] = [];
  const notices: Notice[] = [];
  if (find.kind === "lead" && find.lead) {
    const l = find.lead;
    const hot = l.temperature === "hot";
    const openers = routines.find((r) => r.engine === "lead-openers" && r.status === "on");
    if (hot) {
      team.push(msg(find.botId, `${l.business} in ${l.location.split(",")[0]}: ${find.trigger.toLowerCase()} at ${formatLocalTime(find.happenedAt ?? at)}. Owner is ${l.owner}. Hot.${openers ? " Can you write the opener?" : ""}`, at, openers ? openers.botId : "manager", { feedItemId: find.id }));
      if (openers) team.push(msg(openers.botId, `On it. Opener for ${l.owner.split(" ")[0]} is ready. Leading with "${find.trigger.toLowerCase()}".`, at + 40e3, find.botId, { feedItemId: find.id }));
      notices.push(notice({ at, botId: find.botId, title: `Hot lead: ${l.business}`, body: `${find.trigger}. ${find.summary}.`, href: `/live?id=${find.id}`, tone: "hot" }));
    } else if (!quietHours) {
      notices.push(notice({ at, botId: find.botId, title: `${l.temperature === "warm" ? "Warm" : "New"} lead: ${l.business}`, body: find.trigger, href: `/live?id=${find.id}`, tone: "info" }));
    }
  } else if (find.kind === "opportunity" && find.opportunity?.client) {
    team.push(msg(find.botId, `${find.title}. ${find.opportunity.nextStep}`, at, "manager", { feedItemId: find.id }));
    if (!quietHours) notices.push(notice({ at, botId: find.botId, title: find.title, body: find.opportunity.value ? `Worth about ${find.opportunity.value}.` : find.summary, href: `/live?id=${find.id}`, tone: "info" }));
  } else if (find.kind === "brief" && find.trigger === "Breaking in your niche") {
    team.push(msg(find.botId, `Heads up: ${find.title.toLowerCase()}. ${find.brief?.whatToDo ?? ""}`, at, "content-creator", { feedItemId: find.id }));
  } else if (find.kind === "digest") {
    notices.push(notice({ at, botId: find.botId, title: find.trigger === "Morning text" ? "Your morning text" : "Your evening recap", body: find.summary, href: `/live?id=${find.id}`, tone: "info" }));
  } else if (find.kind === "reminder") {
    notices.push(notice({ at, botId: find.botId, title: find.title, body: find.summary, href: `/live?id=${find.id}`, tone: "info" }));
  }
  return { team, notices };
}

function isQuiet(ts: number) {
  const h = new Date(ts).getHours();
  return h >= 22 || h < 6;
}

function bump(r: Routine, at: number, found: boolean): Routine {
  return { ...r, lastRunAt: at, stats: { ...r.stats, runs: r.stats.runs + 1, checks: r.stats.checks + 1, finds: r.stats.finds + (found ? 1 : 0) } };
}

/** Run one routine at `at`. */
function runOne(r: Routine, at: number, cur: { feed: FeedItem[]; posts: ScheduledPost[]; pendingApprovals: number }, live: boolean) {
  const seq = r.stats.runs + 1;
  let find: FeedItem | null = null;
  let posts = cur.posts;
  const team: TeamMessage[] = [];
  const notices: Notice[] = [];
  if (r.engine === "keep-drafted") {
    const before = posts.length;
    posts = fillCalendar(posts, at, at, 7, r.id, r.doWithoutAsking);
    const added = posts.length - before;
    if (added > 0) team.push(msg(r.botId, `Drafted ${added} new post${added === 1 ? "" : "s"}. The next 7 days are full.`, at, "manager"));
  } else if (r.engine === "chase-approvals") {
    if (cur.pendingApprovals > 0) {
      team.push(msg(r.botId, `${cur.pendingApprovals} thing${cur.pendingApprovals === 1 ? " is" : "s are"} waiting on a yes. I'll nudge the owner.`, at));
      notices.push(notice({ at, botId: r.botId, title: "Waiting on you", body: `${cur.pendingApprovals} thing${cur.pendingApprovals === 1 ? "" : "s"} need${cur.pendingApprovals === 1 ? "s" : ""} your yes.`, href: "/approvals", tone: "needs-you" }));
    }
  } else {
    const chance = live ? ENGINE_META[r.engine].findChance : 1;
    const roll = rngFor(r.id, seq, "chance")();
    if (roll < chance) {
      const since = r.lastRunAt ?? at - 12 * 3600e3;
      find = runEngine(r, { now: at, seq, feed: cur.feed, posts, pendingApprovals: cur.pendingApprovals, since });
    }
  }
  return { routine: bump(r, at, !!find), find, posts, team, notices };
}

/** Post anything due, at the exact minute it was scheduled. */
function settlePosts(posts: ScheduledPost[], routines: Routine[], to: number) {
  const postRoutine = routines.find((r) => r.engine === "post-schedule");
  const finds: FeedItem[] = [];
  const team: TeamMessage[] = [];
  const notices: Notice[] = [];
  let onTime = 0;
  let missed = 0;
  const next = posts.map((p) => {
    if (p.status === "scheduled" && p.scheduledFor <= to) {
      const posted = { ...p, status: "posted" as const, postedAt: p.scheduledFor };
      finds.push(postFeedItem(posted, postRoutine?.botId ?? "content-creator", postRoutine?.id));
      onTime++;
      return posted;
    }
    if (p.status === "needs-ok" && to >= p.scheduledFor + 30 * 60e3) {
      missed++;
      team.push(msg(postRoutine?.botId ?? "content-creator", `Held the ${formatLocalTime(p.scheduledFor)} post. It needed your OK, so it didn't go out.`, p.scheduledFor + 30 * 60e3, "manager", { postId: p.id }));
      return { ...p, status: "missed" as const };
    }
    if (p.status === "needs-ok" && to >= p.scheduledFor - 2 * 3600e3 && to < p.scheduledFor) {
      const id = `n-ok-${p.id}`;
      notices.push({ id, at: to, botId: postRoutine?.botId ?? "content-creator", title: "A post needs your OK", body: `Goes out at ${formatLocalTime(p.scheduledFor)} if you approve it.`, href: "/calendar", tone: "needs-you", read: false });
    }
    return p;
  });
  const routinesNext = postRoutine && (onTime || missed)
    ? routines.map((r) => (r.id === postRoutine.id ? { ...r, lastRunAt: to, stats: { ...r.stats, runs: r.stats.runs + onTime, onTime: r.stats.onTime + onTime, missed: r.stats.missed + missed, finds: r.stats.finds + onTime } } : r))
    : routines;
  return { posts: next, finds, team, notices, routines: routinesNext };
}

/** Live step: run every routine that is due at `now`. */
export function step(s: SimSlice, now: number, speed: number): SimStep {
  let routines = s.routines;
  let feed = s.feed;
  let posts = s.posts;
  const finds: FeedItem[] = [];
  const team: TeamMessage[] = [];
  const notices: Notice[] = [];
  const quiet: string[] = [];

  for (const r0 of s.routines) {
    if (r0.status !== "on" || s.pausedBots.includes(r0.botId)) continue;
    if (!r0.nextRunAt || now < r0.nextRunAt) continue;
    const res = runOne(r0, now, { feed, posts, pendingApprovals: s.pendingApprovals }, true);
    const r1 = { ...res.routine, nextRunAt: scheduleNext(res.routine, now, speed) };
    routines = routines.map((x) => (x.id === r1.id ? r1 : x));
    posts = res.posts;
    team.push(...res.team);
    notices.push(...res.notices);
    if (res.find) {
      finds.push(res.find);
      feed = [res.find, ...feed];
      const f = followOn(res.find, routines, now, isQuiet(now));
      team.push(...f.team);
      notices.push(...f.notices);
    } else quiet.push(r0.id);
  }

  const settled = settlePosts(posts, routines, now);
  posts = settled.posts;
  routines = settled.routines;
  if (settled.finds.length) {
    finds.push(...settled.finds);
    feed = [...settled.finds.reverse(), ...feed];
  }
  team.push(...settled.team);
  notices.push(...settled.notices);

  return { routines, feed: feed.slice(0, FEED_CAP), posts, finds, team, notices, quiet };
}

export interface BackfillResult extends SimStep {
  /** Quiet checks per routine while nobody was watching. */
  checks: Record<string, { botId: string; n: number }>;
}

/**
 * Fill in what the bots did between `from` and `to`, as if the app had been
 * open the whole time. Used for the overnight history and for "While you were away".
 */
export function backfill(s: SimSlice, from: number, to: number, opts: { maxFinds?: number } = {}): BackfillResult {
  type Ev = { at: number; routineId: string };
  const events: Ev[] = [];
  const checks: BackfillResult["checks"] = {};
  for (const r of s.routines) {
    if (r.status !== "on" || s.pausedBots.includes(r.botId)) continue;
    const meta = ENGINE_META[r.engine];
    // Quiet checks: always-on routines check about every 2 minutes.
    const checkEvery = r.trigger.kind === "every" ? r.trigger.minutes * 60e3 : r.trigger.kind === "always" ? 120e3 : 0;
    if (checkEvery) checks[r.id] = { botId: r.botId, n: Math.floor((to - from) / checkEvery) };
    if (r.trigger.kind === "schedule") {
      for (const at of scheduledBetween(r.trigger, from, to)) events.push({ at, routineId: r.id });
    } else if (meta.nightEveryMin > 0) {
      const rand = prng(hashString(`${r.id}:bf:${from}`));
      let t = from + rand() * meta.nightEveryMin * 60e3;
      while (t < to) {
        events.push({ at: Math.round(t), routineId: r.id });
        t += meta.nightEveryMin * 60e3 * (0.5 + rand());
      }
    }
  }
  events.sort((a, b) => a.at - b.at);
  const cap = opts.maxFinds ?? 60;
  // If there's more than we'd show, keep the latest ones (and every scheduled run).
  const keep = events.length > cap ? events.filter((e, i) => i >= events.length - cap || s.routines.find((r) => r.id === e.routineId)?.trigger.kind === "schedule") : events;

  let routines = s.routines;
  let feed = s.feed;
  let posts = s.posts;
  const finds: FeedItem[] = [];
  const team: TeamMessage[] = [];
  const notices: Notice[] = [];

  // Make sure the calendar covers the window so past slots post on time.
  const cc = routines.find((r) => r.engine === "keep-drafted");
  if (cc) posts = fillCalendar(posts, from, from, Math.ceil((to - from) / 86400e3) + 7, cc.id, cc.doWithoutAsking);

  for (const e of keep) {
    // Settle posts up to this moment, so digests see them.
    const settled = settlePosts(posts, routines, e.at);
    posts = settled.posts;
    routines = settled.routines;
    if (settled.finds.length) {
      finds.push(...settled.finds);
      feed = [...[...settled.finds].reverse(), ...feed];
    }
    team.push(...settled.team);

    const r0 = routines.find((r) => r.id === e.routineId)!;
    const res = runOne(r0, e.at, { feed, posts, pendingApprovals: s.pendingApprovals }, false);
    routines = routines.map((x) => (x.id === r0.id ? res.routine : x));
    posts = res.posts;
    team.push(...res.team);
    if (res.find) {
      finds.push(res.find);
      feed = [res.find, ...feed];
      const f = followOn(res.find, routines, e.at, isQuiet(e.at));
      team.push(...f.team);
      notices.push(...f.notices.filter((n) => n.tone !== "info"));
    }
  }
  const settled = settlePosts(posts, routines, to);
  posts = settled.posts;
  routines = settled.routines;
  if (settled.finds.length) {
    finds.push(...settled.finds);
    feed = [...[...settled.finds].reverse(), ...feed];
  }
  team.push(...settled.team);

  // Credit the quiet checks to each routine's stats.
  routines = routines.map((r) => (checks[r.id] ? { ...r, stats: { ...r.stats, checks: r.stats.checks + checks[r.id].n } } : r));
  feed = [...feed].sort((a, b) => b.at - a.at).slice(0, FEED_CAP);
  return { routines, feed, posts, finds, team: team.sort((a, b) => a.at - b.at), notices, quiet: [], checks };
}
