import type { ReactNode } from "react";
import { Footer } from "@/components/z80/Footer";

/** Shared layout for quiet editorial pages (pricing, security, legal). */
export function Editorial({ label, title, intro, children }: { label: string; title: ReactNode; intro?: ReactNode; children: ReactNode }) {
  return (
    <>
      <main id="main" className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(50%_80%_at_70%_0%,rgba(69,108,255,0.12),transparent_70%)]" />
        <div className="relative mx-auto max-w-[1240px] px-5 pb-[16vh] pt-36 md:px-10 md:pt-44">
          <p className="label">{label}</p>
          <h1 className="display mt-6 max-w-[16ch] text-[clamp(48px,7vw,112px)]">{title}</h1>
          {intro && <div className="mt-8 max-w-[600px] text-[17px] leading-relaxed text-fg-2">{intro}</div>}
          <div className="mt-20">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-[680px] space-y-6 text-[15.5px] leading-[1.75] text-fg-2 [&_h2]:mt-14 [&_h2]:text-[13px] [&_h2]:font-semibold [&_h2]:[&_h2]:tracking-[0.16em] [&_h2]:text-white [&_strong]:text-white">{children}</div>;
}
