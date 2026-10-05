"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Display, Reveal, Section } from "@/components/home/Section";
import { TEMP_COLOR, TempChip } from "@/components/signals/SignalParts";
import { aiLead, websiteLead } from "@/lib/services/signalService";
import { EASE } from "@/lib/motion";
import { hashString, prng } from "@/lib/utils";
import type { Signal } from "@/types";

function sampleLead(i: number): Signal {
  const r = prng(hashString(`home-lead:${i}`));
  const s = i % 3 === 2 ? aiLead(r) : websiteLead(r);
  return { id: `home-${i}`, botId: "lead-hunter", kind: "lead", at: 0, read: true, saved: false, dismissed: false, ...s };
}

/** Speed: leads caught minutes after they happen, fully researched. */
export function SignalsSection() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const pool = useMemo(() => Array.from({ length: 12 }, (_, i) => sampleLead(i + 1)), []);
  const [n, setN] = useState(3);

  useEffect(() => {
    if (!inView || reduce) return;
    const t = setInterval(() => setN((x) => x + 1), 3200);
    return () => clearInterval(t);
  }, [inView, reduce]);

  const shown = Array.from({ length: 3 }, (_, i) => pool[(n - i) % pool.length]);
  const top = shown[0];

  return (
    <Section id="speed" label="Speed" className="py-[18vh]">
      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-20">
        <div>
          <Display lines={["Happened 2:07 AM.", "Caught 2:09 AM."]} className="text-[clamp(40px,5.4vw,84px)]" />
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-[440px] text-[clamp(18px,1.6vw,22px)] leading-[1.4] text-fg-2">Lead Hunter checks every few minutes, all night. When a site goes down or a business changes hands, you know before anyone else is awake.</p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-4 text-[15px] text-fg-3">Owner, phone, problem, price and an opener. Ready when you are.</p>
          </Reveal>
        </div>

        <div ref={ref} className="relative">
          <div className="label mb-4 flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff6f91] motion-safe:animate-breathe" />
              Lead Hunter
            </span>
            <span>Illustration · sample data</span>
          </div>
          <ol className="relative space-y-3">
            <AnimatePresence initial={false}>
              {shown.map((s, i) =>
                s?.lead ? (
                  <motion.li
                    key={`${s.id}-${n - i}`}
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
            <span className="text-[12px] text-fg-3">{s.trigger}</span>
          </div>
          <span className="text-[12px] tabular-nums text-fg-4">Caught 2 min after</span>
        </div>
        <div className="mt-3 text-[20px] font-semibold tracking-[-0.02em] text-white">{l.business}</div>
        <div className="text-[13px] text-fg-3">
          {l.owner} · {l.ownerTitle} · {l.location}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-[12.5px]">
          <div>
            <dt className="label">Problem</dt>
            <dd className="mt-1 text-fg-1">{l.problems[0]}</dd>
          </div>
          <div>
            <dt className="label">Google</dt>
            <dd className="mt-1 text-fg-1">
              ★ {l.google.rating.toFixed(1)} · {l.google.reviews} reviews
            </dd>
          </div>
          <div>
            <dt className="label">Recommended</dt>
            <dd className="mt-1 text-fg-1">{l.recommended.offer}</dd>
          </div>
          <div>
            <dt className="label">Price</dt>
            <dd className="mt-1 font-mono text-fg-1">{l.recommended.price}</dd>
          </div>
        </dl>
        <p className="mt-4 line-clamp-3 rounded-[10px] bg-white/[0.03] p-3 text-[13px] leading-relaxed text-fg-1">
          <span className="mr-2 text-[12px] text-creator">Opener</span>
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
