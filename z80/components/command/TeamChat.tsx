"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { useBotName } from "@/components/bots/useBot";
import { agentOrFallback } from "@/data/bots";
import { useWorkspace, workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { formatDayTime } from "@/lib/time";
import { useNow } from "@/lib/hooks/useNow";
import type { TeamMessage } from "@/types";

function Name({ id }: { id: string }) {
  const n = useBotName(id);
  return <>{id === "user" ? "You" : n}</>;
}

/** Your bots talking to each other: handoffs, heads-ups and replies. */
export function TeamChat() {
  const messages = useWorkspace((s) => s.teamChat);
  const [text, setText] = useState("");
  const [limit, setLimit] = useState(40);
  const endRef = useRef<HTMLDivElement>(null);
  const now = useNow(30000);
  const shown = messages.slice(-limit);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div className="mx-auto w-full max-w-[760px] pb-6 pt-8">
      <p className="text-[14px] text-fg-3">Your bots hand work to each other here. You can jump in any time.</p>
      {messages.length > limit && (
        <button onClick={() => setLimit((n) => n + 40)} className="mt-6 text-[13px] text-fg-3 hover:text-white">
          Show earlier
        </button>
      )}
      <ol className="mt-6 space-y-5" aria-live="polite" aria-label="Team chat">
        {shown.map((m) => (
          <Row key={m.id} m={m} now={now} />
        ))}
      </ol>
      <div ref={endRef} className="h-4" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          workspace.sendTeamMessage(text);
          setText("");
        }}
        className="sticky bottom-[4.5rem] mt-4 flex items-center gap-2 rounded-[16px] bg-[#0d0d12] p-1.5 pl-4 hairline lg:bottom-4"
      >
        <label htmlFor="team-input" className="sr-only">
          Message the team
        </label>
        <input id="team-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the team" className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-white placeholder:text-fg-4 focus:outline-none" />
        <button type="submit" disabled={!text.trim()} aria-label="Send" className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white text-black disabled:opacity-30">
          <ArrowUp size={15} />
        </button>
      </form>
    </div>
  );
}

function Row({ m, now }: { m: TeamMessage; now: number }) {
  const user = m.author === "user";
  const a = agentOrFallback(user ? "manager" : m.author);
  return (
    <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className={user ? "flex justify-end" : "flex gap-3"}>
      {user ? (
        <div className="max-w-[80%] rounded-[16px] rounded-br-[6px] bg-white/[0.07] px-4 py-2.5 text-[15px] text-white">{m.text}</div>
      ) : (
        <>
          <AgentGlyph agent={a} size={28} className="mt-0.5" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
              <span className="font-medium" style={{ color: a.accent.tint }}>
                <Name id={m.author} />
              </span>
              {m.to && (
                <span className="text-fg-4">
                  to <Name id={m.to} />
                </span>
              )}
              <span className="tabular-nums text-fg-4">· {formatDayTime(m.at, now)}</span>
            </div>
            <p className="mt-1 text-[15px] leading-relaxed text-fg-1">
              {m.text}
              {m.ref?.feedItemId && (
                <Link href={`/live?id=${m.ref.feedItemId}`} className="ml-2 text-[13px] text-fg-3 hover:text-white">
                  View
                </Link>
              )}
            </p>
          </div>
        </>
      )}
    </motion.li>
  );
}
