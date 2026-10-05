"use client";

import { jobLabel } from "@/lib/copy";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { ActorTag } from "@/components/app/primitives";
import { useWorkspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { clockTime, cn, missionCode } from "@/lib/utils";
import type { ActivityEvent } from "@/types";

/**
 * Transparent audit trail. Every meaningful action, timestamped, expandable.
 */
export function ActivityFeed({ events, showMission = true, dense, limit }: { events: ActivityEvent[]; showMission?: boolean; dense?: boolean; limit?: number }) {
  const missions = useWorkspace((s) => s.missions);
  const [open, setOpen] = useState<string | null>(null);
  const list = limit ? events.slice(0, limit) : events;

  if (!list.length) return <p className="py-8 text-center text-[13.5px] text-fg-3">No activity yet.</p>;

  return (
    <ol className="relative" aria-live="polite" aria-relevant="additions">
      <AnimatePresence initial={false}>
        {list.map((e) => {
          const m = e.missionId ? missions[e.missionId] : undefined;
          const expandable = !!(e.detail?.length || m);
          const isOpen = open === e.id;
          return (
            <motion.li
              key={e.id}
              layout="position"
              initial={{ opacity: 0, y: -6, backgroundColor: "rgba(110,155,255,0.08)" }}
              animate={{ opacity: 1, y: 0, backgroundColor: "rgba(110,155,255,0)" }}
              transition={{ duration: 0.8, ease: EASE }}
              className="rounded-[10px]"
            >
              <button
                onClick={() => expandable && setOpen(isOpen ? null : e.id)}
                aria-expanded={expandable ? isOpen : undefined}
                className={cn(
                  "grid w-full items-baseline gap-x-3 gap-y-1 rounded-[10px] px-2.5 text-left transition-colors",
                  dense ? "grid-cols-[58px_1fr] py-2" : "grid-cols-[62px_1fr] py-2.5 sm:grid-cols-[66px_96px_1fr_14px]",
                  expandable && "hover:bg-white/[0.025]",
                )}
              >
                <span className="text-[13px] tabular-nums text-fg-3">{clockTime(e.at)}</span>
                <span className="truncate">
                  <ActorTag actor={e.actor} />
                  {e.to && (
                    <span className={dense ? "" : "sm:hidden"}>
                      <span className="mx-1 text-fg-4">→</span>
                      <ActorTag actor={e.to} />
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "col-span-2 text-[13.5px] leading-snug",
                    !dense && "sm:col-span-1",
                    dense && "col-start-2",
                    e.kind === "approval" ? "text-attn" : e.kind === "result" ? "text-white" : "text-fg-1",
                  )}
                >
                  {e.to && !dense && (
                    <span className="mr-2 hidden sm:inline">
                      <span className="mr-1.5 text-fg-4">→</span>
                      <ActorTag actor={e.to} />
                    </span>
                  )}
                  {e.message}
                </span>
                {expandable && !dense && <ChevronRight size={13} className={cn("hidden text-fg-4 transition-transform sm:block", isOpen && "rotate-90")} />}
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                    <div className={cn("ml-[74px] space-y-1.5 border-l border-line pb-3 pl-4", !dense && "sm:ml-[172px]")}>
                      {e.detail?.map((d) => (
                        <p key={d} className="text-[12.5px] text-fg-2">
                          {d}
                        </p>
                      ))}
                      <p className="text-[12px] tabular-nums text-fg-3">{new Date(e.at).toLocaleString()}</p>
                      {showMission && m && (
                        <Link href={`/jobs/${m.id}`} className="inline-block text-[12px] text-fg-2 hover:text-white">
                          {jobLabel(m.number)} · {m.title} →
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}
