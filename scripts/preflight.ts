// Go-live check: run `npm run preflight` with the production environment loaded.
// It reads settings and makes read-only calls; it doesn't send notifications or emails.
import "dotenv/config";
import pg from "pg";

const results: { name: string; ok: boolean | null; detail: string }[] = [];
const pass = (name: string, detail = "") => results.push({ name, ok: true, detail });
const fail = (name: string, detail: string) => results.push({ name, ok: false, detail });
const skip = (name: string, detail: string) => results.push({ name, ok: null, detail });
const env = process.env;

async function main() {
  // Required settings
  for (const k of ["DATABASE_URL", "SESSION_SECRET", "APP_URL"]) env[k] ? pass(k) : fail(k, "not set");
  if (env.SESSION_SECRET && env.SESSION_SECRET.length < 32) fail("SESSION_SECRET length", "use at least 32 characters (openssl rand -hex 32)");
  if (env.APP_URL && !/^https:\/\//.test(env.APP_URL)) fail("APP_URL", "must start with https://");
  if (env.SEED_DEMO === "1") skip("SEED_DEMO", "set to 1, but ignored in production (no sample data is created)");

  // Database
  if (env.DATABASE_URL) {
    const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
    try {
      await pool.query("select 1");
      pass("Database connection");
      const { rows } = await pool.query("select to_regclass('public.users') as t");
      rows[0].t ? pass("Database tables", "migrations applied") : skip("Database tables", "not created yet; they're created on first start");
      if (rows[0].t) {
        const team = await pool.query("select count(*)::int as n from users where role = 'team'");
        team.rows[0].n > 0 ? pass("Team logins", `${team.rows[0].n} team account(s)`) : skip("Team logins", "created on first start from TEAM_SEED; passwords print to the log once");
      }
    } catch (e: any) {
      fail("Database connection", e.message);
    } finally {
      await pool.end();
    }
  }

  // App reachable over HTTPS
  if (env.APP_URL) {
    try {
      const r = await fetch(`${env.APP_URL.replace(/\/$/, "")}/api/health`, { signal: AbortSignal.timeout(10_000) });
      r.ok ? pass("Live app health", env.APP_URL) : fail("Live app health", `HTTP ${r.status}`);
    } catch (e: any) {
      skip("Live app health", `couldn't reach ${env.APP_URL} (fine before the first deploy): ${e.message}`);
    }
  }

  // Claude assistant
  if (env.ANTHROPIC_API_KEY) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/models/claude-opus-5-5", {
        headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      });
      r.ok ? pass("Claude API key", "assistant can reach claude-opus-5-5") : fail("Claude API key", `HTTP ${r.status}: ${(await r.text()).slice(0, 160)}`);
    } catch (e: any) {
      fail("Claude API key", e.message);
    }
  } else skip("Claude API key", "not set: chat messages go straight to the team");

  // Phone push
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    const pub = Buffer.from(env.VAPID_PUBLIC_KEY, "base64url");
    pub.length === 65 ? pass("Push keys (VAPID)") : fail("Push keys (VAPID)", "public key looks wrong; regenerate with npm run vapid:generate");
    if (!env.VAPID_SUBJECT?.startsWith("mailto:")) skip("VAPID_SUBJECT", "should be mailto:you@yourdomain");
  } else fail("Push keys (VAPID)", "not set: phones won't buzz when the app is closed. Run npm run vapid:generate");

  // Team email
  if (env.RESEND_API_KEY) {
    try {
      const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` } });
      if (!r.ok) fail("Resend API key", `HTTP ${r.status}`);
      else {
        const { data } = (await r.json()) as { data: { name: string; status: string }[] };
        const from = (env.EMAIL_FROM || "").match(/@([^>\s]+)/)?.[1];
        const d = data.find((x) => x.name === from);
        d?.status === "verified" ? pass("Email sending", `${from} verified`) : fail("Email sending", `sending domain ${from || "(EMAIL_FROM not set)"} isn't verified in Resend`);
      }
    } catch (e: any) {
      fail("Resend API key", e.message);
    }
  } else skip("Team email alerts", "RESEND_API_KEY not set: team gets in-app and push alerts only");
  if (!env.TEAM_ALERT_EMAILS) skip("TEAM_ALERT_EMAILS", "not set: no one receives email alerts");

  const icon = (ok: boolean | null) => (ok === true ? "PASS" : ok === false ? "FAIL" : "NOTE");
  for (const r of results) console.log(`${icon(r.ok).padEnd(5)} ${r.name}${r.detail ? `: ${r.detail}` : ""}`);
  const failed = results.filter((r) => r.ok === false).length;
  console.log(failed ? `\n${failed} problem(s) to fix before go-live.` : "\nReady to go live.");
  process.exit(failed ? 1 : 0);
}

main();
