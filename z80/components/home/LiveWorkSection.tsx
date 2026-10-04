"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Display, Reveal, Section } from "@/components/home/Section";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { agentOrFallback } from "@/data/agents";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const BEATS: { t: string; agent: string; text: string; task: number }[] = [
  { t: "09:41:03", agent: "dots", text: "Mission decomposed into 7 tasks.", task: 0 },
  { t: "09:41:06", agent: "grok", text: "Scanning target region.", task: 1 },
  { t: "09:41:14", agent: "grok", text: "247 companies identified.", task: 1 },
  { t: "09:41:21", agent: "grok", text: "68 passed initial qualification.", task: 2 },
  { t: "09:41:25", agent: "muse", text: "Analyzing each company's positioning.", task: 3 },
  { t: "09:41:32", agent: "muse", text: "Creating personalized opening lines.", task: 3 },
  { t: "09:41:41", agent: "dots", text: "50 prospects prepared.", task: 4 },
];

const TASKS = ["Plan", "Find", "Qualify", "Write", "Prepare", "Approve"];

/** STATE 04 — illustrative execution timeline (loops while in view). */
export function LiveWorkSection() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-25% 0px" });
  const [n, setN] = useState(0);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setN(BEATS.length + 1);
      return;
    }
    if (n <= BEATS.length) {
      const t = setTimeout(() => setN((x) => x + 1), n === 0 ? 400 : 1100);
      return () => clearTimeout(t);
    }
    if (approved) {
      const t = setTimeout(() => {
        setApproved(false);
        setN(0);
      }, 3600);
      return () => clearTimeout(t);
    }
  }, [inView, n, approved, reduce]);

  const shown = BEATS.slice(0, Math.min(n, BEATS.length));
  const needsApproval = n > BEATS.length;
  const currentTask = needsApproval ? 5 : shown.length ? shown[shown.length - 1].task : -1;

  return (
    <Section id="live" index="05" label="Execution" className="py-[16vh]">
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_minmax(0,600px)] lg:gap-20">
        <div>
          <Display lines={["Watch the", "work happen."]} />
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-[420px] text-[16px] leading-relaxed text-fg-2">
              These aren&apos;t chatbots waiting for prompts. Deployed intelligences work through the mission on their own, and every step is visible as it happens.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="label mt-6 text-[10px]">Illustration — timings shortened</p>
          </Reveal>
        </div>

        <div ref={ref} className="panel-solid overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <div className="label text-[10px]">Mission 0248</div>
              <div className="mt-1.5 text-[14.5px] text-white">Generate qualified leads for a roofing company</div>
            </div>
            <span className="label flex items-center gap-2 text-[10px]" style={{ color: approved ? "#fff" : needsApproval ? "var(--color-attn)" : "var(--color-run)" }}>
              <StatusDot color={approved ? "#fff" : needsApproval ? "var(--color-attn)" : "var(--color-run)"} size={5} live={!approved} />
              {approved ? "Launching" : needsApproval ? "Awaiting you" : "Running"}
            </span>
          </div>

          {/* Task rail */}
          <div className="flex items-center gap-1 border-b border-line px-5 py-4">
            {TASKS.map((t, i) => {
              const done = i < currentTask || approved;
              const now = i === currentTask && !approved;
              return (
                <div key={t} className="flex flex-1 flex-col gap-2">
                  <div className="relative h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ background: i === 5 ? "var(--color-attn)" : "linear-gradient(90deg,#456cff,#8754ff)" }}
                      animate={{ width: done ? "100%" : now ? "55%" : "0%" }}
                      transition={{ duration: 0.8, ease: EASE }}
                    />
                  </div>
                  <span className={cn("font-mono text-[9.5px] uppercase tracking-[0.12em]", done || now ? "text-fg-2" : "text-fg-4")}>{t}</span>
                </div>
              );
            })}
          </div>

          <ol className="min-h-[380px] space-y-0.5 px-2 py-3" aria-live="polite">
            <AnimatePresence initial={false}>
              {shown.map((b, i) => {
                const a = agentOrFallback(b.agent);
                return (
                  <motion.li
                    key={`${b.t}-${i}`}
                    className="grid grid-cols-[66px_84px_1fr] items-baseline gap-3 rounded-lg px-3 py-2"
                    initial={{ opacity: 0, x: -8, backgroundColor: "rgba(255,255,255,0.04)" }}
                    animate={{ opacity: 1, x: 0, backgroundColor: "rgba(255,255,255,0)" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: EASE }}
                  >
                    <span className="font-mono text-[11px] text-fg-3">{b.t}</span>
                    <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: a.accent.tint }}>
                      <span className="h-1 w-1 rounded-full" style={{ background: a.accent.hex }} />
                      {a.name}
                    </span>
                    <span className="text-[14px] text-fg-1">{b.text}</span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {needsApproval && (
              <motion.li
                className="mx-1 mt-3 rounded-[12px] p-4"
                style={{ boxShadow: "inset 0 0 0 1px rgba(215,123,255,0.35)", background: "rgba(215,123,255,0.05)" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-fg-3">09:41:43</span>
                  <span className="label text-[10px] text-attn">Approval required</span>
                </div>
                <p className="mt-2.5 text-[15px] text-white">{approved ? "Approved. Outreach scheduled for tomorrow, 9:00 AM." : "Review campaign before anything is sent?"}</p>
                {!approved && (
                  <div className="mt-4 flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setApproved(true)}>
                      Review
                    </Button>
                    <Button variant="solid" size="sm" magnetic={false} icon={<Check size={13} />} onClick={() => setApproved(true)}>
                      Approve
                    </Button>
                  </div>
                )}
              </motion.li>
            )}
          </ol>
        </div>
      </div>
    </Section>
  );
}
