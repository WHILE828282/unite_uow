/* Vercel serverless function: club applications.
   POST { a, s (session from /api/otp), ... }
     apply    { clubId, name, whatsapp, year, message, consent } → saves, notifies the owner and helpers
     mine     → the student's own applications (status only)
     manage   → clubs where you're owner/helper, with their applications and helpers
     status   { id, status: contacted|accepted|declined } → owner/helper only; the student is told on accept/decline
     helper   { clubId, op: add|remove, who: email or @telegram } → owner only
     profile  { name, telegram, whatsapp } → saved for notifications and @username lookup
     tglink   → t.me link that connects your Telegram to Unite notifications
     consent  { version, at } → which Terms / Privacy Policy version the user accepted, and when
   GET ?a=wa&id&k → marks the application "contacted", then opens WhatsApp (link used in emails and Telegram). */
import crypto from "node:crypto";
import { kv, storeConfigured, sessionEmail, readToken, ensureWebhook, ownerKey, holderKey, ticketCode } from "./_lib.js";
import { A, APP_CLUBS, clubById, isAppId, newAppId, getApp, studentView, getRoles, saveRoles, roleOf, getProfile, saveProfile,
  notifyTeam, setStatus, sweepApps, linkOk, waUrl, botUsername } from "./_apps.js";
import * as store from "./_store.js";
import { CLUBS } from "../src/data/clubs.js";

const str = (v, max) => String(v == null ? "" : v).trim().replace(/\s+/g, " ").slice(0, max);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
// "+971 50…", "0501234567" or "501234567" → 971501234567 (UAE by default).
export const waNumber = (v) => {
  const raw = String(v || "").trim();
  let d = raw.replace(/\D/g, "");
  if (raw.startsWith("00")) d = d.slice(2);
  else if (!raw.startsWith("+")) { if (d.startsWith("0")) d = `971${d.slice(1)}`; else if (d.length <= 9) d = `971${d}`; }
  return d.length >= 8 && d.length <= 15 ? d : "";
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { a, id, k } = req.query || {};
    if (a !== "wa" || !isAppId(id) || !linkOk(id, k) || !store.dbConfigured()) return res.status(400).send("This link isn't valid.");
    const app = await getApp(id).catch(() => null);
    if (!app) return res.status(404).send("This application is no longer available.");
    await setStatus(id, "contacted", "link").catch(() => {});
    res.setHeader("Cache-Control", "no-store");
    return res.redirect(302, waUrl(app));
  }
  if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ ok: false }); }
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const me = sessionEmail(b.s);
  if (!me) return res.status(401).json({ ok: false, code: "session", error: "Sign in with your UOWD email to use club applications." });
  if (!store.dbConfigured()) return res.status(503).json({ ok: false, code: "store", error: "Applications aren't available right now. Try again later." });
  sweepApps().catch(() => {});
  // Telegram must deliver button taps and /start links here (registered once, remembered in the database).
  if (readToken() && (b.a === "tglink" || b.a === "apply")) await ensureWebhook(readToken(), req).catch(() => {});

  try {
    if (b.a === "apply") {
      const c = clubById(b.clubId);
      if (!c) return res.status(400).json({ ok: false, error: "This club doesn't take applications here." });
      const name = str(b.name, 60), year = str(b.year, 60), message = str(b.message, 300), whatsapp = waNumber(b.whatsapp);
      if (name.length < 2) return res.status(400).json({ ok: false, field: "name", error: "Enter your name." });
      if (!whatsapp) return res.status(400).json({ ok: false, field: "whatsapp", error: "Enter a WhatsApp number with country code, e.g. +971 50 123 4567." });
      if (b.consent !== true) return res.status(400).json({ ok: false, field: "consent", error: "Tick the box to share your contact details with the club." });
      // One open application per student per club (enforced by a unique index too).
      const r = await store.insertApp({ id: newAppId(), clubId: c.id, name, email: me, whatsapp, year, message, consent: true, consentAt: Date.now(),
        consentVersion: str(b.legalVersion, 20) || null, status: "new", at: Date.now() });
      if (r.duplicate) return res.status(409).json({ ok: false, code: "duplicate", error: `You've already applied to ${c.name}.`, app: studentView(r.duplicate) });
      const app = r;
      await saveProfile(me, { name, whatsapp });
      await notifyTeam(app).catch((e) => console.error("Application notify failed:", e && e.message));
      return res.status(200).json({ ok: true, app: studentView(app) });
    }

    if (b.a === "mine") return res.status(200).json({ ok: true, apps: (await store.listUserApps(me)).map(studentView) });

    if (b.a === "manage") {
      const out = [];
      for (const c of APP_CLUBS) {
        const roles = await getRoles(c.id), role = roleOf(roles, me);
        if (role) out.push({ clubId: c.id, club: c.name, role, owner: roles.owner, helpers: roles.helpers, apps: await store.listClubApps(c.id) });
      }
      return res.status(200).json({ ok: true, clubs: out });
    }

    if (b.a === "status") {
      if (!isAppId(b.id)) return res.status(400).json({ ok: false, error: "Unknown application." });
      const r = await setStatus(b.id, String(b.status || ""), me);
      if (typeof r === "string") return res.status(403).json({ ok: false, error: r });
      return res.status(200).json({ ok: true, app: r });
    }

    if (b.a === "helper") {
      const c = clubById(b.clubId);
      if (!c) return res.status(400).json({ ok: false, error: "Unknown club." });
      const roles = await getRoles(c.id);
      if (roleOf(roles, me) !== "owner") return res.status(403).json({ ok: false, error: "Only the club owner can change helpers." });
      const who = String(b.who || "").trim().toLowerCase();
      let email = who;
      if (who.startsWith("@") || (!who.includes("@") && who)) email = (await store.emailByTelegramUsername(who.replace(/^@/, ""))) || "";
      if (!isEmail(email)) return res.status(400).json({ ok: false, error: who.includes("@") && !who.startsWith("@") ? "Enter a valid email." : "No Unite user has that Telegram username yet. Use their email instead." });
      const helpers = b.op === "remove" ? roles.helpers.filter((h) => h !== email) : [...new Set([...roles.helpers, email])].filter((h) => h !== roles.owner).slice(0, 10);
      await saveRoles(c.id, { owner: roles.owner, helpers });
      return res.status(200).json({ ok: true, helpers });
    }

    if (b.a === "profile") {
      const prev = await getProfile(me);
      const telegram = str(b.telegram, 32).replace(/^@/, "");
      await saveProfile(me, {
        name: str(b.name, 60) || undefined, studentId: b.studentId !== undefined ? str(b.studentId, 20) : undefined,
        telegram: b.telegram === undefined ? undefined : /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(telegram) ? telegram : telegram ? undefined : "",
        whatsapp: waNumber(b.whatsapp) || (b.whatsapp === "" ? "" : undefined),
        photo: typeof b.photo === "string" && (b.photo === "" || (/^data:image\/(jpeg|png|webp);base64,/.test(b.photo) && b.photo.length < 400000)) ? b.photo : undefined,
        theme: ["light", "dark"].includes(b.theme) ? b.theme : undefined,
        notifyEmail: typeof b.notifyEmail === "boolean" ? b.notifyEmail : undefined,
        notifyTelegram: typeof b.notifyTelegram === "boolean" ? b.notifyTelegram : undefined,
      });
      return res.status(200).json({ ok: true, tgLinked: !!prev.tgChat });
    }

    // The app's own copy of memberships and waitlist, saved to the account (so they follow you to another device).
    if (b.a === "sync") {
      const clubsIn = Array.isArray(b.memberships) ? b.memberships.slice(0, 60) : null;
      if (clubsIn) await store.syncMemberships(me, clubsIn.filter((m) => m && CLUBS.some((c) => c.id === Number(m.clubId))).map((m) => ({ clubId: Number(m.clubId), status: m.status === "pending" ? "pending" : "joined", source: m.source === "tryout" ? "tryout" : "app" })));
      if (Array.isArray(b.waitlist)) await store.syncWaitlist(me, b.waitlist.map((x) => str(x, 20)).filter(Boolean));
      const memberships = (await store.listMemberships(me)).map((m) => ({ clubId: m.clubId, status: m.status, at: m.joinedAt ? new Date(m.joinedAt).getTime() : null }));
      return res.status(200).json({ ok: true, memberships, waitlist: await store.listWaitlist(me) });
    }

    // Your tickets, so every device you sign in on shows the same My Tickets (with the signed QR code).
    if (b.a === "tickets") {
      const tickets = (await store.listTicketsFor(me)).map((t) => {
        const d = t.data || {};
        return { id: t.id, ref: t.ref, key: holderKey(t.id), qr: ticketCode(t.id), at: t.createdAt ? new Date(t.createdAt).getTime() : Date.now(), name: t.name || "", studentId: t.studentId || "",
          method: t.method || "", price: Number(t.price) || 0, refunded: t.status === "refunded", checkedIn: t.checkedInAt ? new Date(t.checkedInAt).getTime() : null,
          title: t.title, kind: t.kind || "own", date: t.date, start: t.start, time: d.time || "", where: d.where || (d.room ? `${t.venue}, ${d.room}` : t.venue) || "",
          partyAt: d.at || null, demoId: d.demoId || null, logo: t.hasLogo ? `/api/events?img=${t.ref}&kind=logo` : d.logoUrl || null,
          ...(t.kind === "trip" ? { extName: d.extName, collectUntil: d.collectUntil } : {}) };
      });
      return res.status(200).json({ ok: true, tickets });
    }

    // Your hosted-event applications, so every device you sign in on shows the same My Events.
    if (b.a === "hosted") {
      const img = (ref, kind) => `/api/events?img=${ref}&kind=${kind}&k=${ownerKey(ref)}`;
      const events = (await store.listHostedBy(me)).map((r) => {
        const { account: _a, accountName: _n, verified: _v, no: _no, ...d } = r.data || {};
        return { ...d, ref: r.ref, key: ownerKey(r.ref), moderated: true, mod: r.status, at: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
          cover: img(r.ref, "cover"), logo: r.hasLogo ? img(r.ref, "logo") : null };
      });
      return res.status(200).json({ ok: true, events });
    }

    if (b.a === "consent") {
      const version = str(b.version, 20), at = Number(b.at) || Date.now();
      if (!/^\d{4}-\d{2}-\d{2}(\.\d{1,3})?$/.test(version)) return res.status(400).json({ ok: false, error: "Unknown version." });
      await saveProfile(me, { legal: { version, at } });
      return res.status(200).json({ ok: true });
    }

    if (b.a === "tglink") {
      if (!storeConfigured()) return res.status(503).json({ ok: false, error: "Telegram connect isn't available right now." });
      const bot = await botUsername();
      if (!bot) return res.status(503).json({ ok: false, error: "Telegram isn't set up yet." });
      const code = crypto.randomBytes(12).toString("base64url");
      await kv("SET", A.tgLink(code), me, "EX", "900");
      return res.status(200).json({ ok: true, url: `https://t.me/${bot}?start=${code}`, linked: !!(await getProfile(me)).tgChat });
    }

    return res.status(400).json({ ok: false, error: "Unknown action." });
  } catch (e) {
    console.error("Applications API failed:", e && e.message);
    return res.status(500).json({ ok: false, error: "Something went wrong. Please try again." });
  }
}
