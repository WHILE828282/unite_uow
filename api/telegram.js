/* Vercel serverless function: Telegram webhook for the moderation buttons under each party application.
   ✅ Approve → "approved" (goes live in Events), 🔍 Additional Check → "under_review", ❌ Reject → "rejected".
   Only accepts calls carrying the secret Telegram was given at registration, and only clicks made in the admin chat. */
import { CHAT_ID, readToken, tg, kv, K, TTL_S, storeConfigured, isRef, getPitch, statusFromCode, moderationKeyboard, webhookSecret } from "./_lib.js";
import { A, getProfile, saveProfile, setStatus, tgCard } from "./_apps.js";

const TOAST = { approved: "✅ Approved: it's live on Unite now.", under_review: "🔍 Marked for an additional check.", rejected: "❌ Rejected: it won't be published." };

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false }); }
  const token = readToken();
  if (!token || req.headers["x-telegram-bot-api-secret-token"] !== webhookSecret(token)) return res.status(401).json({ ok: false });

  let u = req.body;
  if (typeof u === "string") { try { u = JSON.parse(u); } catch (e) { u = {}; } }
  // "Connect Telegram" from the Unite profile: t.me/<bot>?start=<one-time code> links this chat to the account.
  const msg = u && u.message;
  if (msg && msg.chat && msg.chat.type === "private") {
    const m = /^\/start\s+([A-Za-z0-9_-]{8,64})$/.exec(String(msg.text || "").trim());
    const say = (text) => tg(token, "sendMessage", { chat_id: msg.chat.id, text }).catch(() => {});
    if (m && storeConfigured()) {
      const email = await kv("GET", A.tgLink(m[1])).catch(() => null);
      if (email) {
        await kv("DEL", A.tgLink(m[1])).catch(() => {});
        await saveProfile(email, { ...(await getProfile(email)), tgChat: String(msg.chat.id) });
        await kv("SET", A.tgChat(msg.chat.id), email);
        await say(`✅ Connected to Unite as ${email}. Club applications and decisions will arrive here.`);
      } else await say("This link has expired. Open your Unite profile and tap Connect Telegram again.");
    } else await say("Hi! Connect this chat from your Unite profile (Profile & settings → Connect Telegram).");
    return res.status(200).json({ ok: true });
  }
  const q = u && u.callback_query;
  if (!q) return res.status(200).json({ ok: true });

  const answer = (text, alert = false) => tg(token, "answerCallbackQuery", { callback_query_id: q.id, text, show_alert: alert }).catch(() => {});

  // Club applications: ✅ Accept / ✖️ Decline under a notification sent to an owner or helper.
  const ca = /^ca:([ad]):(AP-[A-Z0-9]{8})$/.exec(String(q.data || ""));
  if (ca) {
    const email = storeConfigured() ? await kv("GET", A.tgChat(q.message && q.message.chat && q.message.chat.id)).catch(() => null) : null;
    const r = email ? await setStatus(ca[2], ca[1] === "a" ? "accepted" : "declined", email).catch(() => "Couldn't save that. Please tap again.") : "Connect this chat from your Unite profile first.";
    if (typeof r === "string") { await answer(r, true); return res.status(200).json({ ok: true }); }
    await tg(token, "editMessageText", { chat_id: q.message.chat.id, message_id: q.message.message_id, text: tgCard(r, r.status === "accepted" ? `✅ <b>Accepted · ${r.club}</b>` : `✖️ <b>Declined · ${r.club}</b>`), parse_mode: "HTML",
      reply_markup: { inline_keyboard: [[{ text: "💬 WhatsApp", url: `https://wa.me/${r.whatsapp}` }]] } }).catch(() => {});
    await answer(r.status === "accepted" ? "Accepted. The student has been told." : "Declined. The student has been told politely.");
    return res.status(200).json({ ok: true });
  }
  const [, code, ref] = /^m:([acri]):(UN-[A-Z0-9]{6})$/.exec(String(q.data || "")) || [];
  const chatId = q.message && q.message.chat && String(q.message.chat.id);
  if (!code || !isRef(ref) || chatId !== CHAT_ID) { await answer("This button isn't valid here.", true); return res.status(200).json({ ok: true }); }
  if (!storeConfigured()) { await answer("The database isn't connected, so decisions can't be saved yet.", true); return res.status(200).json({ ok: true }); }

  try {
    const rec = await getPitch(ref);
    if (!rec) { await answer(`${ref} wasn't found (it may have expired).`, true); return res.status(200).json({ ok: true }); }
    if (rec.status === "deleted") { await answer(`"${rec.title}" was deleted by the host. Nothing to decide.`, true); return res.status(200).json({ ok: true }); }
    if (code === "i") { await answer(`${rec.title}: currently ${rec.status.replace("_", " ")}.`); return res.status(200).json({ ok: true }); }

    const status = statusFromCode[code];
    const who = (q.from && (q.from.username ? `@${q.from.username}` : q.from.first_name)) || "admin";
    const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    if (rec.status !== status) {
      const next = { ...rec, status, updatedAt: Date.now(), decidedBy: who };
      await kv("SET", K.pitch(ref), JSON.stringify(next), "EX", TTL_S);
      if (status === "approved") await kv("SADD", K.approved, ref);
      else await kv("SREM", K.approved, ref);
    }
    // Mark the chosen button and show who decided and when; the buttons stay so a decision can be changed.
    const edit = await tg(token, "editMessageReplyMarkup", { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: moderationKeyboard(ref, status, `${who}, ${when}`) });
    if (!edit.ok && !/not modified/i.test(String(edit.data && edit.data.description))) console.error("Telegram editMessageReplyMarkup rejected:", JSON.stringify(edit.data));
    await answer(TOAST[status]);
  } catch (e) {
    console.error("Moderation update failed:", e && e.message);
    await answer("Couldn't save that decision. Please tap again.", true);
  }
  return res.status(200).json({ ok: true });
}
