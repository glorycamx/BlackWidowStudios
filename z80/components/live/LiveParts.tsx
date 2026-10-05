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
import { formatAgo, formatLocalTime, isNight } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Agent } from "@/types";
import { tint } from "@/lib/tint";

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
export function Greeting({ hot, needsYou, posted }: { hot: number; needsYou: number; posted: number }) {
  const now = useNow(30000);
  const h = new Date(now).getHours();
  const night = isNight(now);
  const hello = night ? `It's ${formatLocalTime(now)}. Your bots are still at it.` : h < 12 ? "Good morning." : h < 18 ? "Good afternoon." : "Good evening.";
  const bits = [
    hot ? `${hot} hot lead${hot === 1 ? "" : "s"} today` : "No hot leads yet today",
    posted ? `${posted} post${posted === 1 ? "" : "s"} went out` : "",
    needsYou ? `${needsYou} thing${needsYou === 1 ? "" : "s"} need${needsYou === 1 ? "s" : ""} you` : "nothing needs you",
  ].filter(Boolean);
  return (
    <div>
      <h1 className="text-[clamp(30px,3.4vw,44px)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">{hello}</h1>
      <p className="mt-2 text-[clamp(16px,1.3vw,18px)] text-fg-2">
        {bits.slice(0, -1).join(", ")}{bits.length > 1 ? " and " : ""}{bits[bits.length - 1]}.{night ? " Sleep. They've got it." : ""}
      </p>
    </div>
  );
}

/** One calm list: every bot, what it's doing this second. */
export function TeamNow({ bots, paused }: { bots: Agent[]; paused: string[] }) {
  return (
    <section aria-label="Your team right now" className="panel overflow-hidden">
      <div className="flex items-center justify-between px-5 pb-1 pt-4">
        <h2 className="text-[15px] font-semibold text-white">Your team right now</h2>
        <Link href="/team" className="text-[13px] text-fg-3 hover:text-white">
          See all
        </Link>
      </div>
      <ul className="divide-y divide-white/[0.05]">
        {bots.map((a) => (
          <BotNowRow key={a.id} agent={a} paused={paused.includes(a.id)} />
        ))}
      </ul>
    </section>
  );
}

function BotNowRow({ agent, paused }: { agent: Agent; paused: boolean }) {
  const beat = useBeats((b) => b.latest[agent.id]);
  const name = useBotName(agent.id);
  const now = useNow(1000);
  return (
    <li>
      <Link href={`/team/${agent.slug}`} className={cn("flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/[0.025]", paused && "opacity-60")}>
        <AgentGlyph agent={agent} size={34} animated={!paused} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium text-white">{name}</span>
            <StatusDot color={paused ? "#8e93a8" : tint(agent.accent)} size={4} live={!paused} />
          </div>
          <p className="truncate text-[14px] text-fg-2" aria-live="off">
            {paused ? "Paused." : beat?.text ?? "Starting up."}
          </p>
        </div>
        <span className="hidden shrink-0 text-[12px] tabular-nums text-fg-4 sm:block">{paused ? "" : beat ? formatAgo(beat.at, now) : ""}</span>
      </Link>
    </li>
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
