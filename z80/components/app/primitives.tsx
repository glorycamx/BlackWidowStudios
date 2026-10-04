"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { StatusDot } from "@/components/ui/StatusDot";
import { agentOrFallback } from "@/data/agents";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Actor, MissionStatus } from "@/types";

export function PageHeader({ label, title, sub, actions, className }: { label?: ReactNode; title: ReactNode; sub?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {label && <div className="label">{label}</div>}
        <h1 className="mt-2 text-[clamp(34px,4.4vw,56px)] font-semibold leading-[1] tracking-[-0.04em] text-white">{title}</h1>
        {sub && <p className="mt-3 max-w-[560px] text-[19px] leading-snug text-fg-2">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function PageWrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1240px] px-5 py-8 md:px-10 md:py-12", className)}>{children}</div>;
}

/** Name + accent dot for an agent, Z80 or the user. */
export function ActorTag({ actor, className }: { actor: Actor; className?: string }) {
  if (actor === "z80") return <span className={cn("text-[12px] text-white", className)}>Z80</span>;
  if (actor === "user") return <span className={cn("text-[12px] text-fg-2", className)}>You</span>;
  const a = agentOrFallback(actor);
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px]", className)} style={{ color: a.accent.tint }}>
      <span className="h-1 w-1 rounded-full" style={{ background: a.accent.hex }} />
      {a.name}
    </span>
  );
}

export function AgentStack({ ids, size = 24 }: { ids: string[]; size?: number }) {
  return (
    <span className="flex -space-x-1.5">
      {ids.map((id) => (
        <span key={id} className="rounded-full bg-black ring-2 ring-black">
          <AgentGlyph agent={agentOrFallback(id)} size={size} animated={false} />
        </span>
      ))}
    </span>
  );
}

const STATUS: Record<MissionStatus, { label: string; color: string; live: boolean }> = {
  running: { label: "Running", color: "var(--color-run)", live: true },
  "awaiting-approval": { label: "Awaiting approval", color: "var(--color-attn)", live: true },
  paused: { label: "Paused", color: "#a3a3aa", live: false },
  complete: { label: "Complete", color: "#f5f5f7", live: false },
  interrupted: { label: "Interrupted", color: "var(--color-err)", live: true },
};

export function MissionStatusBadge({ status, className }: { status: MissionStatus; className?: string }) {
  const s = STATUS[status];
  return (
    <span className={cn("label inline-flex items-center gap-2 text-[10px]", className)} style={{ color: s.color }}>
      <StatusDot color={s.color} size={5} live={s.live} />
      {s.label}
    </span>
  );
}

export function ProgressBar({ value, status, className }: { value: number; status?: MissionStatus; className?: string }) {
  const color = status === "complete" ? "#f5f5f7" : status === "awaiting-approval" ? "linear-gradient(90deg,#456cff,#d77bff)" : status === "interrupted" ? "#ff5c7a" : "linear-gradient(90deg,#456cff,#8754ff)";
  return (
    <div className={cn("relative h-[3px] overflow-hidden rounded-full bg-white/[0.07]", className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: color }} animate={{ width: `${Math.max(2, value * 100)}%` }} transition={{ duration: 0.8, ease: EASE }} />
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: { label: string; href?: string; onClick?: () => void } }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="relative mb-8 h-16 w-16">
        <span className="absolute inset-0 rounded-full border border-white/10" />
        <span className="absolute inset-[-10px] rounded-full border border-dashed border-white/[0.06] motion-safe:animate-spin-slow" />
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
      </div>
      <h2 className="text-[13px] font-semibold text-white">{title}</h2>
      <p className="mt-3 max-w-[360px] text-[15px] text-fg-2">{body}</p>
      {action &&
        (action.href ? (
          <Link href={action.href} className="mt-8 inline-flex h-10 items-center rounded-[11px] bg-white px-5 text-[11px] font-medium text-black hover:bg-[#e9e9ee]">
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className="mt-8 inline-flex h-10 items-center rounded-[11px] bg-white px-5 text-[11px] font-medium text-black hover:bg-[#e9e9ee]">
            {action.label}
          </button>
        ))}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="label">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
