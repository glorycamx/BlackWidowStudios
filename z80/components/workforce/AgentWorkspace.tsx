"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MessageSquare, Pause, Pencil, Play } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { ActivityFeed } from "@/components/app/ActivityFeed";
import { ApprovalCard } from "@/components/app/ApprovalCard";
import { PermissionSwitch } from "@/components/app/PermissionSwitch";
import { ActorTag, EmptyState, Panel, ProgressBar } from "@/components/app/primitives";
import { CommandConsole, type CommandConsoleHandle } from "@/components/command/CommandConsole";
import { Button } from "@/components/ui/Button";
import { StatusDot } from "@/components/ui/StatusDot";
import { agentOrFallback } from "@/data/bots";
import { AddRoutine } from "@/components/bots/AddRoutine";
import { BotScreen } from "@/components/bots/BotScreen";
import { RoutineRow } from "@/components/bots/RoutineRow";
import { SkillsPanel } from "@/components/bots/SkillsPanel";
import { useBot } from "@/components/bots/useBot";
import { jobLabel } from "@/lib/copy";
import { useBeats } from "@/lib/sim/heartbeats";
import { formatAgo } from "@/lib/time";
import { getIntegration, integrationStatusLabel } from "@/data/integrations";
import { getMemoryDomain } from "@/data/memory";
import { agentStateLabel, getAgentLiveState } from "@/lib/services/agentService";
import { selectMissions, useWorkspace, workspace } from "@/lib/store/workspace";
import { useNow } from "@/lib/hooks/useNow";
import { EASE } from "@/lib/motion";
import { clockTime, cn } from "@/lib/utils";
import { tint } from "@/lib/tint";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "skills", label: "Skills and knowledge" },
  { id: "settings", label: "Apps and permissions" },
  { id: "message", label: "Message" },
] as const;

/** A bot's page: watch it work, its routines, what it found, what it knows. */
export function AgentWorkspace({ slug }: { slug: string }) {
  const { bot: agent, ready } = useBot(slug);
  const params = useSearchParams();
  const missions = useWorkspace(selectMissions);
  const approvals = useWorkspace((s) => s.approvals);
  const activity = useWorkspace((s) => s.activity);
  const paused = useWorkspace((s) => s.pausedAgents);
  const permissions = useWorkspace((s) => s.permissions);
  const connections = useWorkspace((s) => s.connections);
  const thread = useWorkspace((s) => (agent ? s.threads[agent.id] ?? [] : []));
  const routines = useWorkspace((s) => (agent ? s.routines.filter((r) => r.botId === agent.id) : []));
  const finds = useWorkspace((s) => (agent ? s.feed.filter((f) => f.botId === agent.id && !f.dismissed).slice(0, 6) : []));
  const nickname = useWorkspace((s) => (agent ? s.nicknames[agent.id] : undefined));
  const checks = useBeats((b) => (agent ? b.botChecks[agent.id] ?? 0 : 0));
  const [msg, setMsg] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>(params.get("message") ? "message" : "overview");
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
    if (!ready) return <div className="min-h-[60vh]" />;
    return <EmptyState title={agent ? `${agent.name} is coming soon` : "No bot by that name"} body={agent ? agent.shortDescription : "It may have been removed."} action={{ label: "Your team", href: "/team" }} />;
  }

  const st = getAgentLiveState(agent.id, missions, Object.values(approvals), activity, paused, now)!;
  const events = activity.filter((e) => e.actor === agent.id || e.to === agent.id);
  const current = st.activeMissions[0];
  const currentTask = current?.tasks.find((t) => t.agentId === agent.id && (t.status === "running" || t.status === "blocked"));
  const isPaused = paused.includes(agent.id);
  const color = isPaused ? "#686872" : agent.accent.hex;
  const display = nickname ?? agent.name;
  const today = finds.filter((f) => f.at > now - 24 * 3600e3).length;

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-10 md:py-10">
      <Link href="/team" className="label inline-flex items-center gap-2 text-fg-3 hover:text-white">
        <ArrowLeft size={12} /> Your team
      </Link>

      <header className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div aria-hidden className="absolute -inset-6 rounded-full blur-2xl" style={{ background: `radial-gradient(circle, rgba(${agent.accent.rgb} / 0.35), transparent 70%)` }} />
            <AgentGlyph agent={agent} size={96} className="relative" muted={isPaused} />
          </div>
          <div className="min-w-0">
            {renaming ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = new FormData(e.currentTarget).get("nick");
                  workspace.renameBot(agent.id, String(v ?? ""));
                  setRenaming(false);
                }}
                className="flex items-center gap-2"
              >
                <input name="nick" defaultValue={nickname ?? ""} placeholder={agent.name} autoFocus aria-label="Nickname" maxLength={24} className="w-[220px] rounded-[10px] bg-white/[0.05] px-3 py-2 text-[22px] text-white hairline focus:outline-none" />
                <button type="submit" className="h-9 rounded-full bg-white px-4 text-[13px] font-medium text-black">Save</button>
                <button type="button" onClick={() => setRenaming(false)} className="h-9 px-2 text-[13px] text-fg-3">Cancel</button>
              </form>
            ) : (
              <h1 className="flex items-center gap-3 text-[clamp(40px,5vw,64px)] font-semibold leading-[0.95] tracking-[-0.03em] text-white">
                {display}
                <button onClick={() => setRenaming(true)} aria-label={`Rename ${display}`} className="flex h-8 w-8 items-center justify-center rounded-full text-fg-4 hover:bg-white/[0.06] hover:text-white">
                  <Pencil size={14} />
                </button>
              </h1>
            )}
            {nickname && <div className="mt-1 text-[13px] text-fg-4">{agent.name}</div>}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="text-[15px] text-fg-2">{agent.role}</span>
              <span className="flex items-center gap-2 text-[13px]" style={{ color: isPaused ? undefined : tint(agent.accent) }}>
                <StatusDot color={color} size={5} live={!isPaused} />
                {isPaused ? "Paused" : "On shift"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<MessageSquare size={14} />}
            onClick={() => {
              setTab("message");
              setTimeout(() => consoleRef.current?.focus(), 200);
            }}
          >
            Message
          </Button>
          <Button variant={isPaused ? "solid" : "secondary"} magnetic={false} icon={isPaused ? <Play size={14} /> : <Pause size={14} />} onClick={() => workspace.togglePauseAgent(agent.id)}>
            {isPaused ? "Back on shift" : "Pause"}
          </Button>
        </div>
      </header>

      <AnimatePresence>
        {isPaused && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 text-[13.5px] text-fg-2" role="status">
            {display} is paused. Its routines stop until you bring it back.
          </motion.p>
        )}
      </AnimatePresence>

      <div role="tablist" aria-label={`${display} sections`} className="no-scrollbar -mx-5 mt-10 flex gap-1 overflow-x-auto px-5 md:mx-0 md:px-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn("h-9 shrink-0 rounded-full px-4 text-[14px] transition-colors", tab === t.id ? "bg-white text-black" : "text-fg-2 hover:bg-white/[0.05] hover:text-fg-1")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2" aria-label="Watch it work">
          <h2 className="label mb-3">Watch it work</h2>
          <BotScreen bot={agent} paused={isPaused} />
        </section>

        <Panel title="Today">
          <dl className="grid grid-cols-2 gap-5">
            <div>
              <dt className="text-[12px] text-fg-3">Checks</dt>
              <dd className="mt-1 text-[28px] font-medium tabular-nums text-white">{checks.toLocaleString("en-US")}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-fg-3">Found</dt>
              <dd className="mt-1 text-[28px] font-medium tabular-nums text-white">{today}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-fg-3">Routines on</dt>
              <dd className="mt-1 text-[28px] font-medium tabular-nums text-white">{routines.filter((r) => r.status === "on").length}</dd>
            </div>
            <div>
              <dt className="text-[12px] text-fg-3">Waiting on you</dt>
              <dd className="mt-1 text-[28px] font-medium tabular-nums text-white">{st.pendingApprovals.length}</dd>
            </div>
          </dl>
          {current && (
            <div className="mt-6 border-t border-white/[0.06] pt-5">
              <Link href={`/jobs/${current.id}`} className="text-[12px] text-fg-3 hover:text-white">
                {jobLabel(current.number)}
              </Link>
              <div className="mt-1 text-[15px] text-white">{current.title}</div>
              <ProgressBar value={current.progress} status={current.status} className="mt-3" />
              <div className="mt-2 text-[13px] text-fg-2">{currentTask ? currentTask.label : st.doing}</div>
            </div>
          )}
          {st.pendingApprovals.length > 0 && (
            <div className="mt-5 space-y-3">
              {st.pendingApprovals.map((a) => (
                <ApprovalCard key={a.id} approvalId={a.id} compact />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Routines" className="lg:col-span-2" action={<Link href="/routines" className="text-[12px] text-fg-3 hover:text-white">All routines →</Link>}>
          {routines.length ? (
            <ul className="-mt-2 divide-y divide-white/[0.05]">
              {routines.map((r) => (
                <RoutineRow key={r.id} routine={r} />
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-fg-3">No routines yet.</p>
          )}
          <div className="mt-5">
            <AddRoutine botId={agent.id} placeholder={`What should ${display} keep doing?`} />
          </div>
        </Panel>

        <Panel title="Recent finds">
          {finds.length ? (
            <ul className="space-y-4">
              {finds.map((f) => (
                <li key={f.id}>
                  <Link href={`/live?id=${f.id}`} className="block hover:opacity-80">
                    <span className="block text-[12px] text-fg-3">{f.trigger} · {formatAgo(f.at, now)}</span>
                    <span className="mt-0.5 block truncate text-[14px] text-white">{f.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-fg-3">Nothing yet. It keeps checking.</p>
          )}
        </Panel>

      </div>
      )}

      {tab === "skills" && (
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <SkillsPanel botId={agent.id} name={display} className="lg:col-span-2" />

        <Panel title="Works with">
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

        <Panel title="What it knows">
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

      </div>
      )}

      {tab === "settings" && (
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Apps" className="lg:col-span-2">
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

        <Panel title="Recent activity" className="lg:col-span-1" action={<Link href="/activity" className="text-[12px] text-fg-3 hover:text-white">All activity →</Link>}>
          <ActivityFeed events={events} limit={8} dense />
        </Panel>

        <Panel title="Permissions" className="lg:col-span-3" action={<span className="text-[12px] tabular-nums text-fg-4">Applies to every bot</span>}>
          <ul className="grid gap-x-10 md:grid-cols-2">
            {permissions.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 border-b border-white/[0.04] py-3">
                <span className="text-[13.5px] text-fg-1">{p.action}</span>
                <PermissionSwitch value={p.level} onChange={(l) => workspace.setPermission(p.id, l)} label={p.action} />
              </li>
            ))}
          </ul>
        </Panel>

      </div>
      )}

      {tab === "message" && (
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section ref={threadRef} className="panel p-5 lg:col-span-3" aria-label={`Message ${display}`}>
          <h2 className="label">Direct line · {display}</h2>
          <div className="mt-5 space-y-4">
            {thread.length === 0 && <p className="text-[14px] text-fg-3">Talk to {display} directly. For bigger requests, Chat with Manager.</p>}
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
              label={`Message ${display}`}
              hint="Direct message"
              value={msg}
              onChange={setMsg}
              onSubmit={(t) => {
                workspace.messageAgent(agent.id, t);
                setMsg("");
              }}
              examples={[`What are you working on?`, `What did you find overnight?`]}
            />
          </div>
        </section>
      </div>
      )}
    </div>
  );
}
