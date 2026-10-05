"use client";

import { jobLabel } from "@/lib/copy";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Network, Rows3, TriangleAlert, Zap } from "lucide-react";
import { ActivityFeed } from "@/components/app/ActivityFeed";
import { ApprovalCard } from "@/components/app/ApprovalCard";
import { AgentStack, EmptyState, MissionStatusBadge, Panel, ProgressBar } from "@/components/app/primitives";
import { MissionResults } from "@/components/missions/MissionResults";
import { MissionTimeline } from "@/components/missions/MissionTimeline";
import { MissionTopology } from "@/components/missions/MissionTopology";
import { Button } from "@/components/ui/Button";
import { agentOrFallback } from "@/data/bots";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useWorkspace, workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { cn, missionCode } from "@/lib/utils";

export function MissionView({ id }: { id: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const entering = params.get("deployed") === "1";
  const mission = useWorkspace((s) => s.missions[id]);
  const activity = useWorkspace((s) => s.activity);
  const approvals = useWorkspace((s) => s.approvals);
  const wide = useMediaQuery("(min-width: 900px)", true);
  const [view, setView] = useState<"topology" | "timeline">("topology");
  const [flash, setFlash] = useState(entering);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 900);
    router.replace(`/jobs/${id}`);
    return () => clearTimeout(t);
  }, [flash, id, router]);

  useEffect(() => {
    if (window.location.hash === "#results") {
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 400);
    }
  }, []);

  if (!mission) {
    return (
      <EmptyState title="Job not found" body="It may have been cleared from this demo workspace." action={{ label: "Start a job", href: "/chat?focus=1" }} />
    );
  }

  const events = activity.filter((e) => e.missionId === id);
  const pending = mission.approvals.map((a) => approvals[a]).filter((a) => a && a.status === "pending");
  const resolved = mission.approvals.map((a) => approvals[a]).filter((a) => a && a.status !== "pending");
  const showTopology = wide && view === "topology";
  const running = mission.status === "running" || mission.status === "awaiting-approval";

  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 py-8 md:px-10 md:py-10">
      <AnimatePresence>
        {flash && (
          <motion.div className="pointer-events-none fixed inset-0 z-[60] bg-black" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: EASE }} />
        )}
      </AnimatePresence>

      <Link href="/jobs" className="label inline-flex items-center gap-2 text-fg-3 hover:text-white">
        <ArrowLeft size={12} /> Jobs
      </Link>

      {/* Header */}
      <header className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-4">
            <span className="label text-fg-1">{jobLabel(mission.number)}</span>
            <MissionStatusBadge status={mission.status} />
          </div>
          <h1 className="mt-4 max-w-[22ch] text-[clamp(30px,4vw,52px)] font-semibold leading-[1] tracking-[-0.045em] text-white">{mission.title}</h1>
          <p className="mt-4 max-w-[640px] text-[14.5px] leading-relaxed text-fg-3">“{mission.objective}”</p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="label mb-2.5 text-[9.5px]">Team</div>
            <div className="flex items-center gap-3">
              <AgentStack ids={mission.agents.map((a) => a.agentId)} size={26} />
              <span className="text-[13px] text-fg-2">{mission.agents.map((a) => agentOrFallback(a.agentId).name).join(", ")}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-line py-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-4">
          <ProgressBar value={mission.progress} status={mission.status} className="max-w-[360px] flex-1" />
          <span className="text-[13px] tabular-nums text-fg-1">{Math.round(mission.progress * 100)}%</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {running && (
            <div role="radiogroup" aria-label="Simulation speed" className="flex rounded-[9px] p-[3px] hairline">
              {[1, 4].map((sp) => (
                <button
                  key={sp}
                  role="radio"
                  aria-checked={mission.speed === sp}
                  onClick={() => workspace.setMissionSpeed(mission.id, sp)}
                  className={cn("flex h-7 items-center gap-1 rounded-[7px] px-2.5 text-[12px] tabular-nums", mission.speed === sp ? "bg-white/[0.08] text-white" : "text-fg-3 hover:text-fg-1")}
                >
                  {sp === 4 && <Zap size={11} />}
                  {sp}×
                </button>
              ))}
            </div>
          )}
          {wide && (
            <div role="radiogroup" aria-label="View" className="flex rounded-[9px] p-[3px] hairline">
              {(["topology", "timeline"] as const).map((v) => (
                <button
                  key={v}
                  role="radio"
                  aria-checked={view === v}
                  onClick={() => setView(v)}
                  className={cn("flex h-7 items-center gap-1.5 rounded-[7px] px-2.5 text-[12px]", view === v ? "bg-white/[0.08] text-white" : "text-fg-3 hover:text-fg-1")}
                >
                  {v === "topology" ? <Network size={12} /> : <Rows3 size={12} />}
                  {v}
                </button>
              ))}
            </div>
          )}
          {mission.status === "running" && (
            <button onClick={() => workspace.interrupt(mission.id)} className="h-8 rounded-[9px] px-3 text-[12px] text-fg-4 hover:text-fg-2" title="Demo control">
              Simulate interruption
            </button>
          )}
        </div>
      </div>

      {/* Interrupted */}
      <AnimatePresence>
        {mission.status === "interrupted" && mission.interruption && (
          <motion.div
            className="mt-6 flex flex-col gap-4 rounded-[14px] p-5 md:flex-row md:items-center md:justify-between"
            style={{ background: "rgba(255,92,122,0.06)", boxShadow: "inset 0 0 0 1px rgba(255,92,122,0.3)" }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <TriangleAlert size={18} className="mt-0.5 text-err" />
              <div>
                <div className="label text-err">Job interrupted</div>
                <p className="mt-2 text-[15px] text-white">
                  {agentOrFallback(mission.interruption.agentId).name} {mission.interruption.message}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="solid" size="sm" magnetic={false} onClick={() => workspace.recover(mission.id, "reconnect")}>
                Reconnect
              </Button>
              <Button variant="secondary" size="sm" onClick={() => workspace.recover(mission.id, "continue")}>
                Continue without Drive
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion */}
      <AnimatePresence>
        {mission.status === "complete" && mission.results && (
          <motion.div
            className="relative mt-6 overflow-hidden rounded-[16px] p-6 md:p-8"
            style={{ background: "linear-gradient(120deg, rgba(69,108,255,0.08), rgba(181,66,255,0.05))", boxShadow: "inset 0 0 0 1px var(--color-line-2)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="label flex items-center gap-2 text-white">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-white" />
                <span className="absolute inset-0 rounded-full bg-white motion-safe:animate-ping-once" />
              </span>
              Complete
            </div>
            <p className="mt-4 text-[clamp(22px,2.6vw,32px)] font-medium leading-[1.15] tracking-[-0.03em] text-white">
              {mission.results.headline}
              <br />
              <span className="text-fg-2">{mission.results.summary}</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="solid" magnetic={false} onClick={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" })}>
                View results
              </Button>
              <Button variant="secondary" href="/chat?focus=1">
                Start another mission
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body */}
      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          {pending.length > 0 && (
            <div className="mb-8 space-y-3">
              {pending.map((a) => a && <ApprovalCard key={a.id} approvalId={a.id} showMission={false} />)}
            </div>
          )}
          <div className="panel p-4 md:p-6">{showTopology ? <MissionTopology mission={mission} entering={entering} /> : <MissionTimeline mission={mission} />}</div>
        </div>

        <aside className="space-y-6">
          <Panel title="Execution" action={running && <span className="text-[12px] tabular-nums text-fg-4">live</span>}>
            <div className="max-h-[560px] overflow-y-auto pr-1">
              <ActivityFeed events={events} showMission={false} dense />
            </div>
          </Panel>
          {resolved.length > 0 && (
            <Panel title="Decisions">
              <div className="space-y-3">{resolved.map((a) => a && <ApprovalCard key={a.id} approvalId={a.id} compact showMission={false} />)}</div>
            </Panel>
          )}
        </aside>
      </div>

      {mission.results && (
        <div className="mt-14">
          <MissionResults results={mission.results} missionNumber={mission.number} />
        </div>
      )}
    </div>
  );
}
