"use client";

import { useEffect } from "react";
import { IntelligenceCanvas } from "@/components/three/IntelligenceCanvas";
import { heroStage } from "@/components/home/Hero";
import { blend, FORMS, homeDirector } from "@/lib/scene/director";
import { clamp } from "@/lib/utils";

const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * The homepage's particle orb. It sits beside the hero, then softens into a
 * quiet star field behind the rest of the page so the text stays easy to read.
 */
export function HomeScene() {
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const desktop = window.innerWidth >= 900;
      const hero = heroStage(desktop);
      const heroEl = document.getElementById("hero");
      const end = heroEl ? heroEl.offsetTop + heroEl.offsetHeight : window.innerHeight;
      const h = smooth(end * 0.2, end * 0.95, window.scrollY);
      homeDirector.set({
        weights: blend(FORMS.sphere, FORMS.field, h),
        offset: hero.offset,
        scale: hero.scale,
        opacity: 1 - h * 0.72,
        lines: 1 - h * 0.5,
        activity: 0,
        clusters: null,
        groupAlpha: [1, 1, 1, 1, 1],
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return <IntelligenceCanvas director={homeDirector} fixed intro />;
}
