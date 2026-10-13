import { Reveal, Section } from "@/components/home/Section";

const STEPS = [
  { n: "1", t: "Tell it what to do", d: "In plain English, like you'd text a person. “Find roofers whose sites went down.”" },
  { n: "2", t: "It works around the clock", d: "Your agent checks, finds and drafts all day and all night, without being asked." },
  { n: "3", t: "You say yes", d: "Anything that goes out waits in your Inbox. One tap to approve." },
];

export function HowItWorksSection() {
  return (
    <Section id="how" className="py-24 md:py-32">
      <Reveal>
        <h2 className="text-[clamp(30px,3.4vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em] text-white">How it works</h2>
      </Reveal>
      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.06}>
            <li className="h-full rounded-[22px] bg-white/[0.035] p-6 ring-1 ring-[var(--color-line)]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[14px] font-semibold text-black">{s.n}</span>
              <div className="mt-5 text-[19px] font-semibold tracking-[-0.015em] text-white">{s.t}</div>
              <p className="mt-1.5 text-[15.5px] leading-snug text-fg-2">{s.d}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
