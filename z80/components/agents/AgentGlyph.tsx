import { useId } from "react";
import type { Agent } from "@/types";
import { cn, hashString, prng } from "@/lib/utils";

interface Props {
  agent: Pick<Agent, "id" | "visual" | "accent">;
  size?: number;
  animated?: boolean;
  className?: string;
  /** Dim the glyph (inactive / coming soon). */
  muted?: boolean;
}

/**
 * Lightweight SVG signature for an intelligence — the DOM counterpart of the
 * particle scene. Deterministic, so it renders identically on server and client.
 */
export function AgentGlyph({ agent, size = 40, animated = true, className, muted }: Props) {
  const uidRaw = useId();
  const id = uidRaw.replace(/:/g, "");
  const c = agent.accent.hex;
  const r = prng(hashString(agent.id));
  const anim = animated ? "motion-safe:" : "";

  let body: React.ReactNode = null;

  if (agent.visual === "lattice") {
    const nodes: [number, number][] = [];
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 5; x++) {
        const px = 8 + x * 8 + (y % 2) * 4;
        const py = 8 + y * 8;
        if (Math.hypot(px - 24, py - 24) < 17) nodes.push([px, py]);
      }
    const links: [number, number, number, number][] = [];
    nodes.forEach((a, i) =>
      nodes.forEach((b, j) => {
        if (j > i && Math.hypot(a[0] - b[0], a[1] - b[1]) < 9.5) links.push([a[0], a[1], b[0], b[1]]);
      }),
    );
    body = (
      <g className={cn(anim && "motion-safe:animate-[glyph-rotate_40s_linear_infinite] origin-center")} style={{ transformBox: "fill-box" }}>
        {links.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeOpacity={0.28} strokeWidth={0.5} />
        ))}
        {nodes.map(([x, y], i) => {
          const bright = r() > 0.72;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={bright ? 1.35 : 0.9}
              fill={bright ? "#fff" : c}
              className={bright && animated ? "motion-safe:animate-breathe" : undefined}
              style={bright ? { animationDelay: `${(i % 5) * 0.4}s`, transformOrigin: `${x}px ${y}px` } : undefined}
            />
          );
        })}
      </g>
    );
  } else if (agent.visual === "scanner") {
    const pts: [number, number, number][] = [];
    for (let row = 0; row < 6; row++) {
      const y = 11 + row * 5.2;
      const half = Math.sqrt(Math.max(0, 17 ** 2 - (y - 24) ** 2));
      for (let x = 24 - half + 1; x < 24 + half; x += 2.6 + r() * 1.6) pts.push([x, y, r()]);
    }
    body = (
      <>
        <clipPath id={`clip-${id}`}>
          <circle cx={24} cy={24} r={18} />
        </clipPath>
        <g clipPath={`url(#clip-${id})`}>
          {pts.map(([x, y, v], i) => (
            <circle key={i} cx={x} cy={y} r={v > 0.9 ? 1.2 : 0.65} fill={v > 0.9 ? "#fff" : c} opacity={v > 0.9 ? 1 : 0.55 + v * 0.4} />
          ))}
          <g className={cn(animated && "motion-safe:animate-[glyph-scan_3.2s_var(--ease-z-io)_infinite_alternate]")}>
            <rect x={6} y={4} width={1.2} height={40} fill={`url(#beam-${id})`} />
            <rect x={2} y={4} width={9} height={40} fill={`url(#beamglow-${id})`} opacity={0.35} />
          </g>
        </g>
        <defs>
          <linearGradient id={`beam-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`beamglow-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={c} stopOpacity="0" />
            <stop offset="0.5" stopColor={c} stopOpacity="1" />
            <stop offset="1" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
      </>
    );
  } else if (agent.visual === "fluid") {
    const paths = [0, 1, 2].map((k) => {
      const a = 4 + k * 2.2;
      const ph = k * 1.3;
      let d = "";
      for (let i = 0; i <= 32; i++) {
        const x = 7 + (34 * i) / 32;
        const y = 24 + Math.sin(i / 32 * Math.PI * 2 + ph) * a * Math.sin((i / 32) * Math.PI);
        d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)} `;
      }
      return d;
    });
    body = (
      <>
        <defs>
          <linearGradient id={`fl-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7a5cff" />
            <stop offset="1" stopColor="#e05ae8" />
          </linearGradient>
        </defs>
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={`url(#fl-${id})`}
            strokeWidth={i === 1 ? 1.1 : 0.6}
            strokeOpacity={i === 1 ? 0.95 : 0.55}
            strokeLinecap="round"
            strokeDasharray={i === 1 ? "0.1 2.4" : "0.1 3.2"}
            className={animated ? "motion-safe:animate-[glyph-flow_2.4s_linear_infinite]" : undefined}
            style={{ animationDuration: `${2 + i * 0.7}s` }}
          />
        ))}
      </>
    );
  } else if (agent.visual === "pulse") {
    // Broadcast rings that ping outward every few seconds.
    body = (
      <>
        {[0, 1, 2].map((k) => (
          <circle
            key={k}
            cx={24}
            cy={24}
            r={6}
            fill="none"
            stroke={c}
            strokeWidth={0.8}
            className={animated ? "motion-safe:animate-[glyph-ping_3s_ease-out_infinite]" : undefined}
            style={{ transformOrigin: "24px 24px", animationDelay: `${k}s`, opacity: animated ? undefined : 0.5 - k * 0.15, transform: animated ? undefined : `scale(${1 + k * 0.9})` }}
          />
        ))}
        <circle cx={24} cy={24} r={2.2} fill="#fff" />
        <circle cx={24} cy={24} r={4} fill={c} fillOpacity={0.35} />
      </>
    );
  } else {
    // A small constellation; points light up one by one as it "finds" them.
    const pts: [number, number][] = Array.from({ length: 9 }, () => {
      const a = r() * Math.PI * 2;
      const d = 5 + r() * 12;
      return [Math.round((24 + Math.cos(a) * d) * 100) / 100, Math.round((24 + Math.sin(a) * d) * 100) / 100];
    });
    body = (
      <g>
        {pts.slice(1).map(([x, y], i) => (
          <line key={`l${i}`} x1={pts[i][0]} y1={pts[i][1]} x2={x} y2={y} stroke={c} strokeOpacity={0.22} strokeWidth={0.5} />
        ))}
        {pts.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 1.4 : 0.9}
            fill={i % 3 === 0 ? "#fff" : c}
            className={animated ? "motion-safe:animate-[glyph-reveal_4.5s_ease-in-out_infinite]" : undefined}
            style={{ animationDelay: `${i * 0.45}s`, transformOrigin: `${x}px ${y}px` }}
          />
        ))}
      </g>
    );
  }


  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={cn("shrink-0", muted && "opacity-50 grayscale", className)}
      aria-hidden
    >
      {/* Dark backing disc in light theme so the glyph keeps its night-sky look. */}
      <circle cx={24} cy={24} r={23} fill="var(--glyph-bg, transparent)" />
      <circle cx={24} cy={24} r={21} fill={c} fillOpacity={0.05} />
      <circle cx={24} cy={24} r={21} fill="none" stroke={c} strokeOpacity={0.18} strokeWidth={0.6} />
      {body}
    </svg>
  );
}
