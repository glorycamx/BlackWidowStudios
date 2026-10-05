"use client";

import { jobLabel } from "@/lib/copy";
import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { AgentStack, EmptyState, MissionStatusBadge, PageHeader, PageWrap, ProgressBar } from "@/components/app/primitives";
import { Button } from "@/components/ui/Button";
import { selectMissions, useWorkspace } from "@/lib/store/workspace";
import { useNow } from "@/lib/hooks/useNow";
import { EASE } from "@/lib/motion";
import { cn, missionCode, relativeTime } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Running" },
  { id: "approval", label: "Needs you" },
  { id: "complete", label: "Complete" },
] as const;

export function MissionsList() {
  const missions = useWorkspace(selectMissions);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const now = useNow(30000);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return missions.filter((m) => {
      if (filter === "active" && !(m.status === "running" || m.status === "interrupted")) return false;
      if (filter === "approval" && m.status !== "awaiting-approval") return false;
      if (filter === "complete" && m.status !== "complete") return false;
      if (query && !`${m.title} ${m.objective} ${missionCode(m.number)}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [missions, filter, q]);

  if (!missions.length) {
    return (
      <PageWrap>
        <EmptyState title="Nothing running." body="Jobs are one-off work your bots do for you. Ask Manager in Chat." action={{ label: "Start a job", href: "/chat?focus=1" }} />
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <PageHeader
        label={`${missions.length} jobs`}
        title="Jobs"
        sub="One-off work your bots are doing or finished."
        actions={
          <Button variant="solid" icon={<Plus size={14} />} href="/chat?focus=1">
            New job
          </Button>
        }
      />
      <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="tablist" aria-label="Filter jobs" className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn("h-8 rounded-[9px] px-3 text-[12px] transition-colors", filter === f.id ? "bg-white/[0.08] text-white" : "text-fg-3 hover:text-fg-1")}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="relative">
          <span className="sr-only">Search jobs</span>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search jobs"
            className="h-9 w-full rounded-[10px] bg-transparent pl-9 pr-3 text-[13.5px] text-white placeholder:text-fg-3 hairline focus:outline-none md:w-[260px]"
          />
        </label>
      </div>

      <ul className="mt-6 border-t border-line">
        {list.map((m, i) => (
          <motion.li key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.03, ease: EASE }} className="border-b border-line">
            <Link href={`/jobs/${m.id}`} className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 px-1 py-5 transition-colors hover:bg-white/[0.015] md:grid-cols-[70px_1fr_180px_150px_90px]">
              <span className="hidden text-[13px] tabular-nums text-fg-3 md:block">{jobLabel(m.number)}</span>
              <span className="min-w-0">
                <span className="block truncate text-[15.5px] text-white">{m.title}</span>
                <span className="mt-1 block truncate text-[12.5px] text-fg-3">{m.objective}</span>
              </span>
              <span className="hidden md:block">
                <MissionStatusBadge status={m.status} />
                <ProgressBar value={m.progress} status={m.status} className="mt-2.5 w-[140px]" />
              </span>
              <span className="hidden md:block">
                <AgentStack ids={m.agents.map((a) => a.agentId)} size={22} />
              </span>
              <span className="text-right text-[13px] tabular-nums text-fg-3">
                <span className="md:hidden">
                  <MissionStatusBadge status={m.status} />
                </span>
                <span className="hidden md:inline">{relativeTime(m.createdAt, now)}</span>
              </span>
            </Link>
          </motion.li>
        ))}
        {!list.length && <li className="py-16 text-center text-[14px] text-fg-3">No jobs match.</li>}
      </ul>
    </PageWrap>
  );
}
