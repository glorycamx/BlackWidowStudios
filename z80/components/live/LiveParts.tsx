"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { useBotName } from "@/components/bots/useBot";
import { StatusDot } from "@/components/ui/StatusDot";
import { agentOrFallback } from "@/data/bots";
import { useBeats } from "@/lib/sim/heartbeats";
import { useNow } from "@/lib/hooks/useNow";
import { useWorkspace, workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { formatAgo, formatCountdown, formatLocalTime, isNight } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Agent } from "@/types";

function duration(ms: number) {
  const m = Math.round(ms / 60e3);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm ? `${h}h ${rm}m` : `${h}h`;
}

/** What the bots did while the app was closed or the tab was hidden. */
export function AwayCard() {
  const away = useWorkspace((s) => s.away);
  const top = useWorkspace((s) => (s.away ? s.away.top.map((id) => s.feed.find((f) => f.id === id)).filter(Boolean) : []));
  return (
    <AnimatePresence>
      {away && (
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          aria-label="While you were away"
          className="panel-solid relative mt-8 overflow-hidden p-6 md:p-7"
        >
          <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #8f9cff, #d77bff, transparent)" }} />
          <button onClick={() => workspace.dismissAway()} aria-label="Dismiss" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-[8px] text-fg-3 hover:text-white">
            <X size={15} />
          </button>
          <div className="text-[13px] text-fg-3">
            While you were away · {formatLocalTime(away.from)} to {formatLocalTime(away.to)} ({duration(away.to - away.from)})
          </div>
          <h2 className="mt-2 text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[-0.02em] text-white">
            {away.leads ? `${away.leads} new lead${away.leads === 1 ? "" : "s"}${away.hot ? `, ${away.hot} hot` : ""}.` : "No new leads."} Your bots never stopped.
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px] tabular-nums text-fg-2">
            <span>{away.checks.toLocaleString("en-US")} checks</span>
            {away.posts > 0 && <span>{away.posts} posted on time</span>}
            {away.opportunities > 0 && <span>{away.opportunities} way{away.opportunities === 1 ? "" : "s"} to make money</span>}
            {away.briefs > 0 && <span>{away.briefs} news brief{away.briefs === 1 ? "" : "s"}</span>}
          </div>
          {top.length > 0 && (
            <ul className="mt-5 grid gap-2 md:grid-cols-3">
              {top.map((f) => (
                <li key={f!.id}>
                  <Link href={`/live?id=${f!.id}`} className="block rounded-[14px] bg-white/[0.04] px-4 py-3 transition-colors hover:bg-white/[0.07]">
                    <span className="block text-[12px] text-fg-3">
                      {f!.trigger} · {formatLocalTime(f!.happenedAt ?? f!.at)}
                    </span>
                    <span className="mt-0.5 block truncate text-[14px] text-white">{f!.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
}

/** A greeting that knows what time it is. */
export function Greeting({ hot, needsYou }: { hot: number; needsYou: number }) {
  const now = useNow(30000);
  const h = new Date(now).getHours();
  const night = isNight(now);
  const hello = night ? `It's ${formatLocalTime(now)}. Your bots are still at it.` : h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening.";
  const bits = [hot ? `${hot} hot lead${hot === 1 ? "" : "s"} today` : "No hot leads yet today", needsYou ? `${needsYou} thing${needsYou === 1 ? "" : "s"} need${needsYou === 1 ? "s" : ""} you` : "nothing needs you"];
  return (
    <div>
      <h1 className="text-[clamp(34px,4.4vw,56px)] font-semibold leading-[1] tracking-[-0.035em] text-white">{hello}</h1>
      <p className="mt-3 text-[clamp(16px,1.4vw,19px)] text-fg-2">
        {bits[0]}, {bits[1]}.{night ? " Sleep. They've got it." : ""}
      </p>
    </div>
  );
}

/** One bot's live status card for the Right now strip. */
export function BotNowCard({ agent, paused, finds }: { agent: Agent; paused: boolean; finds: number }) {
  const beat = useBeats((b) => b.latest[agent.id]);
  const checks = useBeats((b) => b.botChecks[agent.id] ?? 0);
  const name = useBotName(agent.id);
  const next = useWorkspace((s) => {
    const times = s.routines.filter((r) => r.botId === agent.id && r.status === "on" && r.nextRunAt > 0).map((r) => r.nextRunAt);
    return times.length ? Math.min(...times) : 0;
  });
  const now = useNow(1000);
  return (
    <Link href={`/team/${agent.slug}`} className={cn("panel flex w-[78vw] max-w-[300px] shrink-0 snap-start flex-col p-4 transition-colors hover:bg-white/[0.03] sm:w-auto sm:max-w-none", paused && "opacity-60")}>
      <div className="flex items-center gap-3">
        <AgentGlyph agent={agent} size={32} animated={!paused} />
        <div className="min-w-0">
          <div className="truncate text-[14px] font-medium text-white">{name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px]" style={{ color: paused ? undefined : agent.accent.tint }}>
            <StatusDot color={paused ? "#686872" : agent.accent.hex} size={4} live={!paused} />
            {paused ? "Paused" : beat ? `Checked ${formatAgo(beat.at, now)}` : "On shift"}
          </div>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 min-h-[2.6em] text-[13px] leading-snug text-fg-2" aria-live="off">
        {paused ? "Paused." : beat?.text ?? "Starting up."}
      </p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[12px] tabular-nums text-fg-4">
        <span>
          {checks.toLocaleString("en-US")} {checks === 1 ? "check" : "checks"} · {finds} found
        </span>
        {!paused && next > now && next - now < 3600e3 && <span>next {formatCountdown(next, now)}</span>}
      </div>
    </Link>
  );
}

export function Counter({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[clamp(26px,2.6vw,34px)] font-medium tabular-nums leading-none tracking-[-0.02em]" style={{ color: color ?? "#fff" }}>
        {value}
      </div>
      <div className="mt-1.5 text-[13px] text-fg-3">{label}</div>
    </div>
  );
}

export function BotTag({ id }: { id: string }) {
  const name = useBotName(id);
  const a = agentOrFallback(id);
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-fg-3">
      <AgentGlyph agent={a} size={16} animated={false} />
      <span className="truncate">{name}</span>
    </span>
  );
}
