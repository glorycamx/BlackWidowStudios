"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { AnalysisSequence } from "@/components/command/AnalysisSequence";
import { CommandConsole, type CommandConsoleHandle } from "@/components/command/CommandConsole";
import { TeamAssembly, type AssemblyLayout } from "@/components/command/TeamAssembly";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/z80/Wordmark";
import { getAgent } from "@/data/agents";
import { homeDirector, toNdc } from "@/lib/scene/director";
import { homeFlow, type HeroPhase } from "@/lib/scene/homeFlow";
import { workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { missionCode } from "@/lib/utils";
import type { Plan } from "@/types";

export const DEMO_MISSION =
  "Find 50 businesses in my area that need a new website and build a personalized outreach campaign.";

export function Hero() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const consoleRef = useRef<CommandConsoleHandle>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [value, setValue] = useState("");
  const [phase, setPhaseState] = useState<HeroPhase>("idle");
  const [objective, setObjective] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [transition, setTransition] = useState<{ number: number } | null>(null);
  const typing = useRef<ReturnType<typeof setInterval> | null>(null);

  const setPhase = useCallback((p: HeroPhase) => {
    setPhaseState(p);
    homeFlow.set({ phase: p });
  }, []);

  useEffect(() => () => homeFlow.set({ phase: "idle", layout: null }), []);

  const start = useCallback(
    (text: string) => {
      const t = text.trim();
      if (t.length < 3) return;
      setObjective(t);
      setPlan(null);
      setPhase("analyzing");
      sectionRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      workspace.plan(t).then(setPlan);
    },
    [reduce, setPhase],
  );

  // Final CTA (or anything else) can launch a mission into the hero.
  useEffect(
    () =>
      homeFlow.onMissionRequest((text) => {
        setValue(text);
        start(text);
      }),
    [start],
  );

  // DEPLOY hover: nearby particles pull toward the button.
  useEffect(() => {
    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest?.("[data-deploy]");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const [x, y] = toNdc(r.left + r.width / 2, r.top + r.height / 2);
      homeDirector.set({ attract: [x, y, 1] });
    };
    const out = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest?.("[data-deploy]");
      if (el && !el.contains(e.relatedTarget as Node)) homeDirector.set({ attract: [homeDirector.get().attract[0], homeDirector.get().attract[1], 0] });
    };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      if (typing.current) clearInterval(typing.current);
    };
  }, []);

  /** "Deploy your team" with an empty console types the demo mission. */
  const deployCta = () => {
    if (value.trim().length > 2) return start(value);
    if (typing.current) clearInterval(typing.current);
    if (reduce) {
      setValue(DEMO_MISSION);
      return start(DEMO_MISSION);
    }
    let i = 0;
    consoleRef.current?.focus();
    typing.current = setInterval(() => {
      i += 2;
      setValue(DEMO_MISSION.slice(0, i));
      if (i >= DEMO_MISSION.length) {
        if (typing.current) clearInterval(typing.current);
        setTimeout(() => start(DEMO_MISSION), 380);
      }
    }, 16);
  };

  const onLayout = useCallback((layout: AssemblyLayout | null) => {
    homeFlow.set({ layout });
  }, []);

  const onDeployed = (missionId: string) => {
    const number = Number(missionId.replace(/\D/g, "")) || 0;
    setTransition({ number });
    setTimeout(() => router.push(`/missions/${missionId}?deployed=1`), reduce ? 150 : 900);
  };

  const groupsFor = (p: Plan | null): [number, number, number] => {
    const g: [number, number, number] = [0, 0, 0];
    p?.agents.forEach((a) => {
      const sg = getAgent(a.agentId)?.sceneGroup;
      if (sg !== undefined) g[sg] = 1;
    });
    return g;
  };

  useEffect(() => {
    homeFlow.set({ activeGroups: groupsFor(plan) });
  }, [plan]);

  const inAssembly = phase === "assembly" || phase === "deploying";

  return (
    <section ref={sectionRef} id="hero" aria-label="Z80" className="relative z-10 flex min-h-[100svh] flex-col">
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 pb-10 pt-24 md:px-10 md:pt-28">
        <AnimatePresence mode="wait">
          {!inAssembly ? (
            <motion.div
              key="intro"
              className="flex flex-1 flex-col justify-center pt-[34vh] md:pt-0"
              exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <div className="max-w-[640px]">
                <motion.p
                  className="label flex items-center gap-2.5 text-fg-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1, duration: 1 }}
                >
                  <span className="h-px w-6 bg-gradient-to-r from-transparent to-white/50" />
                  The AI workforce operating system
                </motion.p>
                <motion.h1
                  className="mt-5 text-[clamp(76px,11.5vw,184px)] leading-[0.86]"
                  initial={{ opacity: 0, y: 20, filter: "blur(14px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.45, duration: 1.4, ease: EASE }}
                >
                  <Wordmark animated />
                  <span className="sr-only"> — Deploy your AI workforce</span>
                </motion.h1>
                <motion.p
                  className="mt-6 text-[clamp(22px,2.3vw,32px)] font-normal leading-[1.15] tracking-[-0.025em] text-fg-1/90"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.95, duration: 1, ease: EASE }}
                >
                  Super intelligence is here.
                </motion.p>
                <motion.p
                  className="mt-2.5 text-[15px] leading-relaxed text-fg-3 md:text-[16px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 1 }}
                >
                  Describe the outcome. Z80 deploys the team to do it.
                </motion.p>

                <motion.div
                  className="mt-9 md:mt-10"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.35, duration: 1, ease: EASE }}
                >
                  <AnimatePresence mode="wait">
                    {phase === "idle" ? (
                      <motion.div key="console" exit={{ opacity: 0, scale: 0.985 }} transition={{ duration: 0.3 }}>
                        <CommandConsole ref={consoleRef} value={value} onChange={setValue} onSubmit={start} />
                      </motion.div>
                    ) : (
                      <motion.div key="analysis" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: EASE }}>
                        <AnalysisSequence objective={objective} ready={!!plan} onDone={() => setPhase("assembly")} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  className="mt-6 flex flex-wrap items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: phase === "idle" ? 1 : 0.3 }}
                  transition={{ delay: phase === "idle" ? 1.6 : 0, duration: 0.8 }}
                >
                  <Button variant="primary" size="lg" onClick={deployCta} disabled={phase !== "idle"} data-deploy>
                    Deploy your team
                  </Button>
                  <Button variant="ghost" size="lg" href="#how" iconRight={<ArrowDown size={14} />}>
                    See how it works
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            plan && (
              <motion.div
                key="assembly"
                className="flex flex-1 flex-col justify-center py-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <TeamAssembly
                  plan={plan}
                  onLayout={onLayout}
                  onBack={() => {
                    setPhase("idle");
                    homeFlow.set({ layout: null });
                  }}
                  onDeployStart={() => setPhase("deploying")}
                  onDeployed={onDeployed}
                />
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      {!inAssembly && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center md:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 1 }}
          aria-hidden
        >
          <div className="flex flex-col items-center gap-3">
            <span className="label text-[10px]">Scroll</span>
            <span className="relative h-10 w-px overflow-hidden bg-white/10">
              <motion.span className="absolute inset-x-0 top-0 h-3 bg-white/70" animate={{ y: [-12, 40] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
            </span>
          </div>
        </motion.div>
      )}

      {/* Deploy → mission control transition */}
      <AnimatePresence>
        {transition && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: EASE }}
            role="status"
            aria-live="assertive"
          >
            <motion.div className="text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6, ease: EASE }}>
              <div className="label text-fg-2">Mission {missionCode(transition.number)}</div>
              <motion.div
                className="mx-auto mt-5 h-px bg-gradient-to-r from-transparent via-[#8f9cff] to-transparent"
                initial={{ width: 0 }}
                animate={{ width: 260 }}
                transition={{ duration: 0.8, ease: EASE }}
              />
              <div className="mt-5 text-[22px] font-medium tracking-[-0.02em] text-white">Team deployed.</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
