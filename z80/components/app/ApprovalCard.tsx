"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { ActorTag } from "@/components/app/primitives";
import { Button } from "@/components/ui/Button";
import { agentOrFallback } from "@/data/agents";
import { generateResults } from "@/lib/services/resultsService";
import { useWorkspace, workspace } from "@/lib/store/workspace";
import { useNow } from "@/lib/hooks/useNow";
import { EASE } from "@/lib/motion";
import { cn, missionCode, relativeTime } from "@/lib/utils";

/**
 * A human checkpoint. Review approvals expand to show what will go out;
 * access approvals are a plain allow / deny.
 */
export function ApprovalCard({ approvalId, compact, showMission = true }: { approvalId: string; compact?: boolean; showMission?: boolean }) {
  const approval = useWorkspace((s) => s.approvals[approvalId]);
  const mission = useWorkspace((s) => (approval ? s.missions[approval.missionId] : undefined));
  const [open, setOpen] = useState(false);
  const now = useNow(30000);
  if (!approval) return null;
  const agent = agentOrFallback(approval.agentId);
  const pending = approval.status === "pending";
  const preview = open && mission ? generateResults({ ...mission, outreachHeld: false }) : null;

  return (
    <motion.div
      layout
      className={cn("relative overflow-hidden rounded-[14px]", compact ? "p-4" : "p-5")}
      style={{
        background: pending ? "linear-gradient(180deg, rgba(215,123,255,0.06), rgba(215,123,255,0.015))" : "rgba(255,255,255,0.015)",
        boxShadow: pending ? "inset 0 0 0 1px rgba(215,123,255,0.28)" : "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start gap-3.5">
        <AgentGlyph agent={agent} size={compact ? 30 : 36} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ActorTag actor={approval.agentId} />
            <span className="text-[12px] tabular-nums text-fg-3">{relativeTime(approval.createdAt, now)}</span>
          </div>
          <p className={cn("mt-2 text-white", compact ? "text-[14px]" : "text-[15.5px]")}>{approval.title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-fg-2">{approval.detail}</p>
          {showMission && mission && (
            <Link href={`/missions/${mission.id}`} className="mt-2 inline-block text-[12px] text-fg-3 hover:text-fg-1">
              Mission {missionCode(mission.number)} · {mission.title}
            </Link>
          )}

          <AnimatePresence initial={false}>
            {preview && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                <div className="mt-4 space-y-2 border-t border-line pt-4">
                  <div className="label">Preview · simulated</div>
                  {preview.prospects?.slice(0, 3).map((p) => (
                    <div key={p.id} className="rounded-[10px] bg-white/[0.025] p-3">
                      <div className="flex justify-between text-[12.5px]">
                        <span className="text-white">{p.company}</span>
                        <span className="text-fg-3">{p.owner}</span>
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-fg-2">“{p.opener}”</p>
                    </div>
                  ))}
                  {preview.concepts?.map((c) => (
                    <div key={c.id} className="rounded-[10px] bg-white/[0.025] p-3">
                      <div className="text-[12.5px] text-white">{c.name}</div>
                      <p className="mt-1 text-[12.5px] text-fg-2">{c.hook}</p>
                    </div>
                  ))}
                  {preview.prospects && preview.prospects.length > 3 && <p className="text-[12px] tabular-nums text-fg-3">+ {preview.prospects.length - 3} more</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {pending ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {approval.kind === "review" ? (
                <>
                  <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
                    {open ? "Hide" : "Review"}
                  </Button>
                  <Button variant="solid" size="sm" magnetic={false} icon={<Check size={13} />} onClick={() => workspace.resolveApproval(approval.id, "approved")}>
                    Approve
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => workspace.resolveApproval(approval.id, "denied")}>
                    Hold
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="solid" size="sm" magnetic={false} icon={<Check size={13} />} onClick={() => workspace.resolveApproval(approval.id, "approved")}>
                    Allow
                  </Button>
                  <Button variant="secondary" size="sm" icon={<X size={13} />} onClick={() => workspace.resolveApproval(approval.id, "denied")}>
                    Deny
                  </Button>
                </>
              )}
            </div>
          ) : (
            <p className="label mt-4 flex items-center gap-2 text-[10px]">
              {approval.status === "approved" ? <Check size={12} className="text-white" /> : <X size={12} />}
              {approval.status === "approved" ? (approval.kind === "access" ? "Allowed" : "Approved") : approval.kind === "access" ? "Denied" : "Held"}
              {approval.resolvedAt && <span className="text-fg-4">· {relativeTime(approval.resolvedAt, now)}</span>}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
