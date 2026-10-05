"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Intro, Reveal, Section } from "@/components/home/Section";
import { Button } from "@/components/ui/Button";
import { agentOrFallback } from "@/data/bots";
import { useCases } from "@/data/useCases";
import { homeFlow } from "@/lib/scene/homeFlow";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Pick an objective, watch the workflow assemble. */
export function UseCasesSection() {
  const [id, setId] = useState(useCases[0].id);
  const uc = useCases.find((u) => u.id === id) ?? useCases[0];

  return (
    <Section id="solutions" className="py-[18vh]">
      <Intro title={["What should run", "on autopilot?"]} />

      <Reveal delay={0.05}>
        <div className="no-scrollbar -mx-5 mt-12 overflow-x-auto px-5">
          <div role="tablist" aria-label="Business objective" className="mx-auto flex w-max gap-1 rounded-full bg-white/[0.06] p-1">
            {useCases.map((u) => {
              const on = u.id === id;
              return (
                <button
                  key={u.id}
                  role="tab"
                  aria-selected={on}
                  aria-controls="usecase-panel"
                  onClick={() => setId(u.id)}
                  className={cn("relative h-9 shrink-0 rounded-full px-4 text-[14px] transition-colors duration-300", on ? "text-black" : "text-fg-2 hover:text-white")}
                >
                  {on && <motion.span layoutId="uc-pill" className="absolute inset-0 rounded-full bg-white" transition={{ duration: 0.4, ease: EASE }} />}
                  <span className="relative">{u.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      <div id="usecase-panel" role="tabpanel" className="mt-14">
        <AnimatePresence mode="wait">
          <motion.div key={uc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="text-center">
            <p className="text-[clamp(24px,2.6vw,34px)] font-semibold tracking-[-0.03em] text-white">{uc.outcome}</p>
            <ol className="mx-auto mt-12 grid max-w-[1040px] gap-3 sm:grid-cols-2 md:grid-cols-5">
              {uc.steps.map((s, i) => (
                <motion.li
                  key={s.label}
                  className="rounded-[20px] bg-white/[0.04] px-5 py-6"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.06 + i * 0.08, ease: EASE }}
                >
                  <div className="text-[13px] tabular-nums text-fg-4">{i + 1}</div>
                  <div className="mt-2 text-[16px] font-medium text-white">{s.label}</div>
                  <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
                    {s.agents.map((aid) => {
                      const a = agentOrFallback(aid);
                      return (
                        <span key={aid} className="flex items-center gap-1.5 text-[12.5px]" style={{ color: a.accent.tint }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.accent.hex }} />
                          {a.name}
                        </span>
                      );
                    })}
                  </div>
                </motion.li>
              ))}
            </ol>
            <div className="mt-10">
              <Button variant="secondary" onClick={() => homeFlow.requestMission(uc.prompt)}>
                Run this mission
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
}
