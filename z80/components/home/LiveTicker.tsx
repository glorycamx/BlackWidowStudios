"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { agentOrFallback } from "@/data/bots";
import { EASE } from "@/lib/motion";

/** Sample of what the agents do on their own. Illustrative, labelled as such. */
const LINES: { agent: string; text: string }[] = [
  { agent: "lead-hunter", text: "found a hot lead in Nashua, NH" },
  { agent: "content-creator", text: "wrote 3 personalized openers" },
  { agent: "manager", text: "scheduled 2 follow-ups for 9:00 AM" },
  { agent: "lead-hunter", text: "noticed a competitor's site went down" },
  { agent: "content-creator", text: "drafted this week's posts" },
  { agent: "manager", text: "flagged a proposal expiring tomorrow" },
];

export function LiveTicker() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((x) => (x + 1) % LINES.length), 2800);
    return () => clearInterval(t);
  }, [reduce]);
  const line = LINES[i];
  const a = agentOrFallback(line.agent);
  return (
    <div className="flex items-center gap-3 text-[14px]" aria-live="off">
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 rounded-full bg-[#5be49b] opacity-60 motion-safe:animate-ping" />
        <span className="relative h-2 w-2 rounded-full bg-[#5be49b]" />
      </span>
      <span className="text-fg-3">Working now</span>
      <span className="relative h-5 min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={i}
            className="absolute inset-0 truncate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <span style={{ color: a.accent.tint }}>{a.name}</span> <span className="text-fg-1">{line.text}</span>
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="shrink-0 text-[12px] text-fg-4">Sample</span>
    </div>
  );
}
