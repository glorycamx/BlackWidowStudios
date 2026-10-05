"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { BotScreen } from "@/components/bots/BotScreen";
import { Intro, Reveal, Section } from "@/components/home/Section";
import { StatusDot } from "@/components/ui/StatusDot";
import { bots } from "@/data/bots";
import { useBeats } from "@/lib/sim/heartbeats";
import { useNow } from "@/lib/hooks/useNow";
import { formatAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Agent } from "@/types";
import { tint } from "@/lib/tint";

/** Meet your bots: five on shift, two coming soon, and your own. */
export function MeetBotsSection() {
  const working = bots.filter((b) => b.availability === "available");
  const soon = bots.filter((b) => b.availability !== "available");
  return (
    <Section id="bots" className="py-[18vh]">
      <Intro title={["Meet your bots."]} sub="Each one has a job and keeps doing it, day and night. Or build your own." />
      <div className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {working.map((b, i) => (
          <Reveal key={b.id} delay={i * 0.05}>
            <BotCard bot={b} />
          </Reveal>
        ))}
        <Reveal delay={0.25}>
          <Link href="/team?create=1" className="group flex h-full min-h-[340px] flex-col justify-between rounded-[26px] border border-dashed border-white/15 p-6 transition-colors hover:border-white/30 hover:bg-white/[0.02]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-fg-2 group-hover:text-white">
              <Plus size={20} />
            </span>
            <span>
              <span className="block text-[24px] font-semibold tracking-[-0.02em] text-white">Create your own bot</span>
              <span className="mt-2 block max-w-[300px] text-[15px] leading-snug text-fg-2">Say what it should keep doing, in one sentence. It goes on shift right away.</span>
              <span className="mt-5 inline-block text-[15px] text-[#9aa5ff] group-hover:text-white">Build one ›</span>
            </span>
          </Link>
        </Reveal>
      </div>
      <Reveal delay={0.1}>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {soon.map((b) => (
            <li key={b.id} className="flex items-center gap-4 rounded-[22px] bg-white/[0.02] p-5 opacity-60 hairline">
              <AgentGlyph agent={b} size={40} muted />
              <div className="min-w-0">
                <div className="text-[16px] font-semibold text-white">
                  {b.name} <span className="ml-1.5 rounded-full bg-white/[0.06] px-2 py-0.5 align-middle text-[11px] font-normal text-fg-3">Coming soon</span>
                </div>
                <div className="mt-0.5 text-[14px] text-fg-3">{b.role}</div>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}

function BotCard({ bot }: { bot: Agent }) {
  const beat = useBeats((s) => s.latest[bot.id]);
  const now = useNow(1000);
  return (
    <Link href={`/bots/${bot.slug}`} className={cn("panel-solid group flex h-full flex-col p-5 transition-colors hover:bg-white/[0.03]")}>
      <div className="flex items-center gap-3">
        <AgentGlyph agent={bot} size={40} />
        <div className="min-w-0">
          <div className="text-[19px] font-semibold tracking-[-0.02em] text-white">{bot.name}</div>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: tint(bot.accent) }}>
            <StatusDot color={bot.accent.hex} size={4} />
            {beat ? `On shift · checked ${formatAgo(beat.at, now)}` : "On shift"}
          </div>
        </div>
      </div>
      <p className="mt-4 text-[16px] leading-snug text-fg-1">{bot.role}.</p>
      <BotScreen bot={bot} compact className="mt-5" />
      <span className="mt-4 text-[14px] text-[#9aa5ff] group-hover:text-white">Meet {bot.name} ›</span>
    </Link>
  );
}
