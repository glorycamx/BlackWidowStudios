"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { ThemeSwitch } from "@/components/app/ThemeSwitch";
import { Portal } from "@/components/ui/Portal";
import { availableAgents } from "@/data/bots";
import { useWorkspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { tint } from "@/lib/tint";
import { cn } from "@/lib/utils";

const KEY = "z80.welcome.v1";
const OPEN_EVENT = "z80:welcome";

/** Show the welcome again (Settings). */
export function openWelcome() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

const STEPS = [
  { title: "Meet your team.", body: "Five bots, each with one job. They work for you around the clock." },
  { title: "They never clock out.", body: "Every few seconds they check something. When they find something worth your time, it shows up in Live." },
  { title: "You stay the boss.", body: "Nothing gets sent, posted or spent without your yes. Anything waiting on you shows up in Needs you." },
  { title: "Pick a look.", body: "Light, dark, or match your device. You can change it anytime." },
];

/** A short, calm first-run welcome: four cards, then out of the way. */
export function WelcomeTour() {
  const traveling = useWorkspace((s) => s.traveling);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!traveling && !localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* storage blocked: skip the tour */
    }
    const show = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, [traveling]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const last = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-3 backdrop-blur-md sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="welcome-title"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="panel-solid relative w-full max-w-[520px] overflow-hidden p-7 md:p-9"
            >
              <button onClick={close} aria-label="Skip" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-fg-3 hover:text-white">
                <X size={16} />
              </button>

              <div className="flex min-h-[148px] items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: EASE }} className="w-full">
                    <Visual step={step} />
                  </motion.div>
                </AnimatePresence>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  <h2 id="welcome-title" className="mt-6 text-center text-[28px] font-semibold tracking-[-0.03em] text-white">
                    {s.title}
                  </h2>
                  <p className="mx-auto mt-2 max-w-[380px] text-center text-[16px] leading-snug text-fg-2">{s.body}</p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 flex items-center justify-between gap-4">
                <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
                  {STEPS.map((_, i) => (
                    <span key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i === step ? "w-5 bg-white" : "w-1.5 bg-white/20")} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button onClick={() => setStep(step - 1)} className="h-10 rounded-full px-4 text-[14px] text-fg-3 hover:text-white">
                      Back
                    </button>
                  )}
                  <button onClick={() => (last ? close() : setStep(step + 1))} className="h-10 rounded-full bg-white px-6 text-[14px] font-medium text-black hover:opacity-85">
                    {last ? "Start" : "Next"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

function Visual({ step }: { step: number }) {
  if (step === 0)
    return (
      <ul className="grid grid-cols-5 gap-2">
        {availableAgents.map((a) => (
          <li key={a.id} className="flex flex-col items-center gap-2 text-center">
            <AgentGlyph agent={a} size={52} />
            <span className="text-[12px] font-medium leading-tight text-white">{a.name}</span>
            <span className="text-[11px] leading-tight" style={{ color: tint(a.accent) }}>
              {a.domain}
            </span>
          </li>
        ))}
      </ul>
    );
  if (step === 1)
    return (
      <div className="mx-auto max-w-[360px] rounded-[18px] bg-white/[0.04] p-4 hairline">
        <div className="flex items-center gap-3">
          <AgentGlyph agent={availableAgents[1]} size={30} />
          <div className="min-w-0">
            <div className="text-[15px] font-medium text-white">Bayside Painting</div>
            <div className="text-[13px] text-fg-3">Website went down</div>
          </div>
          <span className="ml-auto rounded-full px-2 py-0.5 text-[12px]" style={{ color: "#ff6f91", background: "#ff6f9118" }}>
            Hot
          </span>
        </div>
        <div className="mt-3 text-[12px] tabular-nums text-fg-3">Happened 2:07 AM · Caught 2:09 AM</div>
      </div>
    );
  if (step === 2)
    return (
      <div className="mx-auto max-w-[360px] rounded-[18px] bg-white/[0.04] p-4 hairline">
        <div className="text-[13px] text-fg-3">Content Creator wants to send</div>
        <div className="mt-1 text-[15px] text-white">An opener to Dana at Bayside Painting</div>
        <div className="mt-3 flex gap-2">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-medium text-black">
            <CheckCircle2 size={13} /> Approve
          </span>
          <span className="inline-flex h-8 items-center rounded-full px-3 text-[13px] text-fg-2 hairline">Hold</span>
        </div>
      </div>
    );
  return <ThemeSwitch size="lg" className="mx-auto max-w-[360px]" />;
}
