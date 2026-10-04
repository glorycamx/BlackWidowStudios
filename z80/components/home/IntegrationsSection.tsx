"use client";

import { Intro, Reveal, Section } from "@/components/home/Section";
import { integrations } from "@/data/integrations";

/** STATE 07 — software as the workforce's toolkit. Status comes from data. */
export function IntegrationsSection() {
  const inner = integrations.slice(0, 6);
  const outer = integrations.slice(6);

  return (
    <Section id="connections" className="overflow-hidden py-[18vh]">
      <Intro title={["Works with", "your tools."]} sub="Connect the software you already use. Rolling out during early access." />
      <Reveal delay={0.1}>
        <div className="relative mx-auto mt-14 aspect-square w-full max-w-[520px]" aria-hidden>
          <Ring items={outer} radius={47} duration={140} />
          <Ring items={inner} radius={30} duration={100} reverse />
          <div className="absolute inset-[41%] flex items-center justify-center rounded-full" style={{ background: "radial-gradient(circle, rgba(100,91,255,0.35), transparent 70%)", boxShadow: "0 0 0 1px rgba(255,255,255,0.14)" }}>
            <span className="text-[15px] font-semibold tracking-[-0.03em] text-white">Z80</span>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

function Ring({ items, radius, duration, reverse }: { items: typeof integrations; radius: number; duration: number; reverse?: boolean }) {
  return (
    <div
      className="absolute inset-0 motion-safe:animate-[glyph-rotate_var(--d)_linear_infinite]"
      style={{ ["--d" as string]: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}
    >
      <div className="absolute rounded-full border border-white/[0.06]" style={{ inset: `${50 - radius}%` }} />
      {items.map((it, i) => {
        const a = (360 / items.length) * i * (Math.PI / 180);
        return (
          <div key={it.id} className="absolute" style={{ left: `${(50 + Math.cos(a) * radius).toFixed(3)}%`, top: `${(50 + Math.sin(a) * radius).toFixed(3)}%` }}>
            <div
              className="flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#0a0a10] motion-safe:animate-[glyph-rotate_var(--d)_linear_infinite]"
              style={{ animationDirection: reverse ? "normal" : "reverse", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
            >
              <span className="text-[13px] tabular-nums text-fg-1">{it.mono}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
