"use client";

import { motion } from "motion/react";
import { HomeComposer } from "@/components/home/HomeComposer";
import { COPY } from "@/lib/copy";
import { EASE } from "@/lib/motion";

/** Where the orb rests in the hero (mirrors HomeScene). */
export function heroStage(desktop: boolean) {
  return { offset: (desktop ? [0.5, 0] : [0, 0.5]) as [number, number], scale: desktop ? 0.62 : 0.5 };
}

/** One promise, one box. Type what you need and you're in. */
export function Hero() {
  return (
    <section id="hero" aria-label="Z80" className="relative z-10 flex min-h-[100svh] flex-col">
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col justify-center px-5 pb-16 pt-[44vh] md:px-10 md:pt-24">
        <motion.div className="max-w-[600px]" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 1, ease: EASE }}>
          <p className="text-[14px] text-fg-3">{COPY.brandLine}</p>
          <h1 className="mt-3 text-[clamp(40px,5.4vw,72px)] font-semibold leading-[1.02] tracking-[-0.035em] text-white">AI agents that never clock out.</h1>
          <p className="mt-5 max-w-[500px] text-[clamp(17px,1.4vw,19px)] leading-[1.5] text-fg-2">
            Tell an agent what to do. It finds leads, posts your content and watches your market around the clock, and asks before anything goes out.
          </p>
          <HomeComposer className="mt-8" />
          <p className="mt-4 text-[13px] text-fg-3">Free demo. No sign-up needed.</p>
        </motion.div>
      </div>
    </section>
  );
}
