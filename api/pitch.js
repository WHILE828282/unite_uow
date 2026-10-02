/* Vercel serverless function: forwards a party pitch from the Unite app to the admin Telegram chat.
   The bot token stays server-side (set TELEGRAM_BOT_TOKEN in the Vercel project settings); it must
   never be shipped in browser code, where anyone could read it and take over the bot. */

// Unite admin moderation chat (TELEGRAM_CHAT_ID in Vercel overrides it without a code change).
// Stray spaces or quotes from pasting are ignored.
const CHAT_ID = String(process.env.TELEGRAM_CHAT_ID || "").trim().replace(/^["']|["']$/g, "").trim() || "8951261399";
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
    `<i>Ref ${esc(p.ref)} · submitted by ${esc(p.account || p.email)}${p.verified ? " (✅ email verified)" : " (demo login, email not verified)"}</i>`,
  ].filter((x) => x !== null);
  return parts.join("\n");
}

// Trim stray spaces/newlines from a pasted token.
// Accepts the usual naming slips (stray spaces or quotes, different case, a VITE_ prefix, TELEGRAM_TOKEN/BOT_TOKEN).
const TOKEN_NAMES = ["TELEGRAM_BOT_TOKEN", "VITE_TELEGRAM_BOT_TOKEN", "TELEGRAM_TOKEN", "BOT_TOKEN"];
const tokenVar = () => {
  const keys = Object.keys(process.env);
  for (const want of TOKEN_NAMES) {
    const key = keys.find((k) => k.trim().toUpperCase() === want && String(process.env[k] || "").trim());
    if (key) return key;
  }
  return null;
};
const readToken = () => {
  const key = tokenVar();
  return key ? String(process.env[key]).trim().replace(/^["']|["']$/g, "").trim() : "";
};
// Names only (never values) of variables that look Telegram-related, so the setup check can show what Vercel passed in.
const telegramVarNames = () => Object.keys(process.env).filter((k) => /TELEGRAM|BOT/i.test(k));
const deployment = () => ({ environment: process.env.VERCEL_ENV || "unknown", host: process.env.VERCEL_URL || "unknown" });
const tg = async (token, method, body) => {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, body instanceof FormData
    ? { method: "POST", body }
    : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok && data.ok, status: r.status, data };
};
// Plain-English explanation of a Telegram error (no secrets included).
const explain = (d, token) => {
  const m = String((d && d.description) || "");
  if (token && token.startsWith(`${CHAT_ID}:`)) return `${CHAT_ID} is the bot's own ID (the number at the start of its token), not your chat ID, and a bot can't message itself. Message @userinfobot in Telegram to get your personal ID, then add it in Vercel as TELEGRAM_CHAT_ID and redeploy.`;
  if (/bots can't send messages to bots/i.test(m)) return `Chat ${CHAT_ID} belongs to a bot, and bots can't message other bots. Message @userinfobot in Telegram to get your personal ID, then add it in Vercel as TELEGRAM_CHAT_ID and redeploy.`;
  if (/unauthorized|not found: 404/i.test(m) || (d && d.error_code === 401)) return "The bot token is invalid. Copy it again from @BotFather and update TELEGRAM_BOT_TOKEN in Vercel, then redeploy.";
  if (/chat not found|bot can't initiate|user is deactivated/i.test(m)) return `The bot can't message chat ${CHAT_ID} yet. Open the bot in Telegram from that account and press Start.`;
  if (/blocked by the user/i.test(m)) return "The admin account has blocked the bot. Unblock it in Telegram and press Start.";
  return m || "Telegram rejected the request.";
};

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
      return res.status(200).json({
        configured: true, variable: tokenVar(), deployment: deployment(), tokenValid: true, bot: `@${me.data.result.username}`, chatId: CHAT_ID, chatReachable: chat.ok,
        help: chat.ok ? "All set: party pitches will be delivered." : explain(chat.data, token),
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

  const p = {
    ref: str(b.ref, 20), title: str(b.title, 120), category: str(b.category, 40), lang: str(b.lang, 40),
    date: str(b.date, 10), start: str(b.start, 5), end: str(b.end, 5),
    spots: Math.max(1, Math.min(100000, parseInt(b.spots, 10) || 1)), price: Math.max(0, Math.min(100000, Number(b.price) || 0)),
    venueName: str(b.venueName, 120), room: str(b.room, 120), mapsUrl: str(b.mapsUrl, 500),
    whatsapp: str(b.whatsapp, 30), telegram: str(b.telegram, 40).replace(/^@/, ""), email: str(b.email, 120),
    studentId: str(b.studentId, 20), account: str(b.account, 120), verified: b.verified === true,
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

  // Artwork: each photo is optional. If Telegram rejects one, the text pitch above still stands, plus a note.
  if (delivered) {
    const failed = [];
    for (const [img, label] of [[cover, "Cover"], [logo, "Logo"]]) {
      if (!img) continue;
      try {
        const form = new FormData();
        form.append("chat_id", CHAT_ID);
        form.append("caption", `🖼 ${label} · ${p.title} (${p.ref})`);
        form.append("photo", new Blob([img.data], { type: img.type }), `${label.toLowerCase()}.${img.type.split("/")[1].replace("jpeg", "jpg")}`);
        const pr = await tg(token, "sendPhoto", form);
        if (!pr.ok) { failed.push(label); console.error(`Telegram sendPhoto (${label}, ${img.type}, ${img.data.length} bytes) rejected:`, JSON.stringify(pr.data)); }
      } catch (e) { failed.push(label); console.error(`Telegram sendPhoto (${label}) error:`, e && e.message); }
    }
    if (failed.length) {
      try { await tg(token, "sendMessage", { chat_id: CHAT_ID, text: `⚠️ ${failed.join(" and ")} for "${p.title}" (${p.ref}) couldn't be attached. Ask the organizer at ${p.email}.` }); }
      catch (e) { console.error("Telegram artwork note error:", e && e.message); }
    }
  }
  return res.status(200).json({ ok: true, delivered });
}

export { buildMessage };
