/* Club applications (every club except the sports teams, which keep the official UOWD tryouts form).
   Stored in Postgres (tables club_applications, club_roles, users, memberships; see db/schema.js):
   status new → contacted → accepted / declined, with timestamps. Declined applications are deleted 90 days after the
   decision. Redis keeps only short-lived things here: Telegram connect codes, the reminder lock, the bot name cache. */
import crypto from "node:crypto";
import { CLUBS } from "../src/data/clubs.js";
import { kv, tg, readToken, sendEmail, storeConfigured } from "./_lib.js";
import * as store from "./_store.js";

export const SITE = "https://uniteuow.com";
export const STATES = ["new", "contacted", "accepted", "declined"];
// Redis keys for short-lived things only.
export const A = {
  tgLink: (code) => `unite:tglink:${code}`,
  sweep: "unite:apps:sweep-lock",
  bot: "unite:bot-username",
};

export const APP_CLUBS = CLUBS.filter((c) => c.category !== "Sports");
export const clubById = (id) => APP_CLUBS.find((c) => c.id === Number(id));
export const isAppId = (v) => /^AP-[A-Z0-9]{8}$/.test(String(v || ""));
export const newAppId = () => `AP-${crypto.randomBytes(6).toString("base64url").replace(/[^A-Za-z0-9]/g, "").toUpperCase().padEnd(8, "X").slice(0, 8)}`;
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ---------------------------- Roles & profiles -------------------- */
// Owner: set on the Manage club screen / in the database, else CLUB_OWNERS='{"21":"name@uowdubai.ac.ae"}', else the club lead.
export const getRoles = (clubId) => store.getRoles(clubId);
export const saveRoles = (clubId, roles) => store.saveRoles(clubId, roles);
export const roleOf = (roles, email) => (email && roles.owner === email ? "owner" : roles.helpers.includes(email) ? "helper" : null);
export const team = (roles) => [roles.owner, ...roles.helpers].filter(Boolean);
export const getProfile = (email) => store.getProfile(email).catch(() => ({}));
export const saveProfile = (email, p) => store.saveProfile(email, p);

/* ---------------------------- Records ----------------------------- */
export const getApp = (id) => store.getApp(id);
// What the student sees about their own applications (no one else's details).
export const studentView = (a) => ({ id: a.id, clubId: a.clubId, club: a.club, status: a.status, at: a.at, updatedAt: a.updatedAt || a.at });

/* ---------------------------- Links -------------------------------- */
const sig = (label, v) => crypto.createHmac("sha256", `unite-apps:${label}:${process.env.OTP_SECRET || process.env.RESEND_API_KEY || readToken()}`).update(String(v)).digest("base64url").slice(0, 16);
export const linkSig = (id) => sig("wa", id);
export const linkOk = (id, s) => { const a = Buffer.from(linkSig(id)), b = Buffer.from(String(s || "")); return a.length === b.length && crypto.timingSafeEqual(a, b); };
export const waText = (a) => `Hi ${a.name.split(" ")[0]}, this is ${a.club} at UOWD — we saw your application on Unite!`;
export const waUrl = (a) => `https://wa.me/${a.whatsapp}?text=${encodeURIComponent(waText(a))}`;
// Tracked link: marks the application "contacted", then opens WhatsApp.
export const trackedWa = (a) => `${SITE}/api/apps?a=wa&id=${a.id}&k=${linkSig(a.id)}`;
export const mailto = (a) => `mailto:${a.email}?subject=${encodeURIComponent(`Your application to ${a.club}`)}`;
export const openUrl = (a) => `${SITE}/?manage=${a.clubId}`;

/* ---------------------------- Notifications ----------------------- */
const button = (href, label, bg) => `<a href="${esc(href)}" style="display:inline-block;margin:4px 6px 4px 0;padding:11px 16px;border-radius:10px;background:${bg};color:#fff;font-weight:600;font-size:14px;text-decoration:none">${esc(label)}</a>`;
const shell = (title, body) => `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 14px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:16px;padding:26px;border:1px solid #e2e8f0">
<tr><td style="font-size:12px;font-weight:700;letter-spacing:.12em;color:#741629;text-transform:uppercase">Unite · UOWD</td></tr>
<tr><td style="padding-top:6px;font-size:20px;font-weight:700;color:#0f172a">${esc(title)}</td></tr>
<tr><td style="padding-top:14px;font-size:14px;line-height:1.55;color:#334155">${body}</td></tr>
</table></td></tr></table></body></html>`;
const row = (k, v) => (v ? `<tr><td style="padding:3px 12px 3px 0;color:#64748b;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:3px 0;color:#0f172a">${esc(v)}</td></tr>` : "");
const details = (a) => `<table cellpadding="0" cellspacing="0" style="font-size:14px;margin:6px 0 12px">${row("Name", a.name)}${row("Year / major", a.year)}${row("Email", a.email)}${row("WhatsApp", `+${a.whatsapp}`)}</table>${a.message ? `<div style="background:#f8fafc;border-radius:10px;padding:12px;margin-bottom:14px;color:#0f172a">“${esc(a.message)}”</div>` : ""}`;

const tgKeyboard = (a) => ({ inline_keyboard: [[
  { text: "💬 WhatsApp", url: trackedWa(a) },
  { text: "✅ Accept", callback_data: `ca:a:${a.id}` },
  { text: "✖️ Decline", callback_data: `ca:d:${a.id}` },
]] });
export const tgCard = (a, heading) => [
  heading,
  "",
  `<b>${esc(a.name)}</b>${a.year ? ` · ${esc(a.year)}` : ""}`,
  a.message ? `“${esc(a.message)}”` : null,
  "",
  `✉️ ${esc(a.email)}`,
  `📱 +${esc(a.whatsapp)}`,
  `<i>Status: ${a.status}</i>`,
].filter((x) => x !== null).join("\n");

const tgSend = async (chatId, text, markup, meta = {}) => {
  const token = readToken();
  if (!token || !chatId) return false;
  const r = await tg(token, "sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...(markup ? { reply_markup: markup } : {}) }).catch(() => ({ ok: false }));
  if (store.dbConfigured()) store.logNotification({ ...meta, channel: "telegram", ok: r.ok });
  return r.ok;
};

// New application (or the 48-hour reminder) to the owner and every helper: email + Telegram if connected.
export const notifyTeam = async (a, reminder = false) => {
  const roles = await getRoles(a.clubId);
  const subject = reminder ? `Reminder: ${a.name} is waiting to hear from ${a.club}` : `New application to ${a.club}`;
  const intro = reminder ? `${esc(a.name)} applied to <b>${esc(a.club)}</b> two days ago and hasn't been contacted yet.` : `<b>${esc(a.name)}</b> wants to join <b>${esc(a.club)}</b>.`;
  const html = shell(subject, `${intro}${details(a)}${button(trackedWa(a), "Chat on WhatsApp", "#16a34a")}${button(mailto(a), "Reply by email", "#0f172a")}${button(openUrl(a), "Open in Unite", "#741629")}`);
  const text = `${subject}\n\n${a.name}${a.year ? ` (${a.year})` : ""}\n${a.message || ""}\n\nEmail: ${a.email}\nWhatsApp: +${a.whatsapp}\n\nChat on WhatsApp: ${trackedWa(a)}\nOpen in Unite: ${openUrl(a)}`;
  const kind = reminder ? "application_reminder" : "application_new";
  for (const email of team(roles)) {
    const p = await getProfile(email);
    if (p.notifyEmail !== false) await sendEmail(email, subject, text, html, { kind, ref: a.id });
    if (p.tgChat && p.notifyTelegram !== false) await tgSend(p.tgChat, tgCard(a, reminder ? `⏰ <b>Still waiting · ${esc(a.club)}</b>` : `📝 <b>New application · ${esc(a.club)}</b>`), tgKeyboard(a), { email, kind, subject, ref: a.id });
  }
};

// Decision to the student: email + Telegram if connected.
export const notifyStudent = async (a) => {
  const ok = a.status === "accepted";
  const subject = ok ? `You're in: ${a.club}` : `Your application to ${a.club}`;
  const body = ok
    ? `Great news: <b>${esc(a.club)}</b> accepted your application. The club is now in your memberships and its weekly sessions are in My Schedule.`
    : `Thanks for applying to <b>${esc(a.club)}</b>. The committee can't take you on this time, but there are plenty of other clubs on Unite and you're welcome to apply again later.`;
  const kind = ok ? "application_accepted" : "application_declined";
  const p = await getProfile(a.email);
  if (p.notifyEmail !== false) await sendEmail(a.email, subject, `${subject}\n\n${body.replace(/<[^>]+>/g, "")}\n\nUnite · uniteuow.com`, shell(subject, `${body}<div style="margin-top:14px">${button(SITE, "Open Unite", "#741629")}</div>`), { kind, ref: a.id });
  if (p.tgChat && p.notifyTelegram !== false) await tgSend(p.tgChat, ok ? `🎉 <b>${esc(a.club)}</b> accepted your application! Its sessions are now in your schedule on Unite.` : `Thanks for applying to <b>${esc(a.club)}</b>. They can't take you on this time — have a look at the other clubs on Unite.`, null, { email: a.email, kind, subject, ref: a.id });
};

// Owner/helper changes the status. Returns the updated record, or an error string.
export const setStatus = async (id, status, by) => {
  if (!STATES.includes(status) || status === "new") return "Unknown status.";
  const a = await getApp(id);
  if (!a) return "This application wasn't found (it may have been removed).";
  const roles = await getRoles(a.clubId);
  if (by !== "link" && !roleOf(roles, by)) return "Only this club's owner and helpers can do that.";
  if (a.status === status) return a;
  if (status === "contacted" && a.status !== "new") return a; // contacting never undoes a decision
  const next = await store.updateApp(id, { status, [`${status}At`]: Date.now(), ...(by !== "link" ? { by } : {}) });
  // Accepted: the club becomes one of the student's memberships. Declined after accepting: membership removed.
  if (status === "accepted") await store.setMembership(a.clubId, a.email, "joined", "application");
  if (status === "declined" && a.status === "accepted") await store.removeMembership(a.clubId, a.email);
  if (status === "accepted" || status === "declined") await notifyStudent(next);
  return next;
};

/* ---------------------------- 48-hour reminder & cleanup ---------- */
// Piggybacks on app traffic (the events feed and these API calls), at most every 10 minutes.
export const sweepApps = async () => {
  if (!store.dbConfigured()) return;
  if (storeConfigured()) { try { if ((await kv("SET", A.sweep, "1", "NX", "EX", "600")) !== "OK") return; } catch (e) { return; } }
  for (const a of await store.appsDueReminder()) {
    await store.updateApp(a.id, { remindedAt: Date.now() });
    await notifyTeam(a, true).catch((e) => console.error("Application reminder failed:", e && e.message));
  }
  await store.purgeDeclinedApps();
};

/* ---------------------------- Telegram connect -------------------- */
export const botUsername = async () => {
  try { const v = await kv("GET", A.bot); if (v) return v; } catch (e) { /* ask Telegram */ }
  const token = readToken();
  if (!token) return "";
  const r = await tg(token, "getMe", {}).catch(() => ({ ok: false }));
  const u = r.ok && r.data.result && r.data.result.username;
  if (u) await kv("SET", A.bot, u, "EX", "86400").catch(() => {});
  return u || "";
};
