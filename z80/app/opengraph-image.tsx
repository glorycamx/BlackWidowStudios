import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Generated Open Graph card: wordmark, tagline, intelligence orb. */
export default function OpengraphImage() {
  const dots = Array.from({ length: 220 }, (_, i) => {
    const a = i * 2.39996;
    const r = 210 * Math.sqrt(((i * 37) % 220) / 220) * 0.15 + 205 * (0.86 + 0.14 * Math.abs(Math.sin(i)));
    return { x: 850 + Math.cos(a) * r * (0.55 + 0.45 * Math.abs(Math.cos(i * 0.7))), y: 315 + Math.sin(a) * r, s: 2 + (i % 7 === 0 ? 3 : 0) };
  });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#000", position: "relative" }}>
        <div style={{ position: "absolute", left: 600, top: 65, width: 500, height: 500, borderRadius: 500, background: "radial-gradient(circle, rgba(69,108,255,0.35), rgba(0,0,0,0) 70%)" }} />
        {dots.map((d, i) => (
          <div key={i} style={{ position: "absolute", left: d.x, top: d.y, width: d.s, height: d.s, borderRadius: 9, background: i % 5 === 0 ? "#ffffff" : "#8fa2ff", opacity: 0.85 }} />
        ))}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 90 }}>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 700, letterSpacing: -6, lineHeight: 1 }}>
            <span style={{ color: "#f1f2f6" }}>Z80</span>
            <span style={{ backgroundImage: "linear-gradient(100deg, #3f7bff, #8754ff, #c847f0)", backgroundClip: "text", color: "transparent" }}>.si</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 40, color: "#c9cad2", letterSpacing: -1 }}>Super intelligence is here.</div>
          <div style={{ marginTop: 16, fontSize: 24, color: "#686872" }}>Autonomous agents. Always on.</div>
        </div>
      </div>
    ),
    size,
  );
}
