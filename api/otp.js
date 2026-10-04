/* Vercel serverless function: live email verification codes for Unite, sent with Resend.
   POST { action: "send", email }                      -> emails a 6-digit code, returns a signed challenge
   POST { action: "verify", email, code, challenge }   -> { ok: true } when the code matches
   Stateless: the challenge carries the email and expiry, signed with HMAC so it can't be forged or reused
   for another address. Needs RESEND_API_KEY. Sender: Unite Team <welcome@uniteuow.com>. Only UOW addresses (@uowdubai.ac.ae, @uowmail.edu.au, @uow.edu.au) and @uniteuow.com. */
import crypto from "node:crypto";
import { sessionToken } from "./_lib.js";

const TTL_MS = 10 * 60 * 1000; // codes expire after 10 minutes
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const clean = (v) => String(v || "").trim().replace(/^["']|["']$/g, "").trim();
const apiKey = () => clean(process.env.RESEND_API_KEY);
// Every code is sent from Unite's verified domain.
const sender = () => "Unite Team <welcome@uniteuow.com>";
// Live codes go to UOWD campus accounts only (the demo account never reaches this API).
const isCampus = (v) => /^[^\s@]+@(uowdubai\.ac\.ae|uowmail\.edu\.au|uow\.edu\.au|uniteuow\.com)$/.test(v);
const RESTRICTED = "🔒 Access Restricted: Unite is an exclusive secure ecosystem for verified UOWD campus members only.";
// Signing key: OTP_SECRET if set, otherwise derived from the Resend key (both stay server-side).
const signingKey = () => crypto.createHash("sha256").update(`unite-otp:${clean(process.env.OTP_SECRET) || apiKey()}`).digest();
const sign = (email, code, exp) => crypto.createHmac("sha256", signingKey()).update(`${email}|${code}|${exp}`).digest("base64url");

const emailHtml = (code) => `<!doctype html><html><body style="margin:0;background:#06101f;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#06101f;padding:32px 16px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#0a192f;border:1px solid #233554;border-radius:16px;padding:32px">
<tr><td style="color:#e6f1ff;font-size:20px;font-weight:700">Unite · UOWD</td></tr>
<tr><td style="color:#8892b0;font-size:14px;padding-top:8px">Your verification code is</td></tr>
<tr><td style="padding:20px 0"><div style="background:#112240;border:1px solid #233554;border-radius:12px;text-align:center;color:#ffffff;font-size:34px;font-weight:700;letter-spacing:10px;padding:16px 0;font-family:Menlo,Consolas,monospace">${code}</div></td></tr>
<tr><td style="color:#8892b0;font-size:13px;line-height:1.5">It expires in 10 minutes. If you didn't try to sign in to Unite, you can ignore this email.</td></tr>
<tr><td style="padding-top:24px"><div style="height:3px;width:48px;background:#b3123a;border-radius:2px"></div></td></tr>
</table></td></tr></table></body></html>`;

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
  const email = String(b.email || "").trim().toLowerCase().slice(0, 254);
  if (!isEmail(email)) return res.status(400).json({ ok: false, error: "Enter a valid email address, like name@uowdubai.ac.ae." });
  if (!isCampus(email)) return res.status(403).json({ ok: false, code: "domain", error: RESTRICTED });
  if (!apiKey()) {
    console.error("RESEND_API_KEY is missing for this deployment");
    return res.status(503).json({ ok: false, code: "config", error: "Email sign-in isn't available right now. Use the demo account instead." });
  }

  if (b.action === "send") {
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    const exp = Date.now() + TTL_MS;
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: sender(), to: [email],
          subject: `${code} is your Unite verification code`,
          html: emailHtml(code),
          text: `Your Unite verification code is ${code}. It expires in 10 minutes. If you didn't try to sign in, ignore this email.`,
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
    return res.status(200).json({ ok: true, session: sessionToken(email) });
  }

  return res.status(400).json({ ok: false, error: "Unknown action." });
}
