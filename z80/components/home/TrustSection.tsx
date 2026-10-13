import Link from "next/link";
import { Reveal, Section } from "@/components/home/Section";

const POINTS = [
  { t: "You say yes first", d: "Emails, posts and spending wait for you, unless you choose otherwise." },
  { t: "See every step", d: "Every check and every action is logged as it happens." },
  { t: "Pause anytime", d: "Stop one job or a whole agent in one tap." },
];

/** You stay in charge, said in three lines. */
export function TrustSection() {
  return (
    <Section id="trust" className="py-24 md:py-32">
      <Reveal>
        <h2 className="text-[clamp(30px,3.4vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em] text-white">They do the work. You stay in charge.</h2>
      </Reveal>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {POINTS.map((p, i) => (
          <Reveal key={p.t} delay={i * 0.06}>
            <li>
              <div className="text-[18px] font-semibold text-white">{p.t}</div>
              <p className="mt-1.5 text-[15.5px] leading-snug text-fg-2">{p.d}</p>
            </li>
          </Reveal>
        ))}
      </ul>
      <Reveal delay={0.1}>
        <p className="mt-10 flex gap-6 text-[15px]">
          <Link href="/security" className="text-fg-1 underline decoration-[var(--color-line-3)] underline-offset-4 hover:text-white">
            Security
          </Link>
          <Link href="/pricing" className="text-fg-1 underline decoration-[var(--color-line-3)] underline-offset-4 hover:text-white">
            Pricing
          </Link>
        </p>
      </Reveal>
    </Section>
  );
}
