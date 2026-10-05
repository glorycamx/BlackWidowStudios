"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { useBotName } from "@/components/bots/useBot";
import { describeTrigger } from "@/data/routines";
import { parseRoutine } from "@/lib/sim/parse";
import { workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import type { BotId } from "@/types";

/** "What should it keep doing?" Plain English in, a confirmation card, then it starts. */
export function AddRoutine({ botId, placeholder, onAdded }: { botId?: BotId; placeholder?: string; onAdded?: () => void }) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<ReturnType<typeof parseRoutine> | null>(null);
  const name = useBotName(draft?.botId ?? botId ?? "manager");

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    setDraft(parseRoutine(t, { botId }));
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2 rounded-[14px] bg-white/[0.04] p-1.5 pl-4 hairline"
      >
        <label className="sr-only" htmlFor={`add-routine-${botId ?? "any"}`}>
          New routine
        </label>
        <input
          id={`add-routine-${botId ?? "any"}`}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setDraft(null);
          }}
          placeholder={placeholder ?? "What should it keep doing? Try: every morning at 8, check for new roofers"}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-white placeholder:text-fg-4 focus:outline-none"
        />
        <button type="submit" aria-label="Preview routine" disabled={!text.trim()} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-black disabled:opacity-30">
          <ArrowUp size={14} />
        </button>
      </form>
      <AnimatePresence>
        {draft && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="mt-3 rounded-[16px] bg-white/[0.04] p-4 hairline" role="status">
            <div className="text-[13px] text-fg-3">{name} will</div>
            <div className="mt-1 text-[16px] text-white">{draft.title}</div>
            <div className="mt-2 text-[12px] text-fg-2">
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5">{describeTrigger(draft.trigger)}</span>
              <span className="ml-2 text-fg-4">Starts right away. Anything it sends waits for your yes.</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  workspace.addRoutine(draft);
                  setDraft(null);
                  setText("");
                  onAdded?.();
                }}
                className="h-8 rounded-full bg-white px-4 text-[13px] font-medium text-black hover:bg-[#e8e8ed]"
              >
                Start it
              </button>
              <button onClick={() => setDraft(null)} className="h-8 rounded-full px-3 text-[13px] text-fg-3 hover:text-white">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
