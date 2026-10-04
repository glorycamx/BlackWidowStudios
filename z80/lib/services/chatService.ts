/**
 * chatService — Z80's conversational layer (MOCK).
 *
 * Classifies a message and produces Z80's reply. Objectives become plans.
 * A model-backed implementation replaces `respond` behind POST /api/chat.
 */
import { agentOrFallback, getAgent } from "@/data/agents";
import { createPlan } from "@/lib/services/planService";
import type { Approval, Mission, Organization, Plan } from "@/types";
import { plural } from "@/lib/utils";

export interface ChatContext {
  org?: Organization | null;
  missions: Mission[];
  approvals: Approval[];
}

export interface ChatReply {
  text: string;
  plan?: Plan;
}

const STATUS = /\b(status|what'?s (running|happening|going on)|update me|progress|how('?s| is| are) (it|things|the team|everything))\b/i;
const APPROVALS = /\b(approv|waiting on me|need(s)? me|pending)\b/i;
const HELP = /^(help|what can you do|how does this work|who are you)\??$/i;
const THANKS = /^(thanks|thank you|thx|great|perfect|nice|awesome|ok(ay)?|cool)[.! ]*$/i;
const GREET = /^(hi|hey|hello|yo|good (morning|afternoon|evening))[.! ]*$/i;

export function teamSentence(plan: Plan): string {
  return plan.agents
    .map((a) => {
      const agent = agentOrFallback(a.agentId);
      return `${agent.name}\n${agent.domain}`;
    })
    .join("\n\n");
}

export function respond(text: string, ctx: ChatContext): ChatReply {
  const t = text.trim();
  if (GREET.test(t)) return { text: "Ready when you are. Describe the outcome you need, and I'll assemble the team for it." };
  if (THANKS.test(t)) return { text: "Anytime. Your workforce keeps moving — I'll tell you when a decision needs you." };
  if (HELP.test(t)) {
    return {
      text: "Tell me what you want accomplished, in plain language. I break it into tasks, choose the intelligences to do the work, and coordinate them. Anything that leaves your company — emails, posts, spend — waits for your approval.",
    };
  }
  if (APPROVALS.test(t) && t.length < 60) {
    const pending = ctx.approvals.filter((a) => a.status === "pending");
    if (!pending.length) return { text: "Nothing is waiting on you right now." };
    return {
      text: `${plural(pending.length, "decision")} waiting on you:\n${pending
        .map((a) => `· ${getAgent(a.agentId)?.name ?? a.agentId}: ${a.title}`)
        .join("\n")}`,
    };
  }
  if (STATUS.test(t) && t.length < 80) {
    const running = ctx.missions.filter((m) => m.status === "running" || m.status === "awaiting-approval");
    if (!running.length) return { text: "Nothing is running. What should your workforce accomplish?" };
    return {
      text: running
        .map((m) => `Mission ${String(m.number).padStart(4, "0")} — ${m.title}: ${Math.round(m.progress * 100)}%${m.status === "awaiting-approval" ? ", waiting on your approval" : ""}.`)
        .join("\n"),
    };
  }
  if (t.split(/\s+/).length < 3) {
    return { text: "Tell me a little more about the outcome you want — who it's for and what done looks like." };
  }
  const plan = createPlan(t, ctx.org);
  const count = plan.agents.length;
  return {
    plan,
    text: `Understood. ${plan.reasoningSummary}\n\nI recommend ${count === 1 ? "one intelligence" : `${count} intelligences`} for this. Want me to deploy ${count === 1 ? "it" : "them"}?`,
  };
}

/** A direct reply from a specific intelligence (Message Agent). MOCK. */
export function agentReply(agentId: string, text: string, ctx: ChatContext): string {
  const agent = agentOrFallback(agentId);
  const active = ctx.missions.filter((m) => m.status !== "complete" && m.agents.some((a) => a.agentId === agentId));
  const focus = active[0] ? `I'm on mission ${String(active[0].number).padStart(4, "0")} — ${active[0].title.toLowerCase()}.` : "I'm available.";
  const asksForWork = text.trim().split(/\s+/).length > 4;
  switch (agent.id) {
    case "helm":
      return asksForWork
        ? `Noted. ${focus} I'll fold this into the plan and route it to the right intelligence. You'll see it in Activity.`
        : `${focus} Everything is on schedule.`;
    case "lookout":
      return asksForWork
        ? `On it. ${focus} I'll add this to my research queue and flag anything worth acting on.`
        : `${focus} Ask me to find, research or qualify anything.`;
    case "beacon":
      return asksForWork
        ? `I like where this is going. ${focus} I'll draft a few directions and send them to you for review.`
        : `${focus} Give me a brief and I'll bring ideas.`;
    default:
      return `${agent.name} is not available yet.`;
  }
}
