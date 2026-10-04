/* Unite's permanent data in Postgres (Neon). Drizzle ORM schema; migrations live in /drizzle
   (generate with `npm run db:generate`, applied on every deploy by scripts/migrate.mjs).
   Redis keeps only short-lived things: login/Telegram link codes, locks, caches. */
import { pgTable, text, integer, boolean, timestamp, numeric, bigint, jsonb, serial, primaryKey, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const ts = (name) => timestamp(name, { withTimezone: true, mode: "date" });
const created = () => ts("created_at").notNull().defaultNow();
const updated = () => ts("updated_at").notNull().defaultNow();

// Accounts, keyed by their (lowercase) email address.
export const users = pgTable("users", {
  email: text("email").primaryKey(),
  name: text("name"),
  studentId: text("student_id"),
  avatarUrl: text("avatar_url"),
  telegram: text("telegram"), // @username, without the @
  telegramChatId: text("telegram_chat_id"), // connected bot chat for notifications
  whatsapp: text("whatsapp"), // digits with country code
  notifyEmail: boolean("notify_email").notNull().default(true),
  notifyTelegram: boolean("notify_telegram").notNull().default(true),
  theme: text("theme"), // light | dark
  legalVersion: text("legal_version"), // Terms / Privacy version accepted
  legalAcceptedAt: ts("legal_accepted_at"),
  passwordHash: text("password_hash"), // scrypt$N$r$p$salt$hash (never the password itself)
  passwordChangedAt: ts("password_changed_at"),
  failedLogins: integer("failed_logins").notNull().default(0), // wrong passwords in a row
  lockedUntil: ts("locked_until"), // too many wrong passwords: log in is paused until then
  createdAt: created(),
  updatedAt: updated(),
}, (t) => [
  index("users_telegram_idx").on(sql`lower(${t.telegram})`),
  index("users_tg_chat_idx").on(t.telegramChatId),
]);

export const clubs = pgTable("clubs", {
  id: integer("id").primaryKey(), // same ids as src/data/clubs.js
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(), // Sports | Tech | Business | Arts
  leadEmail: text("lead_email"),
  createdAt: created(),
}, (t) => [uniqueIndex("clubs_slug_idx").on(t.slug)]);

export const clubRoles = pgTable("club_roles", {
  clubId: integer("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  userEmail: text("user_email").notNull().references(() => users.email, { onDelete: "cascade", onUpdate: "cascade" }),
  role: text("role").notNull(), // owner | helper
  createdAt: created(),
}, (t) => [primaryKey({ columns: [t.clubId, t.userEmail] }), index("club_roles_user_idx").on(t.userEmail)]);

export const memberships = pgTable("memberships", {
  clubId: integer("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  userEmail: text("user_email").notNull().references(() => users.email, { onDelete: "cascade", onUpdate: "cascade" }),
  status: text("status").notNull(), // joined | pending (sports tryout being processed)
  source: text("source").notNull().default("app"), // application | tryout | app
  joinedAt: created(),
}, (t) => [primaryKey({ columns: [t.clubId, t.userEmail] }), index("memberships_user_idx").on(t.userEmail)]);

export const clubApplications = pgTable("club_applications", {
  id: text("id").primaryKey(), // AP-XXXXXXXX
  clubId: integer("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  userEmail: text("user_email").notNull().references(() => users.email, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text("name").notNull(),
  whatsapp: text("whatsapp").notNull(),
  year: text("year"),
  message: text("message"),
  status: text("status").notNull().default("new"), // new | contacted | accepted | declined
  consentAt: ts("consent_at"),
  consentVersion: text("consent_version"),
  contactedAt: ts("contacted_at"),
  acceptedAt: ts("accepted_at"),
  declinedAt: ts("declined_at"),
  remindedAt: ts("reminded_at"),
  decidedBy: text("decided_by"),
  createdAt: created(),
  updatedAt: updated(),
}, (t) => [
  index("apps_club_status_idx").on(t.clubId, t.status),
  index("apps_user_idx").on(t.userEmail),
  index("apps_new_idx").on(t.status, t.createdAt),
  // One open application per student per club (a declined one doesn't block applying again).
  uniqueIndex("apps_one_open_idx").on(t.clubId, t.userEmail).where(sql`${t.status} <> 'declined'`),
]);

// Student-hosted events (and the built-in demo events, source = 'demo').
export const events = pgTable("events", {
  ref: text("ref").primaryKey(), // UN-XXXXXX, or DEMO-<n>
  source: text("source").notNull().default("hosted"), // hosted | demo
  status: text("status").notNull().default("pending"), // pending | under_review | approved | rejected | deleted
  kind: text("kind").notNull().default("own"), // own | trip
  title: text("title").notNull(),
  category: text("category"),
  date: text("date"), // YYYY-MM-DD, Dubai time
  startTime: text("start_time"), // HH:MM
  endTime: text("end_time"),
  spots: integer("spots"),
  price: numeric("price", { mode: "number" }),
  venueName: text("venue_name"),
  hostEmail: text("host_email"),
  data: jsonb("data").notNull(), // the full submission (pitch, contacts, trip details, moderation notes…)
  cover: text("cover"), // image data URL
  logo: text("logo"),
  tgMessageId: bigint("tg_message_id", { mode: "number" }), // admin chat message carrying the moderation buttons
  createdAt: created(),
  updatedAt: updated(),
  deletedAt: ts("deleted_at"),
}, (t) => [index("events_status_idx").on(t.status), index("events_kind_status_idx").on(t.kind, t.status), index("events_host_idx").on(t.hostEmail)]);

export const eventHosts = pgTable("event_hosts", {
  eventRef: text("event_ref").notNull().references(() => events.ref, { onDelete: "cascade" }),
  userEmail: text("user_email").notNull().references(() => users.email, { onDelete: "cascade", onUpdate: "cascade" }),
  role: text("role").notNull().default("host"),
}, (t) => [primaryKey({ columns: [t.eventRef, t.userEmail] }), index("event_hosts_user_idx").on(t.userEmail)]);

export const tickets = pgTable("tickets", {
  id: text("id").primaryKey(), // UNT-2026-XXXXX
  eventRef: text("event_ref").notNull().references(() => events.ref, { onDelete: "cascade" }),
  userEmail: text("user_email"),
  name: text("name"),
  studentId: text("student_id"),
  method: text("method"),
  price: numeric("price", { mode: "number" }).notNull().default(0),
  status: text("status").notNull().default("valid"), // valid | refunded
  qrId: text("qr_id").notNull(), // the signed code in the QR
  checkedInAt: ts("checked_in_at"),
  refundedAt: ts("refunded_at"),
  createdAt: created(),
}, (t) => [index("tickets_event_idx").on(t.eventRef), index("tickets_user_idx").on(t.userEmail), uniqueIndex("tickets_qr_idx").on(t.qrId)]);

// Group trips: the official ticket the host delivered for each purchase.
export const externalTicketDeliveries = pgTable("external_ticket_deliveries", {
  ticketId: text("ticket_id").primaryKey().references(() => tickets.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(), // file | external
  note: text("note"),
  fileName: text("file_name"),
  fileType: text("file_type"),
  fileData: text("file_data"), // base64
  deliveredAt: created(),
});

export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  eventRef: text("event_ref").notNull(),
  userEmail: text("user_email").notNull().references(() => users.email, { onDelete: "cascade", onUpdate: "cascade" }),
  createdAt: created(),
}, (t) => [uniqueIndex("waitlist_event_user_idx").on(t.eventRef, t.userEmail)]);

export const notificationsLog = pgTable("notifications_log", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email"),
  channel: text("channel").notNull(), // email | telegram
  kind: text("kind").notNull(),
  subject: text("subject"),
  ref: text("ref"),
  ok: boolean("ok").notNull(),
  createdAt: created(),
}, (t) => [index("notifications_user_idx").on(t.userEmail), index("notifications_created_idx").on(t.createdAt)]);

// Small key/value table for one-off markers (e.g. when data was last copied from Redis).
export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
  updatedAt: updated(),
});
