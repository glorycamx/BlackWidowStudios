"use client";

import { Check } from "lucide-react";
import { ActorTag } from "@/components/app/primitives";
import { StatusDot } from "@/components/ui/StatusDot";
import { agentOrFallback } from "@/data/bots";
import { useWorkspace } from "@/lib/store/workspace";
import { clockTime, cn } from "@/lib/utils";
import type { Mission } from "@/types";

/** Linear view of the same mission: tasks in order, steps underneath. */
export function MissionTimeline({ mission }: { mission: Mission }) {
  const activity = useWorkspace((s) => s.activity);
  const steps = activity.filter((e) => e.missionId === mission.id && e.taskId);

  return (
    <ol className="relative">
      <span className="absolute bottom-4 left-[9px] top-4 w-px bg-white/[0.08]" aria-hidden />
      {mission.tasks.map((t) => {
        const a = agentOrFallback(t.agentId);
        const mine = steps.filter((e) => e.taskId === t.id).reverse();
        const s = t.status;
        return (
          <li key={t.id} className="relative pb-6 pl-9">
            <span className="absolute left-0 top-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full bg-black">
              {s === "complete" ? (
                <span className="flex h-[17px] w-[17px] items-center justify-center rounded-full bg-white">
                  <Check size={10} strokeWidth={3} className="text-black" />
                </span>
              ) : s === "running" ? (
                <StatusDot color={a.accent.hex} size={8} />
              ) : s === "blocked" ? (
                <StatusDot color="var(--color-attn)" size={8} />
              ) : (
                <span className={cn("h-[13px] w-[13px] rounded-full border", s === "skipped" ? "border-dashed border-white/25" : "border-white/20")} />
              )}
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className={cn("text-[15px]", s === "waiting" ? "text-fg-3" : s === "skipped" ? "text-fg-4 line-through" : "text-white")}>{t.label}</span>
              <ActorTag actor={t.agentId} />
            </div>
            {t.output && <div className="mt-1 text-[13px] tabular-nums text-fg-3">{t.output}</div>}
            {mine.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {mine.map((e) => (
                  <li key={e.id} className="flex gap-3 text-[13px]">
                    <span className="text-[12px] tabular-nums text-fg-4">{clockTime(e.at)}</span>
                    <span className="text-fg-2">{e.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
