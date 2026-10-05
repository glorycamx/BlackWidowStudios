"use client";

/**
 * Heartbeats: quiet proof of work. Every few seconds each bot on shift
 * checks something and says what it checked, even when nothing turns up.
 * They live in their own small store so the feed never re-renders for them,
 * and they never show up in the feed itself.
 */
import { useRef, useSyncExternalStore } from "react";
import { businessName, TOWNS, WEB_INDUSTRIES } from "@/lib/services/signalService";
import { hashString, pick, prng, uid } from "@/lib/utils";
import type { Heartbeat, Routine, RoutineEngine } from "@/types";

const CAP = 200;
const COUNTS_KEY = "z80.beats.v1";

interface BeatState {
  /** Newest first. */
  beats: Heartbeat[];
  /** Latest beat per bot. */
  latest: Record<string, Heartbeat>;
  /** Checks run today, per routine and per bot. */
  checks: Record<string, number>;
  botChecks: Record<string, number>;
  day: string;
}

let state: BeatState = { beats: [], latest: {}, checks: {}, botChecks: {}, day: "" };
const listeners = new Set<() => void>();
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function today(now: number) {
  const d = new Date(now);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function emit() {
  listeners.forEach((l) => l());
}

function persist(enabled: boolean) {
  if (!enabled || persistTimer || typeof window === "undefined") return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      localStorage.setItem(COUNTS_KEY, JSON.stringify({ checks: state.checks, botChecks: state.botChecks, day: state.day }));
    } catch {
      /* ignore */
    }
  }, 2000);
}

export function loadBeatCounts(now: number) {
  try {
    const raw = localStorage.getItem(COUNTS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Pick<BeatState, "checks" | "botChecks" | "day">;
    if (saved.day === today(now)) state = { ...state, checks: saved.checks ?? {}, botChecks: saved.botChecks ?? {}, day: saved.day };
  } catch {
    /* ignore */
  }
}

/** Add checks that happened while nobody was watching (backfill), without lines. */
export function addQuietChecks(counts: Record<string, { botId: string; n: number }>, now: number, save = true) {
  const day = today(now);
  const fresh = state.day !== day;
  const checks = fresh ? {} : { ...state.checks };
  const botChecks = fresh ? {} : { ...state.botChecks };
  for (const [rid, { botId, n }] of Object.entries(counts)) {
    checks[rid] = (checks[rid] ?? 0) + n;
    botChecks[botId] = (botChecks[botId] ?? 0) + n;
  }
  state = { ...state, checks, botChecks, day };
  emit();
  persist(save);
}

export function pushBeat(b: Heartbeat, save = true) {
  const day = today(b.at);
  const fresh = state.day !== day;
  const checks = fresh ? {} : state.checks;
  const botChecks = fresh ? {} : state.botChecks;
  state = {
    beats: [b, ...state.beats].slice(0, CAP),
    latest: { ...state.latest, [b.botId]: b },
    checks: { ...checks, [b.routineId]: (checks[b.routineId] ?? 0) + 1 },
    botChecks: { ...botChecks, [b.botId]: (botChecks[b.botId] ?? 0) + 1 },
    day,
  };
  emit();
  persist(save);
}

export function resetBeats() {
  state = { beats: [], latest: {}, checks: {}, botChecks: {}, day: "" };
  try {
    localStorage.removeItem(COUNTS_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function getBeats() {
  return state;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Read a slice of the heartbeat store. Returns the same value until it changes. */
export function useBeats<T>(selector: (s: BeatState) => T): T {
  const cache = useRef<{ src: BeatState; v: T } | null>(null);
  const get = () => {
    if (cache.current && cache.current.src === state) return cache.current.v;
    const v = selector(state);
    if (cache.current && Object.is(cache.current.v, v)) {
      cache.current = { src: state, v: cache.current.v };
      return cache.current.v;
    }
    cache.current = { src: state, v };
    return v;
  };
  return useSyncExternalStore(subscribe, get, get);
}

/* ------------------------------------------------------------------ */
/* Lines                                                                */
/* ------------------------------------------------------------------ */

type Line = (r: () => number) => { text: string; url: string };

const biz = (r: () => number) => businessName(r, pick(r, WEB_INDUSTRIES));
const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
const n = (r: () => number, lo: number, hi: number) => Math.round(lo + r() * (hi - lo));
const town = (r: () => number) => pick(r, TOWNS).split(",")[0];

const LINES: Partial<Record<RoutineEngine, Line[]>> = {
  "website-down": [
    (r) => { const b = biz(r); return { text: `Checked ${slug(b)}.example. Loads in ${(0.8 + r() * 2).toFixed(1)}s.`, url: `${slug(b)}.example` }; },
    (r) => ({ text: `Pinged ${n(r, 30, 90)} local business sites. All up.`, url: "uptime.example/batch" }),
    (r) => { const b = biz(r); return { text: `${b} answered on the second try. Watching it.`, url: `${slug(b)}.example` }; },
  ],
  "changed-hands": [
    (r) => ({ text: `Read ${n(r, 3, 14)} new business filings in ${town(r)}. No owner changes.`, url: "filings.example/state" }),
    (r) => { const b = biz(r); return { text: `Compared owner names for ${b}. Same as last week.`, url: "filings.example/search" }; },
  ],
  "new-business": [
    (r) => ({ text: `Scanned today's new registrations. ${n(r, 0, 4)} new, all have websites.`, url: "registry.example/new" }),
    (r) => ({ text: `Checked new Google listings near ${town(r)}.`, url: "maps.example/new" }),
  ],
  "review-spike": [
    (r) => { const b = biz(r); return { text: `${b}: ${n(r, 0, 3)} new reviews today. Normal.`, url: `reviews.example/${slug(b)}` }; },
    (r) => ({ text: `Counted reviews for ${n(r, 40, 120)} businesses. No spikes.`, url: "reviews.example" }),
  ],
  "domain-expiring": [
    (r) => ({ text: `Looked up ${n(r, 50, 200)} domains. None expire this month.`, url: "whois.example" }),
    (r) => { const b = biz(r); return { text: `${slug(b)}.example renews in ${n(r, 60, 300)} days. Fine.`, url: `whois.example/${slug(b)}` }; },
  ],
  hiring: [
    (r) => ({ text: `Read ${n(r, 10, 60)} new job posts near ${town(r)}.`, url: "jobs.example/local" }),
    (r) => { const b = biz(r); return { text: `${b} posted a driver role. Not a fit.`, url: "jobs.example/post" }; },
  ],
  "post-schedule": [
    () => ({ text: "Next post is queued and ready to go.", url: "calendar.z80.si" }),
    (r) => ({ text: `Checked the caption length for ${pick(r, ["Instagram", "LinkedIn", "Facebook"])}. Good.`, url: "calendar.z80.si" }),
  ],
  "keep-drafted": [
    () => ({ text: "Calendar is full for the next 7 days.", url: "calendar.z80.si" }),
    (r) => ({ text: `Reread ${n(r, 3, 9)} past posts to stay in your voice.`, url: "drive.example/brand" }),
  ],
  "lead-openers": [
    () => ({ text: "Opener drafts up to date for every hot lead.", url: "outreach.z80.si" }),
  ],
  upsells: [
    (r) => { const b = businessName(r, pick(r, ["Dental", "Bakery", "Roofing"])); return { text: `Reviewed ${b}'s site and reviews. Nothing new to offer yet.`, url: `${slug(b)}.example` }; },
    (r) => ({ text: `Checked ${n(r, 4, 12)} client sites for gaps.`, url: "clients.z80.si" }),
  ],
  competitors: [
    (r) => ({ text: `Checked ${n(r, 3, 8)} competitor pricing pages. No changes.`, url: "competitor.example/pricing" }),
    () => ({ text: "Saved a copy of a competitor's offers page.", url: "competitor.example/offers" }),
  ],
  trends: [
    (r) => ({ text: `Compared this week's searches for ${n(r, 20, 60)} services.`, url: "trends.example" }),
  ],
  "morning-brief": [
    (r) => ({ text: `Read ${n(r, 20, 80)} stories for tomorrow's brief.`, url: "news.example" }),
  ],
  "niche-breaking": [
    (r) => ({ text: `Read ${n(r, 6, 30)} stories in your niche. Nothing urgent.`, url: "news.example/local-business" }),
    () => ({ text: "Checked search and maps update logs. Quiet.", url: "news.example/search" }),
  ],
  "ai-news": [
    (r) => ({ text: `Read ${n(r, 5, 25)} AI stories. ${pick(r, ["None worth your time.", "Saved one for later.", "Mostly launches. Skipped."])}`, url: "news.example/ai" }),
  ],
  "morning-text": [
    () => ({ text: "Collecting what happened for your next update.", url: "z80.si/live" }),
  ],
  "evening-recap": [
    () => ({ text: "Tallying today's finds for tonight's recap.", url: "z80.si/live" }),
  ],
  "follow-ups": [
    (r) => ({ text: `Checked ${n(r, 3, 12)} open leads for replies.`, url: "inbox.example" }),
    () => ({ text: "No follow-ups due in the next hour.", url: "z80.si/live" }),
  ],
  "chase-approvals": [
    () => ({ text: "Checked what's waiting on you.", url: "z80.si/approvals" }),
  ],
  custom: [
    (r) => ({ text: `Checked ${n(r, 5, 40)} sources. Nothing new yet.`, url: "web.example/search" }),
    (r) => ({ text: `Looked through ${n(r, 2, 9)} new pages near ${town(r)}.`, url: "web.example" }),
  ],
};

/** One quiet check for a routine. Deterministic per (routine, n). */
export function makeBeat(routine: Routine, count: number, at: number): Heartbeat {
  const r = prng(hashString(`${routine.id}:beat:${count}`));
  const pool = LINES[routine.engine] ?? LINES.custom!;
  const line = pick(r, pool)(r);
  return { id: uid("hb"), botId: routine.botId, routineId: routine.id, at, text: line.text, url: line.url };
}

