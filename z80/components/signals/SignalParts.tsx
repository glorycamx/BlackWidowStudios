"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadTemperature, Signal } from "@/types";

export const TEMP_COLOR: Record<LeadTemperature, string> = {
  hot: "#ff6f91",
  warm: "#d77bff",
  cool: "#8ea3c8",
};

export function TempChip({ temp, className }: { temp: LeadTemperature; className?: string }) {
  const c = TEMP_COLOR[temp];
  return (
    <span
      className={cn("inline-flex h-5 items-center gap-1.5 rounded-[6px] px-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em]", className)}
      style={{ color: c, background: `${c}14`, boxShadow: `inset 0 0 0 1px ${c}40` }}
    >
      <span className={cn("h-1 w-1 rounded-full", temp === "hot" && "motion-safe:animate-breathe")} style={{ background: c }} />
      {temp}
    </span>
  );
}

export function KindChip({ signal }: { signal: Signal }) {
  if (signal.lead) return <TempChip temp={signal.lead.temperature} />;
  const label = signal.kind === "news" ? "Briefing" : "Reminder";
  return <span className="inline-flex h-5 items-center rounded-[6px] px-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-fg-2 hairline">{label}</span>;
}

/** Copy to clipboard with a quiet confirmation; falls back to selecting nothing. */
export function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className={cn("inline-flex h-7 items-center gap-1.5 rounded-[8px] px-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-2 transition-colors hairline hover:text-white", className)}
    >
      {done ? <Check size={12} /> : <Copy size={12} />}
      {done ? "Copied" : label}
    </button>
  );
}
