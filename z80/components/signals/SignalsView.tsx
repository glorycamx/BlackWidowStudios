"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { EmptyState, PageHeader } from "@/components/app/primitives";
import { SignalDetail } from "@/components/signals/LeadDossierView";
import { KindChip, TEMP_COLOR } from "@/components/signals/SignalParts";
import { Portal } from "@/components/ui/Portal";
import { StatusDot } from "@/components/ui/StatusDot";
import { availableAgents } from "@/data/bots";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useNow } from "@/lib/hooks/useNow";
import { selectVisibleSignals, useWorkspace, workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { cn, relativeTime } from "@/lib/utils";
import { formatAgo } from "@/lib/time";
import { useBeats } from "@/lib/sim/heartbeats";
import type { Agent, Signal } from "@/types";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "hot", label: "Hot leads" },
  { id: "website", label: "Website" },
  { id: "ai", label: "AI" },
  { id: "brief", label: "News" },
  { id: "money", label: "Money" },
  { id: "reminder", label: "Reminders" },
  { id: "saved", label: "Saved" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

function matches(s: Signal, f: FilterId) {
  switch (f) {
    case "hot":
      return s.lead?.temperature === "hot";
    case "website":
      return s.lead?.opportunity === "website";
    case "ai":
      return s.lead?.opportunity === "ai";
    case "brief":
      return s.kind === "brief";
    case "money":
      return s.kind === "opportunity";
    case "reminder":
      return s.kind === "reminder";
    case "saved":
      return s.saved;
    default:
      return true;
  }
}

/** Signals: what the always-on watches found, newest first. */
export function SignalsView() {
  const router = useRouter();
  const params = useSearchParams();
  const signals = useWorkspace(selectVisibleSignals);
  const pausedBots = useWorkspace((s) => s.pausedAgents);
  const customBots = useWorkspace((s) => s.customBots);
  const wide = useMediaQuery("(min-width: 1100px)", true);
  const [filter, setFilter] = useState<FilterId>("all");
  const [selected, setSelected] = useState<string | null>(params.get("id"));
  const now = useNow(15000);

  useEffect(() => {
    const id = params.get("id");
    if (id) setSelected(id);
  }, [params]);

  const list = useMemo(() => signals.filter((s) => matches(s, filter)), [signals, filter]);
  const current = signals.find((s) => s.id === selected) ?? (wide ? list[0] : undefined);

  useEffect(() => {
    if (current && !current.read) workspace.markSignalRead(current.id);
  }, [current]);

  const onShift = availableAgents.length + customBots.length - pausedBots.length;
  const today = signals.filter((s) => s.at > now - 24 * 3600e3);
  const hotToday = today.filter((s) => s.lead?.temperature === "hot").length;

  const open = (id: string) => {
    setSelected(id);
    router.replace(`/live?id=${id}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-10 md:py-12">
      <PageHeader
        label={
          <span className="flex items-center gap-2.5">
            <StatusDot color="var(--color-run)" size={5} live={onShift > 0} />
            {onShift} bots on shift
          </span>
        }
        title="Live"
        sub="Your bots are working right now. Here's what they found."
        actions={
          <div className="flex gap-6 text-[13px] tabular-nums text-fg-3">
            <span>
              <span className="text-[20px] text-white">{today.filter((s) => s.kind === "lead").length}</span> leads today
            </span>
            <span>
              <span className="text-[20px]" style={{ color: TEMP_COLOR.hot }}>
                {hotToday}
              </span>{" "}
              hot
            </span>
          </div>
        }
      />

      {/* Right now */}
      <section aria-label="Right now" className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {availableAgents.map((a) => (
          <BotNowCard key={a.id} agent={a} paused={pausedBots.includes(a.id)} finds={signals.filter((s) => s.botId === a.id && s.at > now - 24 * 3600e3).length} />
        ))}
      </section>

      {/* Filters */}
      <div role="tablist" aria-label="Filter signals" className="no-scrollbar -mx-5 mt-10 flex gap-1 overflow-x-auto px-5 md:mx-0 md:px-0">
        {FILTERS.map((f) => (
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
        <button onClick={() => workspace.markAllSignalsRead()} className="ml-auto h-8 shrink-0 px-2 text-[12px] text-fg-4 hover:text-fg-2">
          Mark all read
        </button>
      </div>

      <div className={cn("mt-5 grid gap-6", wide ? "grid-cols-[minmax(0,420px)_minmax(0,1fr)]" : "grid-cols-1")}>
        {/* Feed */}
        <ol className="min-w-0 space-y-1.5" aria-live="polite" aria-label="Signal feed">
          {list.length === 0 && (
            <li>
              <EmptyState title="Quiet for now." body="Your bots are still checking. New finds show up here the moment they happen." />
            </li>
          )}
          <AnimatePresence initial={false}>
            {list.map((s) => {
              const on = current?.id === s.id;
              return (
                <motion.li key={s.id} layout="position" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: EASE }}>
                  <button
                    onClick={() => open(s.id)}
                    aria-current={on}
                    className={cn("relative w-full rounded-[12px] px-4 py-3.5 text-left transition-colors", on ? "bg-white/[0.06]" : "hover:bg-white/[0.025]")}
                    style={on ? { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" } : undefined}
                  >
                    {!s.read && <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white" aria-label="Unread" />}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <KindChip signal={s} />
                        <span className="truncate text-[12px] text-fg-3">{s.trigger}</span>
                      </div>
                      <span className="shrink-0 text-[12px] tabular-nums text-fg-4">{relativeTime(s.at, now)}</span>
                    </div>
                    <div className={cn("mt-2 truncate text-[15px]", s.read ? "text-fg-1" : "text-white")}>{s.title}</div>
                    <div className="mt-0.5 truncate text-[13px] text-fg-3">{s.lead ? `${s.lead.location} · ${s.lead.recommended.offer}` : s.summary}</div>
                    {s.missionId && <div className="mt-2 text-[12px] text-run">Job running</div>}
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>

        {/* Detail */}
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

function BotNowCard({ agent, paused, finds }: { agent: Agent; paused: boolean; finds: number }) {
  const beat = useBeats((b) => b.latest[agent.id]);
  const checks = useBeats((b) => b.botChecks[agent.id] ?? 0);
  const now = useNow(1000);
  return (
    <div className={cn("panel flex flex-col p-4", paused && "opacity-60")}>
      <div className="flex items-center gap-3">
        <AgentGlyph agent={agent} size={32} animated={!paused} />
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-white">{agent.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[12px]" style={{ color: paused ? undefined : agent.accent.tint }}>
            <StatusDot color={paused ? "#686872" : agent.accent.hex} size={4} live={!paused} />
            {paused ? "Paused" : beat ? `Checked ${formatAgo(beat.at, now)}` : "On shift"}
          </div>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 min-h-[2.6em] text-[13px] leading-snug text-fg-2">{paused ? "Paused." : beat?.text ?? "Starting up."}</p>
      <div className="mt-auto pt-3 text-[12px] tabular-nums text-fg-4">
        {checks.toLocaleString("en-US")} {checks === 1 ? "check" : "checks"} · {finds} found today
      </div>
    </div>
  );
}
