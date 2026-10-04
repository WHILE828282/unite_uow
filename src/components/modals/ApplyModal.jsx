import { useState } from "react";
import { Modal } from "./Modal.jsx";
import { waNumber } from "../../lib/apps.js";

/* Application to a club (every club except the sports teams). Name and email come from the profile, WhatsApp too if
   saved (UAE code by default). The club's owner and helpers are notified straight away. */
export function ApplyModal({ club: c, name: defaultName, email, whatsapp: savedWa, onSubmit, onClose }) {
  const [f, setF] = useState({ name: defaultName || "", whatsapp: savedWa || "+971 ", year: "", message: "", consent: false });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => { const v = k === "consent" ? e.target.checked : e.target.value; setF((x) => ({ ...x, [k]: v })); setErrors((x) => ({ ...x, [k]: "" })); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const er = {};
    if (f.name.trim().length < 2) er.name = "Enter your name.";
    if (!waNumber(f.whatsapp)) er.whatsapp = "Enter a WhatsApp number with country code, e.g. +971 50 123 4567.";
    if (!f.consent) er.consent = "Tick the box to share your contact details with the club.";
    setErrors(er);
    if (Object.keys(er).length) return;
    setSending(true);
    const err = await onSubmit({ name: f.name.trim().replace(/\s+/g, " "), whatsapp: f.whatsapp.trim(), year: f.year.trim(), message: f.message.trim(), consent: true });
    if (err) { setError(err); setSending(false); }
  };

  const field = (bad) => `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${bad ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:border-crimson-400 focus:ring-crimson-100"}`;
  const Err = ({ k }) => (errors[k] ? <p className="mt-1.5 text-xs text-rose-600">{errors[k]}</p> : null);

  return (
    <Modal onClose={sending ? () => {} : onClose}>
      <form onSubmit={submit} noValidate className="p-6 pt-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-crimson-700">Apply to join</p>
        <h2 className="mt-1 pr-10 text-lg font-bold text-slate-900">{c.name}</h2>
        <p className="mt-1 text-sm text-slate-500">The club's committee gets your application right away and usually replies on WhatsApp or by email.</p>

        <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="ap-name">Name</label>
        <input id="ap-name" value={f.name} onChange={set("name")} maxLength={60} autoComplete="name" className={field(errors.name)} />
        <Err k="name" />

        <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="ap-email">Email</label>
        <input id="ap-email" value={email} readOnly className={`${field(false)} bg-slate-50 text-slate-500`} />

        <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="ap-wa">WhatsApp number</label>
        <input id="ap-wa" type="tel" inputMode="tel" autoComplete="tel" value={f.whatsapp} onChange={set("whatsapp")} placeholder="+971 50 123 4567" className={field(errors.whatsapp)} />
        <Err k="whatsapp" />

        <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="ap-year">Year / major <span className="font-normal text-slate-400">(optional)</span></label>
        <input id="ap-year" value={f.year} onChange={set("year")} maxLength={60} placeholder="e.g. Year 2 · Computer Science" className={field(false)} />

        <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="ap-msg">Tell the club about yourself <span className="font-normal text-slate-400">(optional)</span></label>
        <textarea id="ap-msg" rows={4} value={f.message} onChange={set("message")} maxLength={300} placeholder="What you'd like to do, any experience, when you're free…" className={`${field(false)} resize-none`} />
        <p className="mt-1 text-right text-xs tabular-nums text-slate-400">{f.message.length}/300</p>

        <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3.5">
          <input type="checkbox" checked={f.consent} onChange={set("consent")} className="mt-0.5 h-5 w-5 shrink-0 accent-crimson-700" />
          <span className="text-sm text-slate-700">I agree to share my contact details with this club</span>
        </label>
        <Err k="consent" />

        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">{error}</p>}

        <button type="submit" disabled={sending || !f.consent} className="u-btn mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-[15px] font-semibold text-white disabled:opacity-50">
          {sending && <span className="u-spin h-4 w-4 rounded-full border-2 border-white border-t-transparent" />}
          {sending ? "Sending…" : "Send application"}
        </button>
      </form>
    </Modal>
  );
}
