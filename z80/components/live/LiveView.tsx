"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/app/primitives";
import { useWorkingBots } from "@/components/bots/useBot";
import { AwayCard, BotNowCard, BotTag, Counter, Greeting } from "@/components/live/LiveParts";
import { caughtLine, SignalDetail } from "@/components/signals/LeadDossierView";
import { KindChip, TEMP_COLOR } from "@/components/signals/SignalParts";
import { Portal } from "@/components/ui/Portal";
import { StatusDot } from "@/components/ui/StatusDot";
import { jobLabel } from "@/lib/copy";
import { useBeats } from "@/lib/sim/heartbeats";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useNow } from "@/lib/hooks/useNow";
import { selectPendingApprovals, selectVisibleFeed, useWorkspace, workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { formatLocalTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/types";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "hot", label: "Hot leads" },
  { id: "lead", label: "Leads" },
  { id: "post", label: "Posts" },
  { id: "opportunity", label: "Money" },
  { id: "brief", label: "News" },
  { id: "reminder", label: "Reminders" },
  { id: "saved", label: "Saved" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

function matches(s: FeedItem, f: FilterId) {
  if (f === "all") return true;
  if (f === "hot") return s.lead?.temperature === "hot";
  if (f === "saved") return s.saved;
  if (f === "brief") return s.kind === "brief" || s.kind === "digest";
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
  const totalChecks = useBeats((b) => Object.values(b.botChecks).reduce((a, n) => a + n, 0));
  const wide = useMediaQuery("(min-width: 1100px)", true);
  const [filter, setFilter] = useState<FilterId>("all");
  const [limit, setLimit] = useState(20);
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
  const leadsToday = today.filter((s) => s.kind === "lead").length;
  const hotToday = today.filter((s) => s.lead?.temperature === "hot").length;
  const postedToday = posts.filter((p) => p.status === "posted" && (p.postedAt ?? 0) >= dayStart).length;
  const onShift = bots.filter((b) => !pausedBots.includes(b.id)).length;

  const open = (id: string) => {
    setSelected(id);
    router.replace(`/live?id=${id}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-10 md:py-12">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-fg-3">
        <span className="flex items-center gap-2.5">
          <StatusDot color="var(--color-run)" size={5} live={onShift > 0} />
          {onShift} bots on shift
        </span>
        {traveling && (
          <button onClick={() => workspace.travel(null)} className="rounded-full bg-[#d77bff]/15 px-2.5 py-0.5 text-[12px] text-[#e6b8ff] hover:bg-[#d77bff]/25">
            Time travel: {formatLocalTime(now)} · back to now
          </button>
        )}
      </div>
      <div className="mt-4">
        <Greeting hot={hotToday} needsYou={needsYou} />
      </div>

      <AwayCard />

      {/* Right now */}
      <section aria-label="Right now" className="mt-10">
        <h2 className="label mb-3">Right now</h2>
        <div className="no-scrollbar -mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-5">
          {bots.map((a) => (
            <BotNowCard key={a.id} agent={a} paused={pausedBots.includes(a.id)} finds={today.filter((s) => s.botId === a.id).length} />
          ))}
        </div>
      </section>

      {/* Today */}
      <section aria-label="Today" className="mt-10 grid grid-cols-2 gap-6 border-y border-line py-6 sm:grid-cols-4">
        <Counter label="Leads today" value={leadsToday} />
        <Counter label="Hot" value={hotToday} color={TEMP_COLOR.hot} />
        <Counter label="Posted on time" value={postedToday} />
        <Counter label="Checks today" value={totalChecks.toLocaleString("en-US")} />
      </section>

      {/* Filters */}
      <div role="tablist" aria-label="Filter what your bots found" className="no-scrollbar -mx-5 mt-8 flex gap-1 overflow-x-auto px-5 md:mx-0 md:px-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => {
              setFilter(f.id);
              setLimit(20);
            }}
            className={cn("h-8 shrink-0 rounded-[9px] px-3 text-[13px] transition-colors", filter === f.id ? "bg-white/[0.08] text-white" : "text-fg-3 hover:text-fg-1")}
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
                    className={cn("relative w-full rounded-[14px] px-4 py-3.5 text-left transition-colors", on ? "bg-white/[0.06]" : "hover:bg-white/[0.025]")}
                    style={on ? { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" } : undefined}
                  >
                    {!s.read && <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white" aria-label="Unread" />}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <KindChip signal={s} />
                        <span className="truncate text-[12px] text-fg-3">{s.trigger}</span>
                      </div>
                      <BotTag id={s.botId} />
                    </div>
                    <div className={cn("mt-2 truncate text-[15px]", s.read ? "text-fg-1" : "text-white")}>{s.title}</div>
                    <div className="mt-0.5 truncate text-[13px] text-fg-3">{s.lead ? `${s.lead.location} · ${s.lead.recommended.offer}` : s.summary}</div>
                    <div className={cn("mt-2 text-[12px] tabular-nums text-fg-4", action && "pr-28")}>{caughtLine(s, now)}</div>
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
              <button onClick={() => setLimit((n) => n + 20)} className="mt-2 h-10 w-full rounded-[12px] text-[13px] text-fg-3 hairline hover:text-white">
                Show {Math.min(20, list.length - limit)} more
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
                  className="fixed inset-0 z-[60] overflow-y-auto bg-black/95 px-3 pb-24 pt-4 backdrop-blur-xl"
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
