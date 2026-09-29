import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkConfig, isProd } from "./config.js";
import { sessionMiddleware, loadUser } from "./auth.js";
import { api } from "./routes.js";
import { seed } from "./seed.js";
import { startJobs } from "./jobs.js";
import { runMigrations } from "./migrate.js";
import { pool } from "./db.js";
import { rateLimit } from "./ratelimit.js";

checkConfig();

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Basic security headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isProd) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// Photo uploads arrive as base64 JSON and need a bigger body; everything else stays small
const smallJson = express.json({ limit: "100kb" });
const photoJson = express.json({ limit: "25mb" });
app.use((req, res, next) => (req.path === "/api/client/photos" ? photoJson : smallJson)(req, res, next));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

// Rate limits: brute force, spam, and assistant cost
const minutes = (n: number) => n * 60_000;
app.use("/api/auth/login", rateLimit({ windowMs: minutes(15), max: 20, message: "Too many sign-in attempts. Wait 15 minutes and try again." }));
app.use("/api/auth/login", rateLimit({ windowMs: minutes(15), max: 8, key: (req) => `login:${String(req.body?.email || "").trim().toLowerCase()}`, message: "Too many sign-in attempts for this email. Wait 15 minutes and try again." }));
app.use("/api/public/ref", rateLimit({ windowMs: minutes(60), max: 20 }));
app.use("/api/hooks/lead", rateLimit({ windowMs: minutes(10), max: 30 }));
app.use("/api/hooks/event", rateLimit({ windowMs: minutes(1), max: 120 }));

app.use("/api", sessionMiddleware(), loadUser);
app.post("/api/client/chat", rateLimit({ windowMs: minutes(60), max: 40, key: (req) => `chat:${req.user?.clientId ?? req.ip}`, message: "You've sent a lot of messages. Give it a bit, or text Cam directly." }));
app.post("/api/client/site-check", rateLimit({ windowMs: minutes(10), max: 10, key: (req) => `check:${req.user?.clientId ?? req.ip}` }));
app.post("/api/client/photos", rateLimit({ windowMs: minutes(60), max: 20, key: (req) => `photos:${req.user?.clientId ?? req.ip}` }));
app.use("/api", api);
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));
app.use("/api", ((err, _req, res, _next) => {
  if (err?.type === "entity.too.large") return res.status(413).json({ error: "That upload is too big." });
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid request body." });
  console.error("[api]", err);
  res.status(500).json({ error: "Something went wrong" });
}) as express.ErrorRequestHandler);

if (isProd) {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
  // Hashed assets can cache forever; the shell and service worker must always be fresh
  app.use("/assets", express.static(path.join(dist, "assets"), { immutable: true, maxAge: "1y" }));
  app.use(express.static(dist, { index: false, maxAge: 0 }));
  app.get(/^(?!\/api).*/, (_req, res) => res.set("Cache-Control", "no-cache").sendFile(path.join(dist, "index.html")));
}

process.on("unhandledRejection", (err) => console.error("[unhandledRejection]", err));

const port = Number(process.env.PORT) || (isProd ? 5000 : 3001);
await runMigrations();
await seed();
startJobs();
const server = app.listen(port, "0.0.0.0", () => console.log(`[server] Black Widow portal on :${port}`));

const shutdown = () => {
  console.log("[server] Shutting down");
  server.close(() => pool.end().finally(() => process.exit(0)));
  setTimeout(() => process.exit(0), 8000).unref();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
