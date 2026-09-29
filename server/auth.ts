import type { Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool, schema } from "./db.js";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export type User = typeof schema.users.$inferSelect;

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const PgStore = connectPg(session);

export function sessionMiddleware() {
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  }
  return session({
    store: new PgStore({ pool, tableName: "session" }),
    secret: process.env.SESSION_SECRET || "dev-only-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 90, // stay signed in on the phone for 90 days
    },
  });
}

export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  if (req.session.userId) {
    const [u] = await db.select().from(schema.users).where(eq(schema.users.id, req.session.userId));
    if (u) req.user = u;
  }
  next();
}

export function requireRole(role: "team" | "client") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Please sign in" });
    if (req.user.role !== role) return res.status(403).json({ error: "Not allowed" });
    if (role === "client" && !req.user.clientId) return res.status(403).json({ error: "No business linked to this login" });
    next();
  };
}

// Compared against when the email doesn't exist, so response time doesn't reveal which emails have accounts
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function verifyLogin(email: string, password: string) {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email.trim().toLowerCase()));
  const ok = await bcrypt.compare(password, u?.passwordHash || DUMMY_HASH);
  return u && ok ? u : null;
}

export function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export function publicUser(u: User) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, clientId: u.clientId };
}
