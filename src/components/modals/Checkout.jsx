import { useEffect, useState } from "react";
import { Ticket } from "../Ticket.jsx";
import { Modal } from "./Modal.jsx";
import { Check, Icon } from "../ui.jsx";
import { fmtDate } from "../../lib/format.js";
import { GRADIENTS } from "../../lib/styles.js";

export const cardBrand = (digits) => (/^4/.test(digits) ? "VISA" : /^(5[1-5]|2[2-7])/.test(digits) ? "Mastercard" : /^3[47]/.test(digits) ? "AMEX" : "");

export function PayCard({ number = "", name, exp, wallet }) {
  const digits = number.replace(/\D/g, "");
  const shown = wallet ? "•••• •••• •••• 4242" : (digits + "•".repeat(Math.max(0, 16 - digits.length))).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const brand = wallet ? "VISA" : cardBrand(digits);
  return (
    <div className="u-keep relative mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl p-5 text-white shadow-lg"
      style={{ aspectRatio: "1.586", background: "linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #0f172a 100%)" }}>
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-400" style={{ filter: "blur(50px)", opacity: 0.35 }} />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-200">{wallet ? "Wallet" : "Debit / Credit"}</span>
          <span className="text-lg font-extrabold italic leading-none tracking-tight">{brand}</span>
        </div>
        <div>
          <div className="h-7 w-10 rounded-md" style={{ background: "linear-gradient(135deg, #fde68a, #d97706)" }} />
          <p className="mt-3 font-mono text-base tracking-widest tabular-nums">{shown}</p>
          <div className="mt-1.5 flex justify-between gap-3 text-xs uppercase tracking-wider text-indigo-200">
            <span className="truncate">{name || "Card holder"}</span><span className="tabular-nums">{exp || "MM/YY"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Checkout({ party, email, onPaid, onDownload, onClose, live = (b) => b, onOpenFile }) {
  const [step, setStep] = useState("review");
  const [method, setMethod] = useState("Apple Pay");
  const [stage, setStage] = useState(0);
  const [booking, setBooking] = useState(null);
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", name: "" });
  const [errors, setErrors] = useState({});
  const amount = party.price.toFixed(2);
  const stages = [method === "Apple Pay" ? "Confirming with Face ID" : "Securing your card details", "Authorizing with your bank", "Issuing your ticket"];
  const label = method === "Apple Pay" ? "Apple Pay · Visa •••• 4242" : `Card •••• ${card.number.replace(/\D/g, "").slice(-4)}`;

  useEffect(() => {
    if (step !== "processing") return;
    const timers = [
      setTimeout(() => setStage(1), 900),
      setTimeout(() => setStage(2), 1800),
      setTimeout(() => { setBooking(onPaid(party, email, label)); setStep("done"); }, 2700),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line
  }, [step]);

  const confirm = () => {
    if (step !== "review") return; // a second fast tap must not pay twice
    if (method === "Card") {
      const e = {};
      if (card.number.replace(/\s/g, "").length < 15) e.number = "Enter a valid card number.";
      const mm = card.exp.match(/^(\d{2})\/(\d{2})$/);
      if (!mm || +mm[1] < 1 || +mm[1] > 12 || new Date(2000 + +mm[2], +mm[1], 1) <= new Date()) e.exp = "Use a future date (MM/YY).";
      if (card.cvc.length < 3) e.cvc = "3 or 4 digits.";
      if (card.name.trim().length < 2) e.name = "Enter the name on the card.";
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    setStage(0); setStep("processing");
  };

  const upd = (k, fmt) => (e) => { setCard({ ...card, [k]: fmt(e.target.value) }); setErrors({ ...errors, [k]: undefined }); };
  const fmtNum = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };
  const fmtCvc = (v) => v.replace(/\D/g, "").slice(0, 4);
  const fmtName = (v) => v.slice(0, 40);

  if (step === "done" && booking) return <Modal onClose={onClose}><Ticket booking={live(booking)} justPaid onClose={onClose} onDownload={onDownload} onOpenFile={onOpenFile} /></Modal>;

  if (step === "processing")
    return (
      <Modal locked onClose={onClose}>
        <div className="px-8 py-12 text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div className="u-spin absolute inset-0 rounded-full border-4 border-transparent border-t-slate-900" />
            <span className="absolute inset-0 flex items-center justify-center text-crimson-700"><Icon name={method === "Apple Pay" ? "phone" : "card"} className="h-6 w-6" /></span>
          </div>
          <p className="mt-6 text-3xl font-bold tabular-nums tracking-tight text-slate-900">{amount} <span className="text-base font-semibold text-slate-400">AED</span></p>
          <p className="mt-1 text-sm text-slate-500">Processing securely with Ziina · {label}</p>
          <ul className="mx-auto mt-7 max-w-xs space-y-3 text-left text-sm">
            {stages.map((t, i) => (
              <li key={t} className={`flex items-center gap-3 ${i <= stage ? "text-slate-800" : "text-slate-400"}`}>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${i < stage ? "bg-emerald-500" : i === stage ? "bg-indigo-500" : "bg-slate-200"}`}>
                  {i < stage ? <Check className="h-3 w-3" /> : i === stage ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                </span>
                {t}{i === stage && "…"}
              </li>
            ))}
          </ul>
          <p className="mt-7 text-xs text-slate-400">Please keep this window open.</p>
        </div>
      </Modal>
    );

  const inp = (k) => `mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 ${errors[k] ? "border-rose-400" : "border-slate-300 focus:border-indigo-500"}`;
  const Err = ({ k }) => (errors[k] ? <p className="mt-1 text-xs text-rose-600">{errors[k]}</p> : null);

  return (
    <Modal onClose={onClose}>
      <div className="px-5 pb-6 pt-3">
        <div className="mx-auto h-1 w-10 rounded-full bg-slate-200" />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">ziina</span>
            <span className="text-xs font-medium text-slate-400">Secure checkout</span>
          </div>
          <span className="mr-9 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"><Icon name="lock" className="h-3 w-3" /> pay.ziina.com</span>
        </div>

        <div className="mt-5 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Paying Unite Events</p>
          <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-slate-900">{amount}<span className="ml-1.5 text-lg font-semibold text-slate-400">AED</span></p>
          <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-sm text-slate-600">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm ${GRADIENTS[party.category]}`}>{party.emoji}</span>
            <span className="truncate">{party.title} · {fmtDate(party.date)}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Payment method">
          {[["Apple Pay", "phone"], ["Card", "card"]].map(([m, icon]) => (
            <button key={m} role="radio" aria-checked={method === m} onClick={() => { setMethod(m); setErrors({}); }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold ${method === m ? "u-seg-on bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              <Icon name={icon} className="h-4 w-4" /> {m}
            </button>
          ))}
        </div>

        <div key={method} className="u-fade mt-4">
          {method === "Apple Pay" ? (
            <>
              <PayCard wallet name={email.split("@")[0].replace(/[._]/g, " ")} exp="09/29" />
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500"><Icon name="phone" className="h-3.5 w-3.5" /> Double-click the side button to confirm with Face ID</p>
            </>
          ) : (
            <>
              <PayCard number={card.number} name={card.name} exp={card.exp} />
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="cc-number" className="text-sm font-medium text-slate-700">Card number</label>
                  <input id="cc-number" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" className={inp("number")} value={card.number} onChange={upd("number", fmtNum)} />
                  <Err k="number" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cc-exp" className="text-sm font-medium text-slate-700">Expiry</label>
                    <input id="cc-exp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" className={inp("exp")} value={card.exp} onChange={upd("exp", fmtExp)} />
                    <Err k="exp" />
                  </div>
                  <div>
                    <label htmlFor="cc-cvc" className="text-sm font-medium text-slate-700">CVC</label>
                    <input id="cc-cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" className={inp("cvc")} value={card.cvc} onChange={upd("cvc", fmtCvc)} />
                    <Err k="cvc" />
                  </div>
                </div>
                <div>
                  <label htmlFor="cc-name" className="text-sm font-medium text-slate-700">Name on card</label>
                  <input id="cc-name" autoComplete="cc-name" placeholder="Full name" className={inp("name")} value={card.name} onChange={upd("name", fmtName)} />
                  <Err k="name" />
                </div>
              </div>
            </>
          )}
        </div>

        <dl className="mt-5 space-y-1.5 rounded-2xl border border-slate-200/50 bg-slate-50 p-4 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">General admission × 1</dt><dd className="tabular-nums text-slate-800">{amount} AED</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Service fee</dt><dd className="tabular-nums text-slate-800">0.00 AED</dd></div>
          <div className="flex justify-between border-t border-slate-200/50 pt-2 font-semibold"><dt className="text-slate-900">Total</dt><dd className="tabular-nums text-slate-900">{amount} AED</dd></div>
        </dl>

        <button onClick={confirm} className={`u-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white shadow-sm ${method === "Apple Pay" ? "u-keep bg-black hover:bg-slate-800" : "bg-slate-900 hover:bg-slate-800"}`}>
          <Icon name="lock" className="h-4 w-4" /> Pay {amount} AED
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500"><Icon name="shield" className="h-3.5 w-3.5 text-emerald-600" /> Secured by Ziina · PCI DSS · 256-bit TLS</p>
        <p className="mt-1 text-center text-xs text-slate-400">Demo mode: no real charge. For card, try 4242 4242 4242 4242.</p>
      </div>
    </Modal>
  );
}
