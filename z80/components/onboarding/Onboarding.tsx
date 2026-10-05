"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CommandConsole, type CommandConsoleHandle } from "@/components/command/CommandConsole";
import { TeamAssembly } from "@/components/command/TeamAssembly";
import { workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types";

const GOALS = [
  { id: "customers", label: "More customers", ask: "Who are your best customers, and where are they?", hint: "e.g. Homeowners in southern New Hampshire" },
  { id: "marketing", label: "Better marketing", ask: "What are you promoting next?", hint: "e.g. Our new monthly care plan" },
  { id: "admin", label: "Less admin", ask: "What takes up the most time each week?", hint: "e.g. Chasing project updates and writing reports" },
  { id: "research", label: "Faster research", ask: "What do you need to know more about?", hint: "e.g. The five competitors we lose deals to" },
  { id: "followup", label: "Better follow-up", ask: "Who isn't getting followed up with today?", hint: "e.g. Last month's customers and quotes that went quiet" },
  { id: "other", label: "Something else", ask: "What should your bots keep doing, around the clock?", hint: "Tell them in plain English." },
] as const;

type GoalId = (typeof GOALS)[number]["id"];

function objectiveFor(goal: GoalId, answer: string): string {
  const a = answer.trim().replace(/[.]+$/, "");
  switch (goal) {
    case "customers":
      return `Find 50 new customers: ${a}. Research them and build a personalized outreach campaign.`;
    case "marketing":
      return `Research our market and launch a campaign for ${a}.`;
    case "admin":
      return `Organize and coordinate this for us: ${a}. Send me a weekly status report.`;
    case "research":
      return `Research ${a} and tell me where we can win.`;
    case "followup":
      return `Follow up with ${a} and ask happy customers for a review.`;
    default:
      return a;
  }
}

interface Line {
  id: string;
  from: "z80" | "user";
  text: string;
}

/** Onboarding begins with a conversation, not forms. */
export function Onboarding() {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [step, setStep] = useState(0);
  const [value, setValue] = useState("");
  const [company, setCompany] = useState("");
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [typing, setTyping] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const inputRef = useRef<CommandConsoleHandle>(null);
  const started = useRef(false);

  const say = (text: string, delay = 700) =>
    new Promise<void>((res) => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setLines((l) => [...l, { id: `${Date.now()}-${l.length}`, from: "z80", text }]);
        res();
      }, delay);
    });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      await say("Let's set up your bots.", 500);
      await say("What does your company do?", 800);
      setTimeout(() => inputRef.current?.focus(), 100);
    })();
  }, []);

  const answer = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    setLines((l) => [...l, { id: `u-${Date.now()}`, from: "user", text: t }]);
    setValue("");
    if (step === 0) {
      setCompany(t);
      setStep(1);
      await say("Got it. What would make the biggest difference to your business right now?", 900);
    } else if (step === 2 && goal) {
      setStep(3);
      await say("Here are the bots I'd start with.", 900);
      workspace.setOrg({ name: "Your company", description: company, focus: GOALS.find((g) => g.id === goal)?.label ?? "" });
      const p = await workspace.plan(objectiveFor(goal, t));
      setPlan(p);
      setStep(4);
    }
  };

  const pickGoal = async (g: (typeof GOALS)[number]) => {
    if (step !== 1) return;
    setGoal(g.id);
    setLines((l) => [...l, { id: `u-${Date.now()}`, from: "user", text: g.label }]);
    setStep(2);
    await say(g.ask, 800);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const g = GOALS.find((x) => x.id === goal);
  const progress = Math.min(3, step === 0 ? 0 : step === 1 ? 1 : step === 2 ? 2 : 3);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col px-5 pb-12 md:px-10">
      <div className="mx-auto w-full max-w-[720px] pt-8">
        <div className="flex items-center justify-between">
          <p className="label">Let&apos;s set up your bots</p>
          <div className="flex gap-1.5" aria-label={`Step ${progress + 1} of 4`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn("h-[3px] w-8 rounded-full transition-colors duration-500", i <= progress ? "bg-white" : "bg-white/10")} />
            ))}
          </div>
        </div>

        <ol className="mt-12 space-y-6" aria-live="polite">
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <motion.li key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className={l.from === "user" ? "flex justify-end" : ""}>
                {l.from === "z80" ? (
                  <div>
                    <div className="label mb-2 text-[10px] text-fg-1">Z80</div>
                    <p className="text-[clamp(22px,2.6vw,30px)] font-medium leading-[1.2] tracking-[-0.03em] text-white">{l.text}</p>
                  </div>
                ) : (
                  <div className="max-w-[80%] rounded-[16px] rounded-br-[6px] bg-white/[0.07] px-4 py-3 text-[15px] text-white">{l.text}</div>
                )}
              </motion.li>
            ))}
            {typing && (
              <motion.li key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-1" role="status" aria-label="Z80 is typing">
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-[#8f9cff]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
                ))}
              </motion.li>
            )}
          </AnimatePresence>
        </ol>

        <div className="mt-10">
          <AnimatePresence mode="wait">
            {step === 1 && !typing && (
              <motion.ul key="goals" className="grid grid-cols-2 gap-2 sm:grid-cols-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                {GOALS.map((x, i) => (
                  <motion.li key={x.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <button onClick={() => pickGoal(x)} className="h-14 w-full rounded-[12px] px-4 text-left text-[14px] text-fg-1 transition-all hairline hover:bg-white/[0.04] hover:text-white">
                      {x.label}
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            )}
            {(step === 0 || step === 2) && (
              <motion.div key={`input-${step}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                <CommandConsole
                  ref={inputRef}
                  id="onboarding-input"
                  size="compact"
                  label="Answer"
                  hint="Press Enter to continue"
                  value={value}
                  onChange={setValue}
                  onSubmit={answer}
                  disabled={typing}
                  examples={step === 0 ? ["We design websites for local service businesses.", "We run a roofing company in New Hampshire."] : [g?.hint ?? ""]}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {plan && (
          <motion.div className="mt-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
            <p className="label mb-6 text-fg-1">Your first bots</p>
            <TeamAssembly plan={plan} onDeployed={(id) => router.push(`/jobs/${id}?deployed=1`)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
