"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/app/primitives";
import { useWorkingBots } from "@/components/bots/useBot";
import { AwayCard, Greeting, TeamNow } from "@/components/live/LiveParts";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { agentOrFallback } from "@/data/bots";
import { caughtLine, SignalDetail } from "@/components/signals/LeadDossierView";
import { TempChip } from "@/components/signals/SignalParts";
import { Portal } from "@/components/ui/Portal";
import { jobLabel } from "@/lib/copy";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useNow } from "@/lib/hooks/useNow";
import { selectPendingApprovals, selectVisibleFeed, useWorkspace, workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { formatLocalTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/types";

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "lead", label: "Leads" },
  { id: "post", label: "Posts" },
  { id: "brief", label: "News and ideas" },
  { id: "saved", label: "Saved" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

function matches(s: FeedItem, f: FilterId) {
  if (f === "all") return true;
  if (f === "saved") return s.saved;
  if (f === "brief") return s.kind === "brief" || s.kind === "digest" || s.kind === "opportunity";
  return s.kind === f;
}

/** The one obvious next step for each kind of find. */
function primaryAction(f: FeedItem, router: ReturnType<typeof useRouter>, jobNumber?: number): { label: string; run(): void } | null {
  if (f.lead) {
    if (f.missionId) return { label: jobNumber ? `${jobLabel(jobNumber)} running` : "Job running", run: () => router.push(`/jobs/${f.missionId}`) };
    return { label: "Start outreach", run: () => workspace.deploySignal(f.id) };
  }
  if (f.kind === "post") return { label: "Calendar", run: () => router.push("/calendar") };
  if (f.kind === "opportunity") return { label: f.saved ? "Saved" : "Save", run: () => workspace.toggleSaveSignal(f.id) };
  if (f.kind === "reminder" && f.reminder?.relatedId) return { label: "Open lead", run: () => router.push(`/live?id=${f.reminder!.relatedId}`) };
  return null;
}

/** Live: your bots at work right now, and everything they found. */
export function LiveView() {
  const router = useRouter();
  const params = useSearchParams();
  const feed = useWorkspace(selectVisibleFeed);
  const missions = useWorkspace((s) => s.missions);
  const pausedBots = useWorkspace((s) => s.pausedAgents);
  const posts = useWorkspace((s) => s.posts);
  const traveling = useWorkspace((s) => s.traveling);
  const needsYou = useWorkspace(selectPendingApprovals).length;
  const bots = useWorkingBots();
  const wide = useMediaQuery("(min-width: 1100px)", true);
  const [filter, setFilter] = useState<FilterId>("all");
  const [limit, setLimit] = useState(12);
  const [selected, setSelected] = useState<string | null>(params.get("id"));
  const now = useNow(15000);

  useEffect(() => {
    const id = params.get("id");
    if (id) setSelected(id);
  }, [params]);

  const list = useMemo(() => feed.filter((s) => matches(s, filter)), [feed, filter]);
  const current = feed.find((s) => s.id === selected) ?? (wide ? list[0] : undefined);

  useEffect(() => {
    if (current && !current.read) workspace.markSignalRead(current.id);
  }, [current]);

  const dayStart = new Date(now).setHours(0, 0, 0, 0);
  const today = feed.filter((s) => s.at >= dayStart);
  const hotToday = today.filter((s) => s.lead?.temperature === "hot").length;
  const postedToday = posts.filter((p) => p.status === "posted" && (p.postedAt ?? 0) >= dayStart).length;

  const open = (id: string) => {
    setSelected(id);
    router.replace(`/live?id=${id}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-10 md:py-12">
      {traveling && (
        <button onClick={() => workspace.travel(null)} className="mb-4 rounded-full bg-[#d77bff]/15 px-3 py-1 text-[12px] text-[#b25bdb] hover:bg-[#d77bff]/25">
          Time travel: {formatLocalTime(now)} · back to now
        </button>
      )}
      <Greeting hot={hotToday} needsYou={needsYou} posted={postedToday} />

      <AwayCard />

      <div className="mt-8">
        <TeamNow bots={bots} paused={pausedBots} />
      </div>

      <h2 className="mt-12 text-[20px] font-semibold tracking-[-0.02em] text-white">What they found</h2>
      {/* Filters */}
      <div role="tablist" aria-label="Filter what your bots found" className="no-scrollbar -mx-5 mt-3 flex gap-1 overflow-x-auto px-5 md:mx-0 md:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => {
              setFilter(f.id);
              setLimit(12);
            }}
            className={cn("h-9 shrink-0 rounded-full px-4 text-[14px] transition-colors", filter === f.id ? "bg-white text-black" : "text-fg-2 hover:bg-white/[0.05] hover:text-fg-1")}
          >
            {f.label}
          </button>
        ))}
        <button onClick={() => workspace.markAllSignalsRead()} className="ml-auto h-8 shrink-0 px-2 text-[12px] text-fg-4 hover:text-fg-2">
          Mark all read
        </button>
      </div>

      <div className={cn("mt-5 grid gap-6", wide ? "grid-cols-[minmax(0,440px)_minmax(0,1fr)]" : "grid-cols-1")}>
        <ol className="min-w-0 space-y-1.5" aria-live="polite" aria-label="What your bots found">
          {list.length === 0 && (
            <li>
              <EmptyState title="Quiet for now." body="Your bots are still checking. New finds show up here the moment they happen." />
            </li>
          )}
          <AnimatePresence initial={false}>
            {list.slice(0, limit).map((s) => {
              const on = current?.id === s.id;
              const action = primaryAction(s, router, s.missionId ? missions[s.missionId]?.number : undefined);
              return (
                <motion.li key={s.id} layout="position" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: EASE }} className="relative">
                  <button
                    onClick={() => open(s.id)}
                    aria-current={on}
                    className={cn("relative w-full rounded-[16px] px-4 py-3.5 text-left transition-colors", on ? "bg-white/[0.06]" : "hover:bg-white/[0.03]")}
                    style={on ? { boxShadow: "inset 0 0 0 1px var(--color-line-2)" } : undefined}
                  >
                    {!s.read && <span className="absolute left-1.5 top-6 h-1.5 w-1.5 rounded-full bg-[#8f9cff]" aria-label="Unread" />}
                    <div className="flex gap-3.5">
                      <AgentGlyph agent={agentOrFallback(s.botId)} size={32} animated={false} className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn("truncate text-[15px] font-medium", s.read ? "text-fg-1" : "text-white")}>{s.title}</span>
                          {s.lead && <TempChip temp={s.lead.temperature} className="shrink-0" />}
                        </div>
                        <div className="mt-0.5 truncate text-[14px] text-fg-2">{s.lead ? s.trigger : s.summary}</div>
                        <div className={cn("mt-1.5 text-[12px] tabular-nums text-fg-3", action && "pr-28")}>{caughtLine(s, now)}</div>
                      </div>
                    </div>
                  </button>
                  {action && (
                    <button onClick={action.run} className={cn("absolute bottom-3 right-3 h-7 rounded-full px-3 text-[12px] transition-colors", s.missionId ? "text-run" : "bg-white/[0.07] text-white hover:bg-white/[0.12]")}>
                      {action.label}
                    </button>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
          {list.length > limit && (
            <li>
              <button onClick={() => setLimit((n) => n + 12)} className="mt-2 h-10 w-full rounded-[12px] text-[13px] text-fg-3 hairline hover:text-white">
                Show {Math.min(12, list.length - limit)} more
              </button>
            </li>
          )}
        </ol>

        {wide ? (
          <div className="sticky top-8 self-start">
            <AnimatePresence mode="wait">
              {current && (
                <motion.div key={current.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                  <SignalDetail signal={current} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Portal>
            <AnimatePresence>
              {current && selected && (
                <motion.div
                  className="fixed inset-0 z-[60] overflow-y-auto bg-[var(--surface-overlay)] px-3 pb-24 pt-4 backdrop-blur-xl"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  role="dialog"
                  aria-modal="true"
                  aria-label={current.title}
                >
                  <SignalDetail
                    signal={current}
                    onClose={() => {
                      setSelected(null);
                      router.replace("/live");
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Portal>
        )}
      </div>
    </div>
  );
}
