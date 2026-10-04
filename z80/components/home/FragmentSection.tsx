"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { availableAgents } from "@/data/agents";
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
    <section ref={ref} id="fragment" aria-label="One request, an entire team" className="relative z-10 h-[280vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="mx-auto flex h-full max-w-[1440px] flex-col px-5 pt-24 md:justify-center md:px-10 md:pt-0">
          <div className="max-w-[560px]">
            <p className="label flex items-center gap-3">
              <span className="text-fg-2">02</span>
              <span className="h-px w-8 bg-white/15" />
              Orchestration
            </p>
            <h2 className="display mt-5 text-[clamp(42px,6.2vw,96px)]">
              One request.
              <br />
              <span className="text-fg-2">An entire team.</span>
            </h2>
          </div>
          <motion.div style={{ opacity: body }} className="mt-6 hidden max-w-[440px] space-y-4 text-[17px] leading-relaxed text-fg-2 md:block">
            <p className="text-fg-1">Stop managing ten separate AI tools.</p>
            <p>
              Tell Z80 the outcome. Z80 decides which intelligences should work, assigns the mission, and coordinates the operation — start to finish.
            </p>
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
              <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-white">{a.name}</div>
              <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: a.accent.tint }}>
                {a.domain}
              </div>
            </motion.div>
          ))}

        <motion.p style={{ opacity: body }} className="absolute inset-x-5 bottom-10 text-[15px] leading-relaxed text-fg-2 md:hidden">
          Tell Z80 the outcome. It decides which intelligences should work and coordinates the operation.
        </motion.p>
      </div>
    </section>
  );
}
