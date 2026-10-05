"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LiveTicker } from "@/components/home/LiveTicker";
import { Wordmark } from "@/components/z80/Wordmark";
import { availableAgents } from "@/data/bots";
import { COPY } from "@/lib/copy";
import { clusterLayout, clusterRadiusPx } from "@/lib/scene/director";
import { EASE } from "@/lib/motion";
import { formatLocalTime } from "@/lib/time";

/** Where the five clusters rest in the hero (mirrors HomeScene). */
export function heroStage(desktop: boolean) {
  return { offset: (desktop ? [0.44, -0.02] : [0, 0.42]) as [number, number], scale: desktop ? 0.72 : 0.5 };
}

/** The hero: one promise, five bots already at work behind it. */
export function Hero() {
  const [now, setNow] = useState<number | null>(null);
  const [labels, setLabels] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    const calc = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w < 900) return setLabels([]);
      const st = heroStage(true);
      const r = clusterRadiusPx(st.scale, w / h, h);
      setLabels(clusterLayout(st.offset, w / h).map(([x, y]) => ({ x: ((x + 1) / 2) * w, y: ((1 - y) / 2) * h + r + 10 })));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => {
      clearInterval(t);
      window.removeEventListener("resize", calc);
    };
  }, []);

  const bots = availableAgents.filter((a) => a.sceneGroup !== undefined).sort((a, b) => (a.sceneGroup ?? 0) - (b.sceneGroup ?? 0));

  return (
    <section id="hero" aria-label="Z80" className="relative z-10 flex min-h-[100svh] flex-col">
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-5 pb-10 pt-[46vh] md:px-10 md:pt-24">
        <div className="max-w-[660px]">
          <motion.div initial={{ opacity: 0, y: 12, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.35, duration: 1.2, ease: EASE }}>
            <div className="text-[clamp(30px,3vw,40px)] leading-none" aria-hidden>
              <Wordmark animated />
            </div>
            <p className="mt-2 text-[15px] tracking-[-0.01em] text-fg-3">{COPY.brandLine}</p>
          </motion.div>
          <motion.h1
            className="display mt-8 text-[clamp(50px,6.4vw,104px)] leading-[0.92]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1.2, ease: EASE }}
          >
            Your AI bots
            <br />
            <span className="text-fg-2">never clock out.</span>
          </motion.h1>
          <motion.p className="mt-6 max-w-[520px] text-[clamp(17px,1.5vw,21px)] leading-[1.45] text-fg-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}>
            {COPY.support} {COPY.buildYourOwn}
          </motion.p>
          <motion.div className="mt-9 flex flex-wrap items-center gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 1, ease: EASE }}>
            <Button variant="primary" size="lg" href="#bots">
              Meet your bots
            </Button>
            <Button variant="ghost" size="lg" href="#night" iconRight={<ArrowDown size={14} />}>
              See what they did last night
            </Button>
          </motion.div>
          <motion.div className="mt-9 max-w-[480px] space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1 }}>
            <p className="text-[14px] text-fg-3" suppressHydrationWarning>
              {now ? `Right now it's ${formatLocalTime(now)} where you are. ${bots.length} bots are on shift.` : `${bots.length} bots are on shift right now.`}
            </p>
            <LiveTicker />
          </motion.div>
        </div>
      </div>

      {/* Names under the five clusters (desktop) */}
      {labels.length === 5 &&
        bots.map((a, i) => (
          <motion.div
            key={a.id}
            className="pointer-events-none absolute hidden -translate-x-1/2 text-center lg:block"
            style={{ left: labels[i].x, top: labels[i].y }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.2 + i * 0.1, duration: 0.8, ease: EASE }}
            aria-hidden
          >
            <div className="text-[13px] font-medium text-white">{a.name}</div>
            <div className="text-[11px]" style={{ color: a.accent.tint }}>
              {a.domain}
            </div>
          </motion.div>
        ))}
    </section>
  );
}
