import Link from "next/link";
import { Plus } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { Reveal, Section } from "@/components/home/Section";
import { bots } from "@/data/bots";
import { tint } from "@/lib/tint";

/** A first job for each agent, so Deploy goes straight to a ready card. */
const FIRST_JOB: Record<string, string> = {
  manager: "Text me every evening at 6 with what got done",
  "lead-hunter": "Every morning, find local businesses whose website just went down",
  "content-creator": "Keep my social posts going out every weekday at 8 AM",
  researcher: "Watch my competitors' prices and tell me when they change",
  reporter: "Text me a short news brief for my industry every morning at 7",
};

export function AgentsSection() {
  const ready = bots.filter((b) => b.availability === "available");
  const soon = bots.filter((b) => b.availability !== "available");
  return (
    <Section id="agents" className="py-24 md:py-32">
      <Reveal>
        <h2 className="text-[clamp(30px,3.4vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em] text-white">Pick an agent. Or make your own.</h2>
        <p className="mt-3 max-w-[560px] text-[17px] text-fg-2">Each one has a job and keeps doing it. Deploy one in a click.</p>
      </Reveal>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ready.map((a, i) => (
          <Reveal key={a.id} delay={i * 0.04}>
            <li className="flex h-full flex-col rounded-[22px] bg-white/[0.035] p-5 ring-1 ring-[var(--color-line)]">
              <div className="flex items-center gap-3">
                <AgentGlyph agent={a} size={40} />
                <div className="min-w-0">
                  <Link href={`/bots/${a.slug}`} className="text-[17px] font-semibold text-white hover:underline">
                    {a.name}
                  </Link>
                  <div className="text-[13px]" style={{ color: tint(a.accent) }}>
                    {a.domain}
                  </div>
                </div>
              </div>
              <p className="mt-3 flex-1 text-[15px] leading-snug text-fg-2">{a.role}.</p>
              <Link href={`/chat?prompt=${encodeURIComponent(FIRST_JOB[a.id] ?? a.role)}`} className="mt-4 inline-flex h-9 w-fit items-center rounded-full bg-white px-4 text-[14px] font-medium text-black hover:opacity-85">
                Deploy
              </Link>
            </li>
          </Reveal>
        ))}
        <Reveal delay={0.2}>
          <li className="h-full">
            <Link href="/team?create=1" className="flex h-full min-h-[180px] flex-col justify-between rounded-[22px] border border-dashed border-[var(--color-line-3)] p-5 transition-colors hover:bg-white/[0.03]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-line-3)] text-fg-1">
                <Plus size={18} />
              </span>
              <span>
                <span className="block text-[17px] font-semibold text-white">Create your own</span>
                <span className="mt-1 block text-[15px] leading-snug text-fg-2">Describe it in one sentence. It starts right away.</span>
              </span>
            </Link>
          </li>
        </Reveal>
      </ul>
      {soon.length > 0 && <p className="mt-5 text-[14px] text-fg-3">Coming soon: {soon.map((s) => s.name).join(" and ")}.</p>}
    </Section>
  );
}
