import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  date,
  index,
  customType,
  varchar,
  json,
} from "drizzle-orm/pg-core";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  ownerName: text("owner_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  tier: integer("tier").notNull().default(2),
  siteUrl: text("site_url"),
  // build -> phase1 -> live
  status: text("status").notNull().default("build"),
  goLiveDate: date("go_live_date"),
  niche: text("niche"),
  // Public key used by the client's website form to post leads into the portal
  siteKey: text("site_key").notNull().unique(),
  // Code in the client's personal referral link (/r/<code>)
  referralCode: text("referral_code").unique(),
  googleReviewUrl: text("google_review_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  // "team" (Cam, Trae) or "client"
  role: text("role").notNull(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leads = pgTable(
  "leads",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
    name: text("name"),
    phone: text("phone"),
    email: text("email"),
    message: text("message"),
    source: text("source").notNull().default("Website form"),
    // new | contacted | won | lost
    status: text("status").notNull().default("new"),
    nudgedAt: timestamp("nudged_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("leads_client_idx").on(t.clientId, t.createdAt)],
);

export const revisions = pgTable(
  "revisions",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    details: text("details").notNull(),
    page: text("page"),
    // open | in_progress | done
    status: text("status").notNull().default("open"),
    createdBy: text("created_by").notNull().default("client"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("revisions_client_idx").on(t.clientId)],
);

// What the client sees in the Help chat
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
    // client | bot | team | system
    sender: text("sender").notNull(),
    authorName: text("author_name"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chat_client_idx").on(t.clientId, t.id)],
);

// Raw Claude conversation, append-only, replayed on every turn
export const botTurns = pgTable(
  "bot_turns",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: jsonb("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("bot_turns_client_idx").on(t.clientId, t.id)],
);

export const escalations = pgTable("escalations", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  // billing | site_down | unhappy | out_of_scope | human_requested | bug | other | upgrade
  category: text("category").notNull(),
  urgency: text("urgency").notNull().default("normal"),
  summary: text("summary").notNull(),
  status: text("status").notNull().default("open"),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const upgradeRequests = pgTable("upgrade_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  // "tier-3", "tier-4", or an add-on id
  item: text("item").notNull(),
  note: text("note"),
  source: text("source").notNull().default("app"),
  // new | contacted | won | lost
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  business: text("business"),
  phone: text("phone"),
  email: text("email"),
  note: text("note"),
  // app (client typed it in) | link (came through their share link)
  source: text("source").notNull().default("app"),
  // new | contacted | signed | lost
  status: text("status").notNull().default("new"),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  creditAmount: integer("credit_amount").notNull().default(0),
  // none | pending (earned, not yet taken off their bill) | applied
  creditStatus: text("credit_status").notNull().default("none"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    url: text("url").notNull().default("/"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.id)],
);

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  keys: jsonb("keys").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Login sessions (connect-pg-simple's table, declared here so drizzle-kit push keeps it)
export const session = pgTable(
  "session",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire", { precision: 6 }).notNull(),
  },
  (t) => [index("IDX_session_expire").on(t.expire)],
);

// Keys for scheduled notifications already sent, so each fires once
export const jobLog = pgTable("job_log", {
  key: text("key").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

// Visits, call taps and form sends reported by the tracking snippet on the client's site
export const siteEvents = pgTable(
  "site_events",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
    // view | call | text | email | form
    kind: text("kind").notNull(),
    path: text("path"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("site_events_client_idx").on(t.clientId, t.createdAt)],
);

// Uptime monitor results
export const siteChecks = pgTable(
  "site_checks",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
    ok: boolean("ok").notNull(),
    status: integer("status"),
    responseMs: integer("response_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("site_checks_client_idx").on(t.clientId, t.createdAt)],
);

// Job photos clients send in for their site
export const sitePhotos = pgTable(
  "site_photos",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
    mime: text("mime").notNull(),
    data: bytea("data").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("site_photos_client_idx").on(t.clientId)],
);
