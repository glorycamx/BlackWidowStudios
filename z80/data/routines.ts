import type { BotId, Routine, RoutineEngine, Trigger } from "@/types";

/**
 * The routines every workspace starts with. A routine is a job a bot keeps
 * doing: always on, every few minutes, or on a schedule. Each one is powered
 * by a simulated engine (lib/sim/generators.ts) that a real backend replaces.
 */
export interface RoutineTemplate {
  key: string;
  botId: BotId;
  title: string;
  trigger: Trigger;
  engine: RoutineEngine;
  doWithoutAsking?: boolean;
}

export const routineTemplates: RoutineTemplate[] = [
  // Manager
  { key: "morning-text", botId: "manager", title: "Send your morning text", trigger: { kind: "schedule", days: [0, 1, 2, 3, 4, 5, 6], times: ["06:00"] }, engine: "morning-text", doWithoutAsking: true },
  { key: "evening-recap", botId: "manager", title: "Send your evening recap", trigger: { kind: "schedule", days: [0, 1, 2, 3, 4, 5, 6], times: ["18:00"] }, engine: "evening-recap", doWithoutAsking: true },
  { key: "follow-ups", botId: "manager", title: "Remind you about follow-ups", trigger: { kind: "always" }, engine: "follow-ups" },
  { key: "chase-approvals", botId: "manager", title: "Chase anything waiting on you", trigger: { kind: "every", minutes: 120 }, engine: "chase-approvals" },
  // Lead Hunter
  { key: "website-down", botId: "lead-hunter", title: "Catch websites that go down", trigger: { kind: "always" }, engine: "website-down" },
  { key: "changed-hands", botId: "lead-hunter", title: "Spot businesses that change hands", trigger: { kind: "always" }, engine: "changed-hands" },
  { key: "new-business", botId: "lead-hunter", title: "Find new businesses the day they open", trigger: { kind: "always" }, engine: "new-business" },
  { key: "review-spike", botId: "lead-hunter", title: "Watch for review spikes", trigger: { kind: "always" }, engine: "review-spike" },
  { key: "domain-expiring", botId: "lead-hunter", title: "Flag domains about to expire", trigger: { kind: "every", minutes: 60 }, engine: "domain-expiring" },
  { key: "hiring", botId: "lead-hunter", title: "Notice who is hiring for busywork", trigger: { kind: "always" }, engine: "hiring" },
  // Content Creator
  { key: "post-schedule", botId: "content-creator", title: "Post on schedule, on the minute", trigger: { kind: "event", event: "At each scheduled time" }, engine: "post-schedule" },
  { key: "keep-drafted", botId: "content-creator", title: "Keep the next 7 days drafted", trigger: { kind: "schedule", days: [0, 1, 2, 3, 4, 5, 6], times: ["21:00"] }, engine: "keep-drafted" },
  { key: "lead-openers", botId: "content-creator", title: "Write an opener for every hot lead", trigger: { kind: "event", event: "When Lead Hunter finds a hot lead" }, engine: "lead-openers" },
  // Researcher
  { key: "upsells", botId: "researcher", title: "Find upsells for your clients", trigger: { kind: "always" }, engine: "upsells" },
  { key: "competitors", botId: "researcher", title: "Watch competitor prices and offers", trigger: { kind: "always" }, engine: "competitors" },
  { key: "trends", botId: "researcher", title: "Spot what people start searching for", trigger: { kind: "schedule", days: [1, 2, 3, 4, 5], times: ["08:00"] }, engine: "trends" },
  // Reporter
  { key: "morning-brief", botId: "reporter", title: "Write your morning brief", trigger: { kind: "schedule", days: [0, 1, 2, 3, 4, 5, 6], times: ["06:30"] }, engine: "morning-brief" },
  { key: "niche-breaking", botId: "reporter", title: "Flag breaking news in your niche", trigger: { kind: "always" }, engine: "niche-breaking" },
  { key: "ai-news", botId: "reporter", title: "Check AI news", trigger: { kind: "every", minutes: 5 }, engine: "ai-news" },
];

/**
 * How each engine behaves in the demo.
 * - `demoEverySec`: average seconds between runs for always-on routines while you watch.
 * - `nightEveryMin`: average minutes between finds when backfilling history.
 * - `findChance`: share of runs that turn up something worth showing (the rest are quiet checks).
 */
export const ENGINE_META: Record<RoutineEngine, { demoEverySec: number; nightEveryMin: number; findChance: number }> = {
  "website-down": { demoEverySec: 150, nightEveryMin: 170, findChance: 1 },
  "changed-hands": { demoEverySec: 210, nightEveryMin: 260, findChance: 1 },
  "new-business": { demoEverySec: 180, nightEveryMin: 210, findChance: 1 },
  "review-spike": { demoEverySec: 230, nightEveryMin: 280, findChance: 1 },
  "domain-expiring": { demoEverySec: 260, nightEveryMin: 300, findChance: 1 },
  hiring: { demoEverySec: 200, nightEveryMin: 240, findChance: 1 },
  "post-schedule": { demoEverySec: 0, nightEveryMin: 0, findChance: 1 },
  "keep-drafted": { demoEverySec: 0, nightEveryMin: 0, findChance: 1 },
  "lead-openers": { demoEverySec: 0, nightEveryMin: 0, findChance: 1 },
  upsells: { demoEverySec: 170, nightEveryMin: 260, findChance: 1 },
  competitors: { demoEverySec: 240, nightEveryMin: 320, findChance: 1 },
  trends: { demoEverySec: 0, nightEveryMin: 0, findChance: 1 },
  "morning-brief": { demoEverySec: 0, nightEveryMin: 0, findChance: 1 },
  "niche-breaking": { demoEverySec: 200, nightEveryMin: 240, findChance: 1 },
  "ai-news": { demoEverySec: 0, nightEveryMin: 110, findChance: 0.3 },
  "morning-text": { demoEverySec: 0, nightEveryMin: 0, findChance: 1 },
  "evening-recap": { demoEverySec: 0, nightEveryMin: 0, findChance: 1 },
  "follow-ups": { demoEverySec: 260, nightEveryMin: 360, findChance: 1 },
  "chase-approvals": { demoEverySec: 0, nightEveryMin: 0, findChance: 1 },
  custom: { demoEverySec: 160, nightEveryMin: 200, findChance: 0.6 },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function clock12(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** Plain-English trigger chip: "Always on", "Every 5 min", "Daily 6:00 AM". */
export function describeTrigger(t: Trigger): string {
  switch (t.kind) {
    case "always":
      return "Always on";
    case "every":
      return t.minutes < 60 ? `Every ${t.minutes} min` : t.minutes % 60 === 0 ? `Every ${t.minutes / 60 === 1 ? "hour" : `${t.minutes / 60} hours`}` : `Every ${t.minutes} min`;
    case "schedule": {
      const times = t.times.map(clock12).join(", ");
      if (t.days.length === 7) return `Daily ${times}`;
      if (t.days.join() === "1,2,3,4,5") return `Weekdays ${times}`;
      return `${t.days.map((d) => DAY_NAMES[d]).join(", ")} ${times}`;
    }
    case "event":
      return t.event;
  }
}

/** Next time a schedule trigger fires after `from` (local time). */
export function nextScheduled(t: Extract<Trigger, { kind: "schedule" }>, from: number): number {
  const base = new Date(from);
  for (let d = 0; d < 8; d++) {
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d);
    if (!t.days.includes(day.getDay())) continue;
    const times = [...t.times].sort();
    for (const tm of times) {
      const [h, m] = tm.split(":").map(Number);
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m).getTime();
      if (at > from) return at;
    }
  }
  return from + 86400e3;
}

/** Schedule times that fell between `from` (exclusive) and `to` (inclusive). */
export function scheduledBetween(t: Extract<Trigger, { kind: "schedule" }>, from: number, to: number): number[] {
  const out: number[] = [];
  let at = nextScheduled(t, from);
  while (at <= to && out.length < 50) {
    out.push(at);
    at = nextScheduled(t, at);
  }
  return out;
}

export function emptyStats(): Routine["stats"] {
  return { runs: 0, checks: 0, finds: 0, onTime: 0, missed: 0 };
}

export function routineFromTemplate(t: RoutineTemplate, now: number): Routine {
  return {
    id: `r-${t.key}`,
    botId: t.botId,
    title: t.title,
    trigger: t.trigger,
    engine: t.engine,
    status: "on",
    doWithoutAsking: t.doWithoutAsking ?? false,
    createdAt: now,
    nextRunAt: 0,
    stats: emptyStats(),
  };
}

/** Old v3 bot ids, mapped on migration. */
export const LEGACY_BOT_IDS: Record<string, string> = {
  helm: "manager",
  lookout: "lead-hunter",
  beacon: "content-creator",
};
