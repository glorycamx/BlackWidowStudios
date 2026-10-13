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
import { describeTrigger } from "@/data/routines";
import { EASE } from "@/lib/motion";
import { clockTime, missionCode } from "@/lib/utils";
import type { ChatAction, ChatMessage } from "@/types";

interface Props {
  messages: ChatMessage[];
  thinking: boolean;
  onReviewPlan(planId: string): void;
  onNewMission(): void;
}

/** The conversation with Manager. */
export function CommandThread({ messages, thinking, onReviewPlan, onNewMission }: Props) {
  return (
    <ol className="space-y-8" aria-label="Conversation" aria-live="polite">
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
            <AgentGlyph agent={agentOrFallback("manager")} size={26} />
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-1 w-1 rounded-full bg-[#8f9cff]" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
              ))}
            </span>
            <span className="text-[14px] text-fg-3">Setting it up…</span>
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
        <div className="rounded-[22px] bg-white/[0.07] px-4 py-2.5 text-[16px] leading-relaxed text-white">{m.text}</div>
      </div>
    </div>
  );
}

function Z80Message({ m, onReviewPlan, onNewMission }: { m: ChatMessage; onReviewPlan(id: string): void; onNewMission(): void }) {
  return (
    <div className="flex gap-3.5">
      <AgentGlyph agent={agentOrFallback("manager")} size={28} className="mt-0.5" />
      <div className="min-w-0 flex-1">
      <div className="whitespace-pre-line text-[16px] leading-[1.65] text-fg-1">{m.text}</div>
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
    const agent = confirm.kind === "confirm-routine" ? agentOrFallback(confirm.botId) : null;
    const name = confirm.kind === "confirm-bot" ? confirm.name : agent!.name;
    const what = confirm.kind === "confirm-bot" ? confirm.job : confirm.title;
    const href = confirm.done ? (confirm.kind === "confirm-bot" ? `/team/${confirm.done}` : `/team/${agent!.slug}`) : null;
    return (
      <div className="mt-4 rounded-[20px] bg-[var(--surface-raised)] p-4 ring-1 ring-[var(--color-line-2)]">
        <div className="flex items-start gap-3">
          {agent ? <AgentGlyph agent={agent} size={36} /> : <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-[var(--color-line-3)] text-fg-2">+</span>}
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-white">{confirm.kind === "confirm-bot" ? `New agent: ${name}` : name}</div>
            <div className="mt-0.5 text-[15px] leading-snug text-fg-1">{what}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px] text-fg-3">
              <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-fg-2">{describeTrigger(confirm.trigger)}</span>
              <span>Asks you before sending anything</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {href ? (
            <Link href={href} className="inline-flex h-9 items-center gap-2 rounded-full bg-white/[0.07] px-4 text-[14px] text-white hover:bg-white/[0.1]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5fd39a]" />
              Deployed. Open {name} <ArrowUpRight size={13} />
            </Link>
          ) : (
            <button onClick={() => workspace.confirmChatAction(messageId)} className="inline-flex h-9 items-center rounded-full bg-white px-5 text-[14px] font-medium text-black hover:opacity-85">
              Deploy
            </button>
          )}
        </div>
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
                Deploy
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
