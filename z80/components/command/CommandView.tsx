"use client";

import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AmbientRail } from "@/components/app/AmbientRail";
import { CommandConsole, MISSION_EXAMPLES, type CommandConsoleHandle } from "@/components/command/CommandConsole";
import { CommandThread } from "@/components/command/CommandThread";
import { PlanDialog } from "@/components/command/PlanDialog";
import { useWorkspace, workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { greeting } from "@/lib/utils";

const SUGGESTIONS = [
  "Find 50 businesses in my area that need a new website and build a personalized outreach campaign.",
  "I want more commercial roofing jobs next month.",
  "Research my top five competitors and tell me where we can win.",
  "Run our content operation: plan a month of posts and write the first week.",
];

export function CommandView() {
  const router = useRouter();
  const params = useSearchParams();
  const chat = useWorkspace((s) => s.chat);
  const thinking = useWorkspace((s) => s.thinking);
  const org = useWorkspace((s) => s.org);
  const [value, setValue] = useState("");
  const [review, setReview] = useState<string | null>(null);
  const consoleRef = useRef<CommandConsoleHandle>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const handled = useRef(false);

  const send = useCallback((t: string) => {
    setValue("");
    void workspace.sendCommand(t);
  }, []);

  // Deep links: ?focus=1, ?prompt=…
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const prompt = params.get("prompt");
    if (prompt) {
      send(prompt);
      router.replace("/command");
    } else if (params.get("focus")) {
      requestAnimationFrame(() => consoleRef.current?.focus());
      router.replace("/command");
    }
  }, [params, router, send]);

  useEffect(() => {
    if (chat.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length, thinking]);

  const newMission = () => {
    setValue("");
    consoleRef.current?.focus();
  };

  const empty = chat.length === 0;

  return (
    <div className="mx-auto grid w-full max-w-[1320px] xl:grid-cols-[minmax(0,1fr)_300px]">
      <section aria-label="Command" className="relative flex min-h-[calc(100dvh-8.5rem)] flex-col px-5 md:px-10 lg:min-h-dvh">
        {empty ? (
          <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center py-12">
            <motion.p className="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Command{org?.name ? ` · ${org.name}` : ""}
            </motion.p>
            <motion.h1
              className="mt-6 text-[clamp(42px,6vw,80px)] font-semibold leading-[0.95] tracking-[-0.05em] text-white"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              {greeting()}
              <br />
              <span className="text-fg-3">What should we accomplish?</span>
            </motion.h1>
            <motion.div className="mt-10" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: EASE }}>
              <CommandConsole ref={consoleRef} id="command-input" value={value} onChange={setValue} onSubmit={send} examples={MISSION_EXAMPLES} />
            </motion.div>
            <motion.ul className="mt-6 grid gap-2 sm:grid-cols-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button onClick={() => send(s)} className="h-full w-full rounded-[12px] px-4 py-3 text-left text-[13.5px] leading-snug text-fg-2 transition-colors hairline hover:bg-white/[0.025] hover:text-white">
                    {s}
                  </button>
                </li>
              ))}
            </motion.ul>
          </div>
        ) : (
          <>
            <div className="mx-auto w-full max-w-[760px] flex-1 pb-8 pt-10">
              <div className="label mb-10 flex items-center justify-between">
                <span>Command</span>
                <button onClick={() => workspace.clearConversation()} className="text-[12px] text-fg-4 hover:text-fg-2">
                  New conversation
                </button>
              </div>
              <CommandThread messages={chat} thinking={thinking} onReviewPlan={setReview} onNewMission={newMission} />
              <div ref={endRef} className="h-4" />
            </div>
            <div className="sticky bottom-[4.5rem] z-10 mx-auto w-full max-w-[760px] pb-4 pt-2 lg:bottom-0 lg:pb-6">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent" />
              <CommandConsole ref={consoleRef} id="command-input" size="compact" value={value} onChange={setValue} onSubmit={send} disabled={thinking} hint="Talk to your workforce." />
            </div>
          </>
        )}
      </section>

      <aside aria-label="Workspace status" className="hidden border-l border-line px-7 py-10 xl:block">
        <div className="sticky top-10">
          <AmbientRail />
        </div>
      </aside>

      <PlanDialog planId={review} onClose={() => setReview(null)} />
    </div>
  );
}
