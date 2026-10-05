"use client";

import { useMemo, useState } from "react";
import { ActivityFeed } from "@/components/app/ActivityFeed";
import { EmptyState, PageHeader, PageWrap } from "@/components/app/primitives";
import { ChevronDown } from "lucide-react";
import { agentOrFallback, availableAgents } from "@/data/bots";
import { useBeats } from "@/lib/sim/heartbeats";
import { useNow } from "@/lib/hooks/useNow";
import { formatAgo } from "@/lib/time";
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

/** Heartbeats, folded away: proof your bots kept checking, without the noise. */
function QuietChecks() {
  const [open, setOpen] = useState(false);
  const beats = useBeats((b) => b.beats);
  const total = useBeats((b) => Object.values(b.botChecks).reduce((a, n) => a + n, 0));
  const now = useNow(5000);
  return (
    <section className="mt-8 rounded-[18px] bg-white/[0.025] hairline">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <span>
          <span className="block text-[14px] text-white">Quiet checks</span>
          <span className="block text-[13px] text-fg-3">{total.toLocaleString("en-US")} today. Nothing worth your attention, but proof they never stopped.</span>
        </span>
        <ChevronDown size={16} className={cn("shrink-0 text-fg-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="max-h-[360px] space-y-1 overflow-y-auto border-t border-white/[0.06] px-5 py-3">
          {beats.length === 0 && <li className="py-2 text-[13px] text-fg-3">Checks show up here as they happen.</li>}
          {beats.slice(0, 80).map((b) => (
            <li key={b.id} className="flex items-baseline gap-3 py-1 text-[13px]">
              <span className="w-16 shrink-0 tabular-nums text-fg-4">{formatAgo(b.at, now)}</span>
              <span className="shrink-0" style={{ color: agentOrFallback(b.botId).accent.tint }}>
                {agentOrFallback(b.botId).name}
              </span>
              <span className="min-w-0 truncate text-fg-2">{b.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The audit trail. Every step your bots take is here. */
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
      <PageHeader title="Activity" sub="Every step your bots took, as it happened." />
      <div role="tablist" aria-label="Filter activity" className="no-scrollbar -mx-5 mt-10 flex gap-1 overflow-x-auto px-5 md:mx-0 md:px-0">
        {filters.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn("h-8 shrink-0 rounded-[9px] px-3 text-[12px] transition-colors", filter === f.id ? "bg-white/[0.08] text-white" : "text-fg-3 hover:text-fg-1")}
          >
            {f.label}
          </button>
        ))}
      </div>
      <QuietChecks />
      {groups.length === 0 ? (
        <EmptyState title="Nothing yet." body="Every step your bots take shows up here." action={{ label: "Open Chat", href: "/chat?focus=1" }} />
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
