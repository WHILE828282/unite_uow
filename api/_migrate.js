/* Seed data and the one-time copy of permanent data from Redis into Postgres.
   Both are idempotent: running them again never duplicates or overwrites newer Postgres rows
   (inserts skip rows that already exist). Used by scripts/migrate.mjs on deploy and by the /admin page. */
import { PARTIES } from "../src/data/events.js";
import { OFFICIAL, OFFICIAL_ID, clubOf, officialRef } from "../src/data/official.js";
import { kv, storeConfigured, ticketCode, isRef, isTicketId } from "./_lib.js";
import * as store from "./_store.js";
import { db } from "../db/client.js";
import { sql } from "drizzle-orm";

const to24 = (t) => { const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(t || ""); if (!m) return null; const h = (Number(m[1]) % 12) + (/pm/i.test(m[3]) ? 12 : 0); return `${String(h).padStart(2, "0")}:${m[2]}`; };

/* ---------------------------- Seed -------------------------------- */
const DEMO_OWNER = "demo@uniteuow.com";
const DEMO_APPS = [
  { id: "AP-DEMO0001", name: "Aisha Rahman", email: "aisha.rahman@uowmail.edu.au", whatsapp: "971501234567", year: "Year 2 · Media & Communication", message: "I sing and play keys, and I'd love to join a band for the open mic nights. I've performed at school concerts for 4 years.", status: "new", hoursAgo: 3 },
  { id: "AP-DEMO0002", name: "Omar Haddad", email: "omar.haddad@uowmail.edu.au", whatsapp: "971559876543", year: "Year 1 · Computer Science", message: "Self-taught drummer looking for people to jam with on Mondays. Happy to help set up gear for events too.", status: "new", hoursAgo: 26 },
  { id: "AP-DEMO0003", name: "Priya Nair", email: "priya.nair@uowmail.edu.au", whatsapp: "971524567890", year: "Year 3 · Business", message: "Guitar and vocals. I can also help with promotion for the club's gigs on Instagram.", status: "contacted", hoursAgo: 52 },
];
export const seed = async () => {
  await store.seedClubs();
  // Built-in demo events (shown by the app from its own data; stored here so the admin sees everything in one place).
  for (const p of PARTIES) {
    const ref = `DEMO-${p.id}`;
    if (await store.eventExists(ref)) continue;
    const { cover, logo, ...rest } = p;
    await store.saveEvent({ ...rest, ref, status: "approved", kind: "own", title: p.title, category: p.category, date: p.date, start: to24(p.time), price: p.price, spots: p.spots,
      venueName: p.where, coverUrl: cover || null, logoUrl: logo || null, demoId: p.id }, "demo");
  }
  // Official UOWD events (free, RSVP). demoId is the feed id, so tickets synced to a new device find their event.
  for (const o of OFFICIAL) {
    const club = clubOf(o);
    await store.upsertOfficial({ ...o, ref: officialRef(o.n), official: true, demoId: OFFICIAL_ID(o.n), title: o.title, category: o.category,
      clubId: club ? club.id : null, host: club ? club.name : o.host || "UOWD", venueName: o.where || (club && club.where) || "Campus-wide", spots: 1000 });
  }
  // Demo account owns Music Club, with three sample applications.
  const roles = await store.getRoles(21);
  if (!roles.owner || roles.owner === "studentlife@uowdubai.ac.ae") await store.saveRoles(21, { owner: DEMO_OWNER, helpers: roles.helpers });
  await store.ensureUser(DEMO_OWNER, { name: "Demo Student" });
  for (const a of DEMO_APPS) {
    if (await store.getApp(a.id)) continue;
    const at = Date.now() - a.hoursAgo * 36e5;
    await store.insertApp({ ...a, clubId: 21, consent: true, consentAt: at, at, updatedAt: at, ...(a.status === "contacted" ? { contactedAt: at + 20 * 36e5 } : {}) });
  }
  return { clubs: true, demoEvents: PARTIES.length, officialEvents: OFFICIAL.length, demoApps: DEMO_APPS.length };
};

/* ---------------------------- Copy from Redis ---------------------- */
const scan = async (pattern) => {
  const keys = new Set();
  let cursor = "0";
  for (let i = 0; i < 500; i++) {
    const [next, batch] = await kv("SCAN", cursor, "MATCH", pattern, "COUNT", "500");
    (batch || []).forEach((k) => keys.add(k));
    cursor = String(next);
    if (cursor === "0") break;
  }
  return [...keys];
};
const json = (v) => { try { return v ? JSON.parse(v) : null; } catch (e) { return null; } };
const hgetall = async (key) => { const raw = (await kv("HGETALL", key)) || []; const out = []; for (let i = 0; i + 1 < raw.length; i += 2) { const v = json(raw[i + 1]); if (v) out.push(v); } return out; };

// Copies events (+ images), tickets (+ delivered files), club applications, roles and profiles.
// dryRun: only counts what would be copied.
export const copyFromRedis = async ({ dryRun = false } = {}) => {
  if (!storeConfigured()) return { ok: false, error: "Redis isn't configured on this deployment." };
  const report = { events: 0, images: 0, tickets: 0, files: 0, applications: 0, roles: 0, users: 0, skipped: 0, errors: [] };
  const note = (e, what) => { report.errors.push(`${what}: ${String((e && e.message) || e).slice(0, 160)}`); };

  // Users first (foreign keys point at them).
  for (const key of await scan("unite:user:*")) {
    const email = key.slice("unite:user:".length);
    const p = json(await kv("GET", key));
    if (!p || !email.includes("@")) continue;
    report.users++;
    if (dryRun) continue;
    try { await store.saveProfile(email, { name: p.name || undefined, telegram: p.telegram || undefined, whatsapp: p.whatsapp || undefined, tgChat: p.tgChat || undefined, legal: p.legal || undefined }); }
    catch (e) { note(e, `user ${email}`); }
  }

  for (const key of await scan("unite:pitch:*")) {
    const ref = key.slice("unite:pitch:".length);
    if (!isRef(ref)) continue;
    const rec = json(await kv("GET", key));
    if (!rec) continue;
    report.events++;
    const exists = await store.eventExists(ref);
    if (!dryRun && !exists) {
      try { await store.saveEvent({ ...rec, ref }); } catch (e) { note(e, `event ${ref}`); continue; }
    } else if (exists) report.skipped++;
    for (const kind of ["cover", "logo"]) {
      const img = await kv("GET", `unite:img:${ref}:${kind}`);
      if (!img) continue;
      report.images++;
      if (!dryRun && !(await store.getEventImage(ref, kind))) await store.saveEventImage(ref, kind, img).catch((e) => note(e, `image ${ref} ${kind}`));
    }
    for (const t of await hgetall(`unite:tix:${ref}`)) {
      if (!isTicketId(t.id)) continue;
      report.tickets++;
      if (dryRun) continue;
      try {
        const added = await store.insertTicket({ ...t, ref }, ticketCode(t.id));
        if (added && t.delivery) await store.saveTicket({ ...t, ref });
        const meta = t.delivery && t.delivery.mode === "file" ? json(await kv("GET", `unite:tixfile:${t.id}:meta`)) : null;
        if (meta && !(await store.getDeliveryFile(t.id))) {
          const parts = await kv("MGET", ...Array.from({ length: meta.chunks }, (_, i) => `unite:tixfile:${t.id}:${i}`));
          if (parts.every(Boolean)) { await store.saveDeliveryFile(t.id, { type: meta.type, name: meta.name, data: parts.join("") }); report.files++; }
        }
      } catch (e) { note(e, `ticket ${t.id}`); }
    }
  }

  for (const key of await scan("unite:app:*")) {
    const a = json(await kv("GET", key));
    if (!a || !a.id) continue;
    report.applications++;
    if (dryRun) continue;
    if (await store.getApp(a.id)) { report.skipped++; continue; }
    try { await store.insertApp({ ...a, consentAt: a.at }); } catch (e) { note(e, `application ${a.id}`); }
  }

  for (const key of await scan("unite:roles:*")) {
    if (key === "unite:roles:index") continue;
    const clubId = Number(key.slice("unite:roles:".length));
    const r = json(await kv("GET", key));
    if (!clubId || !r) continue;
    report.roles++;
    if (dryRun) continue;
    try {
      const current = await store.getRoles(clubId);
      await store.saveRoles(clubId, { owner: r.owner || current.owner, helpers: [...new Set([...(current.helpers || []), ...(r.helpers || [])])] });
    } catch (e) { note(e, `roles ${clubId}`); }
  }

  if (!dryRun) await store.setMeta("redis_copy", { at: Date.now(), report });
  return { ok: true, dryRun, report };
};

// Row counts for the admin page.
export const counts = async () => {
  const n = async (t) => { const r = await db().execute(sql.raw(`select count(*)::int as n from ${t}`)); return Number((r.rows || r)[0].n); };
  const out = {};
  for (const t of ["users", "clubs", "club_roles", "memberships", "club_applications", "events", "tickets", "external_ticket_deliveries", "waitlist", "notifications_log"]) out[t] = await n(t).catch(() => null);
  return out;
};
