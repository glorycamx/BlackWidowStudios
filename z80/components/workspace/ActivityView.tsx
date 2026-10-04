"use client";

import { useMemo, useState } from "react";
import { ActivityFeed } from "@/components/app/ActivityFeed";
import { EmptyState, PageHeader, PageWrap } from "@/components/app/primitives";
import { availableAgents } from "@/data/agents";
import { useWorkspace } from "@/lib/store/workspace";
import { cn } from "@/lib/utils";
import type { ActivityEvent } from "@/types";

function dayLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

/** The audit trail. Every meaningful agent action is here. */
export function ActivityView() {
  const activity = useWorkspace((s) => s.activity);
  const [filter, setFilter] = useState<string>("all");
  const filtered = useMemo(
    () =>
      activity.filter((e) => {
        if (filter === "all") return true;
        if (filter === "decisions") return e.kind === "approval" || e.actor === "user";
        return e.actor === filter || e.to === filter;
      }),
    [activity, filter],
  );
  const groups = useMemo(() => {
    const out: { day: string; events: ActivityEvent[] }[] = [];
    for (const e of filtered) {
      const day = dayLabel(e.at);
      const last = out[out.length - 1];
      if (last && last.day === day) last.events.push(e);
      else out.push({ day, events: [e] });
    }
    return out;
  }, [filtered]);

  const filters = [{ id: "all", label: "All" }, ...availableAgents.map((a) => ({ id: a.id, label: a.name })), { id: "decisions", label: "Decisions" }];

  return (
    <PageWrap className="max-w-[1000px]">
      <PageHeader label="Audit trail" title="Activity" sub="Every meaningful action your workforce takes — what, who and when. Expand an entry for detail." />
      <div role="tablist" aria-label="Filter activity" className="no-scrollbar -mx-5 mt-10 flex gap-1 overflow-x-auto px-5 md:mx-0 md:px-0">
        {filters.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn("h-8 shrink-0 rounded-[9px] px-3 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors", filter === f.id ? "bg-white/[0.08] text-white" : "text-fg-3 hover:text-fg-1")}
          >
            {f.label}
          </button>
        ))}
      </div>
      {groups.length === 0 ? (
        <EmptyState title="Nothing yet." body="When your workforce acts, every step appears here." action={{ label: "Create mission", href: "/command?focus=1" }} />
      ) : (
        <div className="mt-8 space-y-10">
          {groups.map((g) => (
            <section key={g.day}>
              <h2 className="label sticky top-14 z-10 bg-black/80 py-2 backdrop-blur lg:top-0">{g.day}</h2>
              <div className="mt-2">
                <ActivityFeed events={g.events} limit={200} />
              </div>
            </section>
          ))}
        </div>
      )}
    </PageWrap>
  );
}
