"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Display, Reveal, Section } from "@/components/home/Section";
import { availableAgents } from "@/data/bots";
import { memoryDomains } from "@/data/memory";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const W = 620;
const H = 620;
const C = { x: W / 2, y: H / 2 };

/** STATE 06 — organization memory as a living graph. */
export function MemorySection() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);
  const domains = memoryDomains;
  const pts = domains.map((d, i) => {
    const a = (-90 + (360 / domains.length) * i) * (Math.PI / 180);
    return { ...d, x: Math.round((C.x + Math.cos(a) * 190) * 100) / 100, y: Math.round((C.y + Math.sin(a) * 190) * 100) / 100 };
  });
  const agents = availableAgents.filter((a) => a.sceneGroup !== undefined);
  const agentPts = agents.map((a, i) => {
    const ang = (-60 + i * 120 + 30) * (Math.PI / 180);
    return { a, x: Math.round((C.x + Math.cos(ang) * 285) * 100) / 100, y: Math.round((C.y + Math.sin(ang) * 285) * 100) / 100 };
  });
  const sel = pts.find((p) => p.id === active);

  return (
    <Section id="memory" index="08" label="Memory" className="py-[18vh]">
      <div className="mt-8 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,620px)] lg:gap-16">
        <div>
          <Display lines={["It knows", "your business."]} className="text-[clamp(44px,6vw,96px)]" />
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-[420px] text-[clamp(18px,1.6vw,22px)] leading-[1.4] text-fg-2">One memory. Every agent gets smarter.</p>
          </Reveal>
        </div>

        <Reveal>
          <div className="relative mx-auto aspect-square w-full max-w-[620px]">
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              <circle cx={C.x} cy={C.y} r={190} fill="none" stroke="white" strokeOpacity={0.05} />
              <circle cx={C.x} cy={C.y} r={285} fill="none" stroke="white" strokeOpacity={0.035} strokeDasharray="2 8" />
              {pts.map((p) => {
                const on = active === p.id;
                return (
                  <g key={p.id}>
                    <line x1={C.x} y1={C.y} x2={p.x} y2={p.y} stroke="white" strokeOpacity={on ? 0.35 : 0.1} />
                    <line x1={C.x} y1={C.y} x2={p.x} y2={p.y} stroke="#8f9cff" strokeOpacity={on ? 0.9 : 0.3} className="flow-dash" />
                  </g>
                );
              })}
              {agentPts.map(({ a, x, y }) =>
                a.memory.map((m) => {
                  const p = pts.find((pp) => pp.id === m);
                  if (!p) return null;
                  const on = active === m;
                  return <line key={`${a.id}-${m}`} x1={x} y1={y} x2={p.x} y2={p.y} stroke={a.accent.hex} strokeOpacity={on ? 0.6 : 0.12} strokeWidth={on ? 1.2 : 0.8} className="transition-[stroke-opacity] duration-500" />;
                }),
              )}
              {!reduce &&
                pts.map((p, i) => (
                  <circle key={`pk-${p.id}`} r={2} fill="#fff" opacity={0.9}>
                    <animateMotion dur={`${2.6 + (i % 3) * 0.7}s`} begin={`${i * 0.45}s`} repeatCount="indefinite" path={`M ${C.x} ${C.y} L ${p.x} ${p.y}`} />
                  </circle>
                ))}
            </svg>

            {/* Center */}
            <div className="absolute left-1/2 top-1/2 flex h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-center" style={{ background: "radial-gradient(circle, rgba(100,91,255,0.28), rgba(0,0,0,0.9) 70%)", boxShadow: "0 0 0 1px rgba(255,255,255,0.12), 0 0 80px -10px rgba(100,91,255,0.5)" }}>
              <div>
                <div className="label text-fg-2">Organization</div>
                <div className="mt-1.5 text-[clamp(11px,1.4vw,15px)] font-semibold text-white">Your company</div>
              </div>
            </div>

            {pts.map((p) => {
              const on = active === p.id;
              return (
                <button
                  key={p.id}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-3.5 py-2 text-[12px] transition-all duration-300",
                    on ? "bg-white text-black" : "bg-black text-fg-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]",
                  )}
                  style={{ left: `${((p.x / W) * 100).toFixed(3)}%`, top: `${((p.y / H) * 100).toFixed(3)}%` }}
                  onMouseEnter={() => setActive(p.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(p.id)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive(on ? null : p.id)}
                  aria-pressed={on}
                >
                  {p.label}
                </button>
              );
            })}

            {agentPts.map(({ a, x, y }) => (
              <div key={a.id} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${((x / W) * 100).toFixed(3)}%`, top: `${((y / H) * 100).toFixed(3)}%` }}>
                <span className="mx-auto block h-2 w-2 rounded-full" style={{ background: a.accent.hex, boxShadow: `0 0 12px ${a.accent.hex}` }} />
                <span className="mt-2 block text-[12px]" style={{ color: a.accent.tint }}>
                  {a.name}
                </span>
              </div>
            ))}

            <AnimatePresence>
              {sel && (
                <motion.div
                  className="panel-solid pointer-events-none absolute bottom-0 left-1/2 w-[min(320px,90%)] -translate-x-1/2 p-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <div className="label text-fg-1">{sel.label}</div>
                  <p className="mt-2 text-[13.5px] text-fg-2">{sel.summary}</p>
                  <p className="mt-2 text-[12px] tabular-nums text-fg-3">
                    Used by {agents.filter((a) => a.memory.includes(sel.id)).map((a) => a.name).join(", ") || "Z80"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
