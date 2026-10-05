"use client";

import { useState } from "react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { PageHeader, PageWrap } from "@/components/app/primitives";
import { AddRoutine } from "@/components/bots/AddRoutine";
import { RoutineRow } from "@/components/bots/RoutineRow";
import { useBotName, useWorkingBots } from "@/components/bots/useBot";
import { scheduledBetween } from "@/data/routines";
import { useNow } from "@/lib/hooks/useNow";
import { useWorkspace } from "@/lib/store/workspace";
import { formatLocalTime } from "@/lib/time";
import { cn, plural } from "@/lib/utils";
import type { Agent, Routine, ScheduledPost } from "@/types";

const VIEWS = [
  { id: "list", label: "All routines" },
  { id: "lanes", label: "Next 24 hours" },
] as const;

/** Every routine, in one place. Add one in plain English. */
export function RoutinesView() {
  const routines = useWorkspace((s) => s.routines);
  const posts = useWorkspace((s) => s.posts);
  const bots = useWorkingBots();
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("list");
  const on = routines.filter((r) => r.status === "on").length;

  return (
    <PageWrap>
      <PageHeader label={`${plural(on, "routine")} running`} title="Routines" sub="What your bots keep doing, day and night. Add one in plain English." />
      <div className="mt-10 max-w-[720px]">
        <AddRoutine placeholder="Try: every morning at 8, find new roofers in Nashua" />
      </div>

      <div role="tablist" aria-label="View" className="mt-10 flex gap-1">
        {VIEWS.map((v) => (
          <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)} className={cn("h-8 rounded-[9px] px-3 text-[13px] transition-colors", view === v.id ? "bg-white/[0.08] text-white" : "text-fg-3 hover:text-fg-1")}>
            {v.label}
          </button>
        ))}
      </div>

      {view === "list" ? (
        <div className="mt-6 space-y-6">
          {bots.map((b) => {
            const mine = routines.filter((r) => r.botId === b.id);
            if (!mine.length) return null;
            return <BotGroup key={b.id} bot={b} routines={mine} />;
          })}
        </div>
      ) : (
        <Lanes bots={bots} routines={routines} posts={posts} />
      )}
    </PageWrap>
  );
}

function BotGroup({ bot, routines }: { bot: Agent; routines: Routine[] }) {
  const name = useBotName(bot.id);
  return (
    <section className="panel p-5" aria-label={name}>
      <div className="flex items-center gap-3">
        <AgentGlyph agent={bot} size={28} />
        <h2 className="text-[15px] font-medium text-white">{name}</h2>
        <span className="text-[12px] text-fg-4">{plural(routines.length, "routine")}</span>
      </div>
      <ul className="mt-1 divide-y divide-white/[0.05]">
        {routines.map((r) => (
          <RoutineRow key={r.id} routine={r} />
        ))}
      </ul>
    </section>
  );
}

const SPAN = 24 * 3600e3;

/** One lane per bot across the next 24 hours: always-on bands and scheduled runs. */
function Lanes({ bots, routines, posts }: { bots: Agent[]; routines: Routine[]; posts: ScheduledPost[] }) {
  const now = useNow(60000);
  const end = now + SPAN;
  const pct = (t: number) => `${(((t - now) / SPAN) * 100).toFixed(3)}%`;
  const ticks: number[] = [];
  const first = new Date(now);
  first.setMinutes(0, 0, 0);
  for (let t = first.getTime() + 3600e3; t < end - 3600e3; t += 3600e3) if (new Date(t).getHours() % 3 === 0 && t - now > 100 * 60e3) ticks.push(t);

  return (
    <div className="mt-6 overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="relative ml-[160px] h-6 text-[11px] tabular-nums text-fg-4">
          <span className="absolute left-0">Now</span>
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2" style={{ left: pct(t) }}>
              {formatLocalTime(t).replace(":00", "")}
            </span>
          ))}
        </div>
        <div className="space-y-2">
          {bots.map((b) => {
            const mine = routines.filter((r) => r.botId === b.id && r.status === "on");
            const always = mine.filter((r) => r.trigger.kind === "always" || (r.trigger.kind === "every" && r.trigger.minutes < 30));
            const marks: { at: number; title: string; kind: "run" | "post" }[] = [];
            for (const r of mine) {
              if (r.trigger.kind === "schedule") scheduledBetween(r.trigger, now, end).forEach((at) => marks.push({ at, title: r.title, kind: "run" }));
              if (r.trigger.kind === "every" && r.trigger.minutes >= 30) for (let t = r.nextRunAt || now; t < end; t += r.trigger.minutes * 60e3) marks.push({ at: t, title: r.title, kind: "run" });
            }
            if (b.id === "content-creator") posts.filter((p) => p.scheduledFor > now && p.scheduledFor < end && (p.status === "scheduled" || p.status === "needs-ok")).forEach((p) => marks.push({ at: p.scheduledFor, title: `Post at ${formatLocalTime(p.scheduledFor)}${p.status === "needs-ok" ? " (needs your OK)" : ""}`, kind: "post" }));
            return (
              <div key={b.id} className="flex items-center gap-4">
                <div className="flex w-[144px] shrink-0 items-center gap-2">
                  <AgentGlyph agent={b} size={22} animated={false} />
                  <LaneName id={b.id} />
                </div>
                <div className="relative h-10 flex-1 rounded-[10px] bg-white/[0.025]">
                  {always.length > 0 && (
                    <div className="absolute inset-y-[14px] left-0 right-0 rounded-full" style={{ background: `linear-gradient(90deg, rgba(${b.accent.rgb} / 0.45), rgba(${b.accent.rgb} / 0.18))` }} title={`${plural(always.length, "always-on routine")}`} />
                  )}
                  {ticks.map((t) => (
                    <div key={t} className="absolute inset-y-0 w-px bg-white/[0.04]" style={{ left: pct(t) }} />
                  ))}
                  {marks.map((m, i) => (
                    <span key={i} title={`${m.title} · ${formatLocalTime(m.at)}`} className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: pct(m.at), background: m.kind === "post" ? "#fff" : b.accent.hex, boxShadow: "0 0 0 3px #0b0b10" }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 ml-[160px] text-[12px] text-fg-4">Bands are always-on routines. Dots are scheduled runs. White dots are posts.</p>
      </div>
    </div>
  );
}

function LaneName({ id }: { id: string }) {
  const name = useBotName(id);
  return <span className="truncate text-[13px] text-fg-1">{name}</span>;
}
