"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STAGES = ["Decomposing objective", "Matching capabilities", "Assembling team", "Establishing workflow"];

interface Props {
  objective: string;
  /** The plan has arrived; the sequence may finish. */
  ready: boolean;
  onDone(): void;
  className?: string;
}

/** Contextual analysis state — no spinners. */
export function AnalysisSequence({ objective, ready, onDone, className }: Props) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);
  const per = reduce ? 220 : 620;

  useEffect(() => {
    if (stage < STAGES.length - 1) {
      const t = setTimeout(() => setStage((s) => s + 1), per);
      return () => clearTimeout(t);
    }
    if (stage === STAGES.length - 1 && ready) {
      const t = setTimeout(() => {
        setStage(STAGES.length);
        onDone();
      }, per);
      return () => clearTimeout(t);
    }
  }, [stage, ready, per, onDone]);

  return (
    <div className={cn("panel-solid overflow-hidden p-5 md:p-6", className)} role="status" aria-live="polite">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
        <motion.div
          className="h-px w-1/3 bg-gradient-to-r from-transparent via-[#9aa5ff] to-transparent"
          animate={{ x: ["-100%", "300%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="label flex items-center gap-2 text-fg-2">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo motion-safe:animate-breathe" />
        Z80 is analyzing the objective
      </div>
      <p className="mt-4 line-clamp-3 text-[16px] leading-relaxed text-fg-1 md:text-[18px]">“{objective}”</p>
      <ol className="mt-6 grid gap-2.5">
        {STAGES.map((label, i) => {
          const done = i < stage;
          const current = i === stage;
          return (
            <motion.li
              key={label}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: i <= stage ? 1 : 0.28, x: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.04 }}
            >
              <span className="relative flex h-3 w-3 items-center justify-center">
                <span className={cn("h-1.5 w-1.5 rounded-full transition-colors duration-300", done ? "bg-white" : current ? "bg-indigo" : "bg-white/20")} />
                {current && <span className="absolute inset-0 rounded-full border border-indigo/70 motion-safe:animate-ping-once" />}
              </span>
              <span className={cn("text-[12px]", done ? "text-fg-2" : current ? "text-white" : "text-fg-3")}>{label}</span>
              {current && (
                <span className="relative ml-auto h-px w-24 overflow-hidden bg-white/10">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue to-violet"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: per / 1000, ease: "linear" }}
                  />
                </span>
              )}
              {done && <span className="ml-auto text-[12px] tabular-nums text-fg-3">done</span>}
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
