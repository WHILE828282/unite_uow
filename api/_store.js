/* Data access for the API routes: every read and write of permanent data goes through here, on Postgres via
   Drizzle (parameterised queries only). Records keep the shapes the routes already used, so the routes stay simple.
   Short-lived things (Telegram link codes, locks) use Redis when it is connected, otherwise the app_meta table here. */
import { and, asc, desc, eq, inArray, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db, dbConfigured, schema as S } from "../db/client.js";
import { CLUBS } from "../src/data/clubs.js";

export { dbConfigured };
const ms = (d) => (d ? new Date(d).getTime() : null);
const dt = (v) => (v == null || v === "" ? null : new Date(typeof v === "number" ? v : Date.parse(v) || Number(v)));
const lower = (e) => String(e || "").trim().toLowerCase();

/* ---------------------------- Users ------------------------------- */
// Make sure an account row exists (foreign keys point at it); fills in the name if we learn it.
export const ensureUser = async (email, fields = {}) => {
  const e = lower(email);
  if (!e) return;
  const set = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined && v !== null && v !== ""));
  await db().insert(S.users).values({ email: e, ...set })
    .onConflictDoUpdate({ target: S.users.email, set: Object.keys(set).length ? { ...set, updatedAt: new Date() } : { updatedAt: sql`${S.users.updatedAt}` } });
};
const profileOf = (u) => (u ? {
  name: u.name || "", studentId: u.studentId || "", photo: u.avatarUrl || "", telegram: u.telegram || "", whatsapp: u.whatsapp || "",
  tgChat: u.telegramChatId || "", theme: u.theme || "", notifyEmail: u.notifyEmail, notifyTelegram: u.notifyTelegram,
  legal: u.legalVersion ? { version: u.legalVersion, at: ms(u.legalAcceptedAt) } : null,
} : {});
export const getProfile = async (email) => {
  const [u] = await db().select().from(S.users).where(eq(S.users.email, lower(email))).limit(1);
  return profileOf(u);
};
// Partial update: only the fields given are changed.
export const saveProfile = async (email, p) => {
  const map = {
    name: p.name, studentId: p.studentId, avatarUrl: p.photo, telegram: p.telegram, telegramChatId: p.tgChat, whatsapp: p.whatsapp,
    theme: p.theme, notifyEmail: p.notifyEmail, notifyTelegram: p.notifyTelegram,
    legalVersion: p.legal && p.legal.version, legalAcceptedAt: p.legal && dt(p.legal.at),
  };
  const set = Object.fromEntries(Object.entries(map).filter(([, v]) => v !== undefined));
  const e = lower(email);
  await db().insert(S.users).values({ email: e, ...set }).onConflictDoUpdate({ target: S.users.email, set: { ...set, updatedAt: new Date() } });
};
// Passwords (only /api/otp reads these; the hash never leaves the server).
export const getAuth = async (email) => {
  const [u] = await db().select({ hash: S.users.passwordHash, failed: S.users.failedLogins, lockedUntil: S.users.lockedUntil, name: S.users.name, studentId: S.users.studentId,
    photo: S.users.avatarUrl, telegram: S.users.telegram, whatsapp: S.users.whatsapp })
    .from(S.users).where(eq(S.users.email, lower(email))).limit(1);
  return u ? { ...u, lockedUntil: ms(u.lockedUntil) } : null;
};
export const setPassword = async (email, hash) => {
  const set = { passwordHash: hash, passwordChangedAt: new Date(), failedLogins: 0, lockedUntil: null, updatedAt: new Date() };
  await db().insert(S.users).values({ email: lower(email), ...set }).onConflictDoUpdate({ target: S.users.email, set });
};
export const recordLogin = async (email, ok, lockUntil = null) => {
  await db().update(S.users).set(ok ? { failedLogins: 0, lockedUntil: null } : { failedLogins: sql`${S.users.failedLogins} + 1`, lockedUntil: lockUntil ? new Date(lockUntil) : null })
    .where(eq(S.users.email, lower(email)));
};
export const emailByTelegramChat = async (chatId) => {
  const [u] = await db().select({ email: S.users.email }).from(S.users).where(eq(S.users.telegramChatId, String(chatId))).limit(1);
  return u ? u.email : null;
};
export const emailByTelegramUsername = async (username) => {
  const [u] = await db().select({ email: S.users.email }).from(S.users).where(sql`lower(${S.users.telegram}) = ${lower(username)}`).limit(1);
  return u ? u.email : null;
};

/* ---------------------------- Clubs & roles ----------------------- */
export const seedClubs = async () => {
  const slugs = (await import("../src/data/clubs.js")).CLUB_SLUGS;
  for (const c of CLUBS) {
    await db().insert(S.clubs).values({ id: c.id, slug: slugs[c.id] || String(c.id), name: c.name, category: c.category, leadEmail: c.lead && c.lead.email })
      .onConflictDoUpdate({ target: S.clubs.id, set: { name: c.name, category: c.category, slug: slugs[c.id] || String(c.id), leadEmail: c.lead && c.lead.email } });
  }
};
const envOwners = () => { try { return JSON.parse(process.env.CLUB_OWNERS || "{}"); } catch (e) { return {}; } };
export const getRoles = async (clubId) => {
  const rows = await db().select().from(S.clubRoles).where(eq(S.clubRoles.clubId, Number(clubId))).orderBy(asc(S.clubRoles.createdAt));
  const c = CLUBS.find((x) => x.id === Number(clubId));
  const owner = lower((rows.find((r) => r.role === "owner") || {}).userEmail || envOwners()[clubId] || (c && c.lead && c.lead.email));
  return { owner, helpers: rows.filter((r) => r.role === "helper" && r.userEmail !== owner).map((r) => r.userEmail) };
};
export const saveRoles = async (clubId, { owner, helpers }) => {
  const id = Number(clubId);
  for (const e of [owner, ...helpers].filter(Boolean)) await ensureUser(e);
  await db().delete(S.clubRoles).where(and(eq(S.clubRoles.clubId, id), eq(S.clubRoles.role, "helper")));
  if (owner) {
    await db().delete(S.clubRoles).where(and(eq(S.clubRoles.clubId, id), eq(S.clubRoles.role, "owner"), ne(S.clubRoles.userEmail, lower(owner))));
    await db().insert(S.clubRoles).values({ clubId: id, userEmail: lower(owner), role: "owner" })
      .onConflictDoUpdate({ target: [S.clubRoles.clubId, S.clubRoles.userEmail], set: { role: "owner" } });
  }
  for (const h of helpers) await db().insert(S.clubRoles).values({ clubId: id, userEmail: lower(h), role: "helper" }).onConflictDoNothing();
};

/* ---------------------------- Memberships & waitlist -------------- */
export const setMembership = async (clubId, email, status = "joined", source = "app") => {
  await ensureUser(email);
  await db().insert(S.memberships).values({ clubId: Number(clubId), userEmail: lower(email), status, source })
    .onConflictDoUpdate({ target: [S.memberships.clubId, S.memberships.userEmail], set: { status } });
};
export const removeMembership = (clubId, email) => db().delete(S.memberships).where(and(eq(S.memberships.clubId, Number(clubId)), eq(S.memberships.userEmail, lower(email))));
export const listMemberships = (email) => db().select().from(S.memberships).where(eq(S.memberships.userEmail, lower(email)));
// The app's saved memberships/waitlist (one account): rows not in the list are removed.
export const syncMemberships = async (email, list) => {
  const e = lower(email), keep = list.filter((m) => CLUBS.some((c) => c.id === Number(m.clubId)));
  await ensureUser(e);
  const ids = keep.map((m) => Number(m.clubId));
  await db().delete(S.memberships).where(ids.length ? and(eq(S.memberships.userEmail, e), sql`${S.memberships.clubId} not in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})`) : eq(S.memberships.userEmail, e));
  for (const m of keep) await setMembership(m.clubId, e, m.status === "pending" ? "pending" : "joined", m.source || "app");
};
export const syncWaitlist = async (email, eventRefs) => {
  const e = lower(email), refs = [...new Set(eventRefs.map(String))].slice(0, 100);
  await ensureUser(e);
  await db().delete(S.waitlist).where(refs.length ? and(eq(S.waitlist.userEmail, e), sql`${S.waitlist.eventRef} not in (${sql.join(refs.map((r) => sql`${r}`), sql`, `)})`) : eq(S.waitlist.userEmail, e));
  // Only events that exist (the table points at events): unknown refs are skipped instead of failing the sync.
  const known = refs.length ? (await db().select({ ref: S.events.ref }).from(S.events).where(inArray(S.events.ref, refs))).map((r) => r.ref) : [];
  for (const r of known) await db().insert(S.waitlist).values({ eventRef: r, userEmail: e }).onConflictDoNothing();
};

/* ---------------------------- Club applications ------------------ */
const clubName = (id) => (CLUBS.find((c) => c.id === Number(id)) || {}).name || "Club";
const appOf = (r) => r && {
  id: r.id, clubId: r.clubId, club: clubName(r.clubId), name: r.name, email: r.userEmail, whatsapp: r.whatsapp, year: r.year || "", message: r.message || "",
  consent: !!r.consentAt, consentVersion: r.consentVersion || "", status: r.status, at: ms(r.createdAt), updatedAt: ms(r.updatedAt),
  contactedAt: ms(r.contactedAt), acceptedAt: ms(r.acceptedAt), declinedAt: ms(r.declinedAt), remindedAt: ms(r.remindedAt), ...(r.decidedBy ? { by: r.decidedBy } : {}),
};
export const getApp = async (id) => { const [r] = await db().select().from(S.clubApplications).where(eq(S.clubApplications.id, id)).limit(1); return appOf(r); };
// Returns the new record, or { duplicate: existing } if the student already has an open application to this club.
export const insertApp = async (a) => {
  await ensureUser(a.email, { name: a.name });
  const prev = await findOpenApp(a.clubId, a.email);
  if (prev) return { duplicate: prev };
  try {
    const [r] = await db().insert(S.clubApplications).values({
      id: a.id, clubId: a.clubId, userEmail: lower(a.email), name: a.name, whatsapp: a.whatsapp, year: a.year || null, message: a.message || null,
      status: a.status || "new", consentAt: a.consent ? dt(a.consentAt || a.at || Date.now()) : null, consentVersion: a.consentVersion || null,
      createdAt: dt(a.at || Date.now()), updatedAt: dt(a.updatedAt || a.at || Date.now()),
      contactedAt: dt(a.contactedAt), acceptedAt: dt(a.acceptedAt), declinedAt: dt(a.declinedAt), remindedAt: dt(a.remindedAt), decidedBy: a.by || null,
    }).returning();
    return appOf(r);
  } catch (e) {
    const dup = await findOpenApp(a.clubId, a.email);
    if (dup) return { duplicate: dup };
    throw e;
  }
};
export const updateApp = async (id, fields) => {
  const map = { status: fields.status, contactedAt: dt(fields.contactedAt), acceptedAt: dt(fields.acceptedAt), declinedAt: dt(fields.declinedAt), remindedAt: dt(fields.remindedAt), decidedBy: fields.by };
  const set = Object.fromEntries(Object.entries(map).filter(([, v]) => v !== undefined && v !== null));
  const [r] = await db().update(S.clubApplications).set({ ...set, updatedAt: new Date() }).where(eq(S.clubApplications.id, id)).returning();
  return appOf(r);
};
export const findOpenApp = async (clubId, email) => {
  const [r] = await db().select().from(S.clubApplications)
    .where(and(eq(S.clubApplications.clubId, Number(clubId)), eq(S.clubApplications.userEmail, lower(email)), ne(S.clubApplications.status, "declined"))).limit(1);
  return appOf(r);
};
export const listClubApps = async (clubId) => (await db().select().from(S.clubApplications).where(eq(S.clubApplications.clubId, Number(clubId))).orderBy(desc(S.clubApplications.createdAt))).map(appOf);
export const listUserApps = async (email) => (await db().select().from(S.clubApplications).where(eq(S.clubApplications.userEmail, lower(email))).orderBy(desc(S.clubApplications.createdAt))).map(appOf);
// Still "new" 48 hours later and not reminded yet.
export const appsDueReminder = async () => (await db().select().from(S.clubApplications)
  .where(and(eq(S.clubApplications.status, "new"), isNull(S.clubApplications.remindedAt), lt(S.clubApplications.createdAt, new Date(Date.now() - 48 * 36e5)))).limit(50)).map(appOf);
// Privacy: declined applications are deleted 90 days after the decision.
export const purgeDeclinedApps = () => db().delete(S.clubApplications).where(and(eq(S.clubApplications.status, "declined"), lt(S.clubApplications.declinedAt, new Date(Date.now() - 90 * 864e5))));

/* ---------------------------- Events ------------------------------ */
const HEAVY = ["cover", "logo"];
const evOf = (r) => r && {
  ...(r.data || {}), ref: r.ref, status: r.status, kind: r.kind, title: r.title, at: (r.data && r.data.at) || ms(r.createdAt), updatedAt: ms(r.updatedAt),
  hasCover: !!r.hasCover, hasLogo: !!r.hasLogo, ...(r.taken != null ? { taken: Number(r.taken) } : {}), ...(r.tgMessageId ? { kbMsg: r.tgMessageId } : {}), ...(r.deletedAt ? { deletedAt: ms(r.deletedAt) } : {}),
};
const evCols = { ref: S.events.ref, status: S.events.status, kind: S.events.kind, title: S.events.title, data: S.events.data, createdAt: S.events.createdAt, updatedAt: S.events.updatedAt,
  tgMessageId: S.events.tgMessageId, deletedAt: S.events.deletedAt, hasCover: sql`${S.events.cover} is not null`.as("has_cover"), hasLogo: sql`${S.events.logo} is not null`.as("has_logo") };
export const getEvent = async (ref) => { const [r] = await db().select(evCols).from(S.events).where(eq(S.events.ref, ref)).limit(1); return evOf(r); };
// How many events students have sent in so far (numbers the applications in the admin chat: #1, #2, …).
export const countHosted = async () => Number((await db().select({ n: sql`count(*)` }).from(S.events).where(eq(S.events.source, "hosted")))[0].n) || 0;
export const eventExists = async (ref) => !!(await db().select({ ref: S.events.ref }).from(S.events).where(eq(S.events.ref, ref)).limit(1))[0];
// Insert or update the whole record (images are saved separately with saveEventImage).
export const saveEvent = async (rec, source = "hosted") => {
  const { hasCover, hasLogo, kbMsg, ...data } = rec;
  for (const k of HEAVY) delete data[k];
  if (rec.email) { await ensureUser(rec.email, { name: rec.accountName || undefined }); }
  const row = {
    ref: rec.ref, source, status: rec.status || "pending", kind: rec.kind || "own", title: rec.title || "Untitled", category: rec.category || null,
    date: rec.date || null, startTime: rec.start || null, endTime: rec.end || null, spots: Number(rec.spots) || null, price: Number(rec.price) || 0,
    venueName: rec.venueName || null, hostEmail: rec.email ? lower(rec.email) : null, data, tgMessageId: kbMsg || null,
    createdAt: dt(rec.at || Date.now()), updatedAt: dt(rec.updatedAt || Date.now()), deletedAt: dt(rec.deletedAt),
  };
  const { ref, createdAt, ...set } = row;
  await db().insert(S.events).values(row).onConflictDoUpdate({ target: S.events.ref, set });
  if (rec.email) await db().insert(S.eventHosts).values({ eventRef: rec.ref, userEmail: lower(rec.email) }).onConflictDoNothing();
};
// Events a student sent in (by the account they were signed in with, or the contact email on the form), newest first.
export const listHostedBy = async (email) => {
  const e = lower(email);
  return db().select({ ref: S.events.ref, status: S.events.status, data: S.events.data, createdAt: S.events.createdAt, hasLogo: sql`${S.events.logo} is not null` })
    .from(S.events)
    .where(and(eq(S.events.source, "hosted"), ne(S.events.status, "deleted"), or(eq(S.events.hostEmail, e), sql`lower(${S.events.data}->>'account') = ${e}`)))
    .orderBy(desc(S.events.createdAt)).limit(50);
};
export const saveEventImage = (ref, kind, dataUrl) => db().update(S.events).set(kind === "logo" ? { logo: dataUrl } : { cover: dataUrl }).where(eq(S.events.ref, ref));
export const getEventImage = async (ref, kind) => {
  const [r] = await db().select({ img: kind === "logo" ? S.events.logo : S.events.cover }).from(S.events).where(eq(S.events.ref, ref)).limit(1);
  return r ? r.img : null;
};
// With "taken": tickets issued so far (valid ones), so everyone sees the same availability.
export const listApprovedEvents = async () => (await db().select({ ...evCols, taken: sql`(select count(*)::int from tickets t where t.event_ref = ${S.events.ref} and t.status = 'valid')`.as("taken") }).from(S.events)
  .where(and(eq(S.events.status, "approved"), eq(S.events.source, "hosted"))).orderBy(asc(S.events.date)).limit(100)).map(evOf);
export const listActiveTrips = async () => (await db().select(evCols).from(S.events)
  .where(and(eq(S.events.kind, "trip"), eq(S.events.source, "hosted"), inArray(S.events.status, ["pending", "under_review", "approved"]))).limit(200)).map(evOf);

/* ---------------------------- Tickets ----------------------------- */
const tixOf = (r) => r && {
  id: r.id, ref: r.eventRef, at: ms(r.createdAt), name: r.name || "", email: r.userEmail || "", studentId: r.studentId || "", method: r.method || "", price: Number(r.price) || 0,
  checkedIn: ms(r.checkedInAt), refunded: r.status === "refunded", ...(r.refundedAt ? { refundedAt: ms(r.refundedAt) } : {}),
  delivery: r.dMode ? { mode: r.dMode, note: r.dNote || "", at: ms(r.dAt), fileName: r.dFileName || "" } : null,
};
const tixCols = {
  id: S.tickets.id, eventRef: S.tickets.eventRef, userEmail: S.tickets.userEmail, name: S.tickets.name, studentId: S.tickets.studentId, method: S.tickets.method,
  price: S.tickets.price, status: S.tickets.status, checkedInAt: S.tickets.checkedInAt, refundedAt: S.tickets.refundedAt, createdAt: S.tickets.createdAt,
  dMode: S.externalTicketDeliveries.mode, dNote: S.externalTicketDeliveries.note, dAt: S.externalTicketDeliveries.deliveredAt, dFileName: S.externalTicketDeliveries.fileName,
};
const tixQuery = () => db().select(tixCols).from(S.tickets).leftJoin(S.externalTicketDeliveries, eq(S.externalTicketDeliveries.ticketId, S.tickets.id));
export const getTickets = async (ref) => (await tixQuery().where(eq(S.tickets.eventRef, ref)).orderBy(asc(S.tickets.createdAt))).map(tixOf);
export const getTicket = async (ref, id) => { const [r] = await tixQuery().where(and(eq(S.tickets.eventRef, ref), eq(S.tickets.id, id))).limit(1); return tixOf(r); };
// Tickets issued per built-in event (the feed adds them to the seat counts everyone sees).
export const demoSeats = async () => Object.fromEntries((await db().select({ ref: S.tickets.eventRef, n: sql`count(*)::int` }).from(S.tickets)
  .where(and(eq(S.tickets.status, "valid"), sql`${S.tickets.eventRef} like 'DEMO-%'`)).groupBy(S.tickets.eventRef)).map((r) => [r.ref, Number(r.n)]));
// A student's own tickets with their event, newest first (so every device shows the same My Tickets).
export const listTicketsFor = async (email) => db().select({
  id: S.tickets.id, ref: S.tickets.eventRef, name: S.tickets.name, studentId: S.tickets.studentId, method: S.tickets.method, price: S.tickets.price,
  status: S.tickets.status, checkedInAt: S.tickets.checkedInAt, createdAt: S.tickets.createdAt,
  title: S.events.title, kind: S.events.kind, date: S.events.date, start: S.events.startTime, venue: S.events.venueName, data: S.events.data, hasLogo: sql`${S.events.logo} is not null`,
}).from(S.tickets).innerJoin(S.events, eq(S.events.ref, S.tickets.eventRef)).where(eq(S.tickets.userEmail, lower(email))).orderBy(desc(S.tickets.createdAt)).limit(100);
export const listWaitlist = async (email) => (await db().select({ ref: S.waitlist.eventRef }).from(S.waitlist).where(eq(S.waitlist.userEmail, lower(email)))).map((r) => r.ref);
export const countTickets = async (ref) => Number((await db().select({ n: sql`count(*)` }).from(S.tickets).where(eq(S.tickets.eventRef, ref)))[0].n) || 0;
// false if a ticket with this id already exists
export const insertTicket = async (t, qrId) => {
  if (t.email) await ensureUser(t.email, { name: t.name || undefined });
  const r = await db().insert(S.tickets).values({
    id: t.id, eventRef: t.ref, userEmail: t.email ? lower(t.email) : null, name: t.name || null, studentId: t.studentId || null, method: t.method || null,
    price: Number(t.price) || 0, status: t.refunded ? "refunded" : "valid", qrId, checkedInAt: dt(t.checkedIn), refundedAt: dt(t.refundedAt), createdAt: dt(t.at || Date.now()),
  }).onConflictDoNothing().returning({ id: S.tickets.id });
  return r.length > 0;
};
// Check-in, refund and delivery details (not the file itself).
export const saveTicket = async (t) => {
  await db().update(S.tickets).set({ checkedInAt: dt(t.checkedIn), status: t.refunded ? "refunded" : "valid", refundedAt: dt(t.refundedAt) }).where(eq(S.tickets.id, t.id));
  if (t.delivery) {
    const d = { mode: t.delivery.mode, note: t.delivery.note || null, fileName: t.delivery.fileName || null, deliveredAt: dt(t.delivery.at || Date.now()) };
    await db().insert(S.externalTicketDeliveries).values({ ticketId: t.id, ...d }).onConflictDoUpdate({ target: S.externalTicketDeliveries.ticketId, set: d });
  }
};
export const saveDeliveryFile = (ticketId, { type, name, data }) => db().update(S.externalTicketDeliveries)
  .set({ fileType: type, fileName: name, fileData: data }).where(eq(S.externalTicketDeliveries.ticketId, ticketId));
export const getDeliveryFile = async (ticketId) => {
  const [r] = await db().select({ type: S.externalTicketDeliveries.fileType, name: S.externalTicketDeliveries.fileName, data: S.externalTicketDeliveries.fileData })
    .from(S.externalTicketDeliveries).where(eq(S.externalTicketDeliveries.ticketId, ticketId)).limit(1);
  return r && r.data ? r : null;
};

/* ---------------------------- Notifications log ------------------- */
export const logNotification = (entry) => db().insert(S.notificationsLog).values({
  userEmail: entry.email ? lower(entry.email) : null, channel: entry.channel, kind: entry.kind || "other", subject: entry.subject ? String(entry.subject).slice(0, 200) : null,
  ref: entry.ref || null, ok: !!entry.ok,
}).catch(() => {});

/* ---------------------------- Meta -------------------------------- */
// Short-lived values when Redis isn't connected: locks (one sweep at a time) and one-time codes (Telegram connect).
export const tryLock = async (name, seconds) => {
  const r = await db().execute(sql`insert into app_meta (key, value, updated_at) values (${"lock:" + name}, '{}'::jsonb, now())
    on conflict (key) do update set updated_at = now() where app_meta.updated_at < now() - make_interval(secs => ${Number(seconds)}) returning key`);
  return (r.rows || r).length > 0;
};
export const unlock = (name) => db().delete(S.appMeta).where(eq(S.appMeta.key, "lock:" + name));
export const putCode = (code, email, seconds) => setMeta("code:" + code, { email, exp: Date.now() + seconds * 1000 });
export const takeCode = async (code) => {
  const v = await getMeta("code:" + code);
  if (v) await db().delete(S.appMeta).where(eq(S.appMeta.key, "code:" + code));
  return v && v.exp > Date.now() ? v.email : null;
};
export const getMeta = async (key) => { const [r] = await db().select().from(S.appMeta).where(eq(S.appMeta.key, key)).limit(1); return r ? r.value : null; };
export const setMeta = (key, value) => db().insert(S.appMeta).values({ key, value }).onConflictDoUpdate({ target: S.appMeta.key, set: { value, updatedAt: new Date() } });

