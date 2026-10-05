/**
 * chatService: Manager's side of Chat (MOCK).
 *
 * Classifies a message and produces Z80's reply. Objectives become plans.
 * A model-backed implementation replaces `respond` behind POST /api/chat.
 */
import { agentOrFallback, getAgent } from "@/data/bots";
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
  if (GREET.test(t)) return { text: "Hi. Tell me what your bots should keep doing, or give them a one-off job." };
  if (THANKS.test(t)) return { text: "Anytime. The team keeps working. I'll text you when something needs a yes." };
  if (HELP.test(t)) {
    return {
      text: "Tell me what you want in plain English. If it's ongoing, like \"every morning\" or \"keep an eye on\", I set it up as a routine and a bot runs it around the clock. If it's one-off, I put the right bots on a job. Anything that leaves your company, like emails, posts or spend, waits for your yes unless you say otherwise.",
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
    if (!running.length) return { text: "No jobs running. Your routines are still on. What else should your bots do?" };
    return {
      text: running
        .map((m) => `Job ${m.number}, ${m.title}: ${Math.round(m.progress * 100)}%${m.status === "awaiting-approval" ? ", waiting on your approval" : ""}.`)
        .join("\n"),
    };
  }
  if (t.split(/\s+/).length < 3) {
    return { text: "Tell me a bit more. Who is it for, and what does done look like?" };
  }
  const plan = createPlan(t, ctx.org);
  const count = plan.agents.length;
  return {
    plan,
    text: `Got it. ${plan.reasoningSummary}

I'll put ${count === 1 ? "one bot" : `${count} bots`} on this job. They work on it without stopping and only come to you for a yes. Put them to work?`,
  };
}

/** A direct reply from one bot (its direct line). MOCK. */
export function agentReply(agentId: string, text: string, ctx: ChatContext): string {
  const agent = agentOrFallback(agentId);
  const active = ctx.missions.filter((m) => m.status !== "complete" && m.agents.some((a) => a.agentId === agentId));
  const focus = active[0] ? `I'm on job ${active[0].number}: ${active[0].title.toLowerCase()}.` : "My routines are running.";
  const asksForWork = text.trim().split(/\s+/).length > 4;
  switch (agent.id) {
    case "manager":
      return asksForWork
        ? `Noted. ${focus} I'll fold this into the plan and hand it to the right bot. You'll see it in Activity.`
        : `${focus} Everything is on schedule.`;
    case "lead-hunter":
      return asksForWork
        ? `On it. ${focus} I'll add this to my research queue and flag anything worth acting on.`
        : `${focus} Ask me to find, research or qualify anything.`;
    case "content-creator":
      return asksForWork
        ? `I like where this is going. ${focus} I'll draft a few directions and send them to you for review.`
        : `${focus} Give me a brief and I'll bring ideas.`;
    default:
      if (agent.availability !== "available") return `${agent.name} is not available yet.`;
      return asksForWork ? `Got it. ${focus} I'll work that in and tell you what I find.` : `${focus} Anything you want me to keep an eye on?`;
  }
}
