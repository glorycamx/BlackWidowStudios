"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { TEMP_COLOR } from "@/components/signals/SignalParts";
import { agentOrFallback } from "@/data/agents";
import { useWorkspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import type { Signal } from "@/types";

/**
 * "New hot lead" — the tap on the shoulder. Shows new lead and reminder
 * signals as they arrive (not ones loaded from storage).
 */
export function SignalToasts() {
  const router = useRouter();
  const hydrated = useWorkspace((s) => s.hydrated);
  const latest = useWorkspace((s) => s.signals[0]);
  const watches = useWorkspace((s) => s.watches);
  const seen = useRef<Set<string> | null>(null);
  const [toasts, setToasts] = useState<Signal[]>([]);

  useEffect(() => {
    if (!hydrated || !latest) return;
    if (!seen.current) {
      seen.current = new Set([latest.id]);
      return;
    }
    if (seen.current.has(latest.id)) return;
    seen.current.add(latest.id);
    if (latest.kind === "news") return;
    setToasts((t) => [latest, ...t].slice(0, 3));
    const id = latest.id;
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 7000);
  }, [hydrated, latest]);

  const close = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-20 z-[75] flex flex-col items-end gap-2 sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-5 lg:bottom-auto" aria-live="assertive">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const temp = t.lead?.temperature;
          const color = temp ? TEMP_COLOR[temp] : "#8f9cff";
          const agent = agentOrFallback(watches.find((w) => w.id === t.watchId)?.agentId ?? "lookout");
          const head = t.kind === "reminder" ? "Reminder" : temp === "hot" ? "New hot lead" : temp === "warm" ? "New warm lead" : "New lead";
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="pointer-events-auto w-full max-w-[360px]"
            >
              <div className="panel-solid relative overflow-hidden" style={{ boxShadow: `inset 0 0 0 1px ${color}55, 0 24px 60px -20px rgba(0,0,0,0.9), 0 0 40px -18px ${color}` }}>
                <button
                  onClick={() => {
                    close(t.id);
                    router.push(`/signals?id=${t.id}`);
                  }}
                  className="block w-full p-4 pr-10 text-left"
                >
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color }}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inset-0 rounded-full motion-safe:animate-ping-once" style={{ background: color }} />
                      <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                    </span>
                    {head}
                    <span className="text-fg-4">· {agent.name}</span>
                  </div>
                  <div className="mt-2 text-[15px] font-medium text-white">{t.lead?.business ?? t.title}</div>
                  <div className="mt-0.5 line-clamp-2 text-[12.5px] text-fg-2">
                    {t.trigger}. {t.summary}
                  </div>
                </button>
                <button onClick={() => close(t.id)} aria-label="Dismiss notification" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center text-fg-4 hover:text-white">
                  <X size={13} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
