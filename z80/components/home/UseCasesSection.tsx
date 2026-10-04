"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Display, Reveal, Section } from "@/components/home/Section";
import { Button } from "@/components/ui/Button";
import { agentOrFallback } from "@/data/agents";
import { useCases } from "@/data/useCases";
import { homeFlow } from "@/lib/scene/homeFlow";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** STATE 08 — pick an objective, watch the workflow assemble. */
export function UseCasesSection() {
  const [id, setId] = useState(useCases[0].id);
  const uc = useCases.find((u) => u.id === id) ?? useCases[0];

  return (
    <Section id="solutions" index="10" label="Solutions" className="py-[16vh]">
      <div className="mt-8">
        <Display lines={["What do you want", "to accelerate?"]} className="text-[clamp(40px,6vw,104px)]" />
      </div>

      <Reveal delay={0.05}>
        <div role="tablist" aria-label="Business objective" className="no-scrollbar -mx-5 mt-12 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
          {useCases.map((u) => {
            const on = u.id === id;
            return (
              <button
                key={u.id}
                role="tab"
                aria-selected={on}
                aria-controls="usecase-panel"
                onClick={() => setId(u.id)}
                className={cn(
                  "relative h-11 shrink-0 rounded-[12px] px-5 text-[12px] font-medium uppercase tracking-[0.14em] transition-colors duration-300",
                  on ? "text-black" : "text-fg-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] hover:text-white",
                )}
              >
                {on && <motion.span layoutId="uc-pill" className="absolute inset-0 rounded-[12px] bg-white" transition={{ duration: 0.4, ease: EASE }} />}
                <span className="relative">{u.label}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <div id="usecase-panel" role="tabpanel" className="relative mt-12">
        <AnimatePresence mode="wait">
          <motion.div key={uc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <p className="text-[clamp(22px,2.4vw,32px)] font-medium tracking-[-0.025em] text-white">{uc.outcome}</p>
            <ol className="relative mt-10 grid gap-4 md:grid-cols-5 md:gap-0">
              <span className="absolute left-[11px] top-3 h-[calc(100%-24px)] w-px bg-white/10 md:left-0 md:top-[11px] md:h-px md:w-full" aria-hidden />
              {uc.steps.map((s, i) => (
                <motion.li
                  key={s.label}
                  className="relative pl-9 md:pl-0 md:pr-6"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.08 + i * 0.1, ease: EASE }}
                >
                  <span className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] md:relative">
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
                    />
                  </span>
                  <div className="md:mt-6">
                    <div className="font-mono text-[10.5px] text-fg-3">0{i + 1}</div>
                    <div className="mt-2 text-[17px] font-medium tracking-[-0.01em] text-white">{s.label}</div>
                    <div className="mt-1.5 text-[13.5px] leading-snug text-fg-3">{s.detail}</div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {s.agents.map((aid) => {
                        const a = agentOrFallback(aid);
                        return (
                          <span key={aid} className="flex h-6 items-center gap-1.5 rounded-full px-2.5 font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: a.accent.tint, boxShadow: `inset 0 0 0 1px ${a.accent.hex}44`, background: `${a.accent.hex}10` }}>
                            <span className="h-1 w-1 rounded-full" style={{ background: a.accent.hex }} />
                            {a.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </motion.li>
              ))}
            </ol>
            <div className="mt-12 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-[560px] text-[15px] text-fg-2">
                <span className="label mr-3 text-[10px]">Try</span>“{uc.prompt}”
              </p>
              <Button variant="secondary" iconRight={<ArrowRight size={14} />} onClick={() => homeFlow.requestMission(uc.prompt)}>
                Run this mission
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
}
