/* Shared server helpers for Unite's API routes (files starting with "_" are not deployed as routes).
   Telegram: bot token from TELEGRAM_BOT_TOKEN, admin chat from TELEGRAM_CHAT_ID.
   Database: Upstash Redis over its REST API (Vercel → Storage → Upstash for Redis injects
   KV_REST_API_URL / KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN). */
import crypto from "node:crypto";

const clean = (v) => String(v || "").trim().replace(/^["']|["']$/g, "").trim();

// Admin moderation chat. Stray spaces or quotes from pasting are ignored.
export const CHAT_ID = clean(process.env.TELEGRAM_CHAT_ID) || "8951261399";

// Accepts the usual naming slips (stray spaces or quotes, different case, a VITE_ prefix, TELEGRAM_TOKEN/BOT_TOKEN).
const TOKEN_NAMES = ["TELEGRAM_BOT_TOKEN", "VITE_TELEGRAM_BOT_TOKEN", "TELEGRAM_TOKEN", "BOT_TOKEN"];
export const tokenVar = () => {
  const keys = Object.keys(process.env);
  for (const want of TOKEN_NAMES) {
    const key = keys.find((k) => k.trim().toUpperCase() === want && String(process.env[k] || "").trim());
    if (key) return key;
  }
  return null;
};
export const readToken = () => { const key = tokenVar(); return key ? clean(process.env[key]) : ""; };
// Names only (never values) of variables that look Telegram-related, so the setup check can show what Vercel passed in.
export const telegramVarNames = () => Object.keys(process.env).filter((k) => /TELEGRAM|BOT/i.test(k));
export const deployment = () => ({ environment: process.env.VERCEL_ENV || "unknown", host: process.env.VERCEL_URL || "unknown" });

export const tg = async (token, method, body) => {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, body instanceof FormData
    ? { method: "POST", body }
    : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok && data.ok, status: r.status, data };
};

// Plain-English explanation of a Telegram error (no secrets included).
export const explain = (d, token) => {
  const m = String((d && d.description) || "");
  if (token && token.startsWith(`${CHAT_ID}:`)) return `${CHAT_ID} is the bot's own ID (the number at the start of its token), not your chat ID, and a bot can't message itself. Message @userinfobot in Telegram to get your personal ID, then add it in Vercel as TELEGRAM_CHAT_ID and redeploy.`;
  if (/bots can't send messages to bots/i.test(m)) return `Chat ${CHAT_ID} belongs to a bot, and bots can't message other bots. Message @userinfobot in Telegram to get your personal ID, then add it in Vercel as TELEGRAM_CHAT_ID and redeploy.`;
  if (/unauthorized|not found: 404/i.test(m) || (d && d.error_code === 401)) return "The bot token is invalid. Copy it again from @BotFather and update TELEGRAM_BOT_TOKEN in Vercel, then redeploy.";
  if (/chat not found|bot can't initiate|user is deactivated/i.test(m)) return `The bot can't message chat ${CHAT_ID} yet. Open the bot in Telegram from that account and press Start.`;
  if (/blocked by the user/i.test(m)) return "The admin account has blocked the bot. Unblock it in Telegram and press Start.";
  return m || "Telegram rejected the request.";
};

/* ---------------------------- Database ---------------------------- */
const kvUrl = () => clean(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL).replace(/\/+$/, "");
const kvToken = () => clean(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN);
export const storeConfigured = () => !!(kvUrl() && kvToken());
// One Redis command, e.g. kv("SET", "key", "value"). Throws on failure.
export const kv = async (...cmd) => {
  const r = await fetch(kvUrl(), { method: "POST", headers: { Authorization: `Bearer ${kvToken()}`, "Content-Type": "application/json" }, body: JSON.stringify(cmd.map(String)) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(`Database ${cmd[0]} failed: ${data.error || r.status}`);
  return data.result;
};

export const TTL_S = 120 * 24 * 3600; // applications are kept for 120 days
export const K = {
  pitch: (ref) => `unite:pitch:${ref}`,
  img: (ref, kind) => `unite:img:${ref}:${kind}`,
  approved: "unite:approved",
  webhook: "unite:webhook",
};
export const STATUSES = ["pending", "under_review", "approved", "rejected"];
export const isRef = (v) => /^UN-[A-Z0-9]{6}$/.test(String(v || ""));
export const getPitch = async (ref) => { const v = await kv("GET", K.pitch(ref)); return v ? JSON.parse(v) : null; };

/* ---------------------------- Secrets ----------------------------- */
// Derived from the bot token (or OTP_SECRET), so no extra variables are needed.
const secretBase = () => clean(process.env.OTP_SECRET) || readToken();
const hmac = (label, v) => crypto.createHmac("sha256", `${label}:${secretBase()}`).update(String(v)).digest("base64url");
// Proof that a browser owns a submission: returned once on submit, required to read its status.
export const ownerKey = (ref) => hmac("unite-owner", ref).slice(0, 24);
export const ownerOk = (ref, key) => {
  const a = Buffer.from(ownerKey(ref)), b = Buffer.from(String(key || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
// Telegram echoes this in X-Telegram-Bot-Api-Secret-Token on every webhook call (allowed chars: A-Z a-z 0-9 _ -).
export const webhookSecret = (token) => crypto.createHmac("sha256", `unite-webhook:${token}`).update("telegram").digest("hex").slice(0, 48);

/* ---------------------------- Moderation keyboard ----------------- */
const LABELS = { approved: "✅ Approve", under_review: "🔍 Additional Check", rejected: "❌ Reject" };
const CODES = { approved: "a", under_review: "c", rejected: "r" };
export const statusFromCode = { a: "approved", c: "under_review", r: "rejected" };
export const STATUS_TEXT = { pending: "⏳ Awaiting decision", under_review: "🔍 Additional check", approved: "✅ Approved · live on Unite", rejected: "❌ Rejected" };
// The three actions; the current decision is marked with a dot, plus a status line underneath.
export const moderationKeyboard = (ref, status = "pending", note = "") => ({
  inline_keyboard: [
    ["approved", "under_review", "rejected"].map((s) => ({ text: (s === status ? "● " : "") + LABELS[s], callback_data: `m:${CODES[s]}:${ref}` })),
    [{ text: `${STATUS_TEXT[status] || status}${note ? ` · ${note}` : ""}`, callback_data: `m:i:${ref}` }],
  ],
});

/* ---------------------------- Webhook ----------------------------- */
// Where Telegram should deliver button clicks: the project's production domain (unprotected), else this host.
export const webhookUrl = (req) => {
  const host = clean(process.env.VERCEL_PROJECT_PRODUCTION_URL) || String((req && (req.headers["x-forwarded-host"] || req.headers.host)) || "");
  return host ? `https://${host.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}/api/telegram` : "";
};
// Registers the webhook once per URL (remembered in the database), so button clicks reach /api/telegram.
export const ensureWebhook = async (token, req, force = false) => {
  const url = webhookUrl(req);
  if (!url) return { ok: false, error: "Unknown site address." };
  if (!force && storeConfigured()) { try { if ((await kv("GET", K.webhook)) === url) return { ok: true, url, cached: true }; } catch (e) { /* re-register */ } }
  const r = await tg(token, "setWebhook", { url, secret_token: webhookSecret(token), allowed_updates: ["callback_query"] });
  if (!r.ok) { console.error("Telegram setWebhook rejected:", JSON.stringify(r.data)); return { ok: false, url, error: explain(r.data, token) }; }
  if (storeConfigured()) { try { await kv("SET", K.webhook, url); } catch (e) { /* not critical */ } }
  return { ok: true, url };
};
