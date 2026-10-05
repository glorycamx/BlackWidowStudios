"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { availableAgents } from "@/data/bots";
import { clusterRadiusPx, clusterTriangle, type Vec2 } from "@/lib/scene/director";

/** Formation placement while the sphere splits (mirrors HomeScene). */
export function fragmentOffset(desktop: boolean): Vec2 {
  return desktop ? [0.32, -0.04] : [0, -0.3];
}
export const FRAGMENT_SCALE = { desktop: 0.6, mobile: 0.5 };

/**
 * STATE 02 — the sphere fragments into three intelligences while the
 * headline lands. Sticky; the particle scene does the heavy lifting.
 */
export function FragmentSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const body = useTransform(scrollYProgress, [0.22, 0.38], [0, 1]);
  const [pos, setPos] = useState<{ x: number; y: number; r: number }[]>([]);
  const [labelsOn, setLabelsOn] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (v) => setLabelsOn(v > 0.5 && v < 0.97));

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const desktop = w >= 900;
      const tri = clusterTriangle(fragmentOffset(desktop), w / h);
      const r = clusterRadiusPx(desktop ? FRAGMENT_SCALE.desktop : FRAGMENT_SCALE.mobile, w / h, h);
      setPos(tri.map(([x, y]) => ({ x: ((x + 1) / 2) * w, y: ((1 - y) / 2) * h, r })));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const showcase = availableAgents.filter((a) => a.sceneGroup !== undefined).sort((a, b) => (a.sceneGroup ?? 0) - (b.sceneGroup ?? 0));

  return (
    <section ref={ref} id="fragment" aria-label="Not a chatbot. A workforce." className="relative z-10 h-[280vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="mx-auto flex h-full max-w-[1440px] flex-col px-5 pt-24 md:justify-center md:px-10 md:pt-0">
          <div className="max-w-[560px]">
            <h2 className="display text-[clamp(42px,6.2vw,96px)]">
              Not a chatbot.
              <br />
              <span className="text-fg-2">A workforce.</span>
            </h2>
          </div>
          <motion.div style={{ opacity: body }} className="mt-6 hidden max-w-[420px] text-[clamp(18px,1.6vw,22px)] leading-[1.4] text-fg-2 md:block">
            <p>Three agents that think, act and work together. Day and night.</p>
          </motion.div>
        </div>

        {/* Labels pinned to the particle clusters */}
        {pos.length === 3 &&
          showcase.map((a, i) => (
            <motion.div
              key={a.id}
              className="pointer-events-none absolute -translate-x-1/2 text-center"
              style={{ left: pos[i].x, top: pos[i].y + pos[i].r + 14 }}
              initial={false}
              animate={{ opacity: labelsOn ? 1 : 0, y: labelsOn ? 0 : 8 }}
              transition={{ duration: 0.6, delay: labelsOn ? i * 0.08 : 0 }}
            >
              <div className="text-[17px] font-semibold tracking-[-0.02em] text-white">{a.name}</div>
              <div className="mt-1.5 text-[12px]" style={{ color: a.accent.tint }}>
                {a.role.replace(" Intelligence", "")}
              </div>
            </motion.div>
          ))}

        <motion.p style={{ opacity: body }} className="absolute inset-x-5 bottom-10 text-[15px] leading-relaxed text-fg-2 md:hidden">
          Three agents that think, act and work together. Day and night.
        </motion.p>
      </div>
    </section>
  );
}
