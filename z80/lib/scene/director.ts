/**
 * Scene director — the bridge between DOM state (scroll, hero flow, hover)
 * and the particle engine. Contains no Three.js so it can be imported
 * anywhere without pulling the 3D bundle.
 *
 * The engine eases its current state toward `target` every frame, so the
 * DOM can set targets abruptly and the visuals still move smoothly.
 */

/** Weights for the six particle formations. Should sum to ~1. */
export type FormWeights = [sphere: number, cluster: number, lattice: number, scanner: number, fluid: number, field: number];

export type Vec2 = [number, number];

export interface SceneTarget {
  weights: FormWeights;
  /** Formation center in NDC (-1..1). */
  offset: Vec2;
  /** Formation radius as a fraction of the viewport's smaller half-extent. */
  scale: number;
  opacity: number;
  /** 0 idle → 1 intense analysis. */
  activity: number;
  /** Cluster centers in NDC, one per bot (5); null = default layout around `offset`. */
  clusters: Vec2[] | null;
  /** Per-cluster alpha, one per bot (5). */
  groupAlpha: number[];
  /** Attraction point in NDC + strength 0..1 (DEPLOY hover). */
  attract: [number, number, number];
  /** Network line visibility multiplier. */
  lines: number;
}

export const FORMS: Record<"sphere" | "cluster" | "lattice" | "scanner" | "fluid" | "field", FormWeights> = {
  sphere: [1, 0, 0, 0, 0, 0],
  cluster: [0, 1, 0, 0, 0, 0],
  lattice: [0, 0, 1, 0, 0, 0],
  scanner: [0, 0, 0, 1, 0, 0],
  fluid: [0, 0, 0, 0, 1, 0],
  field: [0, 0, 0, 0, 0, 1],
};

export function blend(a: FormWeights, b: FormWeights, t: number): FormWeights {
  return a.map((v, i) => v + (b[i] - v) * t) as FormWeights;
}

export const DEFAULT_TARGET: SceneTarget = {
  weights: FORMS.sphere,
  offset: [0.42, 0],
  scale: 0.78,
  opacity: 1,
  activity: 0,
  clusters: null,
  groupAlpha: [1, 1, 1, 1, 1],
  attract: [0, 0, 0],
  lines: 1,
};

export interface SceneDirector {
  get(): SceneTarget;
  set(patch: Partial<SceneTarget>): void;
  subscribe(fn: () => void): () => void;
}

export function createDirector(initial: Partial<SceneTarget> = {}): SceneDirector {
  let target: SceneTarget = { ...DEFAULT_TARGET, ...initial };
  const subs = new Set<() => void>();
  return {
    get: () => target,
    set(patch) {
      target = { ...target, ...patch };
      subs.forEach((f) => f());
    },
    subscribe(fn) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
  };
}

/** The homepage's shared director (hero, scroll story, final CTA). */
export const homeDirector = createDirector();

/** Convert a DOM point (client px) to NDC. */
export function toNdc(x: number, y: number): Vec2 {
  if (typeof window === "undefined") return [0, 0];
  return [(x / window.innerWidth) * 2 - 1, -((y / window.innerHeight) * 2 - 1)];
}

/** Cluster size relative to the formation (matches the engine shader). */
export const CLUSTER_SCALE = 0.72;

/**
 * Default positions (NDC) for the five bot clusters around a formation
 * offset: a pentagon with Manager on top. Shared by the engine and DOM
 * labels so they line up.
 */
export function clusterLayout(offset: Vec2, aspect: number): Vec2[] {
  const bx = Math.min(1 / aspect, 1.15); // base / halfW
  const by = Math.min(1, 1.15 * aspect); // base / halfH
  const R = 0.66;
  return [0, 1, 2, 3, 4].map((i) => {
    // Order: Manager top, Lead Hunter upper left, Content Creator upper right, Researcher lower left, Reporter lower right.
    const angle = [90, 162, 18, 234, 306][i] * (Math.PI / 180);
    return [offset[0] + Math.cos(angle) * R * bx, offset[1] + Math.sin(angle) * R * by] as Vec2;
  });
}

/** Cluster radius in px for a formation scale (matches engine shader). */
export function clusterRadiusPx(scale: number, aspect: number, viewportH: number): number {
  const by = Math.min(1, 1.15 * aspect);
  return scale * by * CLUSTER_SCALE * 0.34 * (viewportH / 2);
}
