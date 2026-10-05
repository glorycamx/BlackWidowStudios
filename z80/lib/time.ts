/**
 * Every time the user sees goes through here: local time, 12-hour, AM/PM.
 */

function hm(d: Date) {
  let h = d.getHours() % 12;
  if (h === 0) h = 12;
  return { h, m: String(d.getMinutes()).padStart(2, "0"), s: String(d.getSeconds()).padStart(2, "0"), ap: d.getHours() < 12 ? "AM" : "PM" };
}

/** "8:14 PM", or "8:14:22 PM" with seconds. */
export function formatLocalTime(ts: number, opts: { seconds?: boolean } = {}): string {
  const { h, m, s, ap } = hm(new Date(ts));
  return opts.seconds ? `${h}:${m}:${s} ${ap}` : `${h}:${m} ${ap}`;
}

/** "Today 8:14 PM", "Yesterday 11:02 PM", "Mon 9:00 AM". */
export function formatDayTime(ts: number, now: number): string {
  const d = new Date(ts);
  const n = new Date(now);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(d) - day(n)) / 86400e3);
  const t = formatLocalTime(ts);
  if (diff === 0) return `Today ${t}`;
  if (diff === -1) return `Yesterday ${t}`;
  if (diff === 1) return `Tomorrow ${t}`;
  return `${d.toLocaleDateString("en-US", { weekday: "short" })} ${t}`;
}

/** "just now", "42s ago", "6m ago", "3h ago". */
export function formatAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** "in 42s", "in 6m", "in 2h 10m", "now". */
export function formatCountdown(ts: number, now: number): string {
  const s = Math.round((ts - now) / 1000);
  if (s <= 0) return "now";
  if (s < 60) return `in ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return rm ? `in ${h}h ${rm}m` : `in ${h}h`;
  return `in ${Math.floor(h / 24)}d`;
}

/** "07:00" → "7:00 AM". */
export function formatClockString(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h || 0, m || 0);
  return formatLocalTime(d.getTime());
}

/** Night copy runs from 10 PM to 6 AM local. */
export function isNight(ts: number): boolean {
  const h = new Date(ts).getHours();
  return h >= 22 || h < 6;
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Parse "03:00", "3am", "3:30 pm" into minutes after midnight. */
export function parseClock(text: string): number | null {
  const m = text.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  if (m[3] === "pm" && h < 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}
