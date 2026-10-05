"use client";

import { motion } from "motion/react";
import { Intro, Reveal, Section } from "@/components/home/Section";
import { EASE } from "@/lib/motion";
import { hashString, prng } from "@/lib/utils";
import { useReducedMotionSafe } from "@/lib/hooks/useReducedMotionSafe";

const ROWS = [
  ["Waits for you to ask", "Works while you sleep"],
  ["Forgets when you close the tab", "Remembers your business"],
  ["Answers, then stops", "Finds it the minute it happens"],
  ["You do the work", "Does the work, asks for a yes"],
];

const HOURS = ["12 AM", "6 AM", "12 PM", "6 PM", "12 AM"];

/** The difference, in one picture: two days, side by side. */
export function ChatbotVsSection() {
  const reduce = useReducedMotionSafe();
  const r = prng(hashString("z80-day"));
  const ticks = Array.from({ length: 96 }, (_, i) => ({ x: (i / 95) * 100, h: 30 + r() * 70, find: r() > 0.86 }));
  return (
    <Section id="versus" className="py-[18vh]">
      <Intro title={["Chatbots wait.", "Z80 works."]} sub="A chatbot answers when you ask. Your bots keep going when you don't." />

      <Reveal delay={0.1}>
        <div className="mx-auto mt-16 max-w-[960px] space-y-8">
          <Day label="A chatbot" sub="Two questions, then nothing" color="#686872">
            {[37.5, 58].map((x) => (
              <span key={x} className="absolute bottom-0 w-[3px] -translate-x-1/2 rounded-full bg-[#8e93a8]" style={{ left: `${x}%`, height: "70%" }} />
            ))}
          </Day>
          <Day label="Z80" sub="Checking all day and all night" color="#8f9cff">
            {ticks.map((t, i) => (
              <motion.span
                key={i}
                className="absolute bottom-0 w-[2px] -translate-x-1/2 rounded-full"
                style={{ left: `${t.x.toFixed(2)}%`, background: t.find ? "#ff6f91" : "linear-gradient(to top, #7a6bff, #c252f2)" }}
                initial={{ height: 0 }}
                whileInView={{ height: `${t.h.toFixed(1)}%` }}
                viewport={{ once: true }}
                transition={reduce ? { duration: 0 } : { duration: 0.6, delay: i * 0.008, ease: EASE }}
              />
            ))}
          </Day>
          <div className="flex justify-between pl-0 text-[12px] tabular-nums text-fg-4 md:pl-[180px]">
            {HOURS.map((h, i) => (
              <span key={i}>{h}</span>
            ))}
          </div>
          <p className="text-center text-[13px] text-fg-4">Illustration. Pink marks are finds worth your attention.</p>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mx-auto mt-16 grid max-w-[880px] overflow-hidden rounded-[24px] bg-white/[0.07] sm:grid-cols-2" style={{ gap: 1 }}>
          <div className="bg-[#050507] px-7 py-6 text-[13px] font-medium text-fg-3">A chatbot</div>
          <div className="hidden bg-[#050507] px-7 py-6 text-[13px] font-medium text-white sm:block">Z80</div>
          {ROWS.map(([a, b]) => (
            <div key={a} className="contents">
              <div className="bg-[#050507] px-7 py-5 text-[17px] text-fg-3 line-through decoration-white/20">{a}</div>
              <div className="bg-[#050507] px-7 py-5 text-[17px] text-white">{b}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

function Day({ label, sub, color, children }: { label: string; sub: string; color: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-6">
      <div className="md:w-[156px] md:shrink-0">
        <div className="text-[17px] font-semibold" style={{ color }}>
          {label}
        </div>
        <div className="text-[13px] text-fg-3">{sub}</div>
      </div>
      <div className="relative h-16 flex-1 border-b border-white/[0.08]" aria-hidden>
        {children}
      </div>
    </div>
  );
}
