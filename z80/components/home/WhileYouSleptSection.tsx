"use client";

import { useEffect, useState } from "react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { Display, Reveal, Section } from "@/components/home/Section";
import { agentOrFallback } from "@/data/bots";
import { routineFromTemplate, routineTemplates } from "@/data/routines";
import { backfill } from "@/lib/sim/scheduler";
import { formatLocalTime, isNight, startOfDay } from "@/lib/time";
import type { FeedItem } from "@/types";
import { tint } from "@/lib/tint";

interface Night {
  live: boolean;
  from: number;
  to: number;
  lines: { at: number; bot: string; text: string }[];
  checks: number;
  leads: number;
  hours: number;
}

function line(f: FeedItem): string {
  if (f.kind === "lead" && f.lead) return `Found ${f.lead.business}. ${f.trigger} at ${formatLocalTime(f.happenedAt ?? f.at)}, caught at ${formatLocalTime(f.foundAt ?? f.at)}.`;
  if (f.kind === "post") return `${f.title} at ${formatLocalTime(f.at)}. On the minute.`;
  if (f.kind === "digest") return `Sent your ${f.trigger.toLowerCase()}.`;
  if (f.kind === "brief") return `${f.trigger}: ${f.title}.`;
  if (f.kind === "opportunity") return `Spotted: ${f.title}.`;
  if (f.kind === "reminder") return `Lined up a reminder: ${f.title}.`;
  return f.title;
}

/** Replay a night: tonight so far if it's night where you are, otherwise last night. */
function replay(now: number): Night {
  const live = isNight(now);
  const today = startOfDay(now);
  const from = live ? (new Date(now).getHours() >= 22 ? today + 22 * 3600e3 : today - 2 * 3600e3) : today - 2 * 3600e3;
  const to = live ? now : today + 6 * 3600e3 + 60e3;
  const routines = routineTemplates.map((t) => routineFromTemplate(t, from - 86400e3));
  const res = backfill({ routines, feed: [], posts: [], pendingApprovals: 1, pausedBots: [] }, from, Math.max(from + 60e3, to), { maxFinds: 40 });
  const finds = res.finds.filter((f) => f.kind !== "post" || f.at <= to);
  const pick = finds.filter((f) => f.kind !== "reminder").slice(-10);
  return {
    live,
    from,
    to,
    lines: pick.map((f) => ({ at: f.happenedAt && f.kind === "lead" ? f.foundAt ?? f.at : f.at, bot: f.botId, text: line(f) })),
    checks: Object.values(res.checks).reduce((a, c) => a + c.n, 0),
    leads: finds.filter((f) => f.kind === "lead").length,
    hours: Math.max(1, Math.round((to - from) / 3600e3)),
  };
}

/** While you slept: a night of work, line by line. */
export function WhileYouSleptSection() {
  const [night, setNight] = useState<Night | null>(null);
  useEffect(() => setNight(replay(Date.now())), []);

  return (
    <Section id="night" className="py-[18vh]">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
        <div className="lg:sticky lg:top-[20vh] lg:self-start">
          <Display lines={night?.live ? ["Tonight,", "so far."] : ["While you", "slept."]} className="text-[clamp(44px,6vw,96px)]" />
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-[420px] text-[clamp(18px,1.6vw,22px)] leading-[1.4] text-fg-2">
              {night?.live ? "It's late where you are. Here's what your bots have done since 10 PM." : "A sample night, replayed in your time zone. Every line is something a bot did on its own."}
            </p>
          </Reveal>
        </div>
        <div>
          <ol className="relative space-y-2 border-l border-white/[0.08] pl-6">
            {(night?.lines ?? []).map((l, i) => {
              const a = agentOrFallback(l.bot);
              return (
                <li key={i}>
                  <Reveal y={10}>
                    <div className="relative rounded-[16px] px-4 py-3 transition-colors hover:bg-white/[0.02]">
                      <span className="absolute -left-[29px] top-5 h-2 w-2 rounded-full" style={{ background: a.accent.hex, boxShadow: `0 0 10px ${a.accent.hex}` }} aria-hidden />
                      <div className="flex items-center gap-2 text-[12px] tabular-nums text-fg-3">
                        <span className="text-white">{formatLocalTime(l.at)}</span>
                        <AgentGlyph agent={a} size={16} animated={false} />
                        <span style={{ color: tint(a.accent) }}>{a.name}</span>
                      </div>
                      <p className="mt-1 text-[16px] leading-snug text-fg-1">{l.text}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
          {night && (
            <Reveal delay={0.1}>
              <div className="mt-10 pl-6">
                <p className="text-[clamp(28px,3vw,40px)] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
                  {night.live ? `${night.hours} hours in. They're still going.` : `You slept ${night.hours} hours. They didn't.`}
                </p>
                <p className="mt-3 text-[15px] tabular-nums text-fg-3">
                  {night.checks.toLocaleString("en-US")} checks · {night.leads} leads found · sample data
                </p>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </Section>
  );
}
