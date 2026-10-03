/* Vercel serverless function: club applications (Finance & Growth Lounge) forwarded to the admin Telegram chat.
   POST { club, room, email, name, studentId, verified } -> { ok, delivered } */
import { CHAT_ID, readToken, tg } from "./_lib.js";

const str = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ROOMS = { Tech: "Tech & E-sports Room", Business: "Finance & Growth Lounge", Arts: "Music & Arts Hub" };

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false }); }
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const club = str(b.club, 80), email = str(b.email, 120);
  if (club.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: "Invalid application." });
  const token = readToken();
  if (!token) return res.status(200).json({ ok: true, delivered: false });
  const text = [
    "📝 <b>NEW CLUB APPLICATION</b>",
    "",
    `<b>Club:</b> ${esc(club)}`,
    `<b>Room:</b> ${esc(ROOMS[b.room] || str(b.room, 40))}`,
    `<b>Student:</b> ${esc(str(b.name, 80) || "—")}`,
    `<b>Email:</b> ${esc(email)}${b.verified === true ? " (✅ verified UOWD email)" : " (demo login, not verified)"}`,
    str(b.studentId, 20) ? `<b>Student ID:</b> ${esc(str(b.studentId, 20))}` : null,
    "",
    `<i>${new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} (Dubai)</i>`,
  ].filter((x) => x !== null).join("\n");
  try {
    const r = await tg(token, "sendMessage", { chat_id: CHAT_ID, text, parse_mode: "HTML" });
    if (!r.ok) console.error("Telegram club application rejected:", JSON.stringify(r.data));
    return res.status(200).json({ ok: true, delivered: r.ok });
  } catch (e) {
    console.error("Club application not delivered:", e && e.message);
    return res.status(200).json({ ok: true, delivered: false });
  }
}
