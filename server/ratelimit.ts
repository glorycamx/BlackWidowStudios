import type { Request, Response, NextFunction } from "express";

// Small in-memory fixed-window limiter. Good for a single server instance.
export function rateLimit(opts: { windowMs: number; max: number; key?: (req: Request) => string; message?: string }) {
  const hits = new Map<string, { count: number; reset: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  }, 60_000).unref();
  return (req: Request, res: Response, next: NextFunction) => {
    const k = opts.key ? opts.key(req) : req.ip || "unknown";
    const now = Date.now();
    const cur = hits.get(k);
    if (!cur || cur.reset < now) {
      hits.set(k, { count: 1, reset: now + opts.windowMs });
      return next();
    }
    cur.count++;
    if (cur.count > opts.max) {
      res.setHeader("Retry-After", String(Math.ceil((cur.reset - now) / 1000)));
      return res.status(429).json({ error: opts.message || "Too many requests. Try again in a few minutes." });
    }
    next();
  };
}
