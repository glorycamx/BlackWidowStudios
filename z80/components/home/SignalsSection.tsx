"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Display, Reveal, Section } from "@/components/home/Section";
import { TEMP_COLOR, TempChip } from "@/components/signals/SignalParts";
import { getWatchTemplate } from "@/data/watches";
import { generateSignal } from "@/lib/services/signalService";
import { EASE } from "@/lib/motion";
import type { Signal, Watch } from "@/types";

const TRIGGERS = ["A website goes down", "A business changes hands", "A new business opens", "Reviews spike", "A domain is about to expire", "A company hires for work AI can do"];

function demoWatch(kind: "website-opportunities" | "ai-opportunities"): Watch {
  const t = getWatchTemplate(kind)!;
  return { id: `home-${kind}`, kind, name: t.name, agentId: t.agentId, description: t.description, triggers: t.triggers, cadence: t.cadence, status: "live", autopilot: false, createdAt: 0, nextAt: 0 };
}

/** STATE — the always-on side: leads that arrive on their own, fully researched. */
export function SignalsSection() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const pool = useMemo(() => {
    const web = demoWatch("website-opportunities");
    const ai = demoWatch("ai-opportunities");
    return Array.from({ length: 12 }, (_, i) => generateSignal(i % 3 === 2 ? ai : web, i + 1, 0) as Signal);
  }, []);
  const [n, setN] = useState(3);

  useEffect(() => {
    if (!inView || reduce) return;
    const t = setInterval(() => setN((x) => x + 1), 3200);
    return () => clearInterval(t);
  }, [inView, reduce]);

  const shown = Array.from({ length: 3 }, (_, i) => pool[(n - i) % pool.length]);
  const top = shown[0];

  return (
    <Section id="signals" index="06" label="Always on" className="py-[16vh]">
      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-20">
        <div>
          <Display lines={["Leads that", "find you."]} />
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-[440px] text-[16px] leading-relaxed text-fg-2">
              Lookout watches your market around the clock. The moment something changes, it researches the business, Beacon writes the opener, and your phone lights up. No ad spend. Every lead is timely, organic and explained.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <ul className="mt-8 grid max-w-[460px] gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {TRIGGERS.map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[14px] text-fg-1">
                  <span className="h-1 w-1 rounded-full bg-[#ff6f91]" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-[440px] text-[14px] text-fg-3">
              Turn on autopilot and Z80 drafts the outreach mission for every hot lead the moment it lands. You still approve before anything is sent.
            </p>
          </Reveal>
        </div>

        <div ref={ref} className="relative">
          <div className="label mb-4 flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff6f91] motion-safe:animate-breathe" />
              Live signals
            </span>
            <span>Illustration · sample data</span>
          </div>
          <ol className="relative space-y-3">
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((s, i) =>
                s?.lead ? (
                  <motion.li
                    key={`${s.id}-${n - i}`}
                    layout
                    initial={{ opacity: 0, y: -24, scale: 0.97 }}
                    animate={{ opacity: i === 0 ? 1 : 0.55 - i * 0.12, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.7, ease: EASE }}
                  >
                    {i === 0 ? <FullCard s={s} /> : <MiniCard s={s} />}
                  </motion.li>
                ) : null,
              )}
            </AnimatePresence>
          </ol>
          {top?.lead && <div aria-hidden className="pointer-events-none absolute -inset-10 -z-10 rounded-full blur-3xl" style={{ background: `radial-gradient(50% 40% at 50% 30%, ${TEMP_COLOR[top.lead.temperature]}22, transparent 70%)` }} />}
        </div>
      </div>
    </Section>
  );
}

function FullCard({ s }: { s: Signal }) {
  const l = s.lead!;
  return (
    <div className="panel-solid overflow-hidden">
      <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${TEMP_COLOR[l.temperature]}, transparent)` }} />
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TempChip temp={l.temperature} />
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-fg-3">{s.trigger}</span>
          </div>
          <span className="font-mono text-[10px] text-fg-4">just now</span>
        </div>
        <div className="mt-3 text-[20px] font-semibold tracking-[-0.02em] text-white">{l.business}</div>
        <div className="text-[13px] text-fg-3">
          {l.owner} · {l.ownerTitle} · {l.location}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-[12.5px]">
          <div>
            <dt className="label text-[9px]">Problem</dt>
            <dd className="mt-1 text-fg-1">{l.problems[0]}</dd>
          </div>
          <div>
            <dt className="label text-[9px]">Google</dt>
            <dd className="mt-1 text-fg-1">
              ★ {l.google.rating.toFixed(1)} · {l.google.reviews} reviews
            </dd>
          </div>
          <div>
            <dt className="label text-[9px]">Recommended</dt>
            <dd className="mt-1 text-fg-1">{l.recommended.offer}</dd>
          </div>
          <div>
            <dt className="label text-[9px]">Price</dt>
            <dd className="mt-1 font-mono text-fg-1">{l.recommended.price}</dd>
          </div>
        </dl>
        <p className="mt-4 line-clamp-3 rounded-[10px] bg-white/[0.03] p-3 text-[13px] leading-relaxed text-fg-1">
          <span className="mr-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-beacon">Opener</span>
          {l.outreachScript}
        </p>
      </div>
    </div>
  );
}

function MiniCard({ s }: { s: Signal }) {
  const l = s.lead!;
  return (
    <div className="panel flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <div className="truncate text-[14px] text-white">{l.business}</div>
        <div className="truncate text-[12px] text-fg-3">{s.trigger}</div>
      </div>
      <TempChip temp={l.temperature} />
    </div>
  );
}
