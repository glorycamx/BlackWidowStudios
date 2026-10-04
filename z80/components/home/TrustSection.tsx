import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Display, Reveal, Section } from "@/components/home/Section";
import { pricing } from "@/config/pricing";

const PRINCIPLES = [
  { k: "Explicit permissions", v: "Every action an intelligence can take is a rule you control: autonomous, ask first, or blocked." },
  { k: "Human approval gates", v: "Anything that leaves your company waits for a person. Approvals arrive where you already are." },
  { k: "Activity history", v: "Every meaningful action is recorded with who, what and when — a complete audit trail." },
  { k: "Revoke access instantly", v: "Pause an intelligence or disconnect a tool in one click. Work stops immediately." },
  { k: "Organization-level isolation", v: "Your memory, connections and missions belong to your workspace alone." },
];

/** Trust as part of the product, not a badge wall. No certifications are claimed. */
export function TrustSection() {
  return (
    <Section id="trust" index="12" label="Trust" className="py-[16vh]">
      <div className="mt-8 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <Display lines={["Humans decide.", "Z80 executes."]} className="text-[clamp(40px,5.8vw,100px)]" />
          <Reveal delay={0.1}>
            <Link href="/security" className="group mt-10 inline-flex items-center gap-2 border-b border-white/20 pb-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-white hover:border-white">
              How Z80 handles access <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
        <Reveal delay={0.05}>
          <ul className="divide-y divide-white/[0.07] border-y border-line">
            {PRINCIPLES.map((p, i) => (
              <li key={p.k} className="grid gap-2 py-6 sm:grid-cols-[48px_220px_1fr] sm:gap-6">
                <span className="font-mono text-[11px] text-fg-3">0{i + 1}</span>
                <span className="text-[15px] font-medium text-white">{p.k}</span>
                <span className="text-[14.5px] leading-relaxed text-fg-2">{p.v}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <Reveal>
        <div className="mt-[14vh] flex flex-col gap-4 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
          <p className="max-w-[640px] text-[15px] text-fg-2">
            <span className="mr-3 text-white">{pricing.tiers.map((t) => t.name).join(" · ")}</span>
            Plans for individuals, teams, and companies building AI operations. {pricing.note}
          </p>
          <Link href="/pricing" className="label flex items-center gap-2 text-fg-1 hover:text-white">
            See plans <ArrowUpRight size={13} />
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
