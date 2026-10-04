"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "motion/react";

/**
 * Elements drift a few pixels toward a nearby cursor. Pointer-only:
 * touch and reduced-motion users get a static element.
 */
export function useMagnetic<T extends HTMLElement>(strength = 4, radius = 90) {
  const ref = useRef<T>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 22, mass: 0.6 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const reach = Math.max(r.width, r.height) / 2 + radius;
        const d = Math.hypot(dx, dy);
        if (d < reach) {
          const f = 1 - d / reach;
          x.set((dx / reach) * strength * 2 * f);
          y.set((dy / reach) * strength * 2 * f);
        } else {
          x.set(0);
          y.set(0);
        }
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [reduce, strength, radius, x, y]);

  return { ref, style: { x: sx, y: sy } };
}
