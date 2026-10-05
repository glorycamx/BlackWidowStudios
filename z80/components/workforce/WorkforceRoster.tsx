"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { PageHeader, PageWrap } from "@/components/app/primitives";
import { CreateBotDialog } from "@/components/bots/CreateBotDialog";
import { useRoster } from "@/components/bots/useBot";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { COPY } from "@/lib/copy";
import { useBeats } from "@/lib/sim/heartbeats";
import { useNow } from "@/lib/hooks/useNow";
import { useWorkspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { formatAgo } from "@/lib/time";
import { cn, plural } from "@/lib/utils";
import type { Agent } from "@/types";

/** Your team: every bot, what it's doing right now, plus your own. */
export function WorkforceRoster() {
  const roster = useRoster();
  const paused = useWorkspace((s) => s.pausedAgents);
  const [creating, setCreating] = useState(false);
  const params = useSearchParams();
  useEffect(() => {
    if (params.get("create")) setCreating(true);
  }, [params]);
  const working = roster.filter((a) => a.availability === "available");
  const onShift = working.filter((a) => !paused.includes(a.id)).length;

  return (
    <PageWrap>
      <PageHeader
        label={
          <span className="flex items-center gap-2.5">
            <StatusDot color="var(--color-run)" size={5} live={onShift > 0} />
            {plural(onShift, "bot")} on shift
          </span>
        }
        title="Your team"
        sub="They work around the clock. Or build your own bot in a sentence."
        actions={
          <Button variant="solid" icon={<Plus size={14} />} onClick={() => setCreating(true)}>
            Create your own bot
          </Button>
        }
      />
      <ul className="mt-12 border-t border-line">
        {roster.map((a, i) => (
          <motion.li key={a.id} className="border-b border-line" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.04, ease: EASE }}>
            <RosterRow agent={a} paused={paused.includes(a.id)} />
          </motion.li>
        ))}
        <li className="border-b border-line">
          <button onClick={() => setCreating(true)} className="group grid w-full grid-cols-[auto_1fr] items-center gap-5 px-1 py-6 text-left transition-colors hover:bg-white/[0.015] md:grid-cols-[64px_1fr_24px] md:gap-8">
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-dashed border-white/20 text-fg-2 group-hover:text-white">
              <Plus size={18} />
            </span>
            <span>
              <span className="block text-[17px] font-semibold text-white">Create your own bot</span>
              <span className="mt-1 block text-[13px] text-fg-3">{COPY.buildYourOwn} It starts working right away.</span>
            </span>
            <ChevronRight size={16} className="hidden text-fg-4 md:block" />
          </button>
        </li>
      </ul>
      <CreateBotDialog open={creating} onClose={() => setCreating(false)} />
    </PageWrap>
  );
}

function RosterRow({ agent: a, paused }: { agent: Agent; paused: boolean }) {
  const soon = a.availability !== "available";
  const beat = useBeats((b) => b.latest[a.id]);
  const checks = useBeats((b) => b.botChecks[a.id] ?? 0);
  const nick = useWorkspace((s) => s.nicknames[a.id]);
  const routines = useWorkspace((s) => s.routines.filter((r) => r.botId === a.id && r.status === "on").length);
  const now = useNow(1000);
  const color = soon || paused ? "#686872" : a.accent.hex;
  const row = (
    <div className={cn("grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-2 py-6 md:grid-cols-[64px_minmax(0,1fr)_minmax(0,1.4fr)_150px_24px] md:gap-x-8", soon && "opacity-50")}>
      <AgentGlyph agent={a} size={52} animated={!soon && !paused} muted={soon} />
      <div className="min-w-0">
        <div className="text-[17px] font-semibold text-white">
          {nick ?? a.name}
          {a.custom && <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 align-middle text-[11px] font-normal text-fg-3">Yours</span>}
        </div>
        <div className="mt-1 text-[13px] text-fg-3">{a.role}</div>
      </div>
      <div className="col-span-3 min-w-0 md:col-span-1">
        <div className="flex items-center gap-2 text-[12px]" style={{ color: soon || paused ? undefined : a.accent.tint }}>
          <StatusDot color={color} size={5} live={!soon && !paused} />
          {soon ? "Coming soon" : paused ? "Paused" : beat ? `Checked ${formatAgo(beat.at, now)}` : "On shift"}
        </div>
        <div className="mt-1.5 truncate text-[14px] text-fg-1">{soon ? a.shortDescription : paused ? "Waiting for you to bring it back." : beat?.text ?? "Starting up."}</div>
      </div>
      <div className="hidden text-[13px] tabular-nums text-fg-3 md:block">
        {!soon && (
          <>
            <div>{plural(routines, "routine")}</div>
            <div className="mt-1">{checks.toLocaleString("en-US")} checks today</div>
          </>
        )}
      </div>
      {!soon && <ChevronRight size={16} className="hidden text-fg-4 transition-transform group-hover:translate-x-0.5 group-hover:text-fg-1 md:block" />}
    </div>
  );
  return soon ? (
    <div aria-label={`${a.name}, coming soon`}>{row}</div>
  ) : (
    <Link href={`/team/${a.slug}`} className="group block px-1 transition-colors hover:bg-white/[0.015]">
      {row}
    </Link>
  );
}
