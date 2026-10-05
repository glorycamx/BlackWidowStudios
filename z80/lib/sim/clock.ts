/**
 * The simulation clock. Real wall-clock time by default, with two demo
 * controls: time travel (`?at=03:00` or Settings) shifts "now" to a chosen
 * local time today, and speed (1x, 2x, 4x) compresses how often things happen.
 * No React here, so a real backend can drop it.
 */
import { parseClock, startOfDay } from "@/lib/time";

let offset = 0;
let travelLabel: string | null = null;

/** Current simulated time in ms. */
export function now(): number {
  return Date.now() + offset;
}

/** Travel to a local time today ("03:00", "3am"). Returns false if it can't parse. */
export function travelTo(text: string): boolean {
  const mins = parseClock(text);
  if (mins === null) return false;
  const target = startOfDay(Date.now()) + mins * 60e3;
  offset = target - Date.now();
  travelLabel = text;
  return true;
}

export function clearTravel() {
  offset = 0;
  travelLabel = null;
}

/** Non-null while time traveling; persistence is off in that mode. */
export function traveling(): string | null {
  return travelLabel;
}

/** Read `?at=` from the URL once on boot. */
export function travelFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const at = new URLSearchParams(window.location.search).get("at");
    if (at && travelTo(at)) return at;
  } catch {
    /* ignore */
  }
  return null;
}

/** The tab is hidden: the sim pauses and backfills on return. */
export function tabHidden(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}
