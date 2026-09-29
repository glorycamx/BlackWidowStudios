import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { reducedMotion, useCountUp } from "../motion";
import { WebMark } from "./Icon";

export function CountUp({ value, prefix = "", ms }: { value: number; prefix?: string; ms?: number }) {
  const v = useCountUp(value, ms);
  return <>{prefix}{v.toLocaleString()}</>;
}

// Headline that reveals word by word
export function RevealText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`reveal-words ${className || ""}`} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden="true" style={{ animationDelay: `${80 + i * 55}ms` }}>{w}&nbsp;</span>
      ))}
    </span>
  );
}

// Remounts page content on route change so the entrance animation replays
export function PageTransition({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  return <div key={loc.pathname} className="page-anim">{children}</div>;
}

// Faint spider web drifting behind everything, with scroll parallax
export function AmbientWeb() {
  useEffect(() => {
    if (reducedMotion()) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => document.documentElement.style.setProperty("--scroll", String(window.scrollY)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="ambient" aria-hidden="true">
      <svg viewBox="0 0 400 400" className="ambient-web">
        <g fill="none" stroke="currentColor" strokeWidth="0.6">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1="200" y1="200" x2={200 + Math.cos(a) * 200} y2={200 + Math.sin(a) * 200} />;
          })}
          {[40, 75, 110, 145, 180].map((r) => (
            <polygon key={r} points={Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `${200 + Math.cos(a) * r},${200 + Math.sin(a) * r}`; }).join(" ")} />
          ))}
        </g>
      </svg>
    </div>
  );
}

// Logo draws itself on first open, then lifts away
export function Splash() {
  const [show, setShow] = useState(() => {
    if (reducedMotion()) return false;
    try {
      if (sessionStorage.getItem("bw-splash")) return false;
      sessionStorage.setItem("bw-splash", "1");
    } catch {}
    return true;
  });
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 1150);
    return () => clearTimeout(t);
  }, [show]);
  if (!show) return null;
  return (
    <div className="splash" aria-hidden="true">
      <div className="splash-mark"><WebMark size={84} /></div>
      <div className="splash-word">Black Widow</div>
    </div>
  );
}
