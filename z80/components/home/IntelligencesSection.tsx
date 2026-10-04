"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { availableAgents } from "@/data/agents";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Positions (% of the right-hand stage) for floating capability words. */
const WORD_SPOTS = [
  { x: 12, y: 18 },
  { x: 78, y: 12 },
  { x: 92, y: 46 },
  { x: 80, y: 84 },
  { x: 18, y: 86 },
  { x: 2, y: 52 },
];

/**
 * STATE 03 — each intelligence gets a full viewport while the particle
 * field becomes its signature: lattice, scanner, fluid.
 */
export function IntelligencesSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const showcase = availableAgents.filter((a) => a.sceneGroup !== undefined).sort((a, b) => (a.sceneGroup ?? 0) - (b.sceneGroup ?? 0));
  const [idx, setIdx] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setIdx(Math.min(showcase.length - 1, Math.max(0, Math.floor(v * showcase.length))));
  });

  const agent = showcase[idx];

  return (
    <section ref={ref} id="intelligences" aria-label="Meet the intelligences" className="relative z-10 h-[420vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col px-5 pb-10 pt-24 md:px-10 md:pt-28">
          <p className="label flex items-center gap-3">
            <span className="text-fg-2">04</span>
            <span className="h-px w-8 bg-white/15" />
            Meet the intelligences
          </p>

          <div className="relative mt-auto grid flex-1 items-end md:items-center lg:grid-cols-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={agent.id}
                className="relative max-w-[560px] pb-4 md:pb-0"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <div className="label flex items-center gap-2" style={{ color: agent.accent.tint }}>
                  <span className="h-1.5 w-1.5 rounded-full motion-safe:animate-breathe" style={{ background: agent.accent.hex, boxShadow: `0 0 10px ${agent.accent.hex}` }} />
                  {agent.designation}
                </div>
                <h3 className="display mt-5 text-[clamp(64px,10vw,156px)] uppercase">{agent.name}</h3>
                <p className="mt-4 font-mono text-[12px] uppercase tracking-[0.2em] text-fg-1">{agent.role}</p>
                <p className="mt-6 max-w-[440px] text-[clamp(20px,2vw,26px)] leading-[1.25] tracking-[-0.02em] text-fg-2">{agent.tagline}</p>
                <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 lg:hidden">
                  {agent.capabilities.map((c) => (
                    <span key={c} className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-fg-3">
                      {c}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/agents/${agent.slug}`}
                  className="group mt-9 inline-flex items-center gap-3 border-b border-white/20 pb-2 text-[12px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:border-white"
                >
                  View intelligence
                  <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            </AnimatePresence>

            {/* Capability words orbiting the formation */}
            <div className="pointer-events-none absolute inset-y-[12%] right-[2%] hidden w-[46%] lg:block" aria-hidden>
              <AnimatePresence mode="wait">
                <motion.div key={agent.id} className="absolute inset-0" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                  {agent.capabilities.map((c, i) => {
                    const s = WORD_SPOTS[i % WORD_SPOTS.length];
                    return (
                      <motion.span
                        key={c}
                        className="absolute -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-2"
                        style={{ left: `${s.x}%`, top: `${s.y}%` }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: [0, 1, 0.55], y: 0 }}
                        transition={{ duration: 1.4, delay: 0.25 + i * 0.12, ease: EASE }}
                      >
                        <span className="mr-2 inline-block h-1 w-1 rounded-full align-middle" style={{ background: agent.accent.hex }} />
                        {c}
                      </motion.span>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Chapter index */}
          <nav aria-label="Intelligences" className="mt-6 flex items-center gap-6 md:gap-10">
            {showcase.map((a, i) => (
              <button
                key={a.id}
                onClick={() => {
                  const el = ref.current;
                  if (!el) return;
                  const top = el.offsetTop + ((el.offsetHeight - window.innerHeight) * (i + 0.5)) / showcase.length;
                  window.scrollTo({ top, behavior: "smooth" });
                }}
                className={cn("group flex items-center gap-3 text-left transition-opacity duration-500", i === idx ? "opacity-100" : "opacity-40 hover:opacity-70")}
                aria-current={i === idx}
              >
                <span className="font-mono text-[11px] text-fg-3">0{i + 1}</span>
                <span className="relative h-px w-10 overflow-hidden bg-white/15 md:w-16">
                  <span className={cn("absolute inset-y-0 left-0 transition-[width] duration-700 ease-[var(--ease-z)]", i === idx ? "w-full" : "w-0")} style={{ background: a.accent.hex }} />
                </span>
                <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-white">{a.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
