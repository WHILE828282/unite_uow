/* Vercel serverless function: forwards a party pitch from the Unite app to the admin Telegram chat.
   The bot token stays server-side (set TELEGRAM_BOT_TOKEN in the Vercel project settings); it must
   never be shipped in browser code, where anyone could read it and take over the bot. */

const CHAT_ID = "8878768622"; // Unite admin moderation chat
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
  const line = (label, value) => (value ? `<b>${label}:</b> ${esc(value)}` : null);
  const link = (label, url) => (url ? `<b>${label}:</b> <a href="${esc(url)}">${esc(url)}</a>` : null);
  const price = Number(p.price) > 0 ? `${Number(p.price)} AED` : "Free";
  const parts = [
    "🔔 <b>NEW EVENT PITCH FOR UNITE</b>",
    "",
    line("Event Name", p.title),
    line("Event Type", p.category),
    line("Language", p.lang),
    line("When", `${p.date} · ${p.start}–${p.end}`),
    line("Spots / Price", `${p.spots} spots · ${price}`),
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
    `<i>Ref ${esc(p.ref)} · submitted by ${esc(p.account || p.email)}</i>`,
  ].filter((x) => x !== null);
  let text = parts.join("\n");
  if (text.length > MAX_MESSAGE) text = text.slice(0, MAX_MESSAGE - 1) + "…";
  return text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(503).json({ ok: false, error: "The review service isn't configured yet." });

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== "object") return res.status(400).json({ ok: false, error: "Invalid request." });
  if (b.website) return res.status(200).json({ ok: true }); // honeypot field: bots fill it, people never see it

  const p = {
    ref: str(b.ref, 20), title: str(b.title, 120), category: str(b.category, 40), lang: str(b.lang, 40),
    date: str(b.date, 10), start: str(b.start, 5), end: str(b.end, 5),
    spots: Math.max(1, Math.min(100000, parseInt(b.spots, 10) || 1)), price: Math.max(0, Math.min(100000, Number(b.price) || 0)),
    venueName: str(b.venueName, 120), room: str(b.room, 120), mapsUrl: str(b.mapsUrl, 500),
    whatsapp: str(b.whatsapp, 30), telegram: str(b.telegram, 40).replace(/^@/, ""), email: str(b.email, 120),
    studentId: str(b.studentId, 20), account: str(b.account, 120),
    dress: str(b.dress, 80), reqs: str(b.reqs, 300),
    pitch: str(b.pitch, 2500),
  };
  const missing = [];
  if (p.title.length < 3) missing.push("title");
  if (p.venueName.length < 3) missing.push("venue name");
  if (p.pitch.length < 100) missing.push("detailed description");
  if (!isEmail(p.email)) missing.push("email");
  if (!p.whatsapp && !p.telegram) missing.push("WhatsApp or Telegram");
  const cover = parseImage(b.cover), logo = b.logo ? parseImage(b.logo) : null;
  if (!cover) missing.push("cover photo");
  if (b.logo && !logo) missing.push("logo");
  if (p.mapsUrl && !isHttps(p.mapsUrl)) missing.push("Google Maps URL");
  if (missing.length) return res.status(400).json({ ok: false, error: `Missing or invalid: ${missing.join(", ")}.` });

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: buildMessage(p), parse_mode: "HTML", disable_web_page_preview: true }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.ok) {
      console.error("Telegram sendMessage failed", r.status, data && data.description);
      return res.status(502).json({ ok: false, error: "The review team couldn't be reached. Please try again." });
    }
    // The pitch is delivered; attach the artwork as photos (a failure here doesn't fail the submission).
    for (const [img, label] of [[cover, "Cover"], [logo, "Logo"]]) {
      if (!img) continue;
      try {
        const form = new FormData();
        form.append("chat_id", CHAT_ID);
        form.append("caption", `🖼 ${label} · ${p.title} (${p.ref})`);
        form.append("photo", new Blob([img.data], { type: img.type }), `${label.toLowerCase()}.${img.type.split("/")[1].replace("jpeg", "jpg")}`);
        const pr = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: "POST", body: form });
        if (!pr.ok) console.error("Telegram sendPhoto failed", pr.status, await pr.text().catch(() => ""));
      } catch (e) { console.error("Telegram sendPhoto error", e); }
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Telegram request error", e);
    return res.status(502).json({ ok: false, error: "The review team couldn't be reached. Please try again." });
  }
}

export { buildMessage };
