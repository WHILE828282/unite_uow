import { useEffect, useRef, useState } from "react";
import { isStandalone } from "../../../install.js";
import { GetAppBadges } from "../GetApp.jsx";
import { UniteIcon } from "../UniteIcon.jsx";
import { Modal } from "./Modal.jsx";
import { AnimatedCheck, Check } from "../ui.jsx";
import { maskEmail, validEmail } from "../../lib/format.js";
import { RESTRICTED_MSG, isCampusEmail } from "../../lib/auth.js";

export function AuthModal({ reason, onClose, onSignIn, onRestricted, defaultName = "", defaultSid = "", title = "Campus Login" }) {
  const [step, setStep] = useState("email"); // email | otp | success
  const [name, setName] = useState(defaultName);
  const [nameError, setNameError] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState(defaultSid);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  // "demo": the original walkthrough (any 4-digit code). "live": a real 6-digit code emailed via Resend (/api/otp).
  const [mode, setMode] = useState("demo");
  const [challenge, setChallenge] = useState("");
  const [otpError, setOtpError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [seconds, setSeconds] = useState(45);
  const [resent, setResent] = useState(false);
  const refs = useRef([]);
  const timers = useRef([]);
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (step !== "otp" || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, seconds]);
  useEffect(() => { if (step === "otp" && refs.current[0]) refs.current[0].focus(); }, [step]);

  const blank = (n) => Array(n).fill("");
  const otpApi = async (body) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch("/api/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
      const data = await r.json().catch(() => ({}));
      return r.ok && data.ok ? data : { ok: false, error: data.error || "We couldn't send the code. Try again, or use the demo account." };
    } catch (e) {
      return { ok: false, error: "Couldn't reach the server. Check your connection, or use the demo account." };
    } finally { clearTimeout(t); }
  };
  // Live: email a real 6-digit code through Resend.
  const sendLive = async (v) => {
    setSending(true);
    const r = await otpApi({ action: "send", email: v });
    setSending(false);
    if (!r.ok) return r.error;
    setChallenge(r.challenge); setMode("live"); setAttempts(0); setOtpError("");
    setDigits(blank(6)); setSeconds(45); setStep("otp");
    return "";
  };
  const cleanName = () => name.trim().replace(/\s+/g, " ").slice(0, 60);
  const sendCode = async (override) => {
    if (typeof override !== "string" && cleanName().length < 2) return setNameError("Enter your name, so organisers know who's coming.");
    const v = (typeof override === "string" ? override : email).trim().toLowerCase();
    if (!validEmail(v)) return setError("Enter a valid email address, like name@uowdubai.ac.ae.");
    // Live codes: UOWD campus accounts only (the demo account below is open to everyone).
    if (typeof override !== "string" && !isCampusEmail(v)) { setError(RESTRICTED_MSG); if (onRestricted) onRestricted(); return; }
    setEmail(v); setError("");
    if (typeof override !== "string") { const err = await sendLive(v); if (err) setError(err); return; }
    // Demo account: unchanged walkthrough, any 4-digit code works.
    setMode("demo"); setOtpError(""); setSending(true);
    later(() => { setSending(false); setDigits(["", "", "", ""]); setSeconds(45); setStep("otp"); }, 800);
  };

  const finish = (verified) => {
    setVerifying(false);
    setStep("success");
    later(() => onSignIn(email, studentId.trim(), verified, cleanName() || (mode === "demo" ? "Demo Student" : "")), 1300);
  };
  const verify = async (code) => {
    setVerifying(true); setOtpError("");
    // Demo mode: any complete 4-digit code verifies.
    if (mode === "demo") return later(() => finish(false), 700);
    const r = await otpApi({ action: "verify", email, code, challenge });
    if (r.ok) return finish(true);
    const n = attempts + 1;
    setVerifying(false); setAttempts(n);
    setOtpError(n >= 5 ? "Too many tries. Tap Resend code for a new one." : r.error);
    setDigits(blank(6));
    if (n < 5 && refs.current[0]) setTimeout(() => refs.current[0] && refs.current[0].focus(), 0);
  };

  const N = digits.length;
  const locked = verifying || (mode === "live" && attempts >= 5);
  const setDigit = (i, raw) => {
    // iPhone/Android code autofill (and some keyboards) put the whole code into one box: spread it across the boxes.
    const all = raw.replace(/\D/g, "");
    if (all.length >= 3 && !locked) { // 2 digits = typing over a filled box: keep the newest, below
      const full = all.length >= N, from = full ? 0 : i, next = full ? blank(N) : [...digits];
      (full ? all.slice(0, N) : all).split("").forEach((ch, k) => { if (from + k < N) next[from + k] = ch; });
      setDigits(next); setOtpError("");
      const at = next.findIndex((x) => !x);
      if (refs.current[at < 0 ? N - 1 : at]) refs.current[at < 0 ? N - 1 : at].focus();
      if (next.every(Boolean)) verify(next.join(""));
      return;
    }
    const d = all.slice(-1);
    const next = [...digits]; next[i] = d;
    setDigits(next); setOtpError("");
    if (d && i < N - 1 && refs.current[i + 1]) refs.current[i + 1].focus();
    if (next.every(Boolean)) verify(next.join(""));
  };
  const onKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const next = [...digits]; next[i - 1] = ""; setDigits(next); refs.current[i - 1].focus();
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1].focus();
    if (e.key === "ArrowRight" && i < N - 1) refs.current[i + 1].focus();
  };
  const onPaste = (e) => {
    const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, N);
    if (!t || locked) return;
    e.preventDefault();
    const next = blank(N);
    t.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next); setOtpError("");
    refs.current[Math.min(t.length, N - 1)].focus();
    if (t.length === N) verify(t);
  };
  const resend = async () => {
    if (mode === "live") {
      setSeconds(45);
      const err = await sendLive(email);
      if (err) { setOtpError(err); setSeconds(0); return; }
    } else { setSeconds(45); setDigits(["", "", "", ""]); }
    setResent(true);
    later(() => setResent(false), 3000);
    if (refs.current[0]) refs.current[0].focus();
  };

  return (
    <Modal onClose={onClose}>
      <div key={step} className="u-slide p-6 pt-8">
        {step === "email" && (
          <>
            <div className="flex flex-col items-center">
              <UniteIcon className="h-16 w-16 shadow-lg" />
              <span className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">unite</span>
            </div>
            <h2 className="mt-3 text-center text-xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-center text-sm text-slate-500">{reason || "Sign in with your email to join clubs and get tickets."}</p>

            <label htmlFor="auth-name" className="mt-5 block text-sm font-medium text-slate-700">Your name</label>
            <input
              id="auth-name" value={name} autoFocus autoComplete="name" autoCapitalize="words" enterKeyHint="next"
              onChange={(e) => { setName(e.target.value.slice(0, 60)); setNameError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); document.getElementById("auth-email").focus(); } }}
              placeholder="e.g., Layla Al Mansoori"
              className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 ${nameError ? "border-rose-400" : "border-slate-300 focus:border-indigo-500"}`}
            />
            {nameError && <p className="mt-1.5 text-sm text-rose-600">{nameError}</p>}

            <label htmlFor="auth-email" className="mt-4 block text-sm font-medium text-slate-700">Email address</label>
            <input
              id="auth-email" type="email" inputMode="email" value={email} autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck="false" enterKeyHint="go"
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              placeholder="you@uowdubai.ac.ae"
              className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 ${error ? "border-rose-400" : "border-slate-300 focus:border-indigo-500"}`}
            />
            {error ? <p className="mt-1.5 text-sm text-rose-600">{error}</p> : <p className="mt-1.5 text-xs text-slate-500">Use your UOW student email (@uowmail.edu.au or @uowdubai.ac.ae).</p>}

            <label htmlFor="auth-sid" className="mt-4 block text-sm font-medium text-slate-700">Student ID <span className="font-normal text-slate-400">(Optional)</span></label>
            <input
              id="auth-sid" value={studentId} inputMode="numeric" pattern="[0-9]*" autoComplete="off" enterKeyHint="go"
              onChange={(e) => setStudentId(e.target.value.replace(/\s/g, "").slice(0, 12))}
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              placeholder="e.g., 7654321"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <p className="mt-1.5 text-xs text-slate-500">Up to you. Add it to show your ID on tickets, or leave it blank.</p>

            <button onClick={() => sendCode()} disabled={sending} className="u-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-80">
              {sending ? (<><span className="u-spin inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent" /> Sending code…</>) : "Email me a code"}
            </button>
            <button onClick={() => sendCode("demo@uniteuow.com")} disabled={sending} className="mt-2 w-full rounded-xl py-2.5 text-sm font-medium text-crimson-700 hover:bg-slate-100">
              Continue with a demo account
            </button>

            <ul className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              {["Join clubs in one tap", "Reserve and buy tickets securely", "Host your own student events"].map((t) => (
                <li key={t} className="flex items-center gap-2"><span className="text-emerald-500"><Check /></span>{t}</li>
              ))}
            </ul>
            {!isStandalone() && <div className="mt-5 border-t border-slate-100 pt-5"><GetAppBadges heading="Get the app" /></div>}
          </>
        )}

        {step === "otp" && (
          <>
            <button onClick={() => setStep("email")} className="-ml-1 rounded-lg px-1.5 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100">← Change email</button>
            <h2 className="mt-3 text-center text-xl font-bold text-slate-900">Enter your code</h2>
            <p className="mt-1 text-center text-sm text-slate-500">We sent a {N}-digit code to <span className="font-semibold text-slate-800">{maskEmail(email)}</span></p>
            {studentId.trim() && <p className="mt-2 text-center"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200/70">Student ID {studentId.trim()}</span></p>}

            <div className={mode === "live" ? "mx-auto mt-6 grid max-w-[22rem] grid-cols-6 gap-2" : "mt-6 flex justify-center gap-3"} onPaste={onPaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { refs.current[i] = el; }}
                  value={d}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  enterKeyHint="done"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${i + 1}`}
                  readOnly={locked}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                  onFocus={(e) => e.target.select()}
                  className={`${mode === "live" ? "h-14 w-full min-w-0" : "h-16 w-14"} rounded-xl border-2 text-center text-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${d ? "border-indigo-500 bg-indigo-50" : "border-slate-200/50 bg-white shadow-sm focus:border-indigo-500"}`}
                />
              ))}
            </div>

            <div className="mt-4 flex h-6 items-center justify-center text-sm">
              {verifying ? (
                <span className="inline-flex items-center gap-2 text-slate-500"><span className="u-spin inline-block h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent" /> Verifying…</span>
              ) : otpError ? (
                <span role="alert" className="font-medium text-rose-600">{otpError}</span>
              ) : resent ? (
                <span className="font-medium text-emerald-600">New code sent ✓</span>
              ) : null}
            </div>

            <div className="mt-2 text-center text-sm text-slate-500">
              {seconds > 0 ? (
                <span>Resend code in <span className="font-mono font-semibold text-slate-700">0:{String(seconds).padStart(2, "0")}</span></span>
              ) : (
                <button onClick={resend} className="font-semibold text-crimson-700 hover:underline">Resend code</button>
              )}
            </div>

            {mode === "demo" ? (
              <p className="mt-5 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">Demo mode: any 4-digit code works, for example <span className="font-mono font-bold text-slate-700">1234</span>.</p>
            ) : (
              <p className="mt-5 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">Check your inbox for an email from Unite. Not there? Look in spam or promotions. The code expires in 10 minutes.</p>
            )}
          </>
        )}

        {step === "success" && (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center"><AnimatedCheck /></div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">You're verified</h2>
            <p className="mt-1 text-sm text-slate-500">Signing you in as {email}…</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
