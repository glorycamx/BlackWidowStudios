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
      className={cn("inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[12px] capitalize", className)}
      style={{ color: c, background: `${c}14`, boxShadow: `inset 0 0 0 1px ${c}40` }}
    >
      <span className={cn("h-1 w-1 rounded-full", temp === "hot" && "motion-safe:animate-breathe")} style={{ background: c }} />
      {temp}
    </span>
  );
}

const KIND_LABEL: Record<Signal["kind"], string> = {
  lead: "Lead",
  brief: "Brief",
  reminder: "Reminder",
  post: "Posted",
  opportunity: "Money",
  digest: "Update",
  handoff: "Team",
  approval: "Needs you",
};

export function KindChip({ signal }: { signal: Signal }) {
  if (signal.lead) return <TempChip temp={signal.lead.temperature} />;
  const label = KIND_LABEL[signal.kind];
  return <span className="inline-flex h-5 items-center rounded-full px-2 text-[12px] text-fg-2 bg-white/[0.06]">{label}</span>;
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
      className={cn("inline-flex h-7 items-center gap-1.5 rounded-[8px] px-2.5 text-[12px] text-fg-2 transition-colors hairline hover:text-white", className)}
    >
      {done ? <Check size={12} /> : <Copy size={12} />}
      {done ? "Copied" : label}
    </button>
  );
}
