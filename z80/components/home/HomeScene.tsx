"use client";

import { useEffect } from "react";
import { IntelligenceCanvas } from "@/components/three/IntelligenceCanvas";
import { blend, FORMS, homeDirector, toNdc, type FormWeights, type SceneTarget, type Vec2 } from "@/lib/scene/director";
import { homeFlow } from "@/lib/scene/homeFlow";
import { getAgent } from "@/data/agents";
import { clamp } from "@/lib/utils";
import { FRAGMENT_SCALE, fragmentOffset } from "@/components/home/FragmentSection";

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

/**
 * The homepage's single persistent intelligence. One sphere at the top that
 * fragments into the team, becomes each intelligence in turn, then settles
 * into an ambient field — driven entirely by scroll position and hero state.
 */
export function HomeScene() {
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const desktop = window.innerWidth >= 900;
      const flow = homeFlow.get();

      const heroOffset: Vec2 = desktop ? [0.47, 0.0] : [0, 0.44];
      const heroScale = desktop ? 0.68 : 0.62;
      const stageOffset: Vec2 = desktop ? [0.4, 0] : [0, 0.3];
      const stageScale = desktop ? 0.66 : 0.52;
      const fragOffset = fragmentOffset(desktop);
      const fragScale = desktop ? FRAGMENT_SCALE.desktop : FRAGMENT_SCALE.mobile;

      const fragment = rect("fragment");
      const how = rect("how");
      const intel = rect("intelligences");
      const final = rect("final");

      let t: Partial<SceneTarget> = {};

      // Hero phases override the scroll story while the hero is in view.
      if (flow.phase !== "idle" && y < vh * 0.6) {
        if (flow.phase === "analyzing") {
          t = { weights: FORMS.sphere, offset: desktop ? [0.47, 0] : [0, 0.47], scale: desktop ? 0.7 : 0.56, activity: 1, opacity: 1, lines: 1.2, clusters: null };
        } else if (flow.layout && desktop) {
          const nodes: Vec2[] = [];
          const g: [number, number, number] = [0, 0, 0];
          Object.entries(flow.layout.nodes).forEach(([id, p]) => {
            const sg = getAgent(id)?.sceneGroup;
            if (sg === undefined) return;
            nodes[sg] = toNdc(p.x, p.y);
            g[sg] = 1;
          });
          const m = toNdc(flow.layout.mission.x, flow.layout.mission.y);
          const clusters = [0, 1, 2].map((i) => nodes[i] ?? m) as [Vec2, Vec2, Vec2];
          t = {
            weights: FORMS.cluster,
            clusters,
            groupAlpha: g,
            offset: m,
            scale: 0.38,
            activity: flow.phase === "deploying" ? 1 : 0.15,
            opacity: 0.85,
            lines: 0.6,
          };
        } else if (desktop) {
          t = { weights: FORMS.cluster, offset: [0, -0.05], scale: 0.42, opacity: 0.8, activity: 0.2, clusters: null, groupAlpha: flow.activeGroups, lines: 0.6 };
        } else {
          t = { weights: FORMS.field, opacity: 0.45, activity: 0, clusters: null };
        }
        homeDirector.set({ attract: homeDirector.get().attract, ...t });
        return;
      }

      let weights: FormWeights = FORMS.sphere;
      let offset: Vec2 = heroOffset;
      let scale = heroScale;
      let opacity = 1;
      let lines = 1;
      const groupAlpha: [number, number, number] = [1, 1, 1];

      if (fragment && y < fragment.top) {
        // Hero scrolling away: sphere drifts to center.
        const h = smooth(0, fragment.top, y);
        offset = [heroOffset[0] + (fragOffset[0] - heroOffset[0]) * h, heroOffset[1] + (fragOffset[1] - heroOffset[1]) * h];
        scale = heroScale + (fragScale - heroScale) * h;
      } else if (fragment && how && y < fragment.top + fragment.height - vh) {
        // Sphere fragments into three intelligences.
        const p = clamp((y - fragment.top) / Math.max(1, fragment.height - vh));
        const s = smooth(0.08, 0.5, p);
        weights = blend(FORMS.sphere, FORMS.cluster, s);
        offset = fragOffset;
        scale = fragScale;
        lines = 1 - s * 0.4;
      } else if (fragment && intel && y < intel.top) {
        // Collaboration diagram: clusters dissolve into the ambient field, then gather into Dots.
        const start = fragment.top + fragment.height - vh;
        const q = clamp((y - start) / Math.max(1, intel.top - start));
        weights = q < 0.5 ? blend(FORMS.cluster, FORMS.field, smooth(0, 0.3, q)) : blend(FORMS.field, FORMS.dots, smooth(0.72, 1, q));
        offset = q < 0.5 ? fragOffset : stageOffset;
        scale = q < 0.5 ? fragScale : stageScale;
        opacity = q < 0.5 ? 1 - smooth(0, 0.3, q) * 0.55 : 0.45 + smooth(0.72, 1, q) * 0.55;
        lines = 0.6;
      } else if (intel && y < intel.top + intel.height - vh) {
        // Meet the intelligences: Dots → Grok Bot → Muse.
        const p = clamp((y - intel.top) / Math.max(1, intel.height - vh));
        const seg = p * 3;
        const x = 0.14;
        weights = seg < 1.5 ? blend(FORMS.dots, FORMS.grok, smooth(1 - x, 1 + x, seg)) : blend(FORMS.grok, FORMS.muse, smooth(2 - x, 2 + x, seg));
        offset = stageOffset;
        scale = stageScale;
        opacity = desktop ? 1 : 0.6;
      } else {
        // The rest of the story: ambient field; brighter at the final CTA.
        const end = intel ? intel.top + intel.height - vh : 0;
        const q = clamp((y - end) / vh);
        weights = blend(FORMS.muse, FORMS.field, smooth(0, 0.6, q));
        offset = stageOffset;
        scale = stageScale;
        opacity = 0.42;
        if (final) {
          const f = smooth(final.top - vh, final.top - vh * 0.2, y);
          opacity = 0.42 + f * 0.48;
        }
      }

      homeDirector.set({ weights, offset, scale, opacity, lines, groupAlpha, activity: 0, clusters: null });
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const unsub = homeFlow.subscribe(schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      unsub();
    };
  }, []);

  return <IntelligenceCanvas director={homeDirector} fixed intro />;
}
