"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { Toggle } from "@/components/bots/Toggle";
import { useBotName } from "@/components/bots/useBot";
import { agentOrFallback } from "@/data/bots";
import { describeTrigger } from "@/data/routines";
import { COPY } from "@/lib/copy";
import { useBeats } from "@/lib/sim/heartbeats";
import { useNow } from "@/lib/hooks/useNow";
import { workspace } from "@/lib/store/workspace";
import { formatAgo, formatCountdown, formatDayTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Routine } from "@/types";

/** Engines that send or post things, where "Do it without asking" matters. */
const ACTS = new Set(["post-schedule", "keep-drafted", "lead-openers", "morning-text", "evening-recap", "chase-approvals", "custom"]);

function nextLabel(r: Routine, now: number) {
  if (r.status !== "on") return "Paused";
  if (r.trigger.kind === "event") return "Waiting for it to happen";
  if (!r.nextRunAt) return "Starting";
  if (r.trigger.kind === "schedule") return `Next ${formatDayTime(r.nextRunAt, now)}`;
  return `Next check ${formatCountdown(r.nextRunAt, now)}`;
}

/** One routine: what it does, when, its countdown, and its switches. */
export function RoutineRow({ routine, showBot }: { routine: Routine; showBot?: boolean }) {
  const now = useNow(1000);
  const checks = useBeats((b) => b.checks[routine.id] ?? 0);
  const bot = agentOrFallback(routine.botId);
  const name = useBotName(routine.botId);
  const on = routine.status === "on";
  return (
    <li className={cn("py-4", !on && "opacity-60")}>
      <div className="flex items-start gap-4">
        {showBot && (
          <Link href={`/team/${bot.slug}`} className="mt-0.5 shrink-0" aria-label={name}>
            <AgentGlyph agent={bot} size={30} animated={on} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[15px] text-white">{routine.title}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-fg-3">
            {showBot && <span style={{ color: bot.accent.tint }}>{name}</span>}
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-fg-2">{describeTrigger(routine.trigger)}</span>
            <span className="tabular-nums">{nextLabel(routine, now)}</span>
            {routine.lastRunAt && <span className="tabular-nums text-fg-4">Ran {formatAgo(routine.lastRunAt, now)}</span>}
          </div>
          <div className="mt-1.5 text-[12px] tabular-nums text-fg-4">
            {(routine.stats.checks + checks).toLocaleString("en-US")} checks · {routine.stats.finds} found
            {routine.engine === "post-schedule" && ` · ${routine.stats.onTime} on time · ${routine.stats.missed} held`}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {on && routine.trigger.kind !== "event" && (
            <button onClick={() => workspace.runNow(routine.id)} className="hidden items-center gap-1 text-[12px] text-fg-3 hover:text-white sm:flex" title="Demo control: run it now">
              <Play size={11} /> Run now
            </button>
          )}
          <Toggle on={on} onChange={() => workspace.toggleRoutine(routine.id)} label={`${on ? "Pause" : "Resume"} ${routine.title}`} color={bot.accent.hex} />
        </div>
      </div>
      {ACTS.has(routine.engine) && (
        <label className={cn("mt-3 flex items-center justify-between gap-3 rounded-[12px] bg-white/[0.025] px-3 py-2.5", showBot && "ml-[46px]")}>
          <span className="min-w-0">
            <span className="block text-[13px] text-fg-1">{COPY.doWithoutAsking}</span>
            <span className="block text-[12px] text-fg-4">{COPY.doWithoutAskingHelp}</span>
          </span>
          <Toggle size="sm" on={routine.doWithoutAsking} onChange={(v) => workspace.setDoWithoutAsking(routine.id, v)} label={`${COPY.doWithoutAsking}: ${routine.title}`} color="#d77bff" />
        </label>
      )}
    </li>
  );
}
