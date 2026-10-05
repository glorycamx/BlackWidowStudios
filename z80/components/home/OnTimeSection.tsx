import { Check } from "lucide-react";
import { Display, Reveal, Section } from "@/components/home/Section";

const POSTS = [
  { ch: "Instagram", at: "7:58 AM", cap: "Before and after: a roofing site that loaded in 7 seconds now loads in 1.4." },
  { ch: "LinkedIn", at: "12:14 PM", cap: "3 signs your website is costing you jobs. Fixing all three takes a week." },
  { ch: "Facebook", at: "7:42 PM", cap: "Reviews are the new homepage. Put your best ones where people decide to call." },
];

/** On-time posting: the exact minute, every time. */
export function OnTimeSection() {
  return (
    <Section id="on-time" className="py-[18vh]">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <Display lines={["Posted on", "the minute."]} className="text-[clamp(44px,6vw,96px)]" />
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-[440px] text-[clamp(18px,1.6vw,22px)] leading-[1.4] text-fg-2">Content Creator keeps the next week drafted in your voice and posts at the exact time you picked. Anything new waits for your OK.</p>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <ul className="space-y-3">
            {POSTS.map((p) => (
              <li key={p.at} className="rounded-[22px] bg-white/[0.03] p-5 hairline">
                <div className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-fg-3">{p.ch}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#5fd39a1a] px-2 py-0.5 text-[12px] text-[#5fd39a]">
                    <Check size={11} /> Posted
                  </span>
                </div>
                <p className="mt-2 text-[16px] leading-snug text-white">{p.cap}</p>
                <div className="mt-3 text-[13px] tabular-nums text-[#5fd39a]">
                  Scheduled {p.at} · Posted {p.at}
                </div>
              </li>
            ))}
            <li className="px-1 text-[13px] text-fg-4">Example posts.</li>
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
