"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Plus, X } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { agentOrFallback, agents as roster } from "@/data/agents";
import { getIntegration, integrationStatusLabel } from "@/data/integrations";
import { workspace } from "@/lib/store/workspace";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { AgentAssignment, AgentId, Plan } from "@/types";

export type NodeStatus = "ready" | "initializing" | "connecting" | "active";

export interface AssemblyLayout {
  mission: { x: number; y: number };
  nodes: Record<AgentId, { x: number; y: number }>;
}

interface Props {
  plan: Plan;
  /** Called after the deploy animation with the new mission id. */
  onDeployed(missionId: string): void;
  onBack?(): void;
  backLabel?: string;
  /** Client-px positions of nodes, for syncing the particle scene. */
  onLayout?(layout: AssemblyLayout | null): void;
  onDeployStart?(): void;
  className?: string;
}

const STATUS_LABEL: Record<NodeStatus, string> = {
  ready: "Ready",
  initializing: "Initializing",
  connecting: "Connecting",
  active: "Active",
};

function angleSet(n: number): number[] {
  if (n === 1) return [-90];
  if (n === 2) return [200, -20];
  if (n === 3) return [205, 335, 90];
  if (n === 4) return [215, 325, 145, 35];
  return Array.from({ length: n }, (_, i) => -90 + (360 / n) * i);
}

export function TeamAssembly({ plan: initial, onDeployed, onBack, backLabel = "Edit objective", onLayout, onDeployStart, className }: Props) {
  const reduce = useReducedMotion();
  const wide = useMediaQuery("(min-width: 900px)", true);
  const [plan, setPlan] = useState(initial);
  const [selected, setSelected] = useState<AgentId | null>(initial.agents[0]?.agentId ?? null);
  const [status, setStatus] = useState<Record<AgentId, NodeStatus>>({});
  const [deploying, setDeploying] = useState(false);
  const [energy, setEnergy] = useState<Record<AgentId, boolean>>({});
  const [addOpen, setAddOpen] = useState(false);
  const netRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({});
  const missionRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => setPlan(initial), [initial]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const team = plan.agents;
  const ids = team.map((a) => a.agentId);

  /* ---------------- layout ---------------- */
  useLayoutEffect(() => {
    const el = netRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDims({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [wide]);

  const positions = useMemo(() => {
    const out: Record<AgentId, { x: number; y: number }> = {};
    const angles = angleSet(ids.length);
    const rx = dims.w * (ids.length === 1 ? 0 : 0.36);
    const ry = dims.h * 0.34;
    ids.forEach((id, i) => {
      const a = (angles[i] * Math.PI) / 180;
      out[id] = { x: dims.w / 2 + Math.cos(a) * rx, y: dims.h / 2 + Math.sin(a) * ry * (ids.length === 1 ? 1.15 : 1) };
    });
    return out;
  }, [ids, dims]);

  const reportLayout = useCallback(() => {
    if (!onLayout) return;
    if (!wide || !missionRef.current) return onLayout(null);
    const mr = missionRef.current.getBoundingClientRect();
    const nodes: AssemblyLayout["nodes"] = {};
    for (const id of ids) {
      const el = nodeRefs.current[id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      nodes[id] = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    onLayout({ mission: { x: mr.left + mr.width / 2, y: mr.top + mr.height / 2 }, nodes });
  }, [onLayout, wide, ids]);

  useEffect(() => {
    const t = setTimeout(reportLayout, 320);
    const t2 = setTimeout(reportLayout, 1300);
    window.addEventListener("resize", reportLayout);
    window.addEventListener("scroll", reportLayout, { passive: true });
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
      window.removeEventListener("resize", reportLayout);
      window.removeEventListener("scroll", reportLayout);
    };
  }, [reportLayout, positions]);

  useEffect(() => () => onLayout?.(null), [onLayout]);

  /* ---------------- team edits ---------------- */
  const applyTeam = (nextIds: AgentId[], roles?: Record<AgentId, string>) => {
    const roleMap = roles ?? Object.fromEntries(team.map((a) => [a.agentId, a.roleId]));
    const next = workspace.updatePlanTeam(plan.id, nextIds, roleMap);
    if (next) setPlan(next);
  };
  const remove = (id: AgentId) => {
    if (ids.length <= 1) return;
    const next = ids.filter((x) => x !== id);
    applyTeam(next);
    if (selected === id) setSelected(next[0]);
  };
  const add = (id: AgentId) => {
    applyTeam([...ids, id]);
    setSelected(id);
    setAddOpen(false);
  };
  const changeRole = (id: AgentId, roleId: string) => {
    applyTeam(ids, { ...Object.fromEntries(team.map((a) => [a.agentId, a.roleId])), [id]: roleId });
  };

  /* ---------------- deploy ---------------- */
  const deploy = () => {
    if (deploying || !ids.length) return;
    setDeploying(true);
    setAddOpen(false);
    onDeployStart?.();
    const step = reduce ? 120 : 480;
    const travel = reduce ? 0 : 620;
    ids.forEach((id, i) => {
      const t0 = (reduce ? 50 : 380) + i * step;
      timers.current.push(setTimeout(() => setEnergy((e) => ({ ...e, [id]: true })), t0));
      timers.current.push(setTimeout(() => setStatus((s) => ({ ...s, [id]: "initializing" })), t0 + travel));
      timers.current.push(setTimeout(() => setStatus((s) => ({ ...s, [id]: "connecting" })), t0 + travel + (reduce ? 80 : 380)));
      timers.current.push(setTimeout(() => setStatus((s) => ({ ...s, [id]: "active" })), t0 + travel + (reduce ? 160 : 760)));
    });
    const end = (reduce ? 50 : 380) + (ids.length - 1) * step + travel + (reduce ? 160 : 760) + (reduce ? 200 : 650);
    timers.current.push(
      setTimeout(() => {
        const missionId = workspace.deploy(plan.id);
        if (missionId) onDeployed(missionId);
      }, end),
    );
  };

  const available = roster.filter((a) => !ids.includes(a.id));
  const sel = team.find((a) => a.agentId === selected) ?? null;
  const count = ids.length;

  /* ---------------- render ---------------- */
  return (
    <div className={cn("relative flex w-full flex-col", className)}>
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <motion.div className="label flex items-center gap-2 text-fg-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <StatusDot color="var(--color-indigo)" size={5} />
            {count === 1 ? "1 intelligence recommended" : `${count} intelligences recommended`}
          </motion.div>
          <motion.h2
            className="mt-3 max-w-[28ch] text-[26px] font-semibold leading-[1.08] tracking-[-0.035em] text-white md:text-[34px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: EASE }}
          >
            {plan.title}
          </motion.h2>
        </div>
        {onBack && !deploying && (
          <button onClick={onBack} className="label flex items-center gap-2 self-start text-fg-3 transition-colors hover:text-white md:self-auto">
            <ArrowLeft size={13} /> {backLabel}
          </button>
        )}
      </div>

      <div className={cn("mt-6 grid gap-6", wide ? "grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]" : "grid-cols-1")}>
        {/* Network */}
        {wide ? (
          <div ref={netRef} className="relative h-[min(52vh,500px)] min-h-[360px]">
            <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
              <defs>
                <linearGradient id="energy" x1="0" x2="1">
                  <stop offset="0" stopColor="#fff" stopOpacity="0" />
                  <stop offset="0.7" stopColor="#fff" stopOpacity="1" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* agent ↔ agent collaboration */}
              {ids.map((a, i) =>
                ids.slice(i + 1).map((b) => {
                  const p = positions[a];
                  const q = positions[b];
                  if (!p || !q) return null;
                  return (
                    <line key={`${a}-${b}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="white" strokeOpacity={0.06} strokeDasharray="2 6" />
                  );
                }),
              )}
              {ids.map((id) => {
                const p = positions[id];
                if (!p) return null;
                const agent = agentOrFallback(id);
                const cx = dims.w / 2;
                const cy = dims.h / 2;
                const mx = (cx + p.x) / 2 + (p.y - cy) * 0.12;
                const my = (cy + p.y) / 2 - (p.x - cx) * 0.12;
                const d = `M ${cx} ${cy} Q ${mx} ${my} ${p.x} ${p.y}`;
                const on = selected === id || status[id] === "active";
                return (
                  <g key={id}>
                    <motion.path d={d} fill="none" stroke="white" strokeOpacity={0.1} strokeWidth={1} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: EASE, delay: 0.2 }} />
                    <path d={d} fill="none" stroke={agent.accent.hex} strokeOpacity={on ? 0.75 : 0.35} strokeWidth={1.2} className="flow-dash transition-[stroke-opacity] duration-500" />
                    {energy[id] && !reduce && (
                      <motion.path
                        d={d}
                        fill="none"
                        stroke={agent.accent.tint}
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 6px ${agent.accent.hex})` }}
                        initial={{ pathLength: 0, pathOffset: 0, opacity: 1 }}
                        animate={{ pathLength: [0, 0.35, 0.1], pathOffset: [0, 0.4, 1], opacity: [1, 1, 0] }}
                        transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Mission core */}
            <div ref={missionRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <MissionCore deploying={deploying} />
            </div>

            {/* Agent nodes */}
            {ids.map((id, i) => {
              const p = positions[id];
              if (!p) return null;
              return (
                <motion.div
                  key={id}
                  className="absolute"
                  initial={{ left: dims.w / 2, top: dims.h / 2, opacity: 0, scale: 0.6 }}
                  animate={{ left: p.x, top: p.y, opacity: 1, scale: 1 }}
                  transition={{ duration: 0.95, ease: EASE, delay: 0.25 + i * 0.12 }}
                  style={{ x: "-50%", y: "-50%" }}
                >
                  <AgentNode
                    ref={(el) => {
                      nodeRefs.current[id] = el;
                    }}
                    assignment={team.find((a) => a.agentId === id)!}
                    selected={selected === id}
                    status={status[id] ?? "ready"}
                    onSelect={() => setSelected(id)}
                  />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <MobileNetwork team={team} status={status} selected={selected} onSelect={setSelected} onRemove={remove} onChangeRole={changeRole} deploying={deploying} />
        )}

        {/* Detail panel */}
        {wide && (
          <div className="relative max-h-[min(52vh,500px)] min-h-[360px] overflow-y-auto rounded-[14px] pr-1">
            <AnimatePresence mode="wait">
              {sel && (
                <motion.div
                  key={sel.agentId}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <AgentDetail
                    assignment={sel}
                    status={status[sel.agentId] ?? "ready"}
                    canRemove={count > 1 && !deploying}
                    onRemove={() => remove(sel.agentId)}
                    onChangeRole={(r) => changeRole(sel.agentId, r)}
                    locked={deploying}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={cn("mt-6 flex items-center justify-between gap-3", !wide && "sticky bottom-3 z-10 mt-5 rounded-[16px] bg-black/80 p-2 backdrop-blur-xl hairline")}>
        <div className="relative">
          <Button variant="secondary" size={wide ? "md" : "sm"} icon={<Plus size={14} />} onClick={() => setAddOpen((o) => !o)} disabled={deploying} aria-expanded={addOpen}>
            Add agent
          </Button>
          <AnimatePresence>
            {addOpen && (
              <motion.ul
                className="panel-solid absolute bottom-12 left-0 z-30 w-[290px] p-1.5"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2 }}
              >
                {available.length === 0 && <li className="px-3 py-3 text-[13px] text-fg-3">Every intelligence is on this team.</li>}
                {available.map((a) => {
                  const soon = a.availability !== "available";
                  return (
                    <li key={a.id}>
                      <button
                        disabled={soon}
                        onClick={() => add(a.id)}
                        className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.05] disabled:hover:bg-transparent"
                      >
                        <AgentGlyph agent={a} size={30} animated={false} muted={soon} />
                        <span className="min-w-0 flex-1">
                          <span className={cn("block text-[13.5px]", soon ? "text-fg-3" : "text-white")}>{a.name}</span>
                          <span className="block truncate text-[11.5px] text-fg-3">{a.role}</span>
                        </span>
                        {soon && <span className="label">Soon</span>}
                      </button>
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <DeployButton count={count} deploying={deploying} onClick={deploy} compact={!wide} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function MissionCore({ deploying }: { deploying: boolean }) {
  return (
    <div className="relative flex h-[132px] w-[132px] items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-white/10" />
      <div className="absolute inset-[-14px] rounded-full border border-dashed border-white/[0.07] motion-safe:animate-spin-slow" />
      <motion.div
        className="absolute inset-3 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(100,91,255,0.35), rgba(69,108,255,0.08) 55%, transparent 72%)" }}
        animate={deploying ? { scale: [1, 1.25, 1.1], opacity: [0.7, 1, 0.9] } : { scale: [1, 1.06, 1], opacity: [0.6, 0.85, 0.6] }}
        transition={deploying ? { duration: 0.9, ease: EASE } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative text-center">
        <div className="label text-fg-1">Mission</div>
        <div className="mt-1.5 text-[12px] tabular-nums text-fg-3">{deploying ? "Deploying" : "Objective"}</div>
      </div>
    </div>
  );
}

const AgentNode = forwardRef<HTMLButtonElement, { assignment: AgentAssignment; selected: boolean; status: NodeStatus; onSelect(): void }>(function AgentNode(
  { assignment, selected, status, onSelect },
  ref,
) {
  const agent = agentOrFallback(assignment.agentId);
  const role = agent.roles.find((r) => r.id === assignment.roleId) ?? agent.roles[0];
  const active = status === "active";
  return (
    <button
      ref={ref}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${agent.name}, ${role?.label}. Status ${STATUS_LABEL[status]}`}
      className="group flex flex-col items-center gap-3 rounded-2xl p-2 text-center focus-visible:outline-offset-4"
    >
      <span className="relative flex h-[84px] w-[84px] items-center justify-center rounded-full">
        <span
          className="absolute inset-0 rounded-full transition-all duration-500"
          style={{
            boxShadow: selected || active ? `0 0 0 1px ${agent.accent.hex}, 0 0 40px -6px ${agent.accent.hex}` : "0 0 0 1px rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.55)",
          }}
        />
        {active && <span className="absolute inset-0 rounded-full motion-safe:animate-ping-once" style={{ boxShadow: `0 0 0 1px ${agent.accent.hex}` }} />}
        <AgentGlyph agent={agent} size={58} className="relative" />
      </span>
      <span>
        <span className="block text-[13px] font-semibold text-white">{agent.name}</span>
        <span className="mt-1 block text-[12px] text-fg-3">{role?.label}</span>
        <span className="mt-2 flex items-center justify-center gap-1.5 text-[12px]" style={{ color: status === "ready" ? "var(--color-fg-2)" : agent.accent.tint }}>
          <StatusDot color={status === "ready" ? "#a3a3aa" : agent.accent.hex} size={4} live={status !== "ready"} />
          {STATUS_LABEL[status]}
        </span>
      </span>
    </button>
  );
});

function AgentDetail({
  assignment,
  status,
  canRemove,
  onRemove,
  onChangeRole,
  locked,
}: {
  assignment: AgentAssignment;
  status: NodeStatus;
  canRemove: boolean;
  onRemove(): void;
  onChangeRole(roleId: string): void;
  locked: boolean;
}) {
  const agent = agentOrFallback(assignment.agentId);
  return (
    <div className="rounded-[24px] bg-white/[0.035] p-6">
      <div className="flex items-start gap-4">
        <AgentGlyph agent={agent} size={44} />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold text-white">{agent.name}</div>
          <div className="mt-1 text-[12.5px] text-fg-3">{agent.role}</div>
        </div>
        <span className="label flex items-center gap-1.5 text-[10px]" style={{ color: status === "ready" ? undefined : agent.accent.tint }}>
          <StatusDot color={status === "ready" ? "#a3a3aa" : agent.accent.hex} size={4} live={status !== "ready"} />
          {STATUS_LABEL[status]}
        </span>
      </div>

      <RoleSelect agentId={agent.id} value={assignment.roleId} onChange={onChangeRole} disabled={locked} />

      <p className="mt-4 text-[14px] leading-relaxed text-fg-2">{assignment.why}</p>

      <ul className="mt-5 divide-y divide-white/[0.06] overflow-hidden rounded-[16px] bg-white/[0.04]">
        {assignment.objectives.map((o) => (
          <li key={o} className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-white">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: agent.accent.hex }} />
            {o}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[14px] text-fg-1">
        <span className="text-fg-3">Delivers </span>
        {assignment.estimatedOutput}
      </p>

      {(assignment.tools.length > 0 || assignment.permissions.length > 0) && (
        <details className="group mt-4">
          <summary className="cursor-pointer list-none text-[14px] text-[#9aa5ff] hover:text-white">
            Tools and permissions <span className="inline-block transition-transform group-open:rotate-90">›</span>
          </summary>
          <div className="mt-3 space-y-2 text-[13px] text-fg-2">
            {assignment.tools.length > 0 && (
              <p>
                {assignment.tools
                  .map((t) => {
                    const i = getIntegration(t);
                    return i ? `${i.name}${i.status !== "live" ? ` (${integrationStatusLabel[i.status].toLowerCase()})` : ""}` : t;
                  })
                  .join(", ")}
              </p>
            )}
            {assignment.permissions.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </details>
      )}
      {canRemove && (
        <button onClick={onRemove} className="mt-5 flex items-center gap-1.5 text-[13px] text-fg-3 transition-colors hover:text-[#ff8ca0]">
          <X size={12} /> Remove from team
        </button>
      )}
    </div>
  );
}

function RoleSelect({ agentId, value, onChange, disabled }: { agentId: AgentId; value: string; onChange(v: string): void; disabled?: boolean }) {
  const agent = agentOrFallback(agentId);
  return (
    <label className="relative mt-4 block">
      <span className="sr-only">Change role</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-[9px] bg-white/[0.03] pl-3 pr-8 text-[12px] text-fg-1 hairline focus:outline-none"
      >
        {agent.roles.map((r) => (
          <option key={r.id} value={r.id} className="bg-black">
            {r.label}
          </option>
        ))}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-3" />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="label mb-2.5 text-[10px]">{title}</div>
      {children}
    </div>
  );
}

function MobileNetwork({
  team,
  status,
  selected,
  onSelect,
  onRemove,
  onChangeRole,
  deploying,
}: {
  team: AgentAssignment[];
  status: Record<AgentId, NodeStatus>;
  selected: AgentId | null;
  onSelect(id: AgentId | null): void;
  onRemove(id: AgentId): void;
  onChangeRole(id: AgentId, roleId: string): void;
  deploying: boolean;
}) {
  return (
    <div className="relative pl-7">
      <div className="absolute bottom-6 left-[13px] top-3 w-px bg-gradient-to-b from-indigo/60 via-white/15 to-transparent" aria-hidden />
      <div className="relative mb-4 flex items-center gap-3">
        <span className="absolute -left-[22px] flex h-3 w-3 items-center justify-center rounded-full bg-indigo shadow-[0_0_14px_#645bff]" />
        <span className="label text-fg-1">Mission</span>
        <span className="text-[12px] tabular-nums text-fg-3">{deploying ? "Deploying" : "Objective set"}</span>
      </div>
      <ul className="space-y-3">
        {team.map((a, i) => {
          const agent = agentOrFallback(a.agentId);
          const open = selected === a.agentId;
          const st = status[a.agentId] ?? "ready";
          return (
            <motion.li
              key={a.agentId}
              className="relative"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.6, ease: EASE }}
            >
              <span className="absolute -left-[19px] top-7 h-1.5 w-1.5 rounded-full" style={{ background: agent.accent.hex, boxShadow: `0 0 10px ${agent.accent.hex}` }} />
              <div className="panel overflow-hidden">
                <button className="flex w-full items-center gap-3 p-3.5 text-left" onClick={() => onSelect(open ? null : a.agentId)} aria-expanded={open}>
                  <AgentGlyph agent={agent} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-white">{agent.name}</span>
                    <span className="block truncate text-[12px] text-fg-3">{agent.domain}</span>
                  </span>
                  <span className="label flex items-center gap-1.5 text-[9.5px]" style={{ color: st === "ready" ? undefined : agent.accent.tint }}>
                    {st === "active" ? <Check size={11} /> : <StatusDot color={st === "ready" ? "#a3a3aa" : agent.accent.hex} size={4} live={st !== "ready"} />}
                    {STATUS_LABEL[st]}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                      <div className="border-t border-line px-3.5 pb-4 pt-1">
                        <RoleSelect agentId={a.agentId} value={a.roleId} onChange={(r) => onChangeRole(a.agentId, r)} disabled={deploying} />
                        <Section title="Why">
                          <p className="text-[13px] leading-relaxed text-fg-2">{a.why}</p>
                        </Section>
                        <Section title="Assigned">
                          <ul className="space-y-1">
                            {a.objectives.map((o) => (
                              <li key={o} className="text-[13px] text-fg-1">
                                · {o}
                              </li>
                            ))}
                          </ul>
                        </Section>
                        <Section title="Output">
                          <p className="text-[13px] text-fg-1">{a.estimatedOutput}</p>
                        </Section>
                        {team.length > 1 && !deploying && (
                          <button onClick={() => onRemove(a.agentId)} className="label mt-4 flex items-center gap-1.5 text-[10px] text-fg-3">
                            <X size={12} /> Remove
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

function DeployButton({ count, deploying, onClick, compact }: { count: number; deploying: boolean; onClick(): void; compact?: boolean }) {
  return (
    <Button
      variant="primary"
      size={compact ? "md" : "lg"}
      onClick={onClick}
      disabled={deploying}
      className={cn("min-w-[200px] disabled:opacity-100", compact && "min-w-0 flex-1")}
      data-deploy
      iconRight={
        <span className="relative flex h-2 w-2">
          <span className="absolute inset-0 rounded-full bg-[#8f9cff] motion-safe:animate-breathe" />
        </span>
      }
    >
      {deploying ? "Deploying…" : `Deploy ${count === 1 ? "1 agent" : `${count} agents`}`}
    </Button>
  );
}
