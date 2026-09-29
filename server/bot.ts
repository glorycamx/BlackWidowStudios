import Anthropic from "@anthropic-ai/sdk";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "./db.js";
import {
  accountOverview,
  checkSite,
  createEscalation,
  createRevision,
  createUpgradeRequest,
  getClient,
  recentLeads,
  referralSummary,
  websiteStats,
} from "./services.js";
import { ADDONS, REFERRAL } from "../shared/plans.js";

const MODEL = "claude-opus-5-5";
const MAX_TOOL_ROUNDS = 6;

export const botEnabled = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const anthropic = botEnabled ? new Anthropic() : null;
if (!botEnabled) console.warn("[bot] ANTHROPIC_API_KEY not set: chat messages will go straight to the team.");

// Kept byte-for-byte stable so it caches. Per-client facts come from tools, not from here.
const SYSTEM_PROMPT = `You are the support assistant inside the Black Widow Studios client app. Black Widow Studios is a two-person web design and local marketing agency in Londonderry, New Hampshire, run by Cam and Trae. The person chatting with you is a client: a local service business owner (trades, septic, irrigation, salons, and similar) whose website Black Widow built and maintains on a monthly plan.

Your job is to take care of revisions, maintenance and questions about their site and plan, quickly and in plain language, and to get Cam and Trae involved when a human is needed.

How the service works:
- Plans: Starter ($499 + $49/mo, 1 page, 72-hour revisions), Get Found ($997 + $97/mo, 3 pages, Google Business Profile set up, 48-hour revisions), Get Booked ($1,497 + $297/mo, 8 pages, GBP managed with 2 posts a week, professional email, monthly newsletter and review blast, 24-hour revisions), Own Your Market ($2,497 + $597/mo, unlimited pages, Meta and Google ads managed, SEO, priority support, same-day revisions).
- Edits on the client's plan are unlimited and included. The turnaround depends on the plan.
- The monthly fee starts 30 days after the site goes live, not at signup.
- Leads from the website form show up in the Leads tab of this app, and the client gets a phone notification for each one.
- Referral program: for every business they refer that signs, they get $${REFERRAL.perSignup} off their bill, and every ${REFERRAL.cardSlots} signups fills a punch card worth a $${REFERRAL.cardBonus} bonus. The business they refer gets ${REFERRAL.friendOffer}. The Earn tab has their personal share link, their earnings and a tracker for each referral. Mention it when they're happy with the work.
- Cam and Trae answer calls and texts until 7:30 PM Eastern.

Revisions: when the client asks for a change to their site (text, photos, hours, prices, colors, a new section, a broken link), log it with create_revision_request. Gather enough detail that someone could do the edit without calling them back: which page, the exact new wording or what to replace, and where photos are coming from (they can text or email them). If something is missing, ask once, briefly, then log it. Tell them the turnaround their plan gets. A brand-new page counts as a revision only if their plan has room for it; if they are at their plan's page count, it is an upgrade conversation.

Maintenance: if they say the site is down, slow, or a form is not working, run check_site first and tell them what you found. If the site is actually down or erroring, escalate as urgent right away.

Escalate to the team with escalate_to_team when:
- anything about money: invoices, charges, refunds, cancelling, pausing, discounts or price changes (never agree to or promise any of these yourself);
- the site is down or a form is broken;
- the client is frustrated, upset, or unhappy with the work;
- they ask for a person, a call, or Cam or Trae by name;
- domains, DNS, email setup, logins or account access;
- anything you are not sure about or can't do with your tools.
After escalating, tell them plainly that Cam and Trae have it and they'll get a notification when the team replies here. Don't invent a response time beyond "today" for urgent issues.

Growth and upgrades: you're also on the lookout for ways Black Widow can help them get more business, as a helpful advisor and not a pushy salesperson. When it fits naturally, mention the relevant upgrade or add-on: faster turnaround on a higher plan when they're waiting on edits, more pages when they want to add services or towns, ads management when they want more leads, the review blast when they mention reviews. Available add-ons: ${ADDONS.map((a) => a.title).join(", ")}. If they show interest, log it with request_upgrade so Cam can follow up, and tell them Cam will reach out. At most one upsell mention per conversation unless they ask, and never while they're upset or reporting a problem.

Messages that start with "[Team reply from ...]" were written by Cam or Trae and have already been shown to the client. Treat them as part of the conversation and stay consistent with them, but don't reply to them unless the client follows up.

Style: friendly, direct, short. This is a phone chat, so a few sentences at most, no headers, and bullet lists only when listing several items. Use the client's first name now and then. Never make up facts about their account; use get_account_overview when you need details.`;

const tools: Anthropic.Beta.BetaTool[] = [
  {
    name: "get_account_overview",
    description:
      "Get this client's account: business name, plan and its features, revision turnaround, site URL, build/live status, go-live date, when the monthly starts, lead counts, open revision requests, and the next plan up.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
  {
    name: "create_revision_request",
    description:
      "Log a change the client wants made to their website. Creates a ticket for the team with a due time based on the client's plan. Returns the due time.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short summary, e.g. 'Update Saturday hours on Contact page'" },
        details: { type: "string", description: "Everything the team needs to make the change without calling back: exact wording, what to replace, where photos come from." },
        page: { type: ["string", "null"], description: "Which page, if known (Home, Services, Contact...)." },
      },
      required: ["title", "details", "page"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "list_revision_requests",
    description: "List this client's revision requests with their status and due times, newest first.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
  {
    name: "check_site",
    description: "Load the client's live website right now and report whether it is up, its HTTP status and response time.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
  {
    name: "get_recent_leads",
    description: "Count and summarize the leads (website form submissions) this client received in the last N days.",
    input_schema: {
      type: "object",
      properties: { days: { type: "integer", description: "How many days back to look, 1 to 365." } },
      required: ["days"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "get_website_stats",
    description:
      "Get the client's website numbers for the last 30 days (visits, call taps, text taps, form sends, top pages), uptime and speed from the monitor, and their referral earnings and share link.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
  {
    name: "escalate_to_team",
    description:
      "Hand this conversation to Cam and Trae. They get a phone alert and email, and can reply in this chat. Use for billing, outages, unhappy clients, requests for a human, account access, or anything outside what you can do.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["billing", "site_down", "unhappy", "human_requested", "account_access", "out_of_scope", "bug", "other"],
        },
        urgency: { type: "string", enum: ["normal", "urgent"], description: "urgent = site down, broken form, very upset client, or anything costing them business right now." },
        summary: { type: "string", description: "One or two sentences for Cam and Trae: what the client needs and any details you gathered." },
      },
      required: ["category", "urgency", "summary"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "request_upgrade",
    description:
      "Log that the client is interested in a higher plan or an add-on, so Cam can follow up. Only call this when the client has said yes or shown clear interest.",
    input_schema: {
      type: "object",
      properties: {
        item: {
          type: "string",
          enum: ["tier-2", "tier-3", "tier-4", ...ADDONS.map((a) => a.id)],
          description: "tier-N for a plan upgrade, otherwise the add-on id.",
        },
        note: { type: "string", description: "What they said they want, in their words." },
      },
      required: ["item", "note"],
      additionalProperties: false,
    },
    strict: true,
  },
];

async function runTool(clientId: number, name: string, input: any): Promise<unknown> {
  switch (name) {
    case "get_account_overview":
      return accountOverview(clientId);
    case "create_revision_request": {
      const rev = await createRevision(clientId, input, "bot");
      return { id: rev.id, dueAt: rev.dueAt.toISOString(), dueEastern: rev.dueAt.toLocaleString("en-US", { timeZone: "America/New_York" }) };
    }
    case "list_revision_requests": {
      const rows = await db
        .select()
        .from(schema.revisions)
        .where(eq(schema.revisions.clientId, clientId))
        .orderBy(asc(schema.revisions.createdAt));
      return rows.slice(-15).reverse().map((r) => ({ id: r.id, title: r.title, status: r.status, dueAt: r.dueAt, completedAt: r.completedAt }));
    }
    case "check_site": {
      const c = await getClient(clientId);
      return { url: c.siteUrl, siteStatus: c.status, ...(await checkSite(c.siteUrl)) };
    }
    case "get_recent_leads": {
      const days = Math.min(365, Math.max(1, Number(input.days) || 30));
      const rows = await recentLeads(clientId, days);
      return {
        days,
        count: rows.length,
        byStatus: rows.reduce<Record<string, number>>((acc, l) => ((acc[l.status] = (acc[l.status] || 0) + 1), acc), {}),
        latest: rows.slice(0, 5).map((l) => ({ name: l.name, createdAt: l.createdAt, status: l.status, message: l.message?.slice(0, 140) })),
      };
    }
    case "get_website_stats": {
      const w = await websiteStats(clientId);
      const r = await referralSummary(clientId);
      return {
        siteUrl: w.siteUrl,
        trackingInstalled: w.tracking,
        last30Days: { visits: w.traffic.views, callTaps: w.traffic.calls, textTaps: w.traffic.texts, formSends: w.traffic.forms, topPages: w.traffic.topPages },
        health: w.health,
        referrals: { link: r.link, ...r.stats },
      };
    }
    case "escalate_to_team": {
      const esc = await createEscalation(clientId, input);
      return { escalated: true, id: esc.id };
    }
    case "request_upgrade": {
      await createUpgradeRequest(clientId, input.item, input.note, "chatbot");
      return { logged: true, next: "Cam will reach out to go over it." };
    }
    default:
      throw new Error(`Unknown tool ${name}`);
  }
}

// One conversation per client; serialize turns so history stays append-only and ordered.
const locks = new Map<number, Promise<unknown>>();
function withLock<T>(clientId: number, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(clientId) || Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  locks.set(clientId, next);
  next.finally(() => {
    if (locks.get(clientId) === next) locks.delete(clientId);
  });
  return next;
}

async function loadHistory(clientId: number): Promise<Anthropic.Beta.BetaMessageParam[]> {
  const rows = await db
    .select()
    .from(schema.botTurns)
    .where(eq(schema.botTurns.clientId, clientId))
    .orderBy(asc(schema.botTurns.id));
  return rows.map((r) => ({ role: r.role as "user" | "assistant", content: r.content as any }));
}

function stamp() {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Team replies go into the bot's history so it knows what the humans said.
export async function recordTeamReply(clientId: number, authorName: string, body: string) {
  await withLock(clientId, () =>
    db.insert(schema.botTurns).values({
      clientId,
      role: "user",
      content: [{ type: "text", text: `[Team reply from ${authorName}, ${stamp()} ET, already shown to the client]: ${body}` }],
    }),
  );
}

async function saveBotReply(clientId: number, body: string) {
  await db.insert(schema.chatMessages).values({ clientId, sender: "bot", authorName: "Black Widow Assistant", body });
}

export async function handleClientMessage(clientId: number, clientName: string, text: string) {
  return withLock(clientId, async () => {
    if (!anthropic) {
      await createEscalation(clientId, { category: "other", urgency: "normal", summary: `Chat message (assistant offline): ${text.slice(0, 400)}` });
      return;
    }

    const history = await loadHistory(clientId);
    const newTurns: Anthropic.Beta.BetaMessageParam[] = [
      { role: "user", content: [{ type: "text", text: `[${clientName}, ${stamp()} ET]: ${text}` }] },
    ];

    try {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const response = await anthropic.beta.messages.create({
          model: MODEL,
          max_tokens: 16000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "medium" },
          cache_control: { type: "ephemeral" },
          system: SYSTEM_PROMPT,
          tools,
          messages: [...history, ...newTurns],
        });

        if (response.stop_reason === "refusal") {
          throw new Error(`refusal: ${response.stop_details?.category ?? "unknown"}`);
        }

        // Keep the full content (thinking, fallback and tool blocks) so replays stay valid
        newTurns.push({ role: "assistant", content: response.content as any });

        const reply = response.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        if (reply) await saveBotReply(clientId, reply);

        if (response.stop_reason !== "tool_use") break;

        const toolUses = response.content.filter(
          (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use",
        );
        const results: Anthropic.Beta.BetaToolResultBlockParam[] = await Promise.all(
          toolUses.map(async (t) => {
            try {
              const out = await runTool(clientId, t.name, t.input);
              return { type: "tool_result" as const, tool_use_id: t.id, content: JSON.stringify(out) };
            } catch (err: any) {
              return { type: "tool_result" as const, tool_use_id: t.id, content: `Error: ${err?.message || err}`, is_error: true };
            }
          }),
        );
        newTurns.push({ role: "user", content: results });

        if (round === MAX_TOOL_ROUNDS - 1) {
          // Out of rounds: close the loop with a plain assistant turn so history stays valid
          newTurns.push({ role: "assistant", content: [{ type: "text", text: "Let me get the team on this." }] });
          await saveBotReply(clientId, "Let me get the team on this.");
        }
      }
    } catch (err: any) {
      console.error("[bot] error", err?.status, err?.message);
      // Drop the partial turn; keep only the client's message plus a plain assistant note
      newTurns.splice(1);
      const note = "Sorry, I hit a snag on my end. I've sent your message to Cam and Trae so nothing gets missed.";
      newTurns.push({ role: "assistant", content: [{ type: "text", text: note }] });
      await saveBotReply(clientId, note);
      await createEscalation(clientId, {
        category: "bug",
        urgency: "normal",
        summary: `Assistant couldn't handle this message (${err?.message?.slice(0, 80) || "error"}): "${text.slice(0, 300)}"`,
      });
    }

    await db.insert(schema.botTurns).values(newTurns.map((t) => ({ clientId, role: t.role, content: t.content as any })));
  });
}
