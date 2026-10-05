import { Intro, Reveal, Section } from "@/components/home/Section";

const STEPS = [
  { n: "1", t: "Pick your bots.", d: "Start with the five, or build your own in a sentence." },
  { n: "2", t: "Tell them what to keep doing.", d: "“Every morning, find roofers whose sites went down.” That's a routine." },
  { n: "3", t: "They work. You say yes.", d: "Around the clock, on their own. You get a text when something needs you." },
];

export function HowItWorksSection() {
  return (
    <Section id="how" className="py-[18vh]">
      <Intro title={["Three steps.", "Then it runs itself."]} />
      <ol className="mx-auto mt-16 grid max-w-[1040px] gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08}>
            <li className="h-full rounded-[26px] bg-white/[0.03] p-7 hairline">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[15px] font-semibold text-black">{s.n}</span>
              <div className="mt-6 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-white">{s.t}</div>
              <p className="mt-2 text-[16px] leading-snug text-fg-2">{s.d}</p>
            </li>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
