import { useEffect, useRef, useState } from "react";
import { isStandalone } from "../../../install.js";
import { GetAppBadges } from "../GetApp.jsx";
import { UniteIcon } from "../UniteIcon.jsx";
import { Modal } from "./Modal.jsx";
import { AnimatedCheck, Check } from "../ui.jsx";
import { maskEmail, validEmail } from "../../lib/format.js";
import { RESTRICTED_MSG } from "../../lib/auth.js";
import { ConsentRow, deviceAccepted } from "../Legal.jsx";

export function AuthModal({ reason, onClose, onSignIn, onRestricted, defaultName = "", defaultSid = "", title = "Campus Login" }) {
  const [step, setStep] = useState("email"); // email | otp | success
  // signup: name, email, password (+ optional student ID), confirmed once with an email code.
  // login: email + password. reset ("Forgot password?"): email + new password, confirmed with an email code.
  // Change email (from Profile, defaultName set): just the new email and a code.
  const [flow, setFlow] = useState(() => { try { return !defaultName && localStorage.getItem("unite-returning") ? "login" : "signup"; } catch (e) { return "signup"; } });
  const changing = !!defaultName;
  const login = flow === "login" && !changing, reset = flow === "reset" && !changing, signup = !login && !reset;
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");
  // First sign-in on this device: accept the Terms and Privacy Policy (never pre-ticked).
  const [needsConsent] = useState(() => !deviceAccepted());
  const [agreed, setAgreed] = useState(false);
  const [attempt, setAttempt] = useState(0);
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
  // One real input behind the code boxes: focus never jumps from box to box (on iPhone each jump re-scrolled the
  // screen, so it shook with every digit), and code autofill fills it in one go.
  const otpRef = useRef(null);
  const [otpFocus, setOtpFocus] = useState(false);
  const timers = useRef([]);
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (step !== "otp" || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, seconds]);
  useEffect(() => { if (step === "otp" && otpRef.current) otpRef.current.focus({ preventScroll: true }); }, [step]);

  const blank = (n) => Array(n).fill("");
  const otpApi = async (body) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch("/api/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
      const data = await r.json().catch(() => ({}));
      return r.ok && data.ok ? data : { ok: false, code: data.code, field: data.field, error: data.error || "We couldn't send the code. Try again, or use the demo account." };
    } catch (e) {
      return { ok: false, error: "Couldn't reach the server. Check your connection, or use the demo account." };
    } finally { clearTimeout(t); }
  };
  // Live: email a real 6-digit code through Resend.
  const purpose = changing ? undefined : reset ? "reset" : "signup";
  const sendLive = async (v) => {
    setSending(true);
    const r = await otpApi({ action: "send", email: v, ...(purpose ? { purpose, password } : {}) });
    setSending(false);
    if (!r.ok && r.code === "exists") { setFlow("login"); setPassword(""); return r.error; }
    if (!r.ok && r.field === "password") { setPwError(r.error); return ""; }
    if (!r.ok) return r.code === "domain" ? RESTRICTED_MSG : r.error;
    setChallenge(r.challenge); setMode("live"); setAttempts(0); setOtpError("");
    setDigits(blank(6)); setSeconds(45); setStep("otp");
    return "";
  };
  const cleanName = () => name.trim().replace(/\s+/g, " ").slice(0, 60);
  const sendCode = async (override) => {
    if (needsConsent && !agreed) return setAttempt((n) => n + 1);
    if (typeof override !== "string" && signup && !changing && cleanName().length < 2) return setNameError("Enter your name, so organisers know who's coming.");
    const v = (typeof override === "string" ? override : email).trim().toLowerCase();
    if (!validEmail(v)) return setError("Enter a valid email address, like name@uowdubai.ac.ae.");
    // Live codes: UOWD campus accounts only (the demo account below is open to everyone).
    // (Admin addresses in ADMIN_EMAILS are allowed too: the server decides and answers "domain" for everyone else.)
    setEmail(v); setError("");
    if (typeof override !== "string" && !changing) {
      const bad = password.length < 8 ? "Use at least 8 characters for your password." : password.length > 128 ? "Use 128 characters or fewer." : "";
      if (bad) return setPwError(bad);
    }
    if (typeof override !== "string" && login) {
      setSending(true);
      const r = await otpApi({ action: "login", email: v, password });
      setSending(false);
      if (r.ok) { setMode("live"); return finish(true, r.session, r.profile); }
      if (r.code === "domain") { setError(RESTRICTED_MSG); if (onRestricted) onRestricted(); return; }
      if (r.code === "nopassword") { setFlow("reset"); setPassword(""); return setError(r.error); }
      if (r.code === "wrong" || r.code === "locked") return setPwError(r.error);
      return setError(r.error);
    }
    if (typeof override !== "string") {
      const err = await sendLive(v);
      if (err === RESTRICTED_MSG) { setError(RESTRICTED_MSG); if (onRestricted) onRestricted(); return; }
      if (err) setError(err);
      return;
    }
    // Demo account: unchanged walkthrough, any 4-digit code works.
    setMode("demo"); setOtpError(""); setSending(true);
    later(() => { setSending(false); setDigits(["", "", "", ""]); setSeconds(45); setStep("otp"); }, 800);
  };

  const finish = (verified, session, profile) => {
    setVerifying(false);
    setStep("success");
    try { localStorage.setItem("unite-returning", "1"); } catch (e) { /* ignore */ }
    const p = profile || {};
    const fromAccount = login || reset;
    const who = fromAccount ? p.name || "" : cleanName(), sid = fromAccount ? p.studentId || "" : studentId.trim();
    later(() => onSignIn(email, sid, verified, who || (mode === "demo" ? "Demo Student" : ""), session, fromAccount ? { photo: p.photo || "", telegram: p.telegram || "", whatsapp: p.whatsapp || "" } : null), 1300);
  };
  const verify = async (code) => {
    setVerifying(true); setOtpError("");
    // Demo mode: any complete 4-digit code verifies.
    if (mode === "demo") return later(() => finish(false), 700);
    const r = await otpApi({ action: "verify", email, code, challenge,
      ...(purpose ? { purpose, password } : {}), ...(signup && !changing ? { name: cleanName(), studentId: studentId.trim() } : {}) });
    if (r.ok) return finish(true, r.session, r.profile);
    if (r.code === "exists") { setStep("email"); setFlow("login"); setPassword(""); setVerifying(false); return setError(r.error); }
    const n = attempts + 1;
    setVerifying(false); setAttempts(n);
    setOtpError(n >= 5 ? "Too many tries. Tap Resend code for a new one." : r.error);
    setDigits(blank(6));
    if (n < 5 && otpRef.current) setTimeout(() => otpRef.current && otpRef.current.focus({ preventScroll: true }), 0);
  };

  const N = digits.length;
  const locked = verifying || (mode === "live" && attempts >= 5);
  const onCode = (raw) => {
    if (locked) return;
    const v = String(raw || "").replace(/\D/g, "").slice(0, N);
    const next = blank(N);
    v.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next); setOtpError("");
    if (v.length === N) verify(v);
  };
  const resend = async () => {
    if (mode === "live") {
      setSeconds(45);
      const err = await sendLive(email);
      if (err) { setOtpError(err); setSeconds(0); return; }
    } else { setSeconds(45); setDigits(["", "", "", ""]); }
    setResent(true);
    later(() => setResent(false), 3000);
    if (otpRef.current) otpRef.current.focus({ preventScroll: true });
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

            {!changing && !reset && (
              <div role="tablist" aria-label="Account" className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                {[["signup", "Sign up"], ["login", "Log in"]].map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={flow === k} onClick={() => { setFlow(k); setError(""); setNameError(""); setPwError(""); }}
                    className={`u-btn rounded-lg py-2 text-sm font-semibold ${flow === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{l}</button>
                ))}
              </div>
            )}
            {reset && (
              <div className="mt-5 rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">Reset your password</p>
                <p className="mt-0.5 text-xs text-slate-500">Enter your email and a new password. We'll email you a code to confirm it's you.</p>
              </div>
            )}

            {signup && !changing && (<>
            <label htmlFor="auth-name" className="mt-5 block text-sm font-medium text-slate-700">Your name</label>
            <input
              id="auth-name" value={name} autoFocus autoComplete="name" autoCapitalize="words" enterKeyHint="next"
              onChange={(e) => { setName(e.target.value.slice(0, 60)); setNameError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); document.getElementById("auth-email").focus(); } }}
              placeholder="e.g., Layla Al Mansoori"
              className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-crimson-100 ${nameError ? "border-rose-400" : "border-slate-300 focus:border-crimson-400"}`}
            />
            {nameError && <p className="mt-1.5 text-sm text-rose-600">{nameError}</p>}
            </>)}

            <label htmlFor="auth-email" className="mt-4 block text-sm font-medium text-slate-700">Email address</label>
            <input
              id="auth-email" type="email" autoFocus={login} inputMode="email" value={email} autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck="false" enterKeyHint="go"
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              placeholder="you@uowdubai.ac.ae"
              className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-crimson-100 ${error ? "border-rose-400" : "border-slate-300 focus:border-crimson-400"}`}
            />
            {error ? <p className="mt-1.5 text-sm text-rose-600">{error}</p> : <p className="mt-1.5 text-xs text-slate-500">Use your UOW student email (@uowmail.edu.au or @uowdubai.ac.ae).</p>}

            {!changing && (<>
              <div className="mt-4 flex items-center justify-between">
                <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700">{reset ? "New password" : "Password"}</label>
                {login && <button type="button" onClick={() => { setFlow("reset"); setPassword(""); setPwError(""); setError(""); }} className="text-sm font-semibold text-crimson-700 hover:underline">Forgot password?</button>}
              </div>
              <div className="relative">
                <input
                  id="auth-password" type={showPw ? "text" : "password"} value={password} enterKeyHint="go"
                  autoComplete={login ? "current-password" : "new-password"} autoCapitalize="none" autoCorrect="off" spellCheck="false"
                  onChange={(e) => { setPassword(e.target.value.slice(0, 128)); setPwError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && sendCode()}
                  placeholder={login ? "Your password" : "At least 8 characters"}
                  className={`mt-1.5 w-full rounded-xl border bg-white py-3 pl-3.5 pr-16 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-crimson-100 ${pwError ? "border-rose-400" : "border-slate-300 focus:border-crimson-400"}`}
                />
                <button type="button" onClick={() => setShowPw((x) => !x)} aria-label={showPw ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 mt-[3px] -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100">{showPw ? "Hide" : "Show"}</button>
              </div>
              {pwError && <p className="mt-1.5 text-sm text-rose-600">{pwError}</p>}
            </>)}

            {signup && !changing && (<>
            <label htmlFor="auth-sid" className="mt-4 block text-sm font-medium text-slate-700">Student ID <span className="font-normal text-slate-400">(Optional)</span></label>
            <input
              id="auth-sid" value={studentId} inputMode="numeric" pattern="[0-9]*" autoComplete="off" enterKeyHint="go"
              onChange={(e) => setStudentId(e.target.value.replace(/\s/g, "").slice(0, 12))}
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              placeholder="e.g., 7654321"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm shadow-sm focus:border-crimson-400 focus:outline-none focus:ring-2 focus:ring-crimson-100"
            />
            <p className="mt-1.5 text-xs text-slate-500">Up to you. Add it to show your ID on tickets, or leave it blank.</p>
            </>)}

            {needsConsent && <ConsentRow className="mt-4" checked={agreed} onChange={setAgreed} attempt={attempt} />}
            <button onClick={() => sendCode()} disabled={sending} className="u-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-80">
              {sending ? (<><span className="u-spin inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent" /> {login ? "Logging in…" : "Sending code…"}</>) : changing ? "Email me a code" : login ? "Log in" : reset ? "Email me a code" : "Create account"}
            </button>
            {reset ? (
              <button onClick={() => { setFlow("login"); setPassword(""); setPwError(""); setError(""); }} className="mt-2 w-full rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
                ← Back to log in
              </button>
            ) : (
              <button onClick={() => sendCode("demo@uniteuow.com")} disabled={sending} className="mt-2 w-full rounded-xl py-2.5 text-sm font-medium text-crimson-700 hover:bg-slate-100">
                Continue with a demo account
              </button>
            )}

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

            <div className={`relative ${mode === "live" ? "mx-auto mt-6 grid max-w-[22rem] grid-cols-6 gap-2" : "mt-6 flex justify-center gap-3"}`}>
              {digits.map((d, i) => {
                const at = otpFocus && !locked && i === Math.min(digits.join("").length, N - 1);
                return (
                  <div key={i} aria-hidden="true"
                    className={`${mode === "live" ? "h-14 w-full min-w-0" : "h-16 w-14"} flex items-center justify-center rounded-xl border-2 text-2xl font-bold text-slate-900 transition-colors ${at ? "border-crimson-400 ring-4 ring-crimson-100" : ""} ${d ? "border-crimson-500 bg-crimson-50" : at ? "bg-white" : "border-slate-200/50 bg-white shadow-sm"}`}>
                    {d}
                  </div>
                );
              })}
              <input
                ref={otpRef} value={digits.join("")} onChange={(e) => onCode(e.target.value)}
                onFocus={() => setOtpFocus(true)} onBlur={() => setOtpFocus(false)}
                inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" enterKeyHint="done" maxLength={N}
                aria-label={`${N}-digit code`} readOnly={locked} autoCorrect="off" spellCheck="false"
                className="u-keep absolute inset-0 h-full w-full cursor-text appearance-none border-0 bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent"
                style={{ fontSize: 16, opacity: 0.011, letterSpacing: "2em" }}
              />
            </div>

            <div className="mt-4 flex h-6 items-center justify-center text-sm">
              {verifying ? (
                <span className="inline-flex items-center gap-2 text-slate-500"><span className="u-spin inline-block h-4 w-4 rounded-full border-2 border-crimson-500 border-t-transparent" /> Verifying…</span>
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
              <p className="mt-5 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">Check your inbox for an email from Unite. Not there? Look in spam or promotions. The code expires in 10 minutes.
                {/* UOW student mail is filtered by Mimecast, which can hold the code outside Outlook. */}
                {/@(uowmail\.edu\.au|uow\.edu\.au)$/.test(email) && <> Using UOW email? It may be held by Mimecast: open <a href="https://login-au.mimecast.com/u/login" target="_blank" rel="noopener noreferrer" className="font-semibold text-crimson-700 underline">Mimecast On Hold</a>, release it and tap Permit Sender.</>}
              </p>
            )}
          </>
        )}

        {step === "success" && (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center"><AnimatedCheck /></div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">{login && mode === "live" ? "Welcome back" : reset ? "Password updated" : "You're verified"}</h2>
            <p className="mt-1 text-sm text-slate-500">Signing you in as {email}…</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
