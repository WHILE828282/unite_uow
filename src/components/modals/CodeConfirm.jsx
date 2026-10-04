import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal.jsx";

/* Step-up check for actions that are hard to undo (leaving a club or team, cancelling a sign-up): we email a code to
   the account and the action only happens once it's typed in. Verified accounts get a real 6-digit code (/api/otp);
   the demo account gets a 4-digit demo code shown on screen, since it has no inbox. */
export function CodeConfirm({ email, live, title, body, actionLabel, onVerified, onCancel }) {
  const n = live ? 6 : 4;
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState("");
  const [demoCode] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [state, setState] = useState(live ? "sending" : "ready"); // sending | ready | checking | error
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(45);
  const done = useRef(false);
  const inputRef = useRef(null);

  const otp = async (bodyObj) => {
    try {
      const r = await fetch("/api/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bodyObj) });
      const d = await r.json().catch(() => ({}));
      return r.ok && d.ok ? d : { ok: false, error: d.error || "Something went wrong. Try again." };
    } catch (e) { return { ok: false, error: "Couldn't reach Unite. Check your connection." }; }
  };
  const send = async () => {
    setState("sending"); setError(""); setCode(""); setSeconds(45);
    const r = await otp({ action: "send", email });
    if (r.ok) { setChallenge(r.challenge); setState("ready"); } else { setError(r.error); setState("error"); }
  };
  useEffect(() => { if (live) send(); }, []); // eslint-disable-line
  useEffect(() => { if (state === "ready" && inputRef.current) inputRef.current.focus(); }, [state]);
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const submit = async (e) => {
    e && e.preventDefault();
    if (code.length !== n || state === "checking" || done.current) return;
    if (!live) {
      if (code !== demoCode) { setError("That code isn't right. Check it and try again."); setCode(""); return; }
      done.current = true; return onVerified();
    }
    setState("checking"); setError("");
    const r = await otp({ action: "verify", email, code, challenge });
    if (r.ok) { done.current = true; return onVerified(); }
    setError(r.error); setCode(""); setState("ready");
  };
  useEffect(() => { if (code.length === n) submit(); }, [code]); // eslint-disable-line

  return (
    <Modal onClose={onCancel} size="sm">
      <form onSubmit={submit} className="p-6 pt-8 text-center">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
        <p className="mt-4 text-sm text-slate-600">
          {live ? <>We sent a {n}-digit code to <span className="font-semibold text-slate-900">{email}</span>.</> : <>Demo account: your code is <span className="font-mono text-base font-bold tracking-widest text-slate-900">{demoCode}</span></>}
        </p>
        <input ref={inputRef} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, n)); setError(""); }}
          inputMode="numeric" autoComplete="one-time-code" maxLength={n} disabled={state === "sending" || state === "checking"} aria-label={`${n}-digit code`}
          placeholder={"•".repeat(n)}
          className="mx-auto mt-4 block w-48 rounded-xl border border-slate-200 bg-white py-3 text-center font-mono text-2xl tracking-[0.5em] text-slate-900 placeholder:text-slate-300 focus:border-crimson-400 focus:outline-none focus:ring-2 focus:ring-crimson-100 disabled:opacity-60" />
        <p className="mt-2 min-h-[1.25rem] text-sm text-rose-600" role="alert">{error}</p>
        {live && (
          <button type="button" onClick={send} disabled={seconds > 0 || state === "sending"} className="text-sm font-semibold text-crimson-700 disabled:text-slate-400">
            {state === "sending" ? "Sending code…" : seconds > 0 ? `Resend code in ${seconds}s` : "Resend code"}
          </button>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onCancel} className="u-btn rounded-xl py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Keep it</button>
          <button type="submit" disabled={code.length !== n || state === "checking"} className="u-btn rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
            {state === "checking" ? "Checking…" : actionLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
