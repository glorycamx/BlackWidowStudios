import "dotenv/config";

export const isProd = process.env.NODE_ENV === "production";

// Fail fast on missing settings in production; warn about optional features that are off
export function checkConfig() {
  const missing = ["DATABASE_URL", "SESSION_SECRET", "APP_URL"].filter((k) => !process.env[k]);
  if (isProd && missing.length) {
    throw new Error(`Missing required settings: ${missing.join(", ")}. See .env.example.`);
  }
  if (isProd && (process.env.SESSION_SECRET || "").length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters. Generate one with: openssl rand -hex 32");
  }
  if (isProd && process.env.APP_URL && !/^https:\/\//.test(process.env.APP_URL)) {
    throw new Error("APP_URL must start with https:// in production (phone notifications require HTTPS).");
  }
  const off: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) off.push("assistant (ANTHROPIC_API_KEY): chat messages go straight to the team");
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) off.push("phone push (VAPID keys): in-app alerts only");
  if (!process.env.RESEND_API_KEY) off.push("team email alerts (RESEND_API_KEY)");
  for (const o of off) console.warn(`[config] Off: ${o}`);
}
