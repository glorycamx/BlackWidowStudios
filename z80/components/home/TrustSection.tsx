import Link from "next/link";
import { Intro, Reveal, Section } from "@/components/home/Section";

const POINTS = [
  { t: "Approve what matters", d: "Emails, posts and spend wait for your yes." },
  { t: "See everything", d: "Every action is logged as it happens." },
  { t: "Stop anytime", d: "Pause an agent or cut access in one tap." },
];

/** Trust, said simply. No certifications are claimed. */
export function TrustSection() {
  return (
    <Section id="trust" className="py-[18vh]">
      <Intro title={["Humans decide.", "Z80 executes."]} />
      <Reveal delay={0.05}>
        <ul className="mx-auto mt-16 grid max-w-[960px] gap-px overflow-hidden rounded-[24px] bg-white/[0.07] sm:grid-cols-3">
          {POINTS.map((p) => (
            <li key={p.t} className="bg-[#050507] px-8 py-10 text-center">
              <div className="text-[19px] font-semibold tracking-[-0.02em] text-white">{p.t}</div>
              <p className="mt-2 text-[15px] leading-snug text-fg-3">{p.d}</p>
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-10 flex justify-center gap-8 text-[15px]">
          <Link href="/security" className="text-[#9aa5ff] hover:text-white">
            Security ›
          </Link>
          <Link href="/pricing" className="text-[#9aa5ff] hover:text-white">
            Plans ›
          </Link>
        </p>
      </Reveal>
    </Section>
  );
}
