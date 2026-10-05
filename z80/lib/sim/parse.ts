/**
 * Plain English in, routine or bot out. A keyword parser so the demo works
 * offline; a real model can replace it behind the same functions.
 */
import type { BotId, RoutineEngine, Trigger } from "@/types";

const ROUTINE_WORDS = /\b(every|always|whenever|keep|keeps|each (morning|day|night|evening|week|hour)|daily|weekly|nightly|hourly|monitor|watch for|24\/7|around the clock|any ?time|on schedule|remind me|text me)\b/i;

/** Ongoing request (a routine) or one-off (a job)? */
export function isRoutineRequest(text: string): boolean {
  return ROUTINE_WORDS.test(text);
}

const BOT_HINTS: [RegExp, BotId][] = [
  [/\b(post|posts|posting|content|caption|instagram|linkedin|facebook|social|calendar|draft)\b/i, "content-creator"],
  [/\b(competitor|competitors|upsell|upsells|price|prices|pricing|trend|trends|market|searching for)\b/i, "researcher"],
  [/\b(news|brief|headline|headlines|ai news|stories|breaking)\b/i, "reporter"],
  [/\b(remind|reminder|follow ?up|follow-ups|recap|text me|update me|approval|approvals|waiting on me)\b/i, "manager"],
  [/\b(lead|leads|prospect|prospects|business|businesses|owner|owners|website|websites|site|sites|domain|domains|reviews|hiring|new owner)\b/i, "lead-hunter"],
];

const ENGINE_HINTS: [RegExp, RoutineEngine][] = [
  [/\b(goes|go|went) down|offline|outage\b/i, "website-down"],
  [/changed? hands|new owner|sold\b/i, "changed-hands"],
  [/new business|just opened|registered\b/i, "new-business"],
  [/review(s)? (spike|surge|jump)|lots of reviews\b/i, "review-spike"],
  [/domain/i, "domain-expiring"],
  [/hiring|job post/i, "hiring"],
  [/upsell/i, "upsells"],
  [/competitor/i, "competitors"],
  [/trend|searching for/i, "trends"],
  [/ai news/i, "ai-news"],
  [/breaking|in my niche|industry news/i, "niche-breaking"],
  [/follow ?up/i, "follow-ups"],
];

const DAY_WORDS: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

function clockFrom(text: string): string | null {
  const m = text.match(/\bat (\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (!ap && h < 7) h += 12;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function parseTrigger(text: string): Trigger {
  const t = text.toLowerCase();
  const every = t.match(/every (\d+)\s*(min|mins|minute|minutes|hour|hours|hr|hrs)\b/);
  if (every) {
    const n = Number(every[1]);
    return { kind: "every", minutes: Math.max(1, /h/.test(every[2]) ? n * 60 : n) };
  }
  if (/\b(every|each) hour|hourly\b/.test(t)) return { kind: "every", minutes: 60 };
  const at = clockFrom(t);
  const days = Object.entries(DAY_WORDS).filter(([d]) => t.includes(d)).map(([, n]) => n);
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  if (/weekday/.test(t)) return { kind: "schedule", days: [1, 2, 3, 4, 5], times: [at ?? "08:00"] };
  if (days.length) return { kind: "schedule", days, times: [at ?? "08:00"] };
  if (/\b(morning|daily|every day|each day)\b/.test(t)) return { kind: "schedule", days: allDays, times: [at ?? "07:00"] };
  if (/\b(evening|tonight|night|nightly)\b/.test(t)) return { kind: "schedule", days: allDays, times: [at ?? "20:00"] };
  if (at) return { kind: "schedule", days: allDays, times: [at] };
  if (/\bweekly|every week\b/.test(t)) return { kind: "schedule", days: [1], times: ["08:00"] };
  return { kind: "always" };
}

function sentence(text: string): string {
  let t = text.trim().replace(/[.!?]+$/, "");
  t = t.replace(/^(hey |ok |okay )?(can you |could you |please |i want you to |i need you to |i'd like you to |go )+/i, "");
  t = t.replace(/^keep an eye on\b/i, "Watch").replace(/^always\s+/i, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export interface ParsedRoutine {
  botId: BotId;
  title: string;
  trigger: Trigger;
  engine: RoutineEngine;
}

/** "Text me every morning at 7 with new leads" → Manager, daily 7:00 AM. */
export function parseRoutine(text: string, opts: { botId?: BotId } = {}): ParsedRoutine {
  const botId = opts.botId ?? BOT_HINTS.find(([re]) => re.test(text))?.[1] ?? "manager";
  const hinted = ENGINE_HINTS.find(([re]) => re.test(text))?.[1];
  // Only use a built-in engine if it belongs to the bot doing the work.
  const owner: Partial<Record<RoutineEngine, BotId>> = {
    "website-down": "lead-hunter", "changed-hands": "lead-hunter", "new-business": "lead-hunter", "review-spike": "lead-hunter", "domain-expiring": "lead-hunter", hiring: "lead-hunter",
    upsells: "researcher", competitors: "researcher", trends: "researcher", "ai-news": "reporter", "niche-breaking": "reporter", "follow-ups": "manager",
  };
  const engine = hinted && owner[hinted] === botId ? hinted : "custom";
  return { botId, title: sentence(text), trigger: parseTrigger(text), engine };
}

const ROLE_FOR_VERB: [RegExp, string][] = [
  [/^(watch|watches|monitor|monitors|keep an eye)/i, "Watcher"],
  [/^(find|finds|hunt|hunts|look|looks|search|searches|spot|spots)/i, "Finder"],
  [/^(track|tracks)/i, "Tracker"],
  [/^(write|writes|draft|drafts)/i, "Writer"],
  [/^(check|checks|scan|scans)/i, "Checker"],
  [/^(answer|answers|reply|replies|respond|responds)/i, "Responder"],
  [/^(remind|reminds|chase|chases)/i, "Reminder"],
  [/^(book|books|schedule|schedules)/i, "Booker"],
];

const STOP = new Set(["the", "a", "an", "for", "and", "of", "to", "my", "our", "your", "new", "any", "every", "all", "that", "who", "when", "with", "about", "people", "local", "on", "in", "at", "me", "us"]);

export interface ParsedBot {
  name: string;
  job: string;
  keepDoing: string;
  trigger: Trigger;
}

/** "Create a bot that watches Reddit for people asking for a web designer" → "Reddit Watcher". */
export function parseBotSpec(text: string): ParsedBot {
  const what = text
    .trim()
    .replace(/[.!?]+$/, "")
    .replace(/^(please )?(create|make|build|add|set up|i want|i need)( me)? (a |an |my own )?(new )?bot( that| to| which| who)?\s*/i, "");
  const firstWord = what.split(/\s+/)[0] ?? "";
  const role = ROLE_FOR_VERB.find(([re]) => re.test(firstWord))?.[1] ?? "Helper";
  const rest = what.split(/\s+/).slice(1);
  const proper = rest.find((w) => /^[A-Z][A-Za-z0-9]+$/.test(w));
  const noun = proper ?? rest.find((w) => w.length > 3 && !STOP.has(w.toLowerCase()));
  const subject = noun ? noun.replace(/[^A-Za-z0-9]/g, "") : "";
  const name = `${subject ? subject.charAt(0).toUpperCase() + subject.slice(1) + " " : ""}${role}`.slice(0, 24);
  const job = what ? what.charAt(0).toUpperCase() + what.slice(1) : "Works on whatever you give it";
  return { name, job, keepDoing: job, trigger: parseTrigger(text) };
}
