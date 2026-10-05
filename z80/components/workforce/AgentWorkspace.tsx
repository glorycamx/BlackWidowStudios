"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageSquare, Pause, Play } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { ActivityFeed } from "@/components/app/ActivityFeed";
import { ApprovalCard } from "@/components/app/ApprovalCard";
import { PermissionSwitch } from "@/components/app/PermissionSwitch";
import { ActorTag, EmptyState, Panel, ProgressBar } from "@/components/app/primitives";
import { CommandConsole, type CommandConsoleHandle } from "@/components/command/CommandConsole";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { agentOrFallback, getAgentBySlug } from "@/data/bots";
import { getIntegration, integrationStatusLabel } from "@/data/integrations";
import { getMemoryDomain } from "@/data/memory";
import { agentStateLabel, getAgentLiveState } from "@/lib/services/agentService";
import { selectMissions, useWorkspace, workspace } from "@/lib/store/workspace";
import { useNow } from "@/lib/hooks/useNow";
import { EASE } from "@/lib/motion";
import { clockTime, missionCode } from "@/lib/utils";

/** An intelligence's workspace: what it's doing, knows, uses and may do. */
export function AgentWorkspace({ slug }: { slug: string }) {
  const agent = getAgentBySlug(slug);
  const params = useSearchParams();
  const missions = useWorkspace(selectMissions);
  const approvals = useWorkspace((s) => s.approvals);
  const activity = useWorkspace((s) => s.activity);
  const paused = useWorkspace((s) => s.pausedAgents);
  const permissions = useWorkspace((s) => s.permissions);
  const connections = useWorkspace((s) => s.connections);
  const thread = useWorkspace((s) => (agent ? s.threads[agent.id] ?? [] : []));
  const [msg, setMsg] = useState("");
  const consoleRef = useRef<CommandConsoleHandle>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const now = useNow(20000);

  useEffect(() => {
    if (params.get("message")) {
      setTimeout(() => {
        threadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        consoleRef.current?.focus();
      }, 300);
    }
  }, [params]);

  if (!agent || agent.availability !== "available") {
    return <EmptyState title="Intelligence not available" body={agent ? `${agent.name} is on the roadmap.` : "No intelligence with that name."} action={{ label: "Open workforce", href: "/team" }} />;
  }

  const st = getAgentLiveState(agent.id, missions, Object.values(approvals), activity, paused, now)!;
  const events = activity.filter((e) => e.actor === agent.id || e.to === agent.id);
  const current = st.activeMissions[0];
  const currentTask = current?.tasks.find((t) => t.agentId === agent.id && (t.status === "running" || t.status === "blocked"));
  const outputs = missions
    .flatMap((m) => m.tasks.filter((t) => t.agentId === agent.id && t.status === "complete" && t.output).map((t) => ({ m, t })))
    .slice(0, 6);
  const isPaused = paused.includes(agent.id);
  const color = st.state === "waiting" ? "var(--color-attn)" : st.state === "idle" || st.state === "paused" ? "#686872" : agent.accent.hex;

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-10 md:py-10">
      <Link href="/team" className="label inline-flex items-center gap-2 text-fg-3 hover:text-white">
        <ArrowLeft size={12} /> Workforce
      </Link>

      <header className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div aria-hidden className="absolute -inset-6 rounded-full blur-2xl" style={{ background: `radial-gradient(circle, rgba(${agent.accent.rgb} / 0.35), transparent 70%)` }} />
            <AgentGlyph agent={agent} size={96} className="relative" />
          </div>
          <div>
            <div className="label">{agent.designation}</div>
            <h1 className="mt-3 text-[clamp(40px,5vw,64px)] font-semibold leading-[0.95] tracking-[-0.03em] text-white">{agent.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="text-[14px] text-fg-2">{agent.role}</span>
              <span className="label flex items-center gap-2 text-[10px]" style={{ color }}>
                <StatusDot color={color} size={5} live={st.state === "working" || st.state === "active" || st.state === "waiting"} />
                {agentStateLabel(st.state)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<MessageSquare size={14} />}
            onClick={() => {
              threadRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => consoleRef.current?.focus(), 350);
            }}
          >
            Message agent
          </Button>
          <Button variant={isPaused ? "solid" : "secondary"} magnetic={false} icon={isPaused ? <Play size={14} /> : <Pause size={14} />} onClick={() => workspace.togglePauseAgent(agent.id)}>
            {isPaused ? "Resume agent" : "Pause agent"}
          </Button>
        </div>
      </header>

      <AnimatePresence>
        {isPaused && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 text-[13.5px] text-fg-2" role="status">
            {agent.name} is paused. Missions that depend on it will wait until you resume.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <Panel title="Current objective" className="lg:col-span-2">
          {current ? (
            <div>
              <Link href={`/jobs/${current.id}`} className="text-[12px] text-fg-3 hover:text-white">
                Mission {missionCode(current.number)}
              </Link>
              <div className="mt-2 text-[22px] font-medium tracking-[-0.02em] text-white">{current.title}</div>
              <ProgressBar value={current.progress} status={current.status} className="mt-5 max-w-[420px]" />
              <div className="mt-5 text-[14px] text-fg-2">
                <span className="label mr-3 text-[10px]">Now</span>
                {currentTask ? currentTask.label : st.doing}
              </div>
            </div>
          ) : (
            <p className="text-[15px] text-fg-2">Standing by. Assign a mission from Command.</p>
          )}
          {st.pendingApprovals.length > 0 && (
            <div className="mt-6 space-y-3">
              {st.pendingApprovals.map((a) => (
                <ApprovalCard key={a.id} approvalId={a.id} compact />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Collaborates with">
          <ul className="space-y-4">
            {agent.collaborators.map((id) => {
              const c = agentOrFallback(id);
              return (
                <li key={id}>
                  <Link href={`/team/${c.slug}`} className="flex items-center gap-3 hover:opacity-80">
                    <AgentGlyph agent={c} size={32} animated={false} />
                    <span>
                      <span className="block text-[13px] font-semibold text-white">{c.name}</span>
                      <span className="block text-[12.5px] text-fg-3">{c.role}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Current actions" className="lg:col-span-2" action={<Link href="/activity" className="text-[12px] text-fg-3 hover:text-white">All activity →</Link>}>
          <ActivityFeed events={events} limit={8} dense />
        </Panel>

        <Panel title="Memory referenced">
          <ul className="space-y-3">
            {agent.memory.map((m) => {
              const d = getMemoryDomain(m);
              return (
                <li key={m}>
                  <Link href="/memory" className="block hover:opacity-80">
                    <span className="block text-[14px] text-white">{d?.label ?? m}</span>
                    <span className="block text-[12.5px] text-fg-3">{d?.summary}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Recent output" className="lg:col-span-2">
          {outputs.length ? (
            <ul className="divide-y divide-white/[0.05]">
              {outputs.map(({ m, t }) => (
                <li key={`${m.id}-${t.id}`} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                  <span className="text-[14px] text-white">
                    {t.label} <span className="ml-2 text-[13px] tabular-nums text-fg-2">{t.output}</span>
                  </span>
                  <Link href={`/jobs/${m.id}`} className="text-[12px] text-fg-3 hover:text-white">
                    Mission {missionCode(m.number)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-fg-3">No output yet.</p>
          )}
        </Panel>

        <Panel title="Connected tools">
          <ul className="space-y-2.5">
            {agent.tools.map((t) => {
              const i = getIntegration(t);
              const on = connections[t];
              return (
                <li key={t} className="flex items-center justify-between text-[13.5px]">
                  <span className="flex items-center gap-2.5 text-fg-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-[6px] text-[12px] tabular-nums hairline">{i?.mono}</span>
                    {i?.name ?? t}
                  </span>
                  <span className="text-[12px] text-fg-3">{on ? "Connected" : i ? integrationStatusLabel[i.status] : ""}</span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Permissions" className="lg:col-span-3" action={<span className="text-[12px] tabular-nums text-fg-4">Workspace policy · applies to all intelligences</span>}>
          <ul className="grid gap-x-10 md:grid-cols-2">
            {permissions.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 border-b border-white/[0.04] py-3">
                <span className="text-[13.5px] text-fg-1">{p.action}</span>
                <PermissionSwitch value={p.level} onChange={(l) => workspace.setPermission(p.id, l)} label={p.action} />
              </li>
            ))}
          </ul>
        </Panel>

        <section ref={threadRef} className="panel p-5 lg:col-span-3" aria-label={`Message ${agent.name}`}>
          <h2 className="label">Direct line · {agent.name}</h2>
          <div className="mt-5 space-y-4">
            {thread.length === 0 && <p className="text-[14px] text-fg-3">Talk to {agent.name} directly. For new objectives, Command assembles the right team.</p>}
            {thread.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className={m.author === "user" ? "flex justify-end" : ""}>
                {m.author === "user" ? (
                  <div className="max-w-[75%] rounded-[14px] bg-white/[0.07] px-4 py-2.5 text-[14px] text-white">{m.text}</div>
                ) : (
                  <div className="max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <ActorTag actor={m.author} />
                      <span className="text-[12px] tabular-nums text-fg-4">{clockTime(m.at)}</span>
                    </div>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-fg-1">{m.text}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          <div className="mt-6">
            <CommandConsole
              ref={consoleRef}
              id={`msg-${agent.id}`}
              size="compact"
              label={`Message ${agent.name}`}
              hint="Direct message"
              value={msg}
              onChange={setMsg}
              onSubmit={(t) => {
                workspace.messageAgent(agent.id, t);
                setMsg("");
              }}
              examples={[`Have ${agent.name} take a look at…`, `What are you working on?`]}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
