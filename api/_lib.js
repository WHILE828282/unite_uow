/* Shared server helpers for Unite's API routes (files starting with "_" are not deployed as routes).
   Telegram: bot token from TELEGRAM_BOT_TOKEN, admin chat from TELEGRAM_CHAT_ID (plus TELEGRAM_TEAM_CHAT_ID for the team group).
   Database: Upstash Redis over its REST API (Vercel → Storage → Upstash for Redis injects
   KV_REST_API_URL / KV_REST_API_TOKEN, or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN). */
import crypto from "node:crypto";
import * as store from "./_store.js";

const clean = (v) => String(v || "").trim().replace(/^["']|["']$/g, "").trim();

// Admin moderation chat. Stray spaces or quotes from pasting are ignored.
export const CHAT_ID = clean(process.env.TELEGRAM_CHAT_ID) || "8951261399";
// Optional second chat for the team (a Telegram group with the managers): TELEGRAM_TEAM_CHAT_ID. Event applications and
// admin notices go to both chats, and a decision taken in one shows in the other.
export const TEAM_CHAT_ID = clean(process.env.TELEGRAM_TEAM_CHAT_ID);
export const ADMIN_CHATS = [...new Set([CHAT_ID, TEAM_CHAT_ID].filter(Boolean))];

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

export const TTL_S = 120 * 24 * 3600; // kept for reading old Redis data during the copy to Postgres
// Redis keys still in use: short-lived markers and locks. (Old permanent-data keys are read once by the Redis → Postgres copy.)
export const K = {
  pitch: (ref) => `unite:pitch:${ref}`,
  img: (ref, kind) => `unite:img:${ref}:${kind}`,
  approved: "unite:approved",
  webhook: "unite:webhook",
  tix: (ref) => `unite:tix:${ref}`,
  tixFile: (id, i) => `unite:tixfile:${id}:${i}`,
  trips: "unite:trips",
  sweep: "unite:sweep-lock",
};
export const STATUSES = ["pending", "under_review", "approved", "rejected"];
// Student events (UN-XXXXXX) and Unite's own built-in events (DEMO-<id>, seeded into the database).
export const isRef = (v) => /^(UN-[A-Z0-9]{6}|DEMO-\d{1,4})$/.test(String(v || ""));
// Events (hosted applications) live in Postgres.
export const getPitch = (ref) => store.getEvent(ref);

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
// Unite tickets: the QR carries "U1.<ticket id>.<signature>", so a code can't be made up or altered.
export const ticketSig = (id) => hmac("unite-ticket", id).slice(0, 12);
export const ticketCode = (id) => `U1.${id}.${ticketSig(id)}`;
export const isTicketId = (v) => /^UNT-\d{4}-[A-Z0-9]{5}$/.test(String(v || ""));
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b || "")); return x.length === y.length && crypto.timingSafeEqual(x, y); };
// The ticket holder's own key (returned once on purchase): needed to read the ticket's status and its delivered file.
export const holderKey = (id) => hmac("unite-holder", id).slice(0, 20);
export const holderOk = (id, key) => same(holderKey(id), key);
export const parseTicketCode = (code) => {
  const m = /^U1\.(UNT-\d{4}-[A-Z0-9]{5})\.([A-Za-z0-9_-]{12})$/.exec(String(code || "").trim());
  return m && same(ticketSig(m[1]), m[2]) ? m[1] : null;
};
// Short-lived signed link to a private ticket file (5 minutes).
export const FILE_LINK_MS = 5 * 60 * 1000;
export const fileSig = (id, exp) => hmac("unite-file", `${id}|${exp}`).slice(0, 24);
export const fileLink = (id) => { const exp = Date.now() + FILE_LINK_MS; return `/api/tickets?a=file&t=${id}&exp=${exp}&s=${fileSig(id, exp)}`; };
export const fileLinkOk = (id, exp, sig) => Number(exp) > Date.now() && same(fileSig(id, Number(exp)), sig);
// Admins: ADMIN_EMAILS="a@x.com, b@y.com" (Vercel env). They may sign in with an email code even without a UOWD address.
export const adminEmails = () => String(process.env.ADMIN_EMAILS || "").split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"));
export const isAdminEmail = (email) => !!email && adminEmails().includes(String(email).trim().toLowerCase());
// Signed-in session: issued by /api/otp after a live code is verified, sent back with club application requests.
// "S1.<email, base64url>.<expiry ms>.<signature>", valid for 60 days. Signing key: OTP_SECRET, else the Resend key or bot token.
const sessKey = () => clean(process.env.OTP_SECRET) || clean(process.env.RESEND_API_KEY) || readToken();
const sessSig = (email, exp) => crypto.createHmac("sha256", `unite-session:${sessKey()}`).update(`${email}|${exp}`).digest("base64url").slice(0, 32);
export const sessionToken = (email) => {
  if (!sessKey()) return "";
  const exp = Date.now() + 60 * 864e5;
  return `S1.${Buffer.from(email).toString("base64url")}.${exp}.${sessSig(email, exp)}`;
};
export const sessionEmail = (tok) => {
  const m = /^S1\.([A-Za-z0-9_-]+)\.(\d+)\.([A-Za-z0-9_-]{32})$/.exec(String(tok || ""));
  if (!m || !sessKey() || Number(m[2]) < Date.now()) return null;
  const email = Buffer.from(m[1], "base64url").toString();
  return same(sessSig(email, Number(m[2])), m[3]) ? email : null;
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

// After a decision (from Telegram or the /admin page): every admin chat's copy of the application shows it.
export const syncModerationButtons = async (token, rec, status, note, skip = null) => {
  if (!token || !rec) return;
  const msgs = Array.isArray(rec.kbMsgs) && rec.kbMsgs.length ? rec.kbMsgs : rec.kbMsg ? [{ chat: String(CHAT_ID), msg: rec.kbMsg }] : [];
  const markup = status === "deleted"
    ? { inline_keyboard: [[{ text: `🗑 Removed${note ? ` · ${note}` : ""}`, callback_data: `m:i:${rec.ref}` }]] }
    : moderationKeyboard(rec.ref, status, note);
  for (const { chat, msg } of msgs) {
    if (skip && String(skip.chat) === String(chat) && skip.msg === msg) continue;
    await tg(token, "editMessageReplyMarkup", { chat_id: chat, message_id: msg, reply_markup: markup }).catch(() => {});
  }
};

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
  const mark = `${url}|v2`; // v2: also receives messages (Telegram connect links)
  if (!force) {
    try { if ((storeConfigured() ? await kv("GET", K.webhook) : store.dbConfigured() ? await store.getMeta("webhook") : null) === mark) return { ok: true, url, cached: true }; }
    catch (e) { /* re-register */ }
  }
  const r = await tg(token, "setWebhook", { url, secret_token: webhookSecret(token), allowed_updates: ["callback_query", "message"] });
  if (!r.ok) { console.error("Telegram setWebhook rejected:", JSON.stringify(r.data)); return { ok: false, url, error: explain(r.data, token) }; }
  try { if (storeConfigured()) await kv("SET", K.webhook, mark); else if (store.dbConfigured()) await store.setMeta("webhook", mark); } catch (e) { /* not critical */ }
  return { ok: true, url };
};

/* ---------------------------- Event types ------------------------- */
// Event times are Dubai time (UTC+4, no daylight saving).
export const dubaiMs = (date, time = "00:00") => {
  const [y, mo, d] = String(date).split("-").map(Number), [h, mi] = String(time).split(":").map(Number);
  return Date.UTC(y, mo - 1, d, h || 0, mi || 0) - 4 * 36e5;
};
export const startMs = (rec) => dubaiMs(rec.date, rec.start);
// Group trips collect payments until 23:59 Dubai time on the chosen date.
export const collectMs = (rec) => dubaiMs(rec.collectUntil, "23:59");
export const isTrip = (rec) => rec && rec.kind === "trip";
// collecting -> confirmed (minimum reached at the deadline) or cancelled (everyone refunded).
export const tripState = (rec) => (rec.tripState || "collecting");
export const getTickets = (ref) => store.getTickets(ref);
export const saveTicket = (t) => store.saveTicket(t);
export const savePitch = (rec) => store.saveEvent(rec);

/* ---------------------------- Email (best effort) ----------------- */
// meta { kind, ref } is written to notifications_log.
export const sendEmail = async (to, subject, text, html, meta = {}) => {
  const key = clean(process.env.RESEND_API_KEY);
  if (!key || !to) return false;
  const log = (ok) => { if (store.dbConfigured()) store.logNotification({ email: to, channel: "email", kind: meta.kind || "email", subject, ref: meta.ref, ok }); return ok; };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Unite Team <welcome@uniteuow.com>", to: [to], subject, text, ...(html ? { html } : {}) }),
    });
    return log(r.ok);
  } catch (e) { return log(false); }
};

/* ---------------------------- Group trip sweep -------------------- */
// Runs at most every 2 minutes, piggybacking on the campus feed requests (no cron needed):
// at the payment deadline a trip is confirmed or cancelled with automatic (demo) refunds; before the event the
// host is reminded 48 h and 24 h ahead about undelivered tickets, and at 24 h missing tickets are flagged to the admin.
// A lock so only one request runs a sweep at a time: Redis when connected, otherwise the database.
export const acquireLock = async (name, seconds) => {
  if (storeConfigured()) { try { return (await kv("SET", name, "1", "NX", "EX", String(seconds))) === "OK"; } catch (e) { return false; } }
  if (store.dbConfigured()) { try { return await store.tryLock(name, seconds); } catch (e) { return false; } }
  return true;
};
export const releaseLock = async (name) => {
  if (storeConfigured()) await kv("DEL", name).catch(() => {});
  else if (store.dbConfigured()) await store.unlock(name).catch(() => {});
};
export const sweepTrips = async () => {
  if (!store.dbConfigured()) return;
  if (!(await acquireLock(K.sweep, 120))) return;
  const now = Date.now();
  for (const rec of await store.listActiveTrips()) if (now <= startMs(rec) + 864e5) await sweepTrip(rec.ref);
};
// One trip's deadline, reminders and admin flag. A short per-trip lock stops two requests acting twice.
export const sweepTrip = async (ref) => {
  const token = readToken(), now = Date.now();
  if (!(await acquireLock(`${K.sweep}:${ref}`, 30))) return;
  {
    try {
      const rec = await getPitch(ref);
      if (!rec || !isTrip(rec) || now > startMs(rec) + 864e5) return;
      if (rec.status !== "approved") return;
      let next = rec;
      const tix = await getTickets(ref);
      const live = tix.filter((t) => !t.refunded);
      if (tripState(rec) === "collecting" && now >= collectMs(rec)) {
        if (live.length >= rec.minGroup) next = { ...rec, tripState: "confirmed", confirmedAt: now };
        else {
          next = { ...rec, tripState: "cancelled", cancelledAt: now };
          for (const t of live) {
            await saveTicket({ ...t, refunded: true, refundedAt: now });
            await sendEmail(t.email, `Cancelled: ${rec.title}`, `The group trip "${rec.title}" didn't reach its minimum of ${rec.minGroup} people by the deadline, so it's cancelled. Your payment of ${t.price || 0} AED has been refunded automatically.\n\nUnite · uniteuow.com`, null, { kind: "trip_refund", ref });
          }
          if (token) for (const chat_id of ADMIN_CHATS) await tg(token, "sendMessage", { chat_id, text: `🚫 Group trip cancelled: "${rec.title}" (${ref}) reached ${live.length} of ${rec.minGroup} people by the deadline. ${live.length} purchase(s) marked refunded (demo).` }).catch(() => {});
          await sendEmail(rec.email, `Your group trip "${rec.title}" was cancelled`, `It reached ${live.length} of the ${rec.minGroup} people needed by the payment deadline, so everyone has been refunded automatically.\n\nUnite · uniteuow.com`, null, { kind: "trip_cancelled", ref });
        }
      }
      if (tripState(next) === "confirmed") {
        const missing = live.filter((t) => !t.delivery).length, left = startMs(next) - now;
        const remind = async (flag, hours) => {
          if (next[flag] || left > hours * 36e5 || !missing) return;
          next = { ...next, [flag]: now };
          await sendEmail(next.email, `Reminder: ${missing} ticket(s) to deliver for "${next.title}"`, `${live.length - missing} of ${live.length} tickets are delivered. Every ticket must be delivered at least 24 hours before the event: open Unite → My Events → ${next.title} → Attendees.\n\nUnite · uniteuow.com`, null, { kind: "trip_deliver_reminder", ref });
        };
        await remind("remind48", 48);
        await remind("remind24", 24);
        if (!next.flagged && left <= 24 * 36e5 && missing) {
          next = { ...next, flagged: now };
          if (token) for (const chat_id of ADMIN_CHATS) await tg(token, "sendMessage", { chat_id, text: `⚠️ Tickets missing for group trip "${next.title}" (${ref}): ${live.length - missing} of ${live.length} delivered, and the event starts ${new Date(startMs(next)).toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} (Dubai). Host: ${next.email}` }).catch(() => {});
        }
      }
      if (next !== rec) await savePitch({ ...next, updatedAt: now });
    } catch (e) { console.error(`Trip sweep failed for ${ref}:`, e && e.message); }
    finally { await releaseLock(`${K.sweep}:${ref}`); }
  }
};
