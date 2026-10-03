import { Modal } from "./Modal.jsx";
import { fmtDate } from "../../lib/format.js";



export function WaitlistModal({ party, pos, email, fresh, onLeave, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="p-7 pt-9 text-center">
        <div className="u-pop mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-3xl font-extrabold text-white shadow-lg">#{pos}</div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">{fresh ? "You're on the waitlist" : "Your waitlist spot"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          You are <span className="font-semibold text-slate-900">#{pos}</span> on the waitlist. If a spot opens up, an automated confirmation code will be sent to your email.
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">{party.emoji}</div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{party.title}</p>
              <p className="text-sm text-slate-500">{fmtDate(party.date)} · {party.time}</p>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm">
            <span className="text-slate-500">Code sent to</span>
            <span className="truncate pl-4 font-medium text-slate-800">{email}</span>
          </div>
        </div>

        <ol className="mt-4 space-y-2 text-left text-sm text-slate-600">
          {["A spot opens up", "You receive a confirmation code by email", "Enter the code to claim your ticket"].map((t, i) => (
            <li key={t} className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">{i + 1}</span>{t}
            </li>
          ))}
        </ol>

        <button onClick={onClose} className="u-btn mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800">Got it</button>
        <button onClick={onLeave} className="mt-2 w-full rounded-xl py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-rose-600">Leave waitlist</button>
      </div>
    </Modal>
  );
}
