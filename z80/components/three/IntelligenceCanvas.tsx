"use client";

import { useEffect, useRef, useState } from "react";
import type { SceneDirector } from "@/lib/scene/director";
import { cn } from "@/lib/utils";

interface Props {
  director: SceneDirector;
  /** Full-viewport fixed background (homepage) vs fills its parent. */
  fixed?: boolean;
  interactive?: boolean;
  /** Awakening: particles converge from the ambient field on load. */
  intro?: boolean;
  className?: string;
}

function detectQuality(): "high" | "low" {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 768;
  if ((coarse && small) || (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4) return "low";
  return "high";
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Mounts the particle engine. Three.js is loaded with a dynamic import so it
 * never ships in the initial bundle, and never on pages that don't use it.
 */
export function IntelligenceCanvas({ director, fixed = false, interactive = true, intro = false, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !webglAvailable()) return;
    let disposed = false;
    let engine: { start(): void; dispose(): void } | null = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    import("./engine").then(({ IntelligenceEngine }) => {
      if (disposed) return;
      try {
        engine = new IntelligenceEngine(canvas, director, { quality: detectQuality(), reducedMotion, interactive, intro });
        engine.start();
        requestAnimationFrame(() => setReady(true));
      } catch {
        /* WebGL failed — the CSS fallback stays visible */
      }
    });
    return () => {
      disposed = true;
      engine?.dispose();
    };
  }, [director, interactive, intro]);

  return (
    <div aria-hidden className={cn(fixed ? "pointer-events-none fixed inset-0 z-0" : "pointer-events-none absolute inset-0", className)}>
      <div
        className={cn("absolute inset-0 transition-opacity duration-[1600ms]", ready ? "opacity-0" : "opacity-100")}
        style={{
          background:
            "radial-gradient(circle at var(--orb-x, 71%) var(--orb-y, 50%), rgba(69,108,255,0.16), rgba(100,91,255,0.05) 18%, transparent 34%)",
        }}
      />
      <canvas ref={ref} className={cn("absolute inset-0 h-full w-full transition-opacity duration-[1400ms]", ready ? "opacity-100" : "opacity-0")} />
    </div>
  );
}
