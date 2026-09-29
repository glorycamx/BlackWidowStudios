import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "./db.js";

const pushEnabled = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
if (pushEnabled) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@blackwidow.studio",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
} else {
  console.warn("[notify] VAPID keys not set: phone push is off (in-app alerts still work). Run `npm run vapid:generate`.");
}

export const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";

// Vibration patterns (ms on/off). Android honors these; iOS plays its standard buzz.
export const BUZZ = {
  normal: [200, 100, 200],
  money: [120, 60, 120, 60, 400],
  urgent: [400, 150, 400, 150, 400, 150, 800],
};

export type NotifyKind =
  | "lead"
  | "team_reply"
  | "revision_created"
  | "revision_done"
  | "revision_update"
  | "escalation"
  | "upgrade_request"
  | "referral"
  | "site_live"
  | "report"
  | "offer";

export interface NotifyInput {
  kind: NotifyKind;
  title: string;
  body: string;
  url?: string;
  buzz?: keyof typeof BUZZ;
}

async function deliver(userIds: number[], n: NotifyInput) {
  if (userIds.length === 0) return;
  const url = n.url || "/";
  await db.insert(schema.notifications).values(
    userIds.map((userId) => ({ userId, kind: n.kind, title: n.title, body: n.body, url })),
  );
  if (!pushEnabled) return;

  const subs = await db
    .select()
    .from(schema.pushSubscriptions)
    .where(inArray(schema.pushSubscriptions.userId, userIds));
  const payload = JSON.stringify({
    title: n.title,
    body: n.body,
    url,
    tag: `${n.kind}-${Date.now()}`,
    vibrate: BUZZ[n.buzz || "normal"],
    requireInteraction: n.buzz === "urgent",
  });
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys as { p256dh: string; auth: string } },
          payload,
          { urgency: n.buzz === "urgent" ? "high" : "normal", TTL: 60 * 60 * 24 },
        );
      } catch (err: any) {
        // 404/410: the phone unsubscribed or the app was removed
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, s.id));
        } else {
          console.error("[notify] push failed", err?.statusCode, err?.body || err?.message);
        }
      }
    }),
  );
}

export async function notifyClient(clientId: number, n: NotifyInput) {
  const users = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.clientId, clientId));
  await deliver(users.map((u) => u.id), n);
}

export async function notifyTeam(n: NotifyInput, opts: { email?: boolean } = {}) {
  const team = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.role, "team"));
  await deliver(team.map((u) => u.id), n);
  if (opts.email) await emailTeam(n.title, `${n.body}\n\nOpen: ${appUrl(n.url || "/team")}`);
}

export function appUrl(path: string) {
  return `${(process.env.APP_URL || "").replace(/\/$/, "")}${path}`;
}

async function emailTeam(subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const to = (process.env.TEAM_ALERT_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!key || to.length === 0) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Black Widow Studios <hello@blackwidow.studio>",
        to,
        subject: `[Portal] ${subject}`,
        text,
      }),
    });
    if (!res.ok) console.error("[notify] email failed", res.status, await res.text());
  } catch (err) {
    console.error("[notify] email failed", err);
  }
}
