import type { AgentAccent } from "@/types";

/** Darken a hex color for use as text on a light background. */
function forLight(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const k = lum > 0.7 ? 0.42 : lum > 0.5 ? 0.62 : 0.78;
  const h = (v: number) => Math.round(v * k).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * A bot's accent as readable text in either theme: the soft tint on dark,
 * a deeper version of its color on light. Switches through `--tint-a`.
 */
export function tint(accent: Pick<AgentAccent, "hex" | "tint">): string {
  return `color-mix(in oklab, ${accent.tint} var(--tint-a, 100%), ${forLight(accent.hex)})`;
}
