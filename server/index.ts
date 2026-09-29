import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sessionMiddleware, loadUser } from "./auth.js";
import { api } from "./routes.js";
import { seed } from "./seed.js";
import { startJobs } from "./jobs.js";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: false, limit: "200kb" }));
app.use("/api", sessionMiddleware(), loadUser, api);
app.use("/api", ((err, _req, res, _next) => {
  console.error("[api]", err);
  res.status(500).json({ error: "Something went wrong" });
}) as express.ErrorRequestHandler);

if (process.env.NODE_ENV === "production") {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
  app.use(express.static(dist, { index: false }));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const port = Number(process.env.PORT) || (process.env.NODE_ENV === "production" ? 5000 : 3001);
await seed();
startJobs();
app.listen(port, "0.0.0.0", () => console.log(`[server] Black Widow portal API on :${port}`));
