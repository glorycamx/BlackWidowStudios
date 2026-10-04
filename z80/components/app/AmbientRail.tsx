"use client";

import Link from "next/link";
import { ApprovalCard } from "@/components/app/ApprovalCard";
import { StatusDot } from "@/components/ui/StatusDot";
import { KindChip } from "@/components/signals/SignalParts";
import { availableAgents } from "@/data/agents";
import { getAgentLiveState } from "@/lib/services/agentService";
import { selectMissions, selectPendingApprovals, selectVisibleSignals, useWorkspace } from "@/lib/store/workspace";
import { relativeTime } from "@/lib/utils";
import { useNow } from "@/lib/hooks/useNow";

/** Calm ambient status: who is working, what happened today. */
export function AmbientRail() {
  const missions = useWorkspace(selectMissions);
  const approvals = useWorkspace((s) => s.approvals);
  const activity = useWorkspace((s) => s.activity);
  const paused = useWorkspace((s) => s.pausedAgents);
  const pending = useWorkspace(selectPendingApprovals);
  const signals = useWorkspace(selectVisibleSignals);
  const now = useNow(30000);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  const completedToday = missions.filter((m) => m.status === "complete" && (m.completedAt ?? 0) >= t0).length;
  const tasksToday = activity.filter((e) => e.at >= t0 && (e.kind === "action" || e.kind === "result")).length;
  const allApprovals = Object.values(approvals);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="label text-[10px]">Active intelligences</h2>
        <ul className="mt-5 space-y-5">
          {availableAgents.map((a) => {
            const st = getAgentLiveState(a.id, missions, allApprovals, activity, paused, now);
            if (!st) return null;
            const color = st.state === "waiting" ? "var(--color-attn)" : st.state === "idle" || st.state === "paused" ? "#686872" : a.accent.hex;
            return (
              <li key={a.id}>
                <Link href={`/workforce/${a.slug}`} className="group flex items-start gap-3">
                  <StatusDot color={color} size={6} live={st.state === "working" || st.state === "active" || st.state === "waiting"} className="mt-1.5" />
                  <span className="min-w-0">
                    <span className="block text-[12px] font-semibold uppercase tracking-[0.14em] text-white group-hover:text-fg-1">{a.name}</span>
                    <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-fg-3">{st.doing}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="label text-[10px]">Live signals</h2>
          <Link href="/signals" className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-3 hover:text-white">
            All →
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {signals.slice(0, 4).map((s) => (
            <li key={s.id}>
              <Link href={`/signals?id=${s.id}`} className="block rounded-[10px] p-2.5 transition-colors hover:bg-white/[0.03]" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
                <div className="flex items-center justify-between gap-2">
                  <KindChip signal={s} />
                  <span className="font-mono text-[9.5px] text-fg-4">{relativeTime(s.at, now)}</span>
                </div>
                <div className="mt-1.5 truncate text-[13px] text-white">{s.title}</div>
                <div className="truncate text-[11.5px] text-fg-3">{s.trigger}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="label text-[10px]">Today</h2>
        <dl className="mt-4 space-y-3 text-[13.5px]">
          <Row k="Missions completed" v={completedToday} />
          <Row k="Tasks executed" v={tasksToday} />
          <Row k="Approvals waiting" v={pending.length} highlight={pending.length > 0} />
        </dl>
      </section>

      {pending.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="label text-[10px]">Needs you</h2>
            <Link href="/approvals" className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-3 hover:text-white">
              All →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {pending.slice(0, 2).map((a) => (
              <ApprovalCard key={a.id} approvalId={a.id} compact showMission={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: number; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-fg-3">{k}</dt>
      <dd className={highlight ? "font-mono text-attn" : "font-mono text-fg-1"}>{v}</dd>
    </div>
  );
}
