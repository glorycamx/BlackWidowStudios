"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Check } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { agentOrFallback } from "@/data/agents";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Mission, MissionTask, TaskStatus } from "@/types";

const W = 1000;
const H = 600;
const C = { x: W / 2, y: H / 2 };

function layout(tasks: MissionTask[]) {
  const n = tasks.length;
  return tasks.map((t, i) => {
    const step = 360 / n;
    const a = ((-90 + step / 2 + step * i) * Math.PI) / 180;
    return { t, x: Math.round(C.x + Math.cos(a) * 280), y: Math.round(C.y + Math.sin(a) * 225), a };
  });
}

const STATUS_TEXT: Record<TaskStatus, string> = {
  waiting: "Waiting",
  running: "Running",
  complete: "Complete",
  blocked: "Needs approval",
  skipped: "Skipped",
};

/**
 * Living mission topology: the objective at the center, tasks as branches,
 * packets moving along active work, agents traveling between their tasks.
 */
export function MissionTopology({ mission, entering }: { mission: Mission; entering?: boolean }) {
  const reduce = useReducedMotion();
  const nodes = layout(mission.tasks);
  const byId = Object.fromEntries(nodes.map((n) => [n.t.id, n]));
  const [hover, setHover] = useState<string | null>(null);
  const progress = mission.progress;
  const R = 62;
  const circ = 2 * Math.PI * R;

  // Where each agent currently "is".
  const agentSpots = mission.agents.map((a, idx) => {
    const own = mission.tasks.filter((t) => t.agentId === a.agentId);
    const cur = own.find((t) => t.status === "running" || t.status === "blocked") ?? [...own].reverse().find((t) => t.status === "complete");
    const n = cur ? byId[cur.id] : null;
    const off = 30;
    const x = n ? n.x + Math.cos(n.a + Math.PI / 2) * off : C.x + (idx - 1) * 34;
    const y = n ? n.y + Math.sin(n.a + Math.PI / 2) * off : C.y + 96;
    return { id: a.agentId, x, y, working: cur?.status === "running" };
  });

  return (
    <div className="relative aspect-[1000/600] w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          <radialGradient id="core" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#645bff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={C.x} cy={C.y} r={150} fill="url(#core)" />
        <ellipse cx={C.x} cy={C.y} rx={280} ry={225} fill="none" stroke="white" strokeOpacity={0.04} strokeDasharray="2 8" />

        {/* dependency arcs */}
        {nodes.map((n) =>
          n.t.dependsOn.map((d) => {
            const from = byId[d];
            if (!from) return null;
            const mx = (from.x + n.x) / 2 + (C.x - (from.x + n.x) / 2) * 0.35;
            const my = (from.y + n.y) / 2 + (C.y - (from.y + n.y) / 2) * 0.35;
            const path = `M ${from.x} ${from.y} Q ${mx} ${my} ${n.x} ${n.y}`;
            const live = n.t.status === "running" && from.t.status === "complete";
            const agent = agentOrFallback(n.t.agentId);
            return (
              <g key={`${d}-${n.t.id}`}>
                <path d={path} fill="none" stroke="white" strokeOpacity={from.t.status === "complete" ? 0.14 : 0.05} />
                {live && !reduce && (
                  <circle r={2.6} fill="#fff" style={{ filter: `drop-shadow(0 0 5px ${agent.accent.hex})` }}>
                    <animateMotion dur="1.6s" repeatCount="indefinite" path={path} />
                  </circle>
                )}
              </g>
            );
          }),
        )}

        {/* branches */}
        {nodes.map((n, i) => {
          const agent = agentOrFallback(n.t.agentId);
          const s = n.t.status;
          const path = `M ${C.x} ${C.y} L ${n.x} ${n.y}`;
          return (
            <g key={n.t.id}>
              <motion.line
                x1={C.x}
                y1={C.y}
                x2={n.x}
                y2={n.y}
                stroke={s === "running" ? agent.accent.hex : s === "blocked" ? "#d77bff" : "white"}
                strokeOpacity={s === "running" ? 0.7 : s === "blocked" ? 0.6 : s === "complete" ? 0.22 : 0.07}
                strokeWidth={s === "running" || s === "blocked" ? 1.3 : 1}
                strokeDasharray={s === "waiting" ? "3 6" : undefined}
                initial={entering ? { pathLength: 0 } : false}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, delay: entering ? 0.3 + i * 0.07 : 0, ease: EASE }}
              />
              {(s === "running" || s === "blocked") && !reduce && (
                <circle r={2.4} fill={s === "blocked" ? "#d77bff" : "#fff"}>
                  <animateMotion dur={s === "blocked" ? "2.4s" : "1.2s"} repeatCount="indefinite" path={path} />
                </circle>
              )}
            </g>
          );
        })}

        {/* progress ring */}
        <circle cx={C.x} cy={C.y} r={R} fill="#030305" stroke="white" strokeOpacity={0.1} />
        <motion.circle
          cx={C.x}
          cy={C.y}
          r={R}
          fill="none"
          stroke={mission.status === "complete" ? "#fff" : "url(#ring)"}
          strokeWidth={2}
          strokeLinecap="round"
          transform={`rotate(-90 ${C.x} ${C.y})`}
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ * (1 - progress) }}
          transition={{ duration: 0.9, ease: EASE }}
        />
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#456cff" />
            <stop offset="1" stopColor="#b542ff" />
          </linearGradient>
        </defs>
      </svg>

      {/* center label */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="label text-fg-2">Objective</div>
        <div className="mt-1.5 font-mono text-[20px] text-white">{Math.round(progress * 100)}%</div>
      </div>

      {/* task nodes */}
      {nodes.map((n, i) => {
        const agent = agentOrFallback(n.t.agentId);
        const s = n.t.status;
        const left = n.x < C.x - 40;
        const top = n.y < C.y;
        return (
          <motion.div
            key={n.t.id}
            className="absolute"
            style={{ left: `${(n.x / W) * 100}%`, top: `${(n.y / H) * 100}%` }}
            initial={entering ? { opacity: 0, scale: 0.6 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: entering ? 0.5 + i * 0.08 : 0, ease: EASE }}
          >
            <button
              className="relative block h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full outline-offset-4"
              onMouseEnter={() => setHover(n.t.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(n.t.id)}
              onBlur={() => setHover(null)}
              aria-label={`${n.t.label}, ${agent.name}, ${STATUS_TEXT[s]}${n.t.output ? `, ${n.t.output}` : ""}`}
            >
              <NodeDot status={s} color={agent.accent.hex} />
            </button>
            <div
              className={cn("pointer-events-none absolute w-[124px] -translate-y-1/2", left ? "right-[18px] text-right" : "left-[18px]")}
              style={{ top: 0 }}
            >
              <div className={cn("text-[12.5px] leading-tight", s === "waiting" ? "text-fg-3" : s === "skipped" ? "text-fg-4 line-through" : "text-white")}>{n.t.label}</div>
              <div className={cn("mt-1 flex items-center gap-1.5 text-[12px]", left && "justify-end")} style={{ color: s === "blocked" ? "#d77bff" : s === "running" ? agent.accent.tint : "#686872" }}>
                {STATUS_TEXT[s]}
                {n.t.output && s === "complete" && <span className="text-fg-3 normal-case tracking-normal">· {n.t.output}</span>}
              </div>
            </div>
            {hover === n.t.id && (
              <div className={cn("panel-solid absolute z-20 w-[200px] p-3", top ? "top-5" : "bottom-5", left ? "right-0" : "left-0")}>
                <div className="flex items-center gap-2">
                  <AgentGlyph agent={agent} size={20} animated={false} />
                  <span className="text-[12px]" style={{ color: agent.accent.tint }}>
                    {agent.name}
                  </span>
                </div>
                <div className="mt-2 text-[13px] text-white">{n.t.label}</div>
                <div className="mt-1 text-[12px] text-fg-3">{n.t.output ?? STATUS_TEXT[s]}</div>
              </div>
            )}
          </motion.div>
        );
      })}

      {/* agents traveling through the workflow */}
      {agentSpots.map((a) => {
        const agent = agentOrFallback(a.id);
        return (
          <motion.div
            key={a.id}
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
            initial={false}
            animate={{ left: `${(a.x / W) * 100}%`, top: `${(a.y / H) * 100}%` }}
            transition={{ duration: reduce ? 0 : 1.4, ease: EASE }}
            title={agent.name}
          >
            <span className="relative block rounded-full bg-black" style={{ boxShadow: a.working ? `0 0 0 1px ${agent.accent.hex}, 0 0 18px -2px ${agent.accent.hex}` : "0 0 0 1px rgba(255,255,255,0.12)" }}>
              <AgentGlyph agent={agent} size={22} animated={a.working} />
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function NodeDot({ status, color }: { status: TaskStatus; color: string }) {
  if (status === "complete")
    return (
      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white">
        <Check size={11} className="text-black" strokeWidth={3} />
        <span className="absolute inset-0 rounded-full border border-white motion-safe:animate-ping-once" />
      </span>
    );
  if (status === "running")
    return (
      <span className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 0 1.5px ${color}, 0 0 18px ${color}` }}>
        <span className="absolute inset-[5px] rounded-full motion-safe:animate-breathe" style={{ background: color }} />
      </span>
    );
  if (status === "blocked")
    return (
      <span className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 0 1.5px #d77bff, 0 0 18px #d77bff" }}>
        <span className="absolute inset-[6px] rounded-full bg-attn motion-safe:animate-breathe" />
      </span>
    );
  if (status === "skipped") return <span className="absolute inset-[3px] rounded-full border border-dashed border-white/25" />;
  return <span className="absolute inset-[3px] rounded-full border border-white/20 bg-black" />;
}
