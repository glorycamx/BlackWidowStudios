"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { CalendarClock, Newspaper, Plus, Target, TrendingUp } from "lucide-react";
import { Composer, type ComposerHandle } from "@/components/chat/Composer";
import { CommandThread } from "@/components/command/CommandThread";
import { PlanDialog } from "@/components/command/PlanDialog";
import { TeamChat } from "@/components/command/TeamChat";
import { CreateBotDialog } from "@/components/bots/CreateBotDialog";
import { useWorkspace, workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";

/** One-click starts. Each sends a request Manager turns into a Deploy card. */
const STARTERS = [
  { icon: Target, label: "Find hot leads", prompt: "Every morning, find local businesses whose website just went down" },
  { icon: CalendarClock, label: "Post for me", prompt: "Keep my social posts going out every weekday at 8 AM" },
  { icon: TrendingUp, label: "Watch competitors", prompt: "Watch my competitors' prices and tell me when they change" },
  { icon: Newspaper, label: "Morning brief", prompt: "Text me a short news brief for my industry every morning at 7" },
];

/**
 * The home screen. Empty: one question and one message box, like a fresh
 * chat. With messages: the conversation, and the box stays at the bottom.
 */
export function CommandView() {
  const router = useRouter();
  const params = useSearchParams();
  const chat = useWorkspace((s) => s.chat);
  const thinking = useWorkspace((s) => s.thinking);
  const [value, setValue] = useState("");
  const [review, setReview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const composer = useRef<ComposerHandle>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const handled = useRef(false);
  const team = params.get("tab") === "team";

  const send = useCallback((t: string) => {
    setValue("");
    void workspace.sendCommand(t);
  }, []);

  // Deep links: ?prompt=… (from the homepage) and ?focus=1 (New agent).
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const prompt = params.get("prompt");
    if (prompt) {
      send(prompt);
      router.replace("/chat");
    } else if (params.get("focus")) {
      requestAnimationFrame(() => composer.current?.focus());
      router.replace("/chat");
    }
  }, [params, router, send]);

  useEffect(() => {
    if (chat.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length, thinking]);

  if (team) {
    return (
      <div className="mx-auto w-full max-w-[760px] px-5">
        <h1 className="pt-8 text-[22px] font-semibold tracking-[-0.02em] text-white">Team chat</h1>
        <TeamChat />
      </div>
    );
  }

  const empty = chat.length === 0;

  if (empty) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-[12vh] pt-10">
        <motion.div className="w-full max-w-[720px]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <h1 className="text-center text-[clamp(26px,3.2vw,34px)] font-semibold tracking-[-0.025em] text-white">What should your agents do?</h1>
          <Composer
            ref={composer}
            className="mt-7"
            size="lg"
            value={value}
            onChange={setValue}
            onSubmit={send}
            autoFocus
            placeholder="Describe a job, like “find roofers in Nashua whose sites are slow”"
          />
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {STARTERS.map((s) => (
              <button key={s.label} onClick={() => send(s.prompt)} className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] text-fg-1 ring-1 ring-[var(--color-line-2)] transition-colors hover:bg-white/[0.05]">
                <s.icon size={15} className="text-fg-3" />
                {s.label}
              </button>
            ))}
            <button onClick={() => setCreating(true)} className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] text-fg-1 ring-1 ring-[var(--color-line-2)] transition-colors hover:bg-white/[0.05]">
              <Plus size={15} className="text-fg-3" />
              Create your own
            </button>
          </div>
          <p className="mt-6 text-center text-[13px] text-fg-3">Agents work around the clock. Nothing is sent or posted without your yes.</p>
        </motion.div>
        <CreateBotDialog open={creating} onClose={() => setCreating(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-[760px] flex-1 px-5 pb-6 pt-8">
        <CommandThread messages={chat} thinking={thinking} onReviewPlan={setReview} onNewMission={() => composer.current?.focus()} />
        <div ref={endRef} className="h-4" />
      </div>
      <div className="sticky bottom-0 z-10 bg-gradient-to-t from-[var(--surface-canvas)] via-[var(--surface-canvas)] to-transparent px-5 pb-4 pt-6">
        <div className="mx-auto w-full max-w-[760px]">
          <Composer ref={composer} value={value} onChange={setValue} onSubmit={send} disabled={thinking} placeholder="Message Manager" />
          <p className="mt-2 text-center text-[12px] text-fg-4">Agents ask before anything is sent, posted or spent.</p>
        </div>
      </div>
      <PlanDialog planId={review} onClose={() => setReview(null)} />
    </div>
  );
}
