/* Vercel serverless function: live email verification codes for Unite, sent with Resend.
   POST { action: "send", email }                      -> emails a 6-digit code, returns a signed challenge
   POST { action: "send", email, purpose?: signup|reset, password? }   (sign up / reset check the password and account first)
   POST { action: "verify", email, code, challenge, purpose?, password?, name?, studentId? } -> { ok, session, profile }
        sign up creates the account with its password; reset sets a new password; no purpose = change email
   POST { action: "login", email, password }            -> { ok, session, profile } (5 wrong in a row: paused 15 minutes)
   POST { action: "password-status" | "change-password", s, current?, next } (from Profile, signed in)
   Stateless: the challenge carries the email and expiry, signed with HMAC so it can't be forged or reused
   for another address. Needs RESEND_API_KEY. Sender: Unite Team <welcome@uniteuow.com>. Only UOW addresses (@uowdubai.ac.ae, @uowmail.edu.au, @uow.edu.au), @uniteuow.com and the admins in ADMIN_EMAILS. */
import crypto from "node:crypto";
import { sessionToken, sessionEmail, isAdminEmail } from "./_lib.js";
import * as store from "./_store.js";

const TTL_MS = 10 * 60 * 1000; // codes expire after 10 minutes
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const clean = (v) => String(v || "").trim().replace(/^["']|["']$/g, "").trim();
const apiKey = () => clean(process.env.RESEND_API_KEY);
// Every code is sent from Unite's verified domain.
const sender = () => "Unite Team <welcome@uniteuow.com>";
// Live codes go to UOWD campus accounts only (the demo account never reaches this API).
const isCampus = (v) => /^[^\s@]+@(uowdubai\.ac\.ae|uowmail\.edu\.au|uow\.edu\.au|uniteuow\.com)$/.test(v);
const RESTRICTED = "Unite is for UOWD students. Use your @uowmail.edu.au or @uowdubai.ac.ae email.";
// Signing key: OTP_SECRET if set, otherwise derived from the Resend key (both stay server-side).
const signingKey = () => crypto.createHash("sha256").update(`unite-otp:${clean(process.env.OTP_SECRET) || apiKey()}`).digest();
const sign = (email, code, exp) => crypto.createHmac("sha256", signingKey()).update(`${email}|${code}|${exp}`).digest("base64url");

// Plain, light, mostly-text email: dark heavy templates with the code in the subject trip spam signatures (e.g. UOW's Mimecast).
const emailHtml = (code) => `<!doctype html><html><body style="margin:0;padding:24px 16px;background:#ffffff;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0f172a">
<div style="max-width:440px;margin:0 auto">
<p style="font-size:15px;line-height:1.5;margin:0 0 12px">Hi,</p>
<p style="font-size:15px;line-height:1.5;margin:0 0 12px">Here is your code to sign in to Unite, the student app for UOWD clubs and events:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:0 0 12px;font-family:Menlo,Consolas,monospace">${code}</p>
<p style="font-size:14px;line-height:1.5;color:#475569;margin:0 0 12px">It expires in 10 minutes. If you didn't try to sign in, you can ignore this email.</p>
<p style="font-size:14px;line-height:1.5;color:#475569;margin:0">Unite Team<br>uniteuow.com · support@uniteuow.com</p>
</div></body></html>`;

/* Passwords: scrypt with a random salt per password, compared in constant time. */
const SCRYPT = { N: 16384, r: 8, p: 1 };
const hashPassword = (pw) => {
  const salt = crypto.randomBytes(16), h = crypto.scryptSync(pw, salt, 32, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64url")}$${h.toString("base64url")}`;
};
const passwordOk = (pw, stored) => {
  const [alg, N, r, p, salt, h] = String(stored || "").split("$");
  if (alg !== "scrypt" || !salt || !h || typeof pw !== "string") return false;
  const want = Buffer.from(h, "base64url");
  const got = crypto.scryptSync(pw, Buffer.from(salt, "base64url"), want.length, { N: Number(N), r: Number(r), p: Number(p) });
  return crypto.timingSafeEqual(want, got);
};
const passwordProblem = (pw) => (typeof pw !== "string" || pw.length < 8 ? "Use at least 8 characters for your password." : pw.length > 128 ? "Use 128 characters or fewer." : "");
const MAX_TRIES = 5, LOCK_MS = 15 * 60 * 1000; // 5 wrong passwords in a row pause log in for 15 minutes
const profileOf = (a) => ({ name: (a && a.name) || "", studentId: (a && a.studentId) || "", photo: (a && a.photo) || "", telegram: (a && a.telegram) || "", whatsapp: (a && a.whatsapp) || "" });

// Plain-English reason for a Resend rejection (no secrets included).
const explainResend = (status, d) => {
  const m = String((d && (d.message || d.error)) || "");
  if (status === 401 || /api key is invalid|invalid api key/i.test(m)) return { code: "config", msg: "Email sign-in isn't available right now. Use the demo account instead." };
  if (/only send testing emails|verify a domain/i.test(m)) return { code: "restricted", msg: "Live codes can't be delivered to this address yet. Use the demo account to explore Unite." };
  if (status === 429) return { code: "rate", msg: "Too many codes requested. Wait a minute and try again." };
  if (status === 422) return { code: "address", msg: "That email address can't receive codes. Check it and try again." };
  return { code: "send", msg: "We couldn't send the code. Try again, or use the demo account." };
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};

  // Signed in (from Profile): does the account have a password, and change it.
  if (b.action === "password-status" || b.action === "change-password") {
    const me = sessionEmail(b.s);
    if (!me) return res.status(401).json({ ok: false, code: "session", error: "Sign in again to change your password." });
    if (!store.dbConfigured()) return res.status(503).json({ ok: false, error: "Passwords aren't available right now. Try again later." });
    const auth = await store.getAuth(me);
    if (b.action === "password-status") return res.status(200).json({ ok: true, hasPassword: !!(auth && auth.hash) });
    if (auth && auth.hash) {
      if (auth.lockedUntil && auth.lockedUntil > Date.now()) return res.status(429).json({ ok: false, field: "current", error: "Too many wrong passwords. Try again in 15 minutes." });
      if (!passwordOk(String(b.current || ""), auth.hash)) {
        const n = (auth.failed || 0) + 1;
        await store.recordLogin(me, false, n >= MAX_TRIES ? Date.now() + LOCK_MS : null);
        return res.status(400).json({ ok: false, field: "current", error: "Your current password isn't right." });
      }
    }
    const bad = passwordProblem(b.next);
    if (bad) return res.status(400).json({ ok: false, field: "next", error: bad });
    await store.setPassword(me, hashPassword(b.next));
    return res.status(200).json({ ok: true });
  }

  const email = String(b.email || "").trim().toLowerCase().slice(0, 254);
  if (!isEmail(email)) return res.status(400).json({ ok: false, error: "Enter a valid email address, like name@uowdubai.ac.ae." });
  if (!isCampus(email) && !isAdminEmail(email)) return res.status(403).json({ ok: false, code: "domain", error: RESTRICTED });
  if (b.action !== "login" && !apiKey()) {
    console.error("RESEND_API_KEY is missing for this deployment");
    return res.status(503).json({ ok: false, code: "config", error: "Email sign-in isn't available right now. Use the demo account instead." });
  }

  if (b.action === "send") {
    // Sign up / reset: check the password and the account before emailing a code.
    if (b.purpose === "signup" || b.purpose === "reset") {
      const bad = passwordProblem(b.password);
      if (bad) return res.status(400).json({ ok: false, field: "password", error: bad });
      if (b.purpose === "signup" && store.dbConfigured()) {
        const auth = await store.getAuth(email).catch(() => null);
        if (auth && auth.hash) return res.status(409).json({ ok: false, code: "exists", error: "You already have an account with this email. Log in instead." });
      }
    }
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    const exp = Date.now() + TTL_MS;
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: sender(), to: [email],
          reply_to: "support@uniteuow.com",
          subject: "Your Unite sign-in code",
          html: emailHtml(code),
          text: `Hi,\n\nHere is your code to sign in to Unite, the student app for UOWD clubs and events:\n\n${code}\n\nIt expires in 10 minutes. If you didn't try to sign in, you can ignore this email.\n\nUnite Team\nuniteuow.com · support@uniteuow.com`,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        console.error("Resend rejected the email:", r.status, JSON.stringify(data));
        const why = explainResend(r.status, data);
        return res.status(502).json({ ok: false, code: why.code, error: why.msg });
      }
    } catch (e) {
      console.error("Resend request error:", e && e.message);
      return res.status(502).json({ ok: false, code: "send", error: "We couldn't send the code. Try again, or use the demo account." });
    }
    return res.status(200).json({ ok: true, challenge: `${exp}.${sign(email, code, exp)}` });
  }

  if (b.action === "verify") {
    const code = String(b.code || "").replace(/\D/g, "");
    const [expStr, mac] = String(b.challenge || "").split(".");
    const exp = Number(expStr);
    if (!/^\d{6}$/.test(code) || !mac || !Number.isFinite(exp)) return res.status(400).json({ ok: false, error: "Enter the 6-digit code from your email." });
    if (Date.now() > exp) return res.status(400).json({ ok: false, code: "expired", error: "This code has expired. Tap Resend code for a new one." });
    const want = Buffer.from(sign(email, code, exp)), got = Buffer.from(mac);
    if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return res.status(400).json({ ok: false, code: "wrong", error: "That code isn't right. Check the email and try again." });
    // The code proves the email is yours. Sign up: create the account with its password, name and student ID.
    // Reset: set the new password. Change email: no password involved.
    const purpose = b.purpose === "signup" || b.purpose === "reset" ? b.purpose : "";
    if (purpose) {
      const bad = passwordProblem(b.password);
      if (bad) return res.status(400).json({ ok: false, field: "password", error: bad });
      if (!store.dbConfigured()) return res.status(503).json({ ok: false, error: "Accounts aren't available right now. Try again later." });
    }
    let profile = null;
    if (store.dbConfigured()) {
      try {
        if (purpose === "signup") {
          if (!/^\d{4,10}$/.test(String(b.studentId || "").replace(/\s/g, ""))) return res.status(400).json({ ok: false, field: "studentId", error: "Enter your student ID (numbers only, e.g. 7654321)." });
          const auth = await store.getAuth(email);
          if (auth && auth.hash) return res.status(409).json({ ok: false, code: "exists", error: "You already have an account with this email. Log in instead." });
        }
        const name = String(b.name || "").trim().replace(/\s+/g, " ").slice(0, 60), studentId = String(b.studentId || "").replace(/\s/g, "").slice(0, 12);
        await store.ensureUser(email, purpose === "signup" && name.length >= 2 ? { name, studentId: studentId || undefined } : {});
        if (purpose) await store.setPassword(email, hashPassword(b.password));
        profile = profileOf(await store.getAuth(email));
      } catch (e) {
        console.error("Account on sign-in failed:", e && e.message);
        if (purpose) return res.status(500).json({ ok: false, error: "Something went wrong. Please try again." });
      }
    }
    return res.status(200).json({ ok: true, session: sessionToken(email), profile });
  }

  if (b.action === "login") {
    if (!store.dbConfigured()) return res.status(503).json({ ok: false, error: "Log in isn't available right now. Try again later." });
    const auth = await store.getAuth(email);
    if (!auth) return res.status(404).json({ ok: false, code: "noaccount", error: "There's no Unite account with this email yet. Sign up first." });
    if (!auth.hash) return res.status(400).json({ ok: false, code: "nopassword", error: "This account doesn't have a password yet. Tap Forgot password to set one with an email code." });
    if (auth.lockedUntil && auth.lockedUntil > Date.now()) {
      const mins = Math.max(1, Math.ceil((auth.lockedUntil - Date.now()) / 60000));
      return res.status(429).json({ ok: false, code: "locked", error: `Too many wrong passwords. Try again in ${mins} minute${mins === 1 ? "" : "s"}, or tap Forgot password.` });
    }
    if (!passwordOk(String(b.password || ""), auth.hash)) {
      const n = (auth.failed || 0) + 1;
      await store.recordLogin(email, false, n >= MAX_TRIES ? Date.now() + LOCK_MS : null);
      return res.status(400).json({ ok: false, code: "wrong", error: n >= MAX_TRIES ? "Too many wrong passwords. Try again in 15 minutes, or tap Forgot password." : "That password isn't right. Try again, or tap Forgot password." });
    }
    await store.recordLogin(email, true);
    return res.status(200).json({ ok: true, session: sessionToken(email), profile: profileOf(auth) });
  }

  return res.status(400).json({ ok: false, error: "Unknown action." });
}
