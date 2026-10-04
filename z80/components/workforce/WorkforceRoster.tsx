"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { PageHeader, PageWrap } from "@/components/app/primitives";
import { StatusDot } from "@/components/ui/StatusDot";
import { agents } from "@/data/agents";
import { agentStateLabel, getAgentLiveState } from "@/lib/services/agentService";
import { selectMissions, useWorkspace } from "@/lib/store/workspace";
import { useNow } from "@/lib/hooks/useNow";
import { EASE } from "@/lib/motion";
import { cn, plural } from "@/lib/utils";

/** The roster — a register of intelligences, not a card grid. */
export function WorkforceRoster() {
  const missions = useWorkspace(selectMissions);
  const approvals = useWorkspace((s) => s.approvals);
  const activity = useWorkspace((s) => s.activity);
  const paused = useWorkspace((s) => s.pausedAgents);
  const now = useNow(20000);
  const states = agents.map((a) => ({ a, st: getAgentLiveState(a.id, missions, Object.values(approvals), activity, paused, now)! }));
  const deployed = states.filter((x) => x.a.availability === "available");
  const working = deployed.filter((x) => x.st.state === "working" || x.st.state === "active").length;

  return (
    <PageWrap>
      <PageHeader
        label={`${plural(deployed.length, "intelligence")} · ${working} working`}
        title="Your workforce"
        sub="Every intelligence on your team, what it is doing right now, and what it has done today."
      />
      <ul className="mt-12 border-t border-line">
        {states.map(({ a, st }, i) => {
          const soon = a.availability !== "available";
          const color = soon ? "#3d3d45" : st.state === "waiting" ? "var(--color-attn)" : st.state === "idle" || st.state === "paused" ? "#686872" : a.accent.hex;
          const row = (
            <div className={cn("grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-2 py-6 md:grid-cols-[64px_minmax(0,1.1fr)_minmax(0,1.3fr)_150px_24px] md:gap-x-8", soon && "opacity-50")}>
              <AgentGlyph agent={a} size={52} animated={!soon} muted={soon} />
              <div className="min-w-0">
                <div className="text-[17px] font-semibold uppercase tracking-[0.12em] text-white">{a.name}</div>
                <div className="mt-1 text-[13px] text-fg-3">{a.role}</div>
              </div>
              <div className="col-span-3 min-w-0 md:col-span-1">
                <div className="label flex items-center gap-2 text-[10px]" style={{ color }}>
                  <StatusDot color={color} size={5} live={!soon && st.state !== "idle" && st.state !== "paused"} />
                  {soon ? "Coming soon" : agentStateLabel(st.state)}
                </div>
                <div className="mt-2 truncate text-[14px] text-fg-1">{soon ? a.shortDescription : st.doing}</div>
              </div>
              <div className="hidden font-mono text-[11.5px] text-fg-3 md:block">
                {!soon && (
                  <>
                    <div>{plural(st.activeMissions.length, "mission")}</div>
                    <div className="mt-1">{plural(st.tasksToday, "task")} today</div>
                  </>
                )}
              </div>
              {!soon && <ChevronRight size={16} className="hidden text-fg-4 transition-transform group-hover:translate-x-0.5 group-hover:text-fg-1 md:block" />}
            </div>
          );
          return (
            <motion.li key={a.id} className="border-b border-line" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}>
              {soon ? (
                <div aria-label={`${a.name}, coming soon`}>{row}</div>
              ) : (
                <Link href={`/workforce/${a.slug}`} className="group block px-1 transition-colors hover:bg-white/[0.015]">
                  {row}
                </Link>
              )}
            </motion.li>
          );
        })}
      </ul>
    </PageWrap>
  );
}
