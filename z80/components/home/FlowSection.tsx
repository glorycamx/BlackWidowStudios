"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { Reveal, Section } from "@/components/home/Section";
import { getAgent } from "@/data/agents";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type NodeId = "user" | "z80" | "helm" | "lookout" | "beacon" | "result";

const NODES: Record<NodeId, { x: number; y: number; label: string; sub: string }> = {
  user: { x: 70, y: 210, label: "You", sub: "The objective" },
  z80: { x: 280, y: 210, label: "Z80", sub: "Orchestration" },
  helm: { x: 500, y: 95, label: "Helm", sub: "Operations" },
  lookout: { x: 500, y: 325, label: "Lookout", sub: "Growth" },
  beacon: { x: 720, y: 210, label: "Beacon", sub: "Creative" },
  result: { x: 930, y: 210, label: "Result", sub: "Ready for you" },
};

interface Link {
  from: NodeId;
  to: NodeId;
  message: string;
  bend?: number;
}

const LINKS: Link[] = [
  { from: "user", to: "z80", message: "Find 50 businesses near us that need a new website. Build the outreach." },
  { from: "z80", to: "helm", message: "Mission decomposed into 7 tasks. Helm coordinates.", bend: -30 },
  { from: "helm", to: "lookout", message: "Find and qualify the companies. Owners included.", bend: -40 },
  { from: "lookout", to: "beacon", message: "42 companies qualified. Sending website weaknesses and owner data.", bend: 30 },
  { from: "beacon", to: "helm", message: "Personalized outreach generated. Ready for approval.", bend: 30 },
  { from: "helm", to: "result", message: "Campaign prepared. Review before deployment?", bend: -50 },
];

function pathFor(l: Link) {
  const a = NODES[l.from];
  const b = NODES[l.to];
  const mx = (a.x + b.x) / 2 + (l.bend ?? 0) * ((b.y - a.y) / Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)));
  const my = (a.y + b.y) / 2 - (l.bend ?? 0) * ((b.x - a.x) / Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)));
  return { d: `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`, mx: (a.x + 2 * mx + b.x) / 4, my: (a.y + 2 * my + b.y) / 4 };
}

function actorName(id: NodeId) {
  return id === "user" ? "You" : id === "z80" ? "Z80" : id === "result" ? "You" : getAgent(id)?.name ?? id;
}

export function FlowSection() {
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, { margin: "-20% 0px" });
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!inView || pinned) return;
    const t = setInterval(() => setActive((a) => (a + 1) % LINKS.length), reduce ? 4200 : 2800);
    return () => clearInterval(t);
  }, [inView, pinned, reduce]);

  const link = LINKS[active];
  const p = pathFor(link);

  return (
    <Section id="how" index="03" label="Collaboration" className="py-[18vh]">
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
        <div>
          <Reveal>
            <h2 className="display text-[clamp(38px,4.6vw,72px)]">
              They talk to
              <br />
              each other.
              <br />
              <span className="text-fg-3">So you don&apos;t have to.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-7 max-w-[400px] text-[16px] leading-relaxed text-fg-2">
              Every intelligence hands its work to the next one, with context. Z80 keeps the whole operation in sync, and brings you in only when a decision is yours.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="label mt-8 hidden text-[10px] lg:block">Hover a connection to inspect it</p>
          </Reveal>
        </div>

        <div ref={wrap} className="relative">
          {/* Desktop spatial diagram */}
          <div className="relative hidden aspect-[1000/420] w-full lg:block">
            <svg viewBox="0 0 1000 420" className="absolute inset-0 h-full w-full overflow-visible" role="group" aria-label="Collaboration between Z80 intelligences">
              {LINKS.map((l, i) => {
                const pp = pathFor(l);
                const on = i === active;
                const color = l.from === "user" || l.from === "z80" ? "#8f9cff" : getAgent(l.from)?.accent.hex ?? "#fff";
                return (
                  <g key={i}>
                    <path d={pp.d} fill="none" stroke="white" strokeOpacity={on ? 0.22 : 0.08} strokeWidth={1} />
                    <path d={pp.d} fill="none" stroke={color} strokeOpacity={on ? 0.9 : 0.25} strokeWidth={on ? 1.4 : 1} className="flow-dash transition-[stroke-opacity] duration-500" />
                    {on && !reduce && (
                      <circle r={3.2} fill="#fff" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
                        <animateMotion dur="1.4s" repeatCount="indefinite" path={pp.d} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.65 0 0.35 1" />
                      </circle>
                    )}
                    <path
                      d={pp.d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={26}
                      tabIndex={0}
                      role="button"
                      aria-label={`${actorName(l.from)} to ${actorName(l.to)}: ${l.message}`}
                      className="cursor-pointer outline-none"
                      onMouseEnter={() => {
                        setActive(i);
                        setPinned(true);
                      }}
                      onMouseLeave={() => setPinned(false)}
                      onFocus={() => {
                        setActive(i);
                        setPinned(true);
                      }}
                      onBlur={() => setPinned(false)}
                    />
                  </g>
                );
              })}
            </svg>

            {(Object.keys(NODES) as NodeId[]).map((id) => {
              const n = NODES[id];
              const agent = getAgent(id);
              const lit = link.from === id || link.to === id;
              return (
                <div key={id} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${n.x / 10}%`, top: `${((n.y / 420) * 100).toFixed(3)}%` }}>
                  <div
                    className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black transition-shadow duration-500")}
                    style={{ boxShadow: lit ? `0 0 0 1px ${agent?.accent.hex ?? "rgba(255,255,255,0.6)"}, 0 0 36px -8px ${agent?.accent.hex ?? "#8f9cff"}` : "0 0 0 1px rgba(255,255,255,0.12)" }}
                  >
                    {agent ? (
                      <AgentGlyph agent={agent} size={46} />
                    ) : id === "z80" ? (
                      <span className="text-[15px] font-semibold tracking-[-0.03em] text-white">Z80</span>
                    ) : (
                      <span className={cn("h-2 w-2 rounded-full", id === "result" ? "bg-white" : "bg-fg-2")} />
                    )}
                  </div>
                  <div className="mt-3 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white">{n.label}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-fg-3">{n.sub}</div>
                </div>
              );
            })}

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                className="pointer-events-none absolute z-10 w-[270px] -translate-x-1/2"
                style={{ left: `${p.mx / 10}%`, top: `calc(${(p.my / 420) * 100}% + ${p.my > 210 ? 22 : -112}px)` }}
                initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <Message link={link} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile: vertical chain */}
          <ol className="relative space-y-3 pl-6 lg:hidden">
            <span className="absolute bottom-3 left-[7px] top-3 w-px bg-gradient-to-b from-indigo/50 via-white/10 to-white/0" aria-hidden />
            {LINKS.map((l, i) => (
              <li key={i} className="relative">
                <span
                  className={cn("absolute -left-[22px] top-4 h-2 w-2 rounded-full transition-colors duration-500", i === active ? "bg-white shadow-[0_0_10px_#8f9cff]" : "bg-white/20")}
                />
                <button onClick={() => { setActive(i); setPinned(true); }} className={cn("w-full text-left transition-opacity duration-500", i === active ? "opacity-100" : "opacity-45")}>
                  <Message link={l} />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  );
}

function Message({ link }: { link: Link }) {
  const from = getAgent(link.from);
  return (
    <div className="panel-solid px-4 py-3.5">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
        <span style={{ color: from?.accent.tint ?? "#fff" }}>{actorName(link.from)}</span>
        <span className="text-fg-4">→</span>
        <span className="text-fg-2">{actorName(link.to)}</span>
      </div>
      <p className="mt-2 text-[13.5px] leading-snug text-fg-1">“{link.message}”</p>
    </div>
  );
}
