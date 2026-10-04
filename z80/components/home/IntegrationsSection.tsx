"use client";

import { Display, Reveal, Section } from "@/components/home/Section";
import { integrations, integrationStatusLabel } from "@/data/integrations";
import { cn } from "@/lib/utils";

/** STATE 07 — software as the workforce's toolkit. Status comes from data. */
export function IntegrationsSection() {
  const inner = integrations.slice(0, 6);
  const outer = integrations.slice(6);

  return (
    <Section id="connections" index="09" label="Connections" className="overflow-hidden py-[16vh]">
      <div className="mt-8 grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="order-2 lg:order-1">
          <div className="relative mx-auto aspect-square w-full max-w-[560px]" aria-hidden>
            <Ring items={outer} radius={47} duration={140} />
            <Ring items={inner} radius={30} duration={100} reverse />
            <div className="absolute inset-[41%] flex items-center justify-center rounded-full" style={{ background: "radial-gradient(circle, rgba(100,91,255,0.35), transparent 70%)", boxShadow: "0 0 0 1px rgba(255,255,255,0.14)" }}>
              <span className="text-[15px] font-semibold tracking-[-0.03em] text-white">Z80</span>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <Display lines={["Your software", "becomes their", "toolkit."]} className="text-[clamp(40px,5.6vw,92px)]" />
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-[440px] text-[16px] leading-relaxed text-fg-2">
              Connect the tools your business already runs on. Intelligences use them the way your team would — within the permissions you set.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <ul className="mt-10 grid max-w-[520px] grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              {integrations.map((i) => (
                <li key={i.id} className="flex items-baseline justify-between gap-2 border-b border-line pb-2.5">
                  <span className="text-[13.5px] text-fg-1">{i.name}</span>
                  <span className={cn("font-mono text-[9px] uppercase tracking-[0.12em]", i.status === "live" ? "text-white" : i.status === "preview" ? "text-run" : "text-fg-3")}>
                    {integrationStatusLabel[i.status]}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[12.5px] text-fg-3">Connections are rolling out during early access. Statuses above are current.</p>
          </Reveal>
        </div>
      </div>
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
              className="flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[13px] bg-[#07070a] motion-safe:animate-[glyph-rotate_var(--d)_linear_infinite]"
              style={{ animationDirection: reverse ? "normal" : "reverse", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
            >
              <span className="font-mono text-[11px] text-fg-1">{it.mono}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
