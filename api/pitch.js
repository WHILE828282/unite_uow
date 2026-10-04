/* Vercel serverless function: forwards a party pitch from the Unite app to the admin Telegram chat.
   The bot token stays server-side (set TELEGRAM_BOT_TOKEN in the Vercel project settings); it must
   never be shipped in browser code, where anyone could read it and take over the bot. */

import crypto from "node:crypto";
import { CHAT_ID, tokenVar, readToken, telegramVarNames, deployment, tg, explain, ownerKey, ownerOk, isRef, getPitch, savePitch, getTickets, moderationKeyboard, ensureWebhook, dubaiMs, collectMs } from "./_lib.js";
import { dbConfigured, eventExists, saveEventImage } from "./_store.js";
import { db } from "../db/client.js";
import { sql } from "drizzle-orm";

const MAX_MESSAGE = 4096; // Telegram sendMessage limit

const str = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const isHttps = (u) => { try { return new URL(u).protocol === "https:"; } catch (e) { return false; } };
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
// Artwork arrives as the app's processed upload: a base64 WebP/JPEG/PNG data URL (cover 1600x900, logo 512x512).
const MAX_IMAGE_CHARS = 2_800_000; // ~2 MB of image data
const parseImage = (v) => {
  const m = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(String(v || ""));
  if (!m || v.length > MAX_IMAGE_CHARS) return null;
  return { type: m[1], data: Buffer.from(m[2], "base64") };
};

function buildMessage(p) {
  const full = buildParts(p);
  if (full.length <= MAX_MESSAGE) return full;
  const over = full.length - MAX_MESSAGE + 20;
  return buildParts({ ...p, pitch: p.pitch.slice(0, Math.max(0, p.pitch.length - over)) + " …(cut)" });
}

function buildParts(p) {
  const line = (label, value) => (value ? `<b>${label}:</b> ${esc(value)}` : null);
  const link = (label, url) => (url ? `<b>${label}:</b> <a href="${esc(url)}">${esc(url)}</a>` : null);
  const price = Number(p.price) > 0 ? `${Number(p.price)} AED` : "Free";
  const parts = [
    "🔔 <b>NEW EVENT PITCH FOR UNITE</b>",
    "",
    p.kind === "trip" ? "🚌 <b>GROUP TRIP TO AN EXTERNAL EVENT</b>" : "🏠 <b>OUR OWN EVENT</b>",
    line("Event Name", p.title),
    line("Event Type", p.category),
    line("Language", p.lang),
    line("When", `${p.date} · ${p.start}–${p.end}`),
    line("Spots / Price", `${p.spots} spots · ${price}`),
    ...(p.kind === "trip" ? [
      "",
      "🎫 <b>Group trip</b>",
      line("External Event", p.extName),
      line("Official Ticket Seller", p.seller),
      line("Minimum Group", `${p.minGroup} people`),
      line("Collect Payments Until", `${p.collectUntil} 23:59 (Dubai)`),
    ] : []),
    "",
    "📍 <b>Venue</b>",
    line("Venue Name", p.room ? `${p.venueName} (${p.room})` : p.venueName),
    link("Google Maps URL", p.mapsUrl) || "<b>Google Maps URL:</b> not provided",
    "",
    "👤 <b>Organizer Contacts</b>",
    line("WhatsApp", p.whatsapp) || "<b>WhatsApp:</b> not provided",
    line("Telegram", p.telegram ? `@${p.telegram}` : "") || "<b>Telegram:</b> not provided",
    line("Email", p.email),
    line("Student ID", p.studentId),
    "",
    "🖼 <b>Artwork:</b> cover photo and logo attached below",
    p.dress || p.reqs ? "" : null,
    line("Dress Code", p.dress),
    line("Requirements", p.reqs),
    "",
    "📝 <b>Detailed Description:</b>",
    esc(p.pitch),
    "",
    p.moderated ? "👇 <b>Decide with the buttons under the photo below.</b>" : null,
    p.moderated ? "" : null,
    `<i>Ref ${esc(p.ref)} · submitted by ${p.accountName ? esc(p.accountName) + " · " : ""}${esc(p.account || p.email)}${p.verified ? " (✅ email verified)" : " (demo login, email not verified)"}</i>`,
  ].filter((x) => x !== null);
  return parts.join("\n");
}

const MAX_STORED_IMAGE = 950_000; // database request limit is ~1 MB; larger artwork stays in Telegram only
const newRef = () => "UN-" + Array.from(crypto.randomBytes(6), (x) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[x % 32]).join("");

export default async function handler(req, res) {
  const token = readToken();
  // GET /api/pitch: setup check for the admin (reports status only, never the token).
  if (req.method === "GET") {
    if (!token) {
      const names = telegramVarNames();
      return res.status(200).json({
        configured: false, deployment: deployment(), telegramVariablesSeen: names,
        help: names.length
          ? `Found ${names.join(", ")} but it is empty. Paste the token from @BotFather as its value, save, then redeploy.`
          : `This deployment (${deployment().environment}) has no TELEGRAM_BOT_TOKEN. In Vercel open the project that serves this domain → Settings → Environment Variables, add TELEGRAM_BOT_TOKEN with Production ticked, save, then Deployments → latest → Redeploy.`,
      });
    }
    if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(token)) return res.status(200).json({ configured: true, variable: tokenVar(), tokenLooksValid: false, help: "TELEGRAM_BOT_TOKEN doesn't look like a bot token (expected 123456789:ABC…). Copy it again from @BotFather." });
    try {
      const me = await tg(token, "getMe");
      if (!me.ok) return res.status(200).json({ configured: true, tokenValid: false, help: explain(me.data, token) });
      const chat = await tg(token, "getChat", { chat_id: CHAT_ID });
      // Moderation buttons: need the database, and Telegram must know where to send clicks.
      let moderation = { database: dbConfigured() };
      if (moderation.database) {
        try { await db().execute(sql`select 1`); } catch (e) { moderation = { database: false, databaseError: e.message }; }
      }
      if (moderation.database) {
        const hook = await ensureWebhook(token, req, "force" in (req.query || {}));
        const info = await tg(token, "getWebhookInfo");
        moderation = { ...moderation, webhook: (info.ok && info.data.result.url) || null, webhookError: hook.ok ? (info.ok && info.data.result.last_error_message) || null : hook.error };
      }
      const modHelp = !moderation.database
        ? " Moderation buttons are off: connect a database (Vercel → Storage → Upstash for Redis → Connect to this project), then redeploy."
        : moderation.webhookError ? ` Moderation buttons: ${moderation.webhookError}` : " Moderation buttons are on.";
      return res.status(200).json({
        configured: true, variable: tokenVar(), deployment: deployment(), tokenValid: true, bot: `@${me.data.result.username}`, chatId: CHAT_ID, chatReachable: chat.ok,
        moderation,
        help: chat.ok ? `All set: party pitches will be delivered.${modHelp}` : explain(chat.data, token),
      });
    } catch (e) {
      return res.status(200).json({ configured: true, help: "Couldn't reach Telegram from the server. Try again in a minute." });
    }
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is missing for this deployment; pitch not forwarded.", deployment(), telegramVarNames());
    return res.status(200).json({ ok: true, delivered: false });
  }

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== "object") return res.status(400).json({ ok: false, error: "Invalid request." });
  if (b.website) return res.status(200).json({ ok: true }); // honeypot field: bots fill it, people never see it

  // The host deletes their own application: it leaves Events, the moderation buttons in Telegram are replaced with
  // "Deleted by the host" (so nobody approves it by mistake) and the admin chat gets a note. Blocked once tickets are sold.
  if (b.action === "delete") {
    const ref = str(b.ref, 20);
    if (!isRef(ref) || !ownerOk(ref, b.key)) return res.status(403).json({ ok: false, error: "You can only delete your own events." });
    if (!dbConfigured()) return res.status(200).json({ ok: true });
    try {
      const rec = await getPitch(ref);
      if (!rec || rec.status === "deleted") return res.status(200).json({ ok: true });
      const sold = (await getTickets(ref)).filter((t) => !t.refunded).length;
      if (sold) return res.status(409).json({ ok: false, code: "sold", error: `${sold} ticket${sold > 1 ? "s have" : " has"} already been sold, so this event can't be deleted here. Email events@uniteuow.com and we'll help cancel it and refund your guests.` });
      await savePitch({ ...rec, status: "deleted", deletedAt: Date.now(), updatedAt: Date.now() });
      if (rec.kbMsg) {
        const r = await tg(token, "editMessageReplyMarkup", { chat_id: CHAT_ID, message_id: rec.kbMsg, reply_markup: { inline_keyboard: [[{ text: "🗑 Deleted by the host", callback_data: `m:i:${ref}` }]] } });
        if (!r.ok && !/not modified/i.test(String(r.data && r.data.description))) console.error("Telegram editMessageReplyMarkup (deleted) rejected:", JSON.stringify(r.data));
      }
      await tg(token, "sendMessage", { chat_id: CHAT_ID, text: `🗑 <b>Application deleted by the host</b>\n"${esc(rec.title)}" (${ref}) was withdrawn${rec.status === "approved" ? " and removed from Events" : ""}. No action needed.`, parse_mode: "HTML", ...(rec.kbMsg ? { reply_to_message_id: rec.kbMsg, allow_sending_without_reply: true } : {}) });
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error("Pitch delete failed:", e && e.message);
      return res.status(500).json({ ok: false, error: "Couldn't delete it right now. Please try again." });
    }
  }

  const p = {
    ref: str(b.ref, 20), title: str(b.title, 120), category: str(b.category, 40), lang: str(b.lang, 40),
    date: str(b.date, 10), start: str(b.start, 5), end: str(b.end, 5),
    spots: Math.max(1, Math.min(100000, parseInt(b.spots, 10) || 1)), price: Math.max(0, Math.min(100000, Number(b.price) || 0)),
    venueName: str(b.venueName, 120), room: str(b.room, 120), mapsUrl: str(b.mapsUrl, 500),
    whatsapp: str(b.whatsapp, 30), telegram: str(b.telegram, 40).replace(/^@/, ""), email: str(b.email, 120),
    studentId: str(b.studentId, 20), account: str(b.account, 120), accountName: str(b.accountName, 80), verified: b.verified === true,
    dress: str(b.dress, 80), reqs: str(b.reqs, 300),
    pitch: str(b.pitch, 2500),
    kind: b.kind === "trip" ? "trip" : "own",
    extName: str(b.extName, 120), seller: str(b.seller, 120),
    minGroup: Math.max(0, Math.min(100000, parseInt(b.minGroup, 10) || 0)), collectUntil: str(b.collectUntil, 10),
  };
  if (p.kind !== "trip") { delete p.extName; delete p.seller; delete p.minGroup; delete p.collectUntil; }
  const missing = [];
  if (p.title.length < 3) missing.push("title");
  if (p.venueName.length < 3) missing.push("venue name");
  if (p.pitch.length < 50) missing.push("detailed description"); // the form asks for 50+ characters
  if (!isEmail(p.email)) missing.push("email");
  if (!p.whatsapp && !p.telegram) missing.push("WhatsApp or Telegram");
  const cover = parseImage(b.cover), logo = b.logo ? parseImage(b.logo) : null;
  if (!cover) missing.push("cover photo");
  if (b.logo && !logo) missing.push("logo");
  if (p.mapsUrl && !isHttps(p.mapsUrl)) missing.push("Google Maps URL");
  if (p.kind === "trip") {
    if (p.extName.length < 2) missing.push("external event name");
    if (p.seller.length < 2) missing.push("official ticket seller");
    if (p.minGroup < 1 || p.minGroup > p.spots) missing.push("minimum group size");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.collectUntil) || !/^\d{4}-\d{2}-\d{2}$/.test(p.date) || !/^\d{2}:\d{2}$/.test(p.start)
      || collectMs(p) > dubaiMs(p.date, p.start) - 24 * 36e5 || collectMs(p) < Date.now()) missing.push("collect payments until (at least 24 h before the event)");
  }
  if (missing.length) return res.status(400).json({ ok: false, error: `Missing or invalid: ${missing.join(", ")}.` });

  // Moderation needs the database: the application is stored with status "pending" and the admin decides
  // with inline buttons (handled by /api/telegram). Without a database the app falls back to its 2-hour demo review.
  let moderated = dbConfigured();
  if (moderated) {
    p.ref = newRef();
    try { for (let i = 0; i < 4 && (await eventExists(p.ref)); i++) p.ref = newRef(); }
    catch (e) { console.error("Database unavailable, moderation buttons skipped:", e.message); moderated = false; }
  }
  p.moderated = moderated;

  // Fail-safe delivery: the student's submission always completes. Every Telegram rejection is logged with
  // Telegram's exact JSON so size/format problems can be diagnosed in the Vercel logs.
  const text = buildMessage(p);
  const plain = text.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  let delivered = false;
  try {
    let sent = await tg(token, "sendMessage", { chat_id: CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true });
    if (!sent.ok) {
      console.error("Telegram sendMessage (HTML) rejected:", JSON.stringify(sent.data));
      sent = await tg(token, "sendMessage", { chat_id: CHAT_ID, text: plain, disable_web_page_preview: true });
      if (!sent.ok) console.error("Telegram sendMessage (plain) rejected:", JSON.stringify(sent.data), "|", explain(sent.data, token));
    }
    delivered = sent.ok;
  } catch (e) { console.error("Telegram sendMessage error:", e && e.message); }
  if (!delivered) console.error(`Pitch NOT delivered to chat ${CHAT_ID}; full text follows so it isn't lost:\n${plain}`);

  // Save the application (status "pending") and make sure button clicks are routed back to this site.
  if (delivered && moderated) {
    try {
      const { moderated: _m, ...rec } = p;
      await savePitch({ ...rec, status: "pending", at: Date.now(), updatedAt: Date.now() });
      for (const [kind, raw] of [["cover", b.cover], ["logo", b.logo]]) {
        if (!raw || raw.length > MAX_STORED_IMAGE) continue;
        try { await saveEventImage(p.ref, kind, raw); }
        catch (e) { console.error(`Database: ${kind} image not stored:`, e.message); }
      }
      const hook = await ensureWebhook(token, req);
      if (!hook.ok) console.error("Moderation webhook not registered:", hook.error);
    } catch (e) { console.error("Database save failed, moderation buttons skipped:", e.message); moderated = false; }
  }
  const keyboard = moderated ? JSON.stringify(moderationKeyboard(p.ref)) : null;

  // Artwork: each photo is optional. If Telegram rejects one, the text pitch above still stands, plus a note.
  // The moderation buttons go under the last photo; if no photo got through they follow as their own message.
  let buttonsPlaced = false, kbMsg = null;
  if (delivered) {
    const failed = [];
    const photos = [[cover, "Cover"], [logo, "Logo"]].filter(([img]) => img);
    for (const [i, [img, label]] of photos.entries()) {
      const last = i === photos.length - 1;
      try {
        const form = new FormData();
        form.append("chat_id", CHAT_ID);
        form.append("caption", `🖼 ${label} · ${p.title} (${p.ref})`);
        if (keyboard && last) form.append("reply_markup", keyboard);
        form.append("photo", new Blob([img.data], { type: img.type }), `${label.toLowerCase()}.${img.type.split("/")[1].replace("jpeg", "jpg")}`);
        const pr = await tg(token, "sendPhoto", form);
        if (pr.ok) { if (keyboard && last) { buttonsPlaced = true; kbMsg = pr.data.result && pr.data.result.message_id; } }
        else { failed.push(label); console.error(`Telegram sendPhoto (${label}, ${img.type}, ${img.data.length} bytes) rejected:`, JSON.stringify(pr.data)); }
      } catch (e) { failed.push(label); console.error(`Telegram sendPhoto (${label}) error:`, e && e.message); }
    }
    if (failed.length || (keyboard && !buttonsPlaced)) {
      const note = failed.length ? `⚠️ ${failed.join(" and ")} for "${p.title}" (${p.ref}) couldn't be attached. Ask the organizer at ${p.email}.` : `Decision for "${p.title}" (${p.ref}):`;
      try {
        const r = await tg(token, "sendMessage", { chat_id: CHAT_ID, text: note, ...(keyboard && !buttonsPlaced ? { reply_markup: JSON.parse(keyboard) } : {}) });
        if (!r.ok) console.error("Telegram note rejected:", JSON.stringify(r.data));
        else if (keyboard && !buttonsPlaced) kbMsg = r.data.result && r.data.result.message_id;
      } catch (e) { console.error("Telegram artwork note error:", e && e.message); }
    }
  }
  // Remember which Telegram message carries the buttons, so a later "deleted by the host" can replace them.
  if (kbMsg && moderated) {
    try { const rec = await getPitch(p.ref); if (rec) await savePitch({ ...rec, kbMsg }); } catch (e) { /* not critical */ }
  }
  return res.status(200).json({ ok: true, delivered, moderated: delivered && moderated, ...(delivered && moderated ? { ref: p.ref, key: ownerKey(p.ref) } : {}) });
}

export { buildMessage };
