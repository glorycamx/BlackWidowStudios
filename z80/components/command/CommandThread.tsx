"use client";

import Link from "next/link";
import { jobLabel } from "@/lib/copy";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { ApprovalCard } from "@/components/app/ApprovalCard";
import { ActorTag } from "@/components/app/primitives";
import { Button } from "@/components/ui/Button";
import { agentOrFallback } from "@/data/bots";
import { useWorkspace, workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { clockTime, missionCode } from "@/lib/utils";
import type { ChatAction, ChatMessage } from "@/types";

interface Props {
  messages: ChatMessage[];
  thinking: boolean;
  onReviewPlan(planId: string): void;
  onNewMission(): void;
}

/** One chat. Multiple intelligences. */
export function CommandThread({ messages, thinking, onReviewPlan, onNewMission }: Props) {
  return (
    <ol className="space-y-7" aria-label="Command conversation" aria-live="polite">
      <AnimatePresence initial={false}>
        {messages.map((m) => (
          <motion.li key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
            {m.author === "user" ? (
              <UserMessage m={m} />
            ) : m.author === "z80" || m.author === "manager" ? (
              <Z80Message m={m} onReviewPlan={onReviewPlan} onNewMission={onNewMission} />
            ) : (
              <AgentMessage m={m} onReviewPlan={onReviewPlan} onNewMission={onNewMission} />
            )}
          </motion.li>
        ))}
        {thinking && (
          <motion.li key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3" role="status">
            <span className="label text-fg-1">Z80</span>
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-1 w-1 rounded-full bg-[#8f9cff]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
              ))}
            </span>
            <span className="text-[13px] text-fg-3">Z80 is assembling context…</span>
          </motion.li>
        )}
      </AnimatePresence>
    </ol>
  );
}

function UserMessage({ m }: { m: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] md:max-w-[75%]">
        <div className="rounded-[16px] rounded-br-[6px] bg-white/[0.07] px-4 py-3 text-[15px] leading-relaxed text-white">{m.text}</div>
        <div className="mt-1.5 text-right text-[12px] tabular-nums text-fg-4">{clockTime(m.at)}</div>
      </div>
    </div>
  );
}

function Z80Message({ m, onReviewPlan, onNewMission }: { m: ChatMessage; onReviewPlan(id: string): void; onNewMission(): void }) {
  return (
    <div className="max-w-[92%] md:max-w-[85%]">
      <div className="flex items-center gap-2.5">
        <AgentGlyph agent={agentOrFallback("manager")} size={22} />
        <span className="text-[13px] font-medium text-fg-1">Manager</span>
        <span className="text-[12px] tabular-nums text-fg-4">{clockTime(m.at)}</span>
      </div>
      <div className="mt-3 whitespace-pre-line text-[15px] leading-[1.65] text-fg-1">{m.text}</div>
      {m.team && m.team.length > 0 && (
        <ul className="mt-5 space-y-3 border-l border-line pl-4">
          {m.team.map((id) => {
            const a = agentOrFallback(id);
            return (
              <li key={id} className="flex items-center gap-3">
                <AgentGlyph agent={a} size={30} />
                <span>
                  <span className="block text-[12.5px] font-semibold text-white">{a.name}</span>
                  <span className="block text-[12.5px] text-fg-3">{a.domain}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <Actions messageId={m.id} actions={m.actions} onReviewPlan={onReviewPlan} onNewMission={onNewMission} />
    </div>
  );
}

function AgentMessage({ m, onReviewPlan, onNewMission }: { m: ChatMessage; onReviewPlan(id: string): void; onNewMission(): void }) {
  const a = agentOrFallback(m.author as string);
  const hasApproval = m.actions?.some((x) => x.kind === "approval");
  return (
    <div className="flex max-w-[92%] gap-3 md:max-w-[85%]">
      <AgentGlyph agent={a} size={30} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <ActorTag actor={a.id} />
          {m.to && (
            <>
              <span className="text-[10px] text-fg-4">→</span>
              <ActorTag actor={m.to} />
            </>
          )}
          <span className="text-[12px] tabular-nums text-fg-4">{clockTime(m.at)}</span>
        </div>
        {!hasApproval && <p className="mt-1.5 text-[15px] leading-relaxed text-fg-1">{m.text}</p>}
        <Actions messageId={m.id} actions={m.actions} onReviewPlan={onReviewPlan} onNewMission={onNewMission} />
      </div>
    </div>
  );
}

function Actions({ messageId, actions, onReviewPlan, onNewMission }: { messageId: string; actions?: ChatAction[]; onReviewPlan(id: string): void; onNewMission(): void }) {
  const router = useRouter();
  const confirm = actions?.find((a) => a.kind === "confirm-routine" || a.kind === "confirm-bot");
  const deployed = useWorkspace((s) => s.deployedPlans);
  const missions = useWorkspace((s) => s.missions);
  if (!actions?.length) return null;

  const approval = actions.find((a) => a.kind === "approval");
  if (approval && approval.kind === "approval") {
    return (
      <div className="mt-3">
        <ApprovalCard approvalId={approval.approvalId} compact />
      </div>
    );
  }

  if (confirm && (confirm.kind === "confirm-routine" || confirm.kind === "confirm-bot")) {
    if (confirm.done) {
      const href = confirm.kind === "confirm-bot" ? `/team/${confirm.done}` : "/routines";
      return (
        <Link href={href} className="mt-5 inline-flex items-center gap-2 text-[13px] text-fg-2 hover:text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-run" />
          {confirm.kind === "confirm-bot" ? `${confirm.name} is on shift` : "Running now"} <ArrowUpRight size={12} />
        </Link>
      );
    }
    return (
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="primary" size="sm" onClick={() => workspace.confirmChatAction(messageId)}>
          {confirm.kind === "confirm-bot" ? "Create and start" : "Start it"}
        </Button>
      </div>
    );
  }

  const planAction = actions.find((a) => a.kind === "deploy-plan");
  const deployedMission = planAction && planAction.kind === "deploy-plan" ? deployed[planAction.planId] : undefined;
  if (deployedMission) {
    const mm = missions[deployedMission];
    return (
      <Link href={`/jobs/${deployedMission}`} className="mt-5 inline-flex items-center gap-2 text-[12px] text-fg-2 hover:text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-run" />
        Running · {mm ? jobLabel(mm.number) : "Job"} <ArrowUpRight size={12} />
      </Link>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {actions.map((a, i) => {
        switch (a.kind) {
          case "review-plan":
            return (
              <Button key={i} variant="secondary" size="sm" onClick={() => onReviewPlan(a.planId)}>
                Review plan
              </Button>
            );
          case "deploy-plan":
            return (
              <Button key={i} variant="primary" size="sm" data-deploy onClick={() => workspace.deploy(a.planId)}>
                Put them to work
              </Button>
            );
          case "open-mission":
            return (
              <Button key={i} variant="secondary" size="sm" href={`/jobs/${a.missionId}`} iconRight={<ArrowUpRight size={12} />}>
                Open job
              </Button>
            );
          case "view-results":
            return (
              <Button key={i} variant="solid" size="sm" magnetic={false} onClick={() => router.push(`/jobs/${a.missionId}#results`)}>
                View results
              </Button>
            );
          case "open-signal":
            return (
              <Button key={i} variant="secondary" size="sm" href={`/live?id=${a.signalId}`} iconRight={<ArrowUpRight size={12} />}>
                Open lead
              </Button>
            );
          case "new-mission":
            return (
              <Button key={i} variant="secondary" size="sm" onClick={onNewMission}>
                Start another job
              </Button>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
