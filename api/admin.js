/* Vercel serverless function: the /admin page's data. Only for the emails in ADMIN_EMAILS (signed in with an email code).
   POST { s, a: "overview" }                                  → row counts, Redis copy status
   POST { s, a: "table", table, q, limit }                     → rows of users | clubs | applications | events | tickets (search q)
   POST { s, a: "copy", dryRun } / { s, a: "seed" }            → copy permanent data from Redis again / re-seed demo data */
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { sessionEmail, isAdminEmail } from "./_lib.js";
import { db, dbConfigured, schema as S } from "../db/client.js";
import { getMeta } from "./_store.js";
import { copyFromRedis, counts, seed } from "./_migrate.js";

const like = (q) => `%${String(q).replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
const iso = (d) => (d ? new Date(d).toISOString() : "");

const TABLES = {
  users: async (q, limit) => (await db().select({
    email: S.users.email, name: S.users.name, studentId: S.users.studentId, telegram: S.users.telegram, whatsapp: S.users.whatsapp,
    telegramConnected: sql`${S.users.telegramChatId} is not null`, theme: S.users.theme, legalVersion: S.users.legalVersion, legalAcceptedAt: S.users.legalAcceptedAt, createdAt: S.users.createdAt,
  }).from(S.users).where(q ? or(ilike(S.users.email, like(q)), ilike(S.users.name, like(q)), ilike(S.users.telegram, like(q)), ilike(S.users.whatsapp, like(q))) : undefined)
    .orderBy(desc(S.users.createdAt)).limit(limit)),
  clubs: async (q, limit) => (await db().select({
    id: S.clubs.id, name: S.clubs.name, category: S.clubs.category, slug: S.clubs.slug, leadEmail: S.clubs.leadEmail,
    owner: sql`(select user_email from club_roles r where r.club_id = "clubs"."id" and r.role = 'owner' limit 1)`,
    helpers: sql`(select count(*)::int from club_roles r where r.club_id = "clubs"."id" and r.role = 'helper')`,
    members: sql`(select count(*)::int from memberships m where m.club_id = "clubs"."id" and m.status = 'joined')`,
    newApplications: sql`(select count(*)::int from club_applications a where a.club_id = "clubs"."id" and a.status = 'new')`,
  }).from(S.clubs).where(q ? or(ilike(S.clubs.name, like(q)), ilike(S.clubs.category, like(q)), ilike(S.clubs.slug, like(q))) : undefined).orderBy(S.clubs.id).limit(limit)),
  applications: async (q, limit) => (await db().select({
    id: S.clubApplications.id, club: S.clubs.name, name: S.clubApplications.name, email: S.clubApplications.userEmail, whatsapp: S.clubApplications.whatsapp,
    year: S.clubApplications.year, message: S.clubApplications.message, status: S.clubApplications.status, consentVersion: S.clubApplications.consentVersion,
    createdAt: S.clubApplications.createdAt, contactedAt: S.clubApplications.contactedAt, acceptedAt: S.clubApplications.acceptedAt, declinedAt: S.clubApplications.declinedAt,
  }).from(S.clubApplications).leftJoin(S.clubs, eq(S.clubs.id, S.clubApplications.clubId))
    .where(q ? or(ilike(S.clubApplications.name, like(q)), ilike(S.clubApplications.userEmail, like(q)), ilike(S.clubs.name, like(q)), ilike(S.clubApplications.status, like(q)), ilike(S.clubApplications.id, like(q))) : undefined)
    .orderBy(desc(S.clubApplications.createdAt)).limit(limit)),
  events: async (q, limit) => (await db().select({
    ref: S.events.ref, source: S.events.source, status: S.events.status, kind: S.events.kind, title: S.events.title, category: S.events.category, date: S.events.date,
    start: S.events.startTime, price: S.events.price, spots: S.events.spots, venue: S.events.venueName, host: S.events.hostEmail,
    sold: sql`(select count(*)::int from tickets t where t.event_ref = "events"."ref" and t.status = 'valid')`, number: sql`("events"."data"->>'no')`,
    description: sql`("events"."data"->>'pitch')`, createdAt: S.events.createdAt,
  }).from(S.events).where(q ? or(ilike(S.events.title, like(q)), ilike(S.events.ref, like(q)), ilike(S.events.hostEmail, like(q)), ilike(S.events.status, like(q)), ilike(S.events.venueName, like(q))) : undefined)
    .orderBy(desc(S.events.createdAt)).limit(limit)),
  tickets: async (q, limit) => (await db().select({
    id: S.tickets.id, event: S.events.title, eventRef: S.tickets.eventRef, name: S.tickets.name, email: S.tickets.userEmail, studentId: S.tickets.studentId,
    price: S.tickets.price, method: S.tickets.method, status: S.tickets.status, checkedInAt: S.tickets.checkedInAt, delivered: sql`${S.externalTicketDeliveries.mode}`, createdAt: S.tickets.createdAt,
  }).from(S.tickets).leftJoin(S.events, eq(S.events.ref, S.tickets.eventRef)).leftJoin(S.externalTicketDeliveries, eq(S.externalTicketDeliveries.ticketId, S.tickets.id))
    .where(q ? or(ilike(S.tickets.id, like(q)), ilike(S.tickets.name, like(q)), ilike(S.tickets.userEmail, like(q)), ilike(S.events.title, like(q)), ilike(S.tickets.eventRef, like(q))) : undefined)
    .orderBy(desc(S.tickets.createdAt)).limit(limit)),
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false }); }
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const me = sessionEmail(b.s);
  if (!me) return res.status(401).json({ ok: false, code: "session", error: "Sign in with your email code first." });
  if (!isAdminEmail(me)) return res.status(403).json({ ok: false, code: "forbidden", error: "This account isn't an admin." });
  if (!dbConfigured()) return res.status(503).json({ ok: false, error: "The database isn't connected on this deployment." });
  try {
    if (b.a === "overview") return res.status(200).json({ ok: true, me, counts: await counts(), redisCopy: await getMeta("redis_copy") });
    if (b.a === "table") {
      const fn = TABLES[b.table];
      if (!fn) return res.status(400).json({ ok: false, error: "Unknown table." });
      const q = String(b.q || "").trim().slice(0, 100), limit = Math.min(5000, Math.max(1, Number(b.limit) || 200));
      const rows = (await fn(q, limit)).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v instanceof Date ? iso(v) : v])));
      return res.status(200).json({ ok: true, rows });
    }
    if (b.a === "copy") return res.status(200).json(await copyFromRedis({ dryRun: !!b.dryRun }));
    if (b.a === "seed") return res.status(200).json({ ok: true, seeded: await seed() });
    return res.status(400).json({ ok: false, error: "Unknown action." });
  } catch (e) {
    console.error("Admin API failed:", e && e.message);
    return res.status(500).json({ ok: false, error: "Query failed. Check the server logs." });
  }
}
