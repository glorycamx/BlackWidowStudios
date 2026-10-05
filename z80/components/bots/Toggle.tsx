"use client";

import { cn } from "@/lib/utils";

/** Very light accents (Manager) would hide the "on" state, so they fall back to brand blue. */
function onColor(c: string) {
  const n = parseInt(c.replace("#", "").slice(0, 6), 16);
  if (Number.isNaN(n)) return c;
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum > 0.8 ? "#7a7fff" : c;
}

/** On/off switch. */
export function Toggle({ on, onChange, label, color = "#8f9cff", size = "md" }: { on: boolean; onChange(v: boolean): void; label: string; color?: string; size?: "sm" | "md" }) {
  const w = size === "sm" ? 30 : 38;
  const h = size === "sm" ? 18 : 22;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn("relative shrink-0 rounded-full transition-colors duration-200", on ? "" : "bg-white/[0.1]")}
      style={{ width: w, height: h, background: on ? onColor(color) : undefined }}
    >
      <span
        className="absolute top-[2px] rounded-full bg-[#fff] shadow transition-transform duration-200 ease-[var(--ease-z)]"
        style={{ width: h - 4, height: h - 4, left: 2, transform: on ? `translateX(${w - h}px)` : "none" }}
      />
    </button>
  );
}
