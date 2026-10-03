/* Vercel serverless function: Telegram webhook for the moderation buttons under each party application.
   ✅ Approve → "approved" (goes live in Events), 🔍 Additional Check → "under_review", ❌ Reject → "rejected".
   Only accepts calls carrying the secret Telegram was given at registration, and only clicks made in the admin chat. */
import { CHAT_ID, readToken, tg, kv, K, TTL_S, storeConfigured, isRef, getPitch, statusFromCode, moderationKeyboard, webhookSecret } from "./_lib.js";

const TOAST = { approved: "✅ Approved: it's live on Unite now.", under_review: "🔍 Marked for an additional check.", rejected: "❌ Rejected: it won't be published." };

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false }); }
  const token = readToken();
  if (!token || req.headers["x-telegram-bot-api-secret-token"] !== webhookSecret(token)) return res.status(401).json({ ok: false });

  let u = req.body;
  if (typeof u === "string") { try { u = JSON.parse(u); } catch (e) { u = {}; } }
  const q = u && u.callback_query;
  if (!q) return res.status(200).json({ ok: true }); // nothing else is subscribed; acknowledge and move on

  const answer = (text, alert = false) => tg(token, "answerCallbackQuery", { callback_query_id: q.id, text, show_alert: alert }).catch(() => {});
  const [, code, ref] = /^m:([acri]):(UN-[A-Z0-9]{6})$/.exec(String(q.data || "")) || [];
  const chatId = q.message && q.message.chat && String(q.message.chat.id);
  if (!code || !isRef(ref) || chatId !== CHAT_ID) { await answer("This button isn't valid here.", true); return res.status(200).json({ ok: true }); }
  if (!storeConfigured()) { await answer("The database isn't connected, so decisions can't be saved yet.", true); return res.status(200).json({ ok: true }); }

  try {
    const rec = await getPitch(ref);
    if (!rec) { await answer(`${ref} wasn't found (it may have expired).`, true); return res.status(200).json({ ok: true }); }
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
