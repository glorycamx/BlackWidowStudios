"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { useBotName, useWorkingBots } from "@/components/bots/useBot";
import { Portal } from "@/components/ui/Portal";
import { agentOrFallback } from "@/data/bots";
import { useNow } from "@/lib/hooks/useNow";
import { selectUnreadNotices, useWorkspace, workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { formatAgo, formatLocalTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Notice } from "@/types";

const TONE: Record<Notice["tone"], string> = { hot: "#ff6f91", "needs-you": "#d77bff", info: "#8f9cff" };

/** "5 bots on shift · 8:14:22 PM" */
export function ShiftClock({ className }: { className?: string }) {
  const now = useNow(1000);
  const bots = useWorkingBots();
  const paused = useWorkspace((s) => s.pausedAgents);
  const on = bots.filter((b) => !paused.includes(b.id)).length;
  return (
    <div className={cn("flex items-center gap-2 text-[12px] tabular-nums text-fg-3", className)} aria-label={`${on} bots on shift`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inset-0 rounded-full bg-run motion-safe:animate-breathe" />
      </span>
      <span>
        {on} on shift · {formatLocalTime(now, { seconds: true })}
      </span>
    </div>
  );
}

function Who({ id }: { id: string }) {
  return <>{useBotName(id)}</>;
}

/** The bell and its notification center. */
export function NoticeBell({ className }: { className?: string }) {
  const unread = useWorkspace(selectUnreadNotices);
  const notices = useWorkspace((s) => s.notices);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const now = useNow(15000);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className={cn("relative flex h-9 w-9 items-center justify-center rounded-[10px] text-fg-2 hover:bg-white/[0.04] hover:text-white", className)}>
        <Bell size={16} />
        {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d77bff] px-1 text-[10px] font-medium tabular-nums text-black">{unread > 9 ? "9+" : unread}</span>}
      </button>
      <Portal>
        <AnimatePresence>
          {open && (
            <motion.div className="fixed inset-0 z-[95] bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
              <motion.aside
                role="dialog"
                aria-label="Notifications"
                aria-modal="true"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col border-l border-line bg-[var(--surface-raised)]"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <h2 className="text-[17px] font-semibold text-white">Notifications</h2>
                  <div className="flex items-center gap-1">
                    {unread > 0 && (
                      <button onClick={() => workspace.markAllNoticesRead()} className="h-8 px-2 text-[12px] text-fg-3 hover:text-white">
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setOpen(false)} aria-label="Close" className="flex h-8 w-8 items-center justify-center text-fg-3 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
                  {notices.length === 0 && <li className="px-2 py-10 text-center text-[14px] text-fg-3">Nothing yet. Your bots will tap you when something needs you.</li>}
                  {notices.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => {
                          workspace.markNoticeRead(n.id);
                          setOpen(false);
                          if (n.href) router.push(n.href);
                        }}
                        className={cn("relative w-full rounded-[14px] px-4 py-3 text-left transition-colors hover:bg-white/[0.04]", !n.read && "bg-white/[0.025]")}
                      >
                        {!n.read && <span className="absolute left-1.5 top-5 h-1.5 w-1.5 rounded-full" style={{ background: TONE[n.tone] }} aria-label="Unread" />}
                        <div className="flex items-center justify-between gap-2 text-[12px] text-fg-3">
                          <span style={{ color: TONE[n.tone] }}>
                            <Who id={n.botId} />
                          </span>
                          <span className="tabular-nums">{formatAgo(n.at, now)}</span>
                        </div>
                        <div className="mt-1 text-[14px] text-white">{n.title}</div>
                        <div className="mt-0.5 line-clamp-2 text-[13px] text-fg-2">{n.body}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}

/**
 * Phone-style banners for new notices (not ones loaded from storage).
 * With browser alerts on and the tab in the background, it also sends a
 * desktop notification.
 */
export function PhoneToasts() {
  const router = useRouter();
  const latest = useWorkspace((s) => s.notices[0]);
  const alerts = useWorkspace((s) => s.settings.browserAlerts);
  const seen = useRef<Set<string> | null>(null);
  const [toasts, setToasts] = useState<Notice[]>([]);

  useEffect(() => {
    if (!latest) return;
    if (!seen.current) {
      seen.current = new Set([latest.id]);
      return;
    }
    if (seen.current.has(latest.id) || latest.read) return;
    seen.current.add(latest.id);
    // Banners are for what matters: hot leads, things that need you, and your morning text and recap.
    const banner = latest.tone !== "info" || /morning text|evening recap/i.test(latest.title);
    if (!banner) return;
    if (alerts && typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState === "hidden") {
      try {
        new Notification(`${agentOrFallback(latest.botId).name}: ${latest.title}`, { body: latest.body, tag: latest.id });
      } catch {
        /* some browsers only allow notifications from a service worker */
      }
    }
    setToasts((t) => [latest, ...t].slice(0, 3));
    const id = latest.id;
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 7000);
  }, [latest, alerts]);

  const close = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[75] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:items-end" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const bot = agentOrFallback(t.botId);
          return (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.97 }} transition={{ duration: 0.45, ease: EASE }} className="pointer-events-auto w-full max-w-[380px]">
              <div className="relative overflow-hidden rounded-[22px] bg-[var(--surface-toast)] p-3.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl" style={{ boxShadow: `inset 0 0 0 1px var(--color-line-2)` }}>
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-black">
                    <AgentGlyph agent={bot} size={26} animated={false} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-[12px] text-fg-3">
                      <span className="truncate">
                        Z80 · <Who id={t.botId} />
                      </span>
                      <span>now</span>
                    </div>
                    <div className="mt-0.5 truncate text-[14px] font-semibold text-white">{t.title}</div>
                    <div className="line-clamp-2 text-[13px] leading-snug text-fg-2">{t.body}</div>
                    <div className="mt-2.5 flex gap-1.5">
                      <button
                        onClick={() => {
                          close(t.id);
                          workspace.markNoticeRead(t.id);
                          router.push(t.href ?? "/live");
                        }}
                        className="h-7 rounded-full bg-white/[0.12] px-3 text-[12px] font-medium text-white hover:bg-white/[0.18]"
                      >
                        {t.tone === "needs-you" ? "Review" : "View"}
                      </button>
                      <button onClick={() => close(t.id)} className="h-7 rounded-full px-3 text-[12px] text-fg-3 hover:text-white">
                        Later
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
