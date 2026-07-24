import { pgTable, text, timestamp, jsonb, integer, boolean, primaryKey, uuid, serial } from "drizzle-orm/pg-core";

// The account row. `id` is the Clerk user id (not a UUID) — Clerk owns
// auth/passwords, so this table only holds app-only fields.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  name: text("name"),
  workspaceName: text("workspace_name").notNull().default("My Workspace"),
  notifications: jsonb("notifications").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// The Media Kit — one row per user, read by every AI engine as `creatorContext`.
export const creatorProfile = pgTable("creator_profile", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  niche: text("niche"),
  bio: text("bio"),
  platforms: jsonb("platforms").notNull().default([]),
  audience: jsonb("audience").notNull().default({}),
  tone: text("tone"),
  pastDeals: text("past_deals"),
  rateFloor: text("rate_floor"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Custom agents the user created. The five preset "Deal Team" agents are
// static data in code (lib/agentTypes.ts) — only additions live here.
export const agents = pgTable(
  "agents",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    initials: text("initials").notNull(),
    role: text("role").notNull(),
    color: text("color").notNull(),
    status: text("status").notNull().default("working"),
    task: text("task"),
    score: integer("score"),
    goal: text("goal"),
    char: integer("char"),
    type: text("type").notNull().default("custom"),
    capabilities: jsonb("capabilities").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({ pk: primaryKey({ columns: [table.userId, table.id] }) })
);

// Custom teams (pods) the user created.
export const teams = pgTable(
  "teams",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    icon: text("icon"),
    iconBg: text("icon_bg"),
    description: text("description"),
    goal: text("goal"),
    members: jsonb("members").notNull().default([]),
    activity: jsonb("activity").notNull().default([]),
    meetings: integer("meetings").notNull().default(0),
    pipeline: jsonb("pipeline").notNull().default({}),
    leads: integer("leads").notNull().default(0),
    template: text("template"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({ pk: primaryKey({ columns: [table.userId, table.id] }) })
);

// Per-user overrides layered on top of preset agents so a creator can
// tweak them without duplicating them.
export const agentConfig = pgTable(
  "agent_config",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    agentId: text("agent_id").notNull(),
    role: text("role"),
    goal: text("goal"),
    permissions: jsonb("permissions"),
    settings: jsonb("settings"),
  },
  (table) => ({ pk: primaryKey({ columns: [table.userId, table.agentId] }) })
);

export const agentStates = pgTable(
  "agent_states",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    agentId: text("agent_id").notNull(),
    removed: boolean("removed").notNull().default(false),
    paused: boolean("paused").notNull().default(false),
  },
  (table) => ({ pk: primaryKey({ columns: [table.userId, table.agentId] }) })
);

// A replacement member list for a (preset or custom) team.
export const teamMembers = pgTable(
  "team_members",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    teamId: text("team_id").notNull(),
    members: jsonb("members").notNull().default([]),
  },
  (table) => ({ pk: primaryKey({ columns: [table.userId, table.teamId] }) })
);

// The brands an agent works — the deals pipeline.
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentId: text("agent_id"),
  name: text("name").notNull(),
  title: text("title"),
  company: text("company"),
  email: text("email"),
  status: text("status").notNull().default("new"),
  score: integer("score"),
  source: text("source").notNull().default("manual"),
  review: text("review").notNull().default("accepted"),
  profileUrl: text("profile_url"),
  website: text("website"),
  platform: text("platform"),
  research: jsonb("research"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// The event log — feeds notifications, the dashboard, and analytics later.
export const activity = pgTable("activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentId: text("agent_id"),
  type: text("type").notNull(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  text: text("text").notNull(),
  dismissed: boolean("dismissed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// The background work queue every AI engine runs through.
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentId: text("agent_id"),
  kind: text("kind").notNull(),
  status: text("status").notNull().default("queued"),
  params: jsonb("params").notNull().default({}),
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

// Agent-written outbound messages — the first pitch, and any follow-ups
// that build on it. Each pitch is a draft the creator opens in their own
// mail app or copies; there's no send-integration.
export const outreachDrafts = pgTable("outreach_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentId: text("agent_id"),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  subject: text("subject"),
  body: text("body").notNull(),
  rationale: text("rationale"),
  status: text("status").notNull().default("draft"),
  dismissed: boolean("dismissed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

// Agent-written priced proposals for a lead.
export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentId: text("agent_id"),
  leadId: uuid("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  products: jsonb("products").notNull().default([]),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

// Booked calls — the calendar's only source.
export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentId: text("agent_id"),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("call"),
  whenAt: timestamp("when_at", { withTimezone: true }).notNull(),
  whenLabel: text("when_label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// A connected TikTok account — one per user. Powers the profile photo and
// follower count shown on the dashboard. Only usable once the app is live
// on a public HTTPS domain (TikTok won't redirect back to localhost).
export const tiktokAccounts = pgTable("tiktok_accounts", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  openId: text("open_id").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  displayName: text("display_name").notNull().default(""),
  username: text("username"),
  avatarUrl: text("avatar_url").notNull().default(""),
  followerCount: integer("follower_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// The team group chat — one shared thread per user. `agentId` marks which
// teammate authored an 'ai' message; null for the creator's own messages.
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentId: text("agent_id"),
  who: text("who").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
