"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { agentOrFallback } from "@/data/bots";
import { EASE } from "@/lib/motion";

/** Sample of what the bots do on their own. Illustrative, labelled as such. */
const LINES: { agent: string; text: string }[] = [
  { agent: "lead-hunter", text: "caught a website going down in Nashua" },
  { agent: "content-creator", text: "posted to Instagram at 7:58 PM, on the minute" },
  { agent: "researcher", text: "found an upsell for a client" },
  { agent: "reporter", text: "read 19 AI stories, saved one for you" },
  { agent: "manager", text: "lined up your morning text" },
  { agent: "lead-hunter", text: "spotted a business that just changed hands" },
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
