"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { AgentStage } from "@/components/agents/AgentStage";
import { BotScreen } from "@/components/bots/BotScreen";
import { describeTrigger, routineTemplates } from "@/data/routines";
import { CommandConsole } from "@/components/command/CommandConsole";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { agentOrFallback } from "@/data/bots";
import { getIntegration, integrationStatusLabel } from "@/data/integrations";
import { getMemoryDomain } from "@/data/memory";
import { EASE } from "@/lib/motion";
import type { Agent } from "@/types";

const PROMPTS: Record<string, string> = {
  "content-creator": "Keep my Instagram posting every weekday at 8 AM",
  "lead-hunter": "Every morning, find roofers whose websites went down",
  manager: "Text me every evening at 6 with what got done",
  researcher: "Watch my competitors' prices and tell me when they change",
  reporter: "Check AI news every 10 minutes and flag what matters",
};

/** Public profile of one bot. */
export function AgentProfile({ agent }: { agent: Agent }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const available = agent.availability === "available";
  const keeps = routineTemplates.filter((r) => r.botId === agent.id);

  return (
    <main id="main" className="relative">
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0 md:left-[40%]">
          <AgentStage visual={agent.visual} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent md:via-black/20" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-[1440px] flex-col justify-end px-5 pb-16 pt-28 md:justify-center md:px-10 md:pb-10">
          <Link href="/#bots" className="label inline-flex items-center gap-2 text-fg-3 hover:text-white">
            <ArrowLeft size={12} /> Your bots
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE, delay: 0.2 }} className="mt-10 max-w-[640px]">
            <div className="flex items-center gap-2 text-[15px] font-medium" style={{ color: agent.accent.tint }}>
              {agent.tagline}
            </div>
            <h1 className="display mt-5 text-[clamp(64px,10vw,150px)]">{agent.name}</h1>
            <p className="mt-5 text-[19px] text-fg-1">{agent.role}.</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <span className="label flex items-center gap-2 text-[10px]">
                Status
                <span className="flex items-center gap-2" style={{ color: available ? agent.accent.tint : undefined }}>
                  <StatusDot color={available ? agent.accent.hex : "#686872"} size={5} live={available} />
                  {available ? "On shift, around the clock" : "Coming soon"}
                </span>
              </span>
              <span className="label">{agent.personality.join(" · ")}</span>
            </div>
            <p className="mt-8 max-w-[520px] text-[17px] leading-relaxed text-fg-2">{agent.description}</p>
            {available && (
              <div className="mt-10">
                <Button variant="primary" size="lg" href="#put-to-work" data-deploy>
                  Put {agent.name} to work
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1440px] px-5 py-[14vh] md:px-10">
        {available && (
          <div className="mb-[10vh] grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-[clamp(32px,4vw,56px)] font-semibold leading-[1] tracking-[-0.045em] text-white">Watch it work.</h2>
              <p className="mt-4 max-w-[440px] text-[17px] leading-relaxed text-fg-2">This is {agent.name} in the demo, right now. It checks something every few seconds, even when nothing turns up.</p>
              {keeps.length > 0 && (
                <ul className="mt-8 space-y-2.5">
                  {keeps.map((r) => (
                    <li key={r.key} className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5 text-[15px] text-white">
                      {r.title}
                      <span className="shrink-0 text-[12px] text-fg-3">{describeTrigger(r.trigger)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <BotScreen bot={agent} />
          </div>
        )}
        <div className="grid gap-px overflow-hidden rounded-[16px] bg-line md:grid-cols-2 lg:grid-cols-4">
          <Block title="Specialties">
            <ul className="space-y-2.5">
              {agent.specialties.map((s) => (
                <li key={s} className="text-[15px] text-white">
                  {s}
                </li>
              ))}
            </ul>
          </Block>
          <Block title="Apps">
            <ul className="space-y-2.5">
              {agent.tools.map((t) => {
                const i = getIntegration(t);
                return (
                  <li key={t} className="flex items-baseline justify-between gap-3 text-[15px] text-white">
                    {i?.name ?? t}
                    {i && <span className="text-[12px] text-fg-3">{integrationStatusLabel[i.status]}</span>}
                  </li>
                );
              })}
            </ul>
          </Block>
          <Block title="What it knows">
            <ul className="space-y-2.5">
              {agent.memory.map((m) => (
                <li key={m} className="text-[15px] text-white">
                  {getMemoryDomain(m)?.label ?? m}
                  <span className="block text-[12.5px] text-fg-3">{getMemoryDomain(m)?.summary}</span>
                </li>
              ))}
            </ul>
          </Block>
          <Block title="Works with">
            <ul className="space-y-4">
              {agent.collaborators.map((id) => {
                const c = agentOrFallback(id);
                return (
                  <li key={id}>
                    <Link href={`/bots/${c.slug}`} className="flex items-center gap-3 hover:opacity-80">
                      <AgentGlyph agent={c} size={30} animated={false} />
                      <span>
                        <span className="block text-[13px] font-semibold text-white">{c.name}</span>
                        <span className="block text-[12.5px] text-fg-3">{c.role}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Block>
        </div>

        {available && (
          <div id="put-to-work" className="mx-auto mt-[14vh] max-w-[760px] scroll-mt-32">
            <h2 className="text-center text-[clamp(32px,4vw,56px)] font-semibold leading-[1] tracking-[-0.045em] text-white">
              Put {agent.name} to work.
            </h2>
            <div className="mt-10">
              <CommandConsole
                id={`agent-${agent.id}`}
                value={value}
                onChange={setValue}
                onSubmit={(t) => router.push(`/chat?prompt=${encodeURIComponent(t)}`)}
                examples={[PROMPTS[agent.id] ?? `Have ${agent.name} work on…`]}
                hint={`Manager hands it to ${agent.name}. Ongoing asks become routines.`}
              />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-black p-7">
      <h2 className="label mb-6 text-[10px]">{title}</h2>
      {children}
    </section>
  );
}
