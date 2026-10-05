"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { Portal } from "@/components/ui/Portal";
import { CUSTOM_COLORS } from "@/data/bots";
import { describeTrigger } from "@/data/routines";
import { parseBotSpec } from "@/lib/sim/parse";
import { workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { AgentVisual } from "@/types";

const VISUALS: { id: AgentVisual; label: string }[] = [
  { id: "orbit", label: "Constellation" },
  { id: "pulse", label: "Pulse" },
  { id: "lattice", label: "Lattice" },
  { id: "scanner", label: "Scanner" },
  { id: "fluid", label: "Waves" },
];

const IDEAS = [
  "Watches Reddit for people asking for a web designer",
  "Finds restaurants without online ordering",
  "Checks my clients' Google reviews every morning",
];

/** Build your own bot: say what it should keep doing, give it a name, it goes on shift. */
export function CreateBotDialog({ open, onClose, initial = "" }: { open: boolean; onClose(): void; initial?: string }) {
  const router = useRouter();
  const [what, setWhat] = useState(initial);
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [color, setColor] = useState(0);
  const [visual, setVisual] = useState<AgentVisual>("orbit");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setWhat(initial);
    setNameTouched(false);
    setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, initial, onClose]);

  const parsed = parseBotSpec(what || "a bot");
  const shownName = nameTouched ? name : what.trim() ? parsed.name : "";
  const preview = { id: `preview-${visual}`, visual, accent: CUSTOM_COLORS[color] };

  const create = () => {
    if (!what.trim()) return;
    const id = workspace.createBot({ name: shownName || parsed.name, job: parsed.job, keepDoing: parsed.keepDoing, trigger: parsed.trigger, colorIndex: color, visual });
    onClose();
    router.push(`/team/${id}`);
  };

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-3 backdrop-blur-md sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-bot-title"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="panel-solid max-h-[92vh] w-full max-w-[560px] overflow-y-auto p-6 md:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="create-bot-title" className="text-[26px] font-semibold tracking-[-0.02em] text-white">
                    Create your own bot
                  </h2>
                  <p className="mt-1.5 text-[14px] text-fg-2">Say what it should keep doing. It starts working the moment you hit create.</p>
                </div>
                <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-fg-3 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <label className="mt-7 block text-[13px] font-medium text-fg-2" htmlFor="bot-what">
                What should it keep doing?
              </label>
              <textarea
                id="bot-what"
                ref={inputRef}
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                rows={3}
                placeholder="Watch for new restaurants in my town that don't have a website"
                className="mt-2 w-full resize-none rounded-[14px] bg-white/[0.04] px-4 py-3 text-[15px] leading-snug text-white placeholder:text-fg-4 hairline focus:outline-none"
              />
              {!what && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {IDEAS.map((i) => (
                    <button key={i} onClick={() => setWhat(i)} className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[12px] text-fg-2 hover:text-white">
                      {i}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto]">
                <div>
                  <label className="block text-[13px] font-medium text-fg-2" htmlFor="bot-name">
                    Name
                  </label>
                  <input
                    id="bot-name"
                    value={shownName}
                    onChange={(e) => {
                      setName(e.target.value.slice(0, 24));
                      setNameTouched(true);
                    }}
                    placeholder="Name your bot"
                    className="mt-2 w-full rounded-[12px] bg-white/[0.04] px-4 py-2.5 text-[15px] text-white placeholder:text-fg-4 hairline focus:outline-none"
                  />
                  <div className="mt-5 text-[13px] font-medium text-fg-2">Color</div>
                  <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Color">
                    {CUSTOM_COLORS.map((c, i) => (
                      <button key={c.hex} role="radio" aria-checked={color === i} aria-label={`Color ${i + 1}`} onClick={() => setColor(i)} className={cn("h-7 w-7 rounded-full transition-transform", color === i && "scale-110")} style={{ background: c.hex, boxShadow: color === i ? `0 0 0 2px #000, 0 0 0 4px ${c.hex}` : undefined }} />
                    ))}
                  </div>
                  <div className="mt-5 text-[13px] font-medium text-fg-2">Look</div>
                  <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Look">
                    {VISUALS.map((v) => (
                      <button key={v.id} role="radio" aria-checked={visual === v.id} onClick={() => setVisual(v.id)} className={cn("rounded-full px-3 py-1.5 text-[12px] transition-colors", visual === v.id ? "bg-white text-black" : "bg-white/[0.05] text-fg-2 hover:text-white")}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-3 rounded-[18px] bg-white/[0.02] px-6 py-5">
                  <AgentGlyph agent={preview} size={84} />
                  <div className="max-w-[140px] truncate text-center text-[14px] font-medium text-white">{shownName || "Your bot"}</div>
                </div>
              </div>

              {what.trim() && (
                <p className="mt-6 text-[13px] text-fg-3">
                  First routine: <span className="text-fg-1">{parsed.keepDoing}</span> · <span className="text-fg-2">{describeTrigger(parsed.trigger)}</span>. Anything it sends waits for your yes.
                </p>
              )}

              <div className="mt-7 flex justify-end gap-2">
                <button onClick={onClose} className="h-10 rounded-full px-4 text-[14px] text-fg-3 hover:text-white">
                  Cancel
                </button>
                <button onClick={create} disabled={!what.trim()} className="h-10 rounded-full bg-white px-5 text-[14px] font-medium text-black hover:opacity-85 disabled:opacity-30">
                  Create and start
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
