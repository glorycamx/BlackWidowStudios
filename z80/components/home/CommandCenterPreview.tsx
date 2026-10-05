"use client";

import { ArrowUpRight, Activity, Brain, CheckCircle2, Command, Plug, Target, Users } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { Display, Reveal, Section } from "@/components/home/Section";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { Wordmark } from "@/components/z80/Wordmark";
import { agentOrFallback } from "@/data/bots";

const NAV = [
  { label: "Command", icon: Command, on: true },
  { label: "Workforce", icon: Users },
  { label: "Missions", icon: Target },
  { label: "Memory", icon: Brain },
  { label: "Connections", icon: Plug },
  { label: "Activity", icon: Activity },
];

/** STATE 09 — a calm, static preview of the logged-in product. */
export function CommandCenterPreview() {
  const rail = [
    { id: "manager", doing: "Coordinating 4 missions" },
    { id: "lead-hunter", doing: "Researching 38 accounts" },
    { id: "content-creator", doing: "Creating campaign concepts" },
  ];
  return (
    <Section id="product" index="11" label="Command center" className="py-[18vh]">
      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <Display lines={["Your company,", "with a mind of its own."]} className="text-[clamp(40px,5.8vw,96px)]" />
        <Reveal delay={0.1}>
          <Button variant="secondary" href="/chat" iconRight={<ArrowUpRight size={14} />}>
            Open the command center
          </Button>
        </Reveal>
      </div>

      <Reveal delay={0.05} y={40}>
        <div className="relative mt-14">
          <div aria-hidden className="absolute -inset-x-10 -top-10 bottom-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(100,91,255,0.16),transparent_70%)]" />
          <div className="panel-solid relative grid min-h-[560px] overflow-hidden lg:grid-cols-[210px_1fr_280px]" role="img" aria-label="Preview of the Z80 command center">
            {/* Sidebar */}
            <div className="hidden flex-col border-r border-line p-4 lg:flex">
              <div className="px-2 pb-6 pt-1 text-[16px]">
                <Wordmark />
              </div>
              {NAV.map(({ label, icon: Icon, on }) => (
                <div key={label} className={`flex h-9 items-center gap-3 rounded-[9px] px-2.5 text-[13px] ${on ? "bg-white/[0.06] text-white" : "text-fg-3"}`}>
                  <Icon size={15} />
                  {label}
                </div>
              ))}
              <div className="mt-4 flex h-9 items-center justify-between rounded-[9px] px-2.5 text-[13px] text-fg-2">
                <span className="flex items-center gap-3">
                  <CheckCircle2 size={15} /> Approvals
                </span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-attn/20 px-1.5 text-[12px] tabular-nums text-attn">2</span>
              </div>
            </div>

            {/* Conversation */}
            <div className="flex flex-col p-6 md:p-10">
              <div className="label">Command</div>
              <h3 className="mt-6 text-[clamp(30px,3.4vw,48px)] font-semibold leading-[1.02] tracking-[-0.04em] text-white">
                Good morning.
                <br />
                <span className="text-fg-3">Your agents worked through the night.</span>
              </h3>
              <div className="mt-8 space-y-4">
                <div className="ml-auto max-w-[80%] rounded-[14px] bg-white/[0.06] px-4 py-3 text-[14px] text-white">I want more commercial roofing jobs next month.</div>
                <div className="max-w-[88%]">
                  <div className="label mb-2 text-[10px] text-fg-1">Z80</div>
                  <p className="text-[14px] leading-relaxed text-fg-2">
                    Understood. I&apos;d start by identifying commercial property operators in your area, researching which buildings likely need roofing work, and building an outreach campaign around those opportunities.
                  </p>
                  <div className="mt-3 flex gap-2">
                    {["lead-hunter", "content-creator", "manager"].map((id) => {
                      const a = agentOrFallback(id);
                      return (
                        <span key={id} className="flex h-7 items-center gap-2 rounded-[8px] px-2.5 text-[12px] hairline" style={{ color: a.accent.tint }}>
                          <span className="h-1 w-1 rounded-full" style={{ background: a.accent.hex }} />
                          {a.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AgentGlyph agent={agentOrFallback("lead-hunter")} size={26} />
                  <div>
                    <div className="text-[12px] text-hunter">Lead Hunter</div>
                    <p className="mt-1 text-[14px] text-fg-1">Found 81 potential accounts.</p>
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-8">
                <div className="flex h-12 items-center justify-between rounded-[13px] px-4 text-[14px] text-fg-3 hairline">
                  Give your agents a new goal.
                  <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-white/[0.06] text-fg-2">↑</span>
                </div>
              </div>
            </div>

            {/* Ambient rail */}
            <div className="hidden border-l border-line p-6 lg:block">
              <div className="label">Active intelligences</div>
              <ul className="mt-5 space-y-5">
                {rail.map((r) => {
                  const a = agentOrFallback(r.id);
                  return (
                    <li key={r.id} className="flex items-start gap-3">
                      <StatusDot color={a.accent.hex} size={6} className="mt-1.5" />
                      <div>
                        <div className="text-[12.5px] font-semibold text-white">{a.name}</div>
                        <div className="mt-1 text-[13px] text-fg-3">{r.doing}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="label mt-10 text-[10px]">Today</div>
              <dl className="mt-4 space-y-3 text-[13px]">
                {[
                  ["Missions completed", "3"],
                  ["Tasks executed", "64"],
                  ["Approvals waiting", "2"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-fg-3">{k}</dt>
                    <dd className="font-mono text-fg-1">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-8 text-[12px] text-fg-4">Sample workspace</p>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
