"use client";

import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AmbientRail } from "@/components/app/AmbientRail";
import { CommandConsole, MISSION_EXAMPLES, type CommandConsoleHandle } from "@/components/command/CommandConsole";
import { CommandThread } from "@/components/command/CommandThread";
import { PlanDialog } from "@/components/command/PlanDialog";
import { selectPendingApprovals, selectVisibleSignals, useWorkspace, workspace } from "@/lib/store/workspace";
import { useNow } from "@/lib/hooks/useNow";
import Link from "next/link";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { CreateBotDialog } from "@/components/bots/CreateBotDialog";
import { TeamChat } from "@/components/command/TeamChat";

const SUGGESTIONS = [
  "Text me every morning at 7 with new hot leads",
  "Keep my posting calendar full for the next two weeks",
  "Watch my competitors' prices and tell me when they change",
  "Find 20 roofers in Nashua whose sites are slow",
];

export function CommandView() {
  const router = useRouter();
  const params = useSearchParams();
  const chat = useWorkspace((s) => s.chat);
  const thinking = useWorkspace((s) => s.thinking);
  const org = useWorkspace((s) => s.org);
  const signals = useWorkspace(selectVisibleSignals);
  const decisions = useWorkspace(selectPendingApprovals).length;
  const now = useNow(30000);
  const recent = signals.filter((x) => x.at > now - 12 * 3600e3 && x.kind === "lead");
  const overnight = { leads: recent.length, hot: recent.filter((x) => x.lead?.temperature === "hot").length, decisions };
  const [value, setValue] = useState("");
  const [review, setReview] = useState<string | null>(null);
  const [tab, setTab] = useState<"manager" | "team">(params.get("tab") === "team" ? "team" : "manager");
  const [creating, setCreating] = useState(false);
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
      router.replace("/chat");
    } else if (params.get("focus")) {
      requestAnimationFrame(() => consoleRef.current?.focus());
      router.replace("/chat");
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
      <section aria-label="Chat" className="relative flex min-h-[calc(100dvh-8.5rem)] flex-col px-5 md:px-10 lg:min-h-dvh">
        <div role="tablist" aria-label="Chat" className="mx-auto mt-6 flex w-full max-w-[760px] gap-1">
          {(
            [
              ["manager", "Manager"],
              ["team", "Team chat"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("h-8 rounded-[9px] px-3 text-[13px] transition-colors", tab === id ? "bg-white/[0.08] text-white" : "text-fg-3 hover:text-fg-1")}>
              {label}
            </button>
          ))}
        </div>
        {tab === "team" ? (
          <TeamChat />
        ) : empty ? (
          <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center py-12">
            <motion.p className="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Chat with Manager{org?.name ? ` · ${org.name}` : ""}
            </motion.p>
            <motion.h1
              className="mt-6 text-[clamp(42px,6vw,80px)] font-semibold leading-[0.95] tracking-[-0.05em] text-white"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              What should your bots
              <br />
              <span className="text-fg-3">keep doing?</span>
            </motion.h1>
            <motion.div className="mt-8 grid grid-cols-3 gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08, ease: EASE }}>
              {[
                { n: overnight.leads, k: "new leads", href: "/live" },
                { n: overnight.hot, k: "hot", href: "/live" },
                { n: overnight.decisions, k: overnight.decisions === 1 ? "needs your yes" : "need your yes", href: "/approvals" },
              ].map((x) => (
                <Link key={x.k} href={x.href} className="rounded-[20px] bg-white/[0.04] px-5 py-4 transition-colors hover:bg-white/[0.07]">
                  <div className="text-[30px] font-semibold tabular-nums tracking-[-0.03em] text-white">{x.n}</div>
                  <div className="text-[14px] text-fg-3">{x.k}</div>
                </Link>
              ))}
            </motion.div>
            <motion.div className="mt-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: EASE }}>
              <CommandConsole ref={consoleRef} id="command-input" value={value} onChange={setValue} onSubmit={send} examples={MISSION_EXAMPLES} />
              <p className="mt-3 px-2 text-[14px] text-fg-4">Ongoing asks become routines that run around the clock. One-offs become jobs.</p>
            </motion.div>
            <motion.ul className="mt-6 grid gap-2 sm:grid-cols-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button onClick={() => send(s)} className="h-full w-full rounded-[12px] px-4 py-3 text-left text-[13.5px] leading-snug text-fg-2 transition-colors hairline hover:bg-white/[0.025] hover:text-white">
                    {s}
                  </button>
                </li>
              ))}
              <li>
                <button onClick={() => setCreating(true)} className="h-full w-full rounded-[12px] border border-dashed border-white/15 px-4 py-3 text-left text-[13.5px] leading-snug text-fg-2 transition-colors hover:bg-white/[0.025] hover:text-white">
                  Create a bot that…
                </button>
              </li>
            </motion.ul>
          </div>
        ) : (
          <>
            <div className="mx-auto w-full max-w-[760px] flex-1 pb-8 pt-10">
              <div className="mb-10 flex items-center justify-end">
                <button onClick={() => workspace.clearConversation()} className="text-[12px] text-fg-4 hover:text-fg-2">
                  New conversation
                </button>
              </div>
              <CommandThread messages={chat} thinking={thinking} onReviewPlan={setReview} onNewMission={newMission} />
              <div ref={endRef} className="h-4" />
            </div>
            <div className="sticky bottom-[4.5rem] z-10 mx-auto w-full max-w-[760px] pb-4 pt-2 lg:bottom-0 lg:pb-6">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent" />
              <CommandConsole ref={consoleRef} id="command-input" size="compact" value={value} onChange={setValue} onSubmit={send} disabled={thinking} hint="Talk to Manager." />
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
      <CreateBotDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
