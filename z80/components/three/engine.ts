/**
 * IntelligenceEngine — the Z80 particle system.
 *
 * One Points draw call + one LineSegments draw call. Every particle carries
 * six precomputed formations (sphere, team clusters, lattice, scanner,
 * fluid ribbons, ambient field); the vertex shader blends them by
 * weights the SceneDirector sets, so morphs are free on the CPU.
 *
 * Deterministic (seeded) geometry, no React in the hot path, pauses when the
 * tab is hidden or the canvas is offscreen, and degrades on weak devices.
 */
import * as THREE from "three";
import { clusterTriangle, type SceneDirector, type SceneTarget } from "@/lib/scene/director";

export type Quality = "high" | "low";

export interface EngineOptions {
  quality: Quality;
  reducedMotion: boolean;
  /** Fixed full-viewport canvas (homepage) vs contained canvas. */
  interactive?: boolean;
  /** Start from the ambient field and converge (homepage awakening). */
  intro?: boolean;
}

/* ------------------------------------------------------------------ */
/* Seeded geometry                                                     */
/* ------------------------------------------------------------------ */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
}

function unitDir(r: () => number): [number, number, number] {
  const u = r() * 2 - 1;
  const th = r() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return [s * Math.cos(th), u, s * Math.sin(th)];
}

interface Built {
  points: THREE.BufferGeometry;
  lines: THREE.BufferGeometry;
}

function build(count: number, arcCount: number, linkCount: number): Built {
  const r = rng(80);
  const sphere = new Float32Array(count * 3);
  const lattice = new Float32Array(count * 3);
  const scanner = new Float32Array(count * 3);
  const fluid = new Float32Array(count * 3);
  const field = new Float32Array(count * 3);
  const rand = new Float32Array(count * 4);
  const group = new Float32Array(count);

  // lattice sites inside the unit sphere.
  const G = 6;
  const sites: [number, number, number][] = [];
  for (let x = -G; x <= G; x++)
    for (let y = -G; y <= G; y++)
      for (let z = -G; z <= G; z++) {
        const p: [number, number, number] = [x / G, y / G, z / G];
        if (Math.hypot(...p) <= 1.0) sites.push(p);
      }

  // fluid ribbons: a few wide, flowing bands.
  const ribbons = Array.from({ length: 4 }, (_, k) => ({
    a: 1,
    b: 2,
    c: 1,
    p: (k / 4) * Math.PI * 2 + r() * 0.4,
    q: r() * Math.PI * 2,
    amp: 0.85 + k * 0.12,
    tilt: (k - 1.5) * 0.35,
  }));

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    // --- sphere: luminous shell, faint interior, scattered halo
    const kind = r();
    const [dx, dy, dz] = unitDir(r);
    let rad: number;
    if (kind < 0.78) rad = 1 - Math.abs(gauss(r)) * 0.028;
    else if (kind < 0.88) rad = Math.cbrt(r()) * 0.92;
    else rad = 1.02 + Math.pow(r(), 2.4) * 0.5;
    sphere[i3] = dx * rad;
    sphere[i3 + 1] = dy * rad;
    sphere[i3 + 2] = dz * rad;

    // --- lattice: lattice nodes + edges
    const s = sites[Math.floor(r() * sites.length)];
    if (r() < 0.62) {
      lattice[i3] = s[0] + gauss(r) * 0.006;
      lattice[i3 + 1] = s[1] + gauss(r) * 0.006;
      lattice[i3 + 2] = s[2] + gauss(r) * 0.006;
    } else {
      const axis = Math.floor(r() * 3);
      const t = r() / G;
      lattice[i3] = s[0] + (axis === 0 ? t : 0);
      lattice[i3 + 1] = s[1] + (axis === 1 ? t : 0);
      lattice[i3 + 2] = s[2] + (axis === 2 ? t : 0);
    }
    lattice[i3] *= 0.92;
    lattice[i3 + 1] *= 0.92;
    lattice[i3 + 2] *= 0.92;

    // --- scanner: data terrain of scan rows, tilted toward the viewer
    const row = Math.floor(r() * 26);
    const gz = (row / 25) * 2.2 - 1.1;
    const gx = r() * 3.6 - 1.8;
    let gy = 0.16 * Math.sin(gx * 2.1 + gz * 3.0) + 0.08 * Math.sin(gx * 5.3 - gz * 2.2);
    if (r() < 0.035) gy += r() * 0.55; // signal spikes
    const tilt = -0.95;
    scanner[i3] = gx;
    scanner[i3 + 1] = gy * Math.cos(tilt) - gz * Math.sin(tilt) - 0.05;
    scanner[i3 + 2] = gy * Math.sin(tilt) + gz * Math.cos(tilt);

    // --- fluid: flowing ribbons (band = curve + offset along a twisting normal)
    const rb = ribbons[Math.floor(r() * ribbons.length)];
    const u = r() * Math.PI * 2;
    const w = (r() - 0.5) * 0.22;
    const cx = Math.sin(u * rb.a + rb.p) * 1.2 * rb.amp;
    const cy = Math.sin(u * rb.b + rb.q) * 0.5 * rb.amp + rb.tilt * Math.cos(u);
    const cz = Math.cos(u * rb.c + rb.p) * 0.45;
    fluid[i3] = cx + gauss(r) * 0.012;
    fluid[i3 + 1] = cy + w * Math.cos(u * 2 + rb.q) + gauss(r) * 0.012;
    fluid[i3 + 2] = cz + w * Math.sin(u * 2 + rb.q);

    // --- field: ambient volume
    field[i3] = (r() * 2 - 1) * 7.5;
    field[i3 + 1] = (r() * 2 - 1) * 4.6;
    field[i3 + 2] = -8 + r() * 9.5;

    rand[i * 4] = r();
    rand[i * 4 + 1] = r();
    rand[i * 4 + 2] = r();
    rand[i * 4 + 3] = r();
    group[i] = Math.floor(r() * 3);
  }

  const points = new THREE.BufferGeometry();
  points.setAttribute("position", new THREE.BufferAttribute(sphere, 3));
  points.setAttribute("aSphere", new THREE.BufferAttribute(sphere, 3));
  points.setAttribute("aLattice", new THREE.BufferAttribute(lattice, 3));
  points.setAttribute("aScanner", new THREE.BufferAttribute(scanner, 3));
  points.setAttribute("aFluid", new THREE.BufferAttribute(fluid, 3));
  points.setAttribute("aField", new THREE.BufferAttribute(field, 3));
  points.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));
  points.setAttribute("aGroup", new THREE.BufferAttribute(group, 1));
  points.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);

  // --- network lines
  const lp: number[] = [];
  const lg: number[] = [];
  const lt: number[] = [];
  const ls: number[] = [];

  // Great-circle arcs (the long fine lines in the brand artwork).
  for (let a = 0; a < arcCount; a++) {
    const n = new THREE.Vector3(...unitDir(r));
    const u = new THREE.Vector3(...unitDir(r)).cross(n).normalize();
    const v = n.clone().cross(u).normalize();
    const start = r() * Math.PI * 2;
    const len = (0.35 + r() * 1.3) * Math.PI;
    const segs = 40;
    const g = Math.floor(r() * 3);
    const seed = r();
    const rr = 1.0 + (r() - 0.5) * 0.02;
    for (let k = 0; k < segs; k++) {
      for (const kk of [k, k + 1]) {
        const ang = start + (len * kk) / segs;
        const p = u.clone().multiplyScalar(Math.cos(ang)).add(v.clone().multiplyScalar(Math.sin(ang))).multiplyScalar(rr);
        lp.push(p.x, p.y, p.z);
        lg.push(g);
        lt.push(kk / segs);
        ls.push(seed);
      }
    }
  }

  // Short neighbor links between shell nodes of the same group.
  const shell: number[] = [];
  for (let i = 0; i < count && shell.length < linkCount; i++) {
    const x = sphere[i * 3], y = sphere[i * 3 + 1], z = sphere[i * 3 + 2];
    const d = Math.hypot(x, y, z);
    if (d > 0.95 && d < 1.01) shell.push(i);
  }
  for (const i of shell) {
    const best: { j: number; d: number }[] = [];
    for (const j of shell) {
      if (j === i || group[j] !== group[i]) continue;
      const d = Math.hypot(sphere[i * 3] - sphere[j * 3], sphere[i * 3 + 1] - sphere[j * 3 + 1], sphere[i * 3 + 2] - sphere[j * 3 + 2]);
      if (d < 0.2) {
        best.push({ j, d });
      }
    }
    best.sort((a, b) => a.d - b.d);
    const seed = r();
    for (const { j } of best.slice(0, 3)) {
      if (j < i) continue;
      lp.push(sphere[i * 3], sphere[i * 3 + 1], sphere[i * 3 + 2], sphere[j * 3], sphere[j * 3 + 1], sphere[j * 3 + 2]);
      lg.push(group[i], group[i]);
      lt.push(0, 1);
      ls.push(seed, seed);
    }
  }

  const lines = new THREE.BufferGeometry();
  const lpArr = new Float32Array(lp);
  lines.setAttribute("position", new THREE.BufferAttribute(lpArr, 3));
  lines.setAttribute("aSphere", new THREE.BufferAttribute(lpArr, 3));
  lines.setAttribute("aGroup", new THREE.BufferAttribute(new Float32Array(lg), 1));
  lines.setAttribute("aT", new THREE.BufferAttribute(new Float32Array(lt), 1));
  lines.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(ls), 1));
  lines.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);

  return { points, lines };
}

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

const COMMON = /* glsl */ `
uniform float uTime;
uniform vec3 uW0;
uniform vec3 uW1;
uniform vec3 uOffset;
uniform float uScale;
uniform float uClusterScale;
uniform mat3 uRot;
uniform mat3 uRotSoft;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uGroupAlpha;
uniform vec3 uCol0;
uniform vec3 uCol1;
uniform vec3 uCol2;
uniform float uOpacity;
uniform float uActivity;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform vec3 uAttract;
uniform float uAspect;

vec3 groupCenter(float g) { return g < 0.5 ? uC0 : (g < 1.5 ? uC1 : uC2); }
vec3 groupColor(float g) { return g < 0.5 ? uCol0 : (g < 1.5 ? uCol1 : uCol2); }
float groupAlpha(float g) { return g < 0.5 ? uGroupAlpha.x : (g < 1.5 ? uGroupAlpha.y : uGroupAlpha.z); }

vec3 rotY(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

vec3 clusterLocal(vec3 s, float g, float t) {
  vec3 c = s * 0.34;
  if (g < 0.5) {
    c = floor(c * 9.0 + 0.5) / 9.0;
    c = rotY(c, t * 0.18);
  } else if (g < 1.5) {
    c.y *= 0.36;
    c = rotY(c, t * 0.55);
  } else {
    c += 0.045 * vec3(sin(t * 1.1 + c.y * 14.0), sin(t * 0.9 + c.z * 12.0), sin(t * 1.3 + c.x * 13.0));
    c = rotY(c, t * 0.22);
  }
  return c;
}

vec4 distort(vec4 clip) {
  vec2 ndc = clip.xy / clip.w;
  vec2 d = ndc - uMouse;
  d.x *= uAspect;
  float dist = length(d);
  vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0);
  ndc += dir * uMouseStrength * 0.045 * exp(-dist * dist * 14.0);
  vec2 a = uAttract.xy - ndc;
  a.x *= uAspect;
  float ad = length(a);
  vec2 adir = ad > 0.0001 ? a / ad : vec2(0.0);
  vec2 pull = adir * uAttract.z * 0.09 * exp(-ad * ad * 5.0);
  pull.x /= uAspect;
  ndc += pull;
  clip.xy = ndc * clip.w;
  return clip;
}
`;

const POINTS_VERT = /* glsl */ `
${COMMON}
uniform float uPixelRatio;
uniform float uSize;
attribute vec3 aSphere;
attribute vec3 aLattice;
attribute vec3 aScanner;
attribute vec3 aFluid;
attribute vec3 aField;
attribute vec4 aRand;
attribute float aGroup;
varying vec3 vColor;
varying float vAlpha;

void main() {
  float t = uTime;
  float g = aGroup;

  // Sphere
  float breathe = 1.0 + 0.012 * sin(t * 0.9 + aRand.x * 6.2831);
  vec3 sL = uRot * (aSphere * breathe);
  vec3 pS = uOffset + uScale * sL;
  float len = length(aSphere);
  vec3 n = normalize(sL);
  float rim = pow(1.0 - abs(n.z), 1.6);
  float shell = step(0.94, len) * step(len, 1.02);
  float halo = step(1.02, len);

  // Clusters
  vec3 pC = groupCenter(g) + uScale * uClusterScale * (uRotSoft * clusterLocal(aSphere, g, t));

  // lattice
  vec3 dL = aLattice * (1.0 + 0.018 * sin(t * 1.4 + aLattice.y * 6.0));
  vec3 pD = uOffset + uScale * (uRot * dL);

  // scanner
  vec3 gL = aScanner;
  float gx = mod(gL.x + t * 0.11 + 1.8, 3.6) - 1.8;
  gL.x = gx;
  vec3 pG = uOffset + uScale * (uRotSoft * gL);
  float bx = sin(t * 0.55) * 1.6;
  float beam = exp(-pow((gx - bx) * 3.0, 2.0));

  // fluid ribbons
  vec3 mL = aFluid + vec3(
    0.06 * sin(t * 0.5 + aFluid.y * 2.4),
    0.12 * sin(t * 0.7 + aFluid.x * 2.2),
    0.08 * sin(t * 0.6 + aFluid.x * 1.7 + aFluid.y));
  vec3 pM = uOffset + uScale * (uRotSoft * mL);

  // Field
  vec3 pF = aField + 0.28 * vec3(sin(t * 0.05 + aRand.x * 6.2831), cos(t * 0.04 + aRand.y * 6.2831), 0.0);

  vec3 pos = pS * uW0.x + pC * uW0.y + pD * uW0.z + pG * uW1.x + pM * uW1.y + pF * uW1.z;

  // Node pulses — faster during analysis.
  float rate = 0.35 + aRand.x * 0.7;
  float spike = pow(max(0.0, sin(t * rate * (1.0 + uActivity * 4.0) + aRand.z * 60.0)), 48.0) * step(0.62, aRand.w);
  // Analysis sweep through the sphere.
  float sweep = exp(-pow((n.y - sin(t * 1.7)) * 5.0, 2.0)) * uActivity;

  vec3 cS = mix(vec3(0.38, 0.47, 1.0), vec3(0.88, 0.91, 1.0), clamp(aRand.y * 0.65 + rim * 0.45, 0.0, 1.0));
  float aS = (0.34 + 0.66 * rim) * (0.4 + 0.6 * shell) * (1.0 - 0.4 * halo) + sweep * 0.8;
  cS += sweep * vec3(0.4, 0.3, 0.6);

  vec3 cC = mix(groupColor(g), vec3(1.0), aRand.y * 0.35);
  float aC = 0.8;

  vec3 cD = mix(vec3(0.43, 0.6, 1.0), vec3(0.92, 0.95, 1.0), aRand.y * 0.7);
  float aD = 0.78;

  float hot = step(0.965, aRand.w) * beam * 2.5;
  vec3 cG = mix(vec3(0.34, 0.29, 1.0), vec3(0.74, 0.69, 1.0), aRand.y) + beam * vec3(0.35, 0.35, 0.5);
  float aG = (0.42 + 0.75 * beam + hot) * smoothstep(1.8, 1.2, abs(gx));

  vec3 cM = mix(vec3(0.52, 0.3, 1.0), vec3(0.93, 0.38, 0.9), smoothstep(-1.2, 1.2, aFluid.x + sin(t * 0.3 + aFluid.y)));
  float aM = 0.85;

  vec3 cF = vec3(0.62, 0.66, 0.86);
  float aF = 0.18 + 0.4 * aRand.z;

  vColor = cS * uW0.x + cC * uW0.y + cD * uW0.z + cG * uW1.x + cM * uW1.y + cF * uW1.z;
  vColor += spike * 0.7;
  float alpha = aS * uW0.x + aC * uW0.y + aD * uW0.z + aG * uW1.x + aM * uW1.y + aF * uW1.z;
  alpha *= mix(1.0, groupAlpha(g), uW0.y);
  vAlpha = clamp(alpha * uOpacity * (1.0 + spike), 0.0, 1.6);

  vec4 mv = viewMatrix * vec4(pos, 1.0);
  float size = (0.8 + aRand.w * aRand.w * aRand.w * 2.6) * (1.0 + spike * 1.6 + hot * 0.6);
  gl_PointSize = size * uSize * uPixelRatio * (6.0 / -mv.z);
  gl_Position = distort(projectionMatrix * mv);
}
`;

const POINTS_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  float o = a * vAlpha;
  gl_FragColor = vec4(vColor * o, o);
}
`;

const LINES_VERT = /* glsl */ `
${COMMON}
uniform float uLineAlpha;
attribute vec3 aSphere;
attribute float aGroup;
attribute float aT;
attribute float aSeed;
varying float vAlpha;
varying float vT;
varying float vSeed;

void main() {
  float t = uTime;
  vec3 pS = uOffset + uScale * (uRot * aSphere);
  vec3 pC = groupCenter(aGroup) + uScale * uClusterScale * (uRotSoft * clusterLocal(aSphere, aGroup, t));
  float wsum = uW0.x + uW0.y + 0.0001;
  vec3 pos = (pS * uW0.x + pC * uW0.y) / wsum;
  float vis = uW0.x + 0.5 * uW0.y;
  float flick = smoothstep(-0.25, 0.9, sin(t * 0.22 + aSeed * 31.0));
  vAlpha = uLineAlpha * vis * (0.3 + 0.7 * flick) * uOpacity * mix(1.0, groupAlpha(aGroup), uW0.y);
  vT = aT;
  vSeed = aSeed;
  gl_Position = distort(projectionMatrix * viewMatrix * vec4(pos, 1.0));
}
`;

const LINES_FRAG = /* glsl */ `
uniform float uTime;
uniform float uActivity;
varying float vAlpha;
varying float vT;
varying float vSeed;
void main() {
  float speed = (0.08 + uActivity * 0.45) * (0.6 + vSeed);
  float p = fract(uTime * speed + vSeed * 7.0);
  float d = abs(vT - p);
  float on = step(vSeed, 0.3 + uActivity * 0.65);
  float glow = smoothstep(0.07, 0.0, d) * on;
  vec3 col = vec3(0.5, 0.58, 1.0) * 0.8 + vec3(0.85, 0.88, 1.0) * glow * 1.4;
  float a = vAlpha * (0.6 + glow * 2.0);
  gl_FragColor = vec4(col * a, a);
}
`;

/* ------------------------------------------------------------------ */
/* Engine                                                              */
/* ------------------------------------------------------------------ */

function glowTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,0.45)");
  grd.addColorStop(0.6, "rgba(255,255,255,0.08)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const GROUP_COLORS = [new THREE.Color("#6E9BFF"), new THREE.Color("#7A6BFF"), new THREE.Color("#C252F2")];

interface Live {
  w: number[];
  offset: [number, number];
  scale: number;
  opacity: number;
  activity: number;
  clusters: [number, number][];
  groupAlpha: number[];
  attract: [number, number, number];
  lines: number;
}

export class IntelligenceEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private uniforms: Record<string, THREE.IUniform>;
  private lineUniforms: Record<string, THREE.IUniform>;
  private glow: THREE.Sprite;
  private clusterGlows: THREE.Sprite[] = [];
  private geo: Built;
  private raf = 0;
  private running = false;
  private visible = true;
  private onscreen = true;
  private last = 0;
  private time = 8;
  private spin = 0;
  private mouse = { x: 0, y: 0, tx: 0, ty: 0, strength: 0, ts: 0 };
  private live: Live;
  private halfW = 1;
  private halfH = 1;
  private frameSamples: number[] = [];
  private dprCap: number;
  private disposers: (() => void)[] = [];
  private unsub: () => void;
  private dirty = true;
  private age = 0;
  private m4a = new THREE.Matrix4();
  private m4b = new THREE.Matrix4();

  constructor(
    private canvas: HTMLCanvasElement,
    private director: SceneDirector,
    private opts: EngineOptions,
  ) {
    const low = opts.quality === "low";
    this.dprCap = low ? 1.25 : 1.75;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
    this.camera.position.set(0, 0, 6);

    this.geo = build(low ? 7000 : 15000, low ? 22 : 38, low ? 1100 : 2200);

    const t = director.get();
    this.live = {
      w: opts.intro && !opts.reducedMotion ? [0, 0, 0, 0, 0, 1] : [...t.weights],
      offset: [...t.offset] as [number, number],
      scale: t.scale,
      opacity: 0,
      activity: t.activity,
      clusters: [[-0.5, 0], [0, 0], [0.5, 0]],
      groupAlpha: [...t.groupAlpha],
      attract: [...t.attract] as [number, number, number],
      lines: t.lines,
    };

    const shared = {
      uTime: { value: this.time },
      uW0: { value: new THREE.Vector3(1, 0, 0) },
      uW1: { value: new THREE.Vector3(0, 0, 0) },
      uOffset: { value: new THREE.Vector3() },
      uScale: { value: 1 },
      uClusterScale: { value: 1 },
      uRot: { value: new THREE.Matrix3() },
      uRotSoft: { value: new THREE.Matrix3() },
      uC0: { value: new THREE.Vector3() },
      uC1: { value: new THREE.Vector3() },
      uC2: { value: new THREE.Vector3() },
      uGroupAlpha: { value: new THREE.Vector3(1, 1, 1) },
      uCol0: { value: GROUP_COLORS[0] },
      uCol1: { value: GROUP_COLORS[1] },
      uCol2: { value: GROUP_COLORS[2] },
      uOpacity: { value: 0 },
      uActivity: { value: 0 },
      uMouse: { value: new THREE.Vector2(9, 9) },
      uMouseStrength: { value: 0 },
      uAttract: { value: new THREE.Vector3() },
      uAspect: { value: 1 },
    };
    this.uniforms = { ...shared, uPixelRatio: { value: 1 }, uSize: { value: low ? 2.6 : 2.2 } };
    this.lineUniforms = { ...shared, uLineAlpha: { value: low ? 0.55 : 0.6 } };

    const pointsMat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: POINTS_VERT,
      fragmentShader: POINTS_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const linesMat = new THREE.ShaderMaterial({
      uniforms: this.lineUniforms,
      vertexShader: LINES_VERT,
      fragmentShader: LINES_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    const tex = glowTexture();
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: new THREE.Color("#3a4dff"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    this.glow.renderOrder = -1;
    this.scene.add(this.glow);
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: GROUP_COLORS[i], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
      s.renderOrder = -1;
      this.clusterGlows.push(s);
      this.scene.add(s);
    }

    const lines = new THREE.LineSegments(this.geo.lines, linesMat);
    lines.frustumCulled = false;
    const points = new THREE.Points(this.geo.points, pointsMat);
    points.frustumCulled = false;
    this.scene.add(lines, points);

    this.disposers.push(() => {
      pointsMat.dispose();
      linesMat.dispose();
      tex.dispose();
      this.geo.points.dispose();
      this.geo.lines.dispose();
      (this.glow.material as THREE.Material).dispose();
      this.clusterGlows.forEach((g) => (g.material as THREE.Material).dispose());
    });

    this.unsub = director.subscribe(() => {
      this.dirty = true;
      if (this.opts.reducedMotion) this.requestFrame();
    });
    this.bindEvents();
    this.resize();
  }

  private bindEvents() {
    const onResize = () => this.resize();
    window.addEventListener("resize", onResize);
    this.disposers.push(() => window.removeEventListener("resize", onResize));

    const onVis = () => {
      this.visible = document.visibilityState === "visible";
      this.updateRunning();
    };
    document.addEventListener("visibilitychange", onVis);
    this.disposers.push(() => document.removeEventListener("visibilitychange", onVis));

    const io = new IntersectionObserver((entries) => {
      this.onscreen = entries.some((e) => e.isIntersecting);
      this.updateRunning();
    });
    io.observe(this.canvas);
    this.disposers.push(() => io.disconnect());

    if (this.opts.interactive !== false && !this.opts.reducedMotion) {
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.ty = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        this.mouse.ts = 1;
      };
      const onLeave = () => (this.mouse.ts = 0);
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      this.disposers.push(() => {
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerleave", onLeave);
      });
    }

    const onLost = (e: Event) => {
      e.preventDefault();
      this.stop();
    };
    this.canvas.addEventListener("webglcontextlost", onLost);
    this.disposers.push(() => this.canvas.removeEventListener("webglcontextlost", onLost));
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.halfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z;
    this.halfW = this.halfH * this.camera.aspect;
    this.uniforms.uPixelRatio.value = dpr;
    this.uniforms.uAspect.value = w / h;
    this.dirty = true;
    if (!this.running) this.renderOnce();
  }

  start() {
    this.running = true;
    this.updateRunning();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private updateRunning() {
    const shouldRun = this.running && this.visible && this.onscreen;
    if (shouldRun && !this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    } else if (!shouldRun && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private requestFrame() {
    if (!this.raf && this.visible && this.onscreen) this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0.016);
    this.last = now;
    const settled = this.step(dt);
    this.renderer.render(this.scene, this.camera);
    this.sampleFrame(dt);
    // Reduced motion renders only until the scene has settled.
    if (this.opts.reducedMotion) {
      if (!settled || this.dirty) {
        this.dirty = false;
        this.raf = requestAnimationFrame(this.frame);
      }
      return;
    }
    if (this.running) this.raf = requestAnimationFrame(this.frame);
  };

  private renderOnce() {
    this.step(0.016);
    this.renderer.render(this.scene, this.camera);
  }

  /** Adaptive quality: drop resolution if frames are consistently slow. */
  private sampleFrame(dt: number) {
    if (this.dprCap <= 1) return;
    this.frameSamples.push(dt);
    if (this.frameSamples.length >= 90) {
      const avg = this.frameSamples.reduce((a, b) => a + b, 0) / this.frameSamples.length;
      this.frameSamples = [];
      if (avg > 0.024) {
        this.dprCap = Math.max(1, this.dprCap - 0.5);
        this.resize();
      }
    }
  }

  private step(dt: number): boolean {
    const t: SceneTarget = this.director.get();
    const rm = this.opts.reducedMotion;
    const k = (rate: number) => (rm ? 1 : 1 - Math.exp(-dt * rate));
    const L = this.live;
    let delta = 0;
    const ease = (cur: number, to: number, rate: number) => {
      const n = cur + (to - cur) * k(rate);
      delta += Math.abs(to - n);
      return n;
    };

    this.age += dt;
    const wRate = this.opts.intro && this.age < 3.5 ? 0.85 : 2.1;
    for (let i = 0; i < 6; i++) L.w[i] = ease(L.w[i], t.weights[i], wRate);
    L.offset[0] = ease(L.offset[0], t.offset[0], 2.4);
    L.offset[1] = ease(L.offset[1], t.offset[1], 2.4);
    L.scale = ease(L.scale, t.scale, 2.4);
    L.opacity = ease(L.opacity, t.opacity, 1.6);
    L.activity = ease(L.activity, t.activity, 2.5);
    L.lines = ease(L.lines, t.lines, 2.5);
    for (let i = 0; i < 3; i++) L.groupAlpha[i] = ease(L.groupAlpha[i], t.groupAlpha[i], 3);
    for (let i = 0; i < 3; i++) L.attract[i] = ease(L.attract[i], t.attract[i], 5);

    const base = Math.min(this.halfH, this.halfW * 1.15);
    const tri: [number, number][] = t.clusters ?? clusterTriangle(t.offset, this.halfW / this.halfH);
    for (let i = 0; i < 3; i++) {
      L.clusters[i][0] = ease(L.clusters[i][0], tri[i][0], 2.4);
      L.clusters[i][1] = ease(L.clusters[i][1], tri[i][1], 2.4);
    }

    if (!rm) this.time += dt * (1 + L.activity * 1.6);
    this.spin += rm ? 0 : dt * (0.05 + L.activity * 0.35);

    // Mouse easing.
    const m = this.mouse;
    m.x += (m.tx - m.x) * k(3);
    m.y += (m.ty - m.y) * k(3);
    m.strength += (m.ts - m.strength) * k(2);

    const u = this.uniforms;
    u.uTime.value = this.time;
    (u.uW0.value as THREE.Vector3).set(L.w[0], L.w[1], L.w[2]);
    (u.uW1.value as THREE.Vector3).set(L.w[3], L.w[4], L.w[5]);
    const radius = L.scale * base;
    u.uScale.value = radius;
    u.uClusterScale.value = 0.95;
    (u.uOffset.value as THREE.Vector3).set(L.offset[0] * this.halfW, L.offset[1] * this.halfH, 0);
    (u.uC0.value as THREE.Vector3).set(L.clusters[0][0] * this.halfW, L.clusters[0][1] * this.halfH, 0);
    (u.uC1.value as THREE.Vector3).set(L.clusters[1][0] * this.halfW, L.clusters[1][1] * this.halfH, 0);
    (u.uC2.value as THREE.Vector3).set(L.clusters[2][0] * this.halfW, L.clusters[2][1] * this.halfH, 0);
    (u.uGroupAlpha.value as THREE.Vector3).set(L.groupAlpha[0], L.groupAlpha[1], L.groupAlpha[2]);
    u.uOpacity.value = L.opacity;
    u.uActivity.value = L.activity;
    (u.uMouse.value as THREE.Vector2).set(m.x, m.y);
    u.uMouseStrength.value = m.strength;
    (u.uAttract.value as THREE.Vector3).set(L.attract[0], L.attract[1], L.attract[2]);
    this.lineUniforms.uLineAlpha.value = (this.opts.quality === "low" ? 0.55 : 0.6) * L.lines;

    this.m4a.makeRotationY(this.spin + m.x * 0.22).multiply(this.m4b.makeRotationX(-m.y * 0.14 + 0.18));
    (u.uRot.value as THREE.Matrix3).setFromMatrix4(this.m4a);
    this.m4a.makeRotationY(m.x * 0.18).multiply(this.m4b.makeRotationX(-m.y * 0.1));
    (u.uRotSoft.value as THREE.Matrix3).setFromMatrix4(this.m4a);

    // Glows.
    this.glow.position.set(L.offset[0] * this.halfW, L.offset[1] * this.halfH, -0.5);
    this.glow.scale.setScalar(radius * 2.5);
    (this.glow.material as THREE.SpriteMaterial).opacity = (L.w[0] * 0.32 + L.w[2] * 0.12 + L.activity * 0.25) * L.opacity;
    for (let i = 0; i < 3; i++) {
      const g = this.clusterGlows[i];
      g.position.set(L.clusters[i][0] * this.halfW, L.clusters[i][1] * this.halfH, -0.4);
      g.scale.setScalar(radius * 1.1);
      (g.material as THREE.SpriteMaterial).opacity = L.w[1] * 0.2 * L.groupAlpha[i] * L.opacity;
    }

    return delta < 0.002;
  }

  dispose() {
    this.stop();
    this.unsub();
    this.disposers.forEach((d) => d());
    this.renderer.dispose();
  }
}
