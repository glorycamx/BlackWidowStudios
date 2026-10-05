"use client";

import { useEffect } from "react";
import { IntelligenceCanvas } from "@/components/three/IntelligenceCanvas";
import { heroStage } from "@/components/home/Hero";
import { blend, FORMS, homeDirector, type FormWeights, type Vec2 } from "@/lib/scene/director";
import { clamp } from "@/lib/utils";

const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function rect(id: string) {
  const el = document.getElementById(id);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top + window.scrollY, height: r.height };
}

const ALL_ON = [1, 1, 1, 1, 1];

/**
 * The homepage's one particle scene, driven by scroll. The orb sits
 * behind the hero, fade to an ambient field while you read, become
 * Manager, Lead Hunter and Content Creator in the showcase, and gather back
 * into five clusters for the final call to action.
 */
export function HomeScene() {
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const desktop = window.innerWidth >= 900;
      const hero = heroStage(desktop);
      const stageOffset: Vec2 = desktop ? [0.4, 0] : [0, 0.3];
      const stageScale = desktop ? 0.66 : 0.52;
      const finalOffset: Vec2 = desktop ? [0, 0.04] : [0, 0.3];
      const finalScale = desktop ? 0.5 : 0.42;

      const heroEl = rect("hero");
      const intel = rect("intelligences");
      const final = rect("final");
      const heroEnd = heroEl ? heroEl.top + heroEl.height : vh;

      let weights: FormWeights = FORMS.sphere;
      let offset: Vec2 = hero.offset;
      let scale = hero.scale;
      let opacity = 1;
      let lines = 0.7;
      let activity = 0.25;
      const AMBIENT = 0.35;

      if (y < heroEnd) {
        // Hero: the orb, dissolving into the field as you scroll.
        const h = smooth(heroEnd * 0.25, heroEnd, y);
        weights = blend(FORMS.sphere, FORMS.field, h);
        opacity = 1 - h * (1 - AMBIENT);
        activity = 0;
        lines = 1;
      } else if (intel && y < intel.top) {
        // Reading: quiet ambient field, gathering into the first bot just before the showcase.
        const k = smooth(intel.top - vh * 0.9, intel.top, y);
        weights = blend(FORMS.field, FORMS.lattice, k);
        offset = [hero.offset[0] + (stageOffset[0] - hero.offset[0]) * k, hero.offset[1] + (stageOffset[1] - hero.offset[1]) * k];
        scale = stageScale;
        opacity = AMBIENT + k * ((desktop ? 1 : 0.6) - AMBIENT);
        activity = 0;
        lines = 0.6;
      } else if (intel && y < intel.top + intel.height - vh) {
        // Showcase: Manager (lattice), Lead Hunter (scanner), Content Creator (fluid).
        const p = clamp((y - intel.top) / Math.max(1, intel.height - vh));
        const seg = p * 3;
        const x = 0.14;
        weights = seg < 1.5 ? blend(FORMS.lattice, FORMS.scanner, smooth(1 - x, 1 + x, seg)) : blend(FORMS.scanner, FORMS.fluid, smooth(2 - x, 2 + x, seg));
        offset = stageOffset;
        scale = stageScale;
        opacity = desktop ? 1 : 0.6;
        activity = 0;
        lines = 1;
      } else {
        // The rest: ambient field, then five clusters again at the end.
        const end = intel ? intel.top + intel.height - vh : 0;
        const q = clamp((y - end) / vh);
        weights = blend(FORMS.fluid, FORMS.field, smooth(0, 0.6, q));
        offset = stageOffset;
        scale = stageScale;
        opacity = AMBIENT;
        activity = 0;
        if (final) {
          const f = smooth(final.top - vh, final.top - vh * 0.15, y);
          weights = blend(weights, FORMS.cluster, f);
          offset = [stageOffset[0] + (finalOffset[0] - stageOffset[0]) * f, stageOffset[1] + (finalOffset[1] - stageOffset[1]) * f];
          scale = stageScale + (finalScale - stageScale) * f;
          opacity = AMBIENT + f * 0.12;
          activity = f * 0.2;
        }
      }

      homeDirector.set({ weights, offset, scale, opacity, lines, groupAlpha: ALL_ON, activity, clusters: null });
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
