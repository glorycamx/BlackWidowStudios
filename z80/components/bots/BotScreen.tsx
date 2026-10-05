"use client";

import { motion } from "motion/react";
import { useReducedMotionSafe } from "@/lib/hooks/useReducedMotionSafe";
import { Lock } from "lucide-react";
import { useBeats } from "@/lib/sim/heartbeats";
import { useNow } from "@/lib/hooks/useNow";
import { formatAgo } from "@/lib/time";
import { cn, hashString, prng } from "@/lib/utils";
import type { Agent } from "@/types";

/**
 * "Watch it work": a simulated browser showing what the bot is looking at
 * right now. The page is a skeleton drawn from the URL, so each check looks
 * different. With reduced motion it stays still and only the caption changes.
 */
export function BotScreen({ bot, paused, className, compact }: { bot: Agent; paused?: boolean; className?: string; compact?: boolean }) {
  const beat = useBeats((b) => b.latest[bot.id]);
  const reduce = useReducedMotionSafe();
  const now = useNow(1000);
  const url = paused ? "Paused" : beat?.url ?? "z80.si";
  const r = prng(hashString(url + (beat?.id ?? "")));
  const rows = Array.from({ length: compact ? 4 : 7 }, () => 30 + r() * 65);
  const hero = r() > 0.4;
  const cards = 2 + Math.floor(r() * 3);
  const cx = 18 + r() * 64;
  const cy = 30 + r() * 50;
  const c = bot.accent.hex;

  return (
    <figure className={cn("overflow-hidden rounded-[18px] bg-[#09090d]", className)} style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)" }} aria-label={`What ${bot.name} is looking at`}>
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        <span className="flex gap-1" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-white/[0.12]" />
          <span className="h-2 w-2 rounded-full bg-white/[0.12]" />
          <span className="h-2 w-2 rounded-full bg-white/[0.12]" />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[8px] bg-white/[0.05] px-2.5 py-1 text-[12px] text-fg-3">
          <Lock size={10} className="shrink-0" aria-hidden />
          <span className="truncate tabular-nums">{url}</span>
        </div>
      </div>
      <div className={cn("relative overflow-hidden", compact ? "h-[120px]" : "h-[240px] md:h-[300px]")} aria-hidden>
        <motion.div key={reduce ? "still" : url + (beat?.id ?? "")} initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: paused ? 0.25 : 1, y: 0 }} transition={{ duration: 0.45 }} className="absolute inset-0 p-4">
          {hero && <div className="mb-3 h-[22%] rounded-[8px]" style={{ background: `linear-gradient(110deg, rgba(${bot.accent.rgb} / 0.18), rgba(255,255,255,0.03))` }} />}
          <div className="space-y-2">
            {rows.slice(0, hero ? rows.length - 2 : rows.length).map((w, i) => (
              <div key={i} className="h-[7px] rounded-full bg-white/[0.07]" style={{ width: `${w.toFixed(1)}%` }} />
            ))}
          </div>
          {!compact && (
            <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${cards}, minmax(0, 1fr))` }}>
              {Array.from({ length: cards }, (_, i) => (
                <div key={i} className="h-10 rounded-[8px] bg-white/[0.04]" />
              ))}
            </div>
          )}
        </motion.div>
        {!paused && !reduce && (
          <>
            <motion.div className="absolute left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)`, opacity: 0.6 }} initial={{ top: "0%" }} animate={{ top: ["0%", "100%"] }} transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }} />
            <motion.svg width="14" height="18" viewBox="0 0 14 18" className="absolute" initial={false} animate={{ left: `${cx.toFixed(1)}%`, top: `${cy.toFixed(1)}%` }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
              <path d="M1 1 L1 14 L4.5 10.5 L7 16.5 L9 15.6 L6.6 9.8 L11.5 9.8 Z" fill="#fff" stroke="#000" strokeWidth="1" />
            </motion.svg>
          </>
        )}
      </div>
      <figcaption className="flex items-start justify-between gap-3 border-t border-white/[0.06] px-4 py-3" aria-live="polite">
        <span className="min-w-0 text-[13px] leading-snug text-fg-1">{paused ? `${bot.name} is paused.` : beat?.text ?? "Starting up."}</span>
        {beat && !paused && <span className="shrink-0 text-[12px] tabular-nums text-fg-4">{formatAgo(beat.at, now)}</span>}
      </figcaption>
    </figure>
  );
}
