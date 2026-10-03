import { UniteIcon } from "./UniteIcon.jsx";
import { Check, EventLogo, Icon, QRCode } from "./ui.jsx";
import { downloadCalendar } from "../lib/downloads.js";
import { fmtDate, shortVenue } from "../lib/format.js";



export function Ticket({ booking: b, justPaid, onClose, onDownload }) {
  const rows = [["Date", fmtDate(b.date)], ["Time", b.time], ["Venue", shortVenue(b.where)], ["Admission", "General · 1 guest"]];
  return (
    <div className="bg-slate-100">
      <div className="u-keep relative overflow-hidden bg-slate-900 px-6 pb-16 pt-8 text-center text-white">
        <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-slate-900" style={{ filter: "blur(70px)", opacity: 0.55 }} />
        <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-emerald-500" style={{ filter: "blur(80px)", opacity: 0.22 }} />
        <div className="relative">
          <div className="u-pop mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-200">{justPaid ? (b.paid ? "Payment Successful" : "You're in!") : "Your ticket"}</h2>
          {b.paid && <p className="mt-0.5 text-3xl font-bold tabular-nums tracking-tight">{b.price.toFixed(2)} <span className="text-base font-semibold text-slate-400">AED</span></p>}
          <p className="mt-1 text-sm text-slate-400">{b.paid ? `Paid via Ziina · ${b.method}` : "Free spot reserved"}</p>
        </div>
      </div>

      <div className="-mt-10 px-5 pb-5">
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/60">
          <div className="u-keep flex items-center justify-between bg-slate-900 px-5 py-3">
            <div className="flex items-center gap-2">
              <UniteIcon className="h-6 w-6" />
              <span className="text-sm font-extrabold tracking-tight text-white">unite</span>
              <span className="text-xs font-medium uppercase tracking-widest text-slate-400">· Admit one</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white"><Check className="h-3 w-3" /> Confirmed</span>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-3">
              {b.logo ? <EventLogo p={b} className="h-12 w-12 ring-1 ring-slate-200/70" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl ring-1 ring-inset ring-slate-200/70">{b.emoji}</div>}
              <p className="min-w-0 font-semibold leading-snug text-slate-900">{b.title}</p>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">{k}</dt>
                  <dd className="truncate font-semibold text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="relative my-5 border-t-2 border-dashed border-slate-200">
              <span className="absolute h-7 w-7 rounded-full bg-slate-100" style={{ left: -34, top: -15 }} />
              <span className="absolute h-7 w-7 rounded-full bg-slate-100" style={{ right: -34, top: -15 }} />
            </div>

            <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/60"><QRCode value={b.id} className="h-36 w-36" /></div>
            <p className="mt-3 text-center text-xs font-medium uppercase tracking-widest text-slate-400">Booking ID</p>
            <p className="text-center font-mono text-lg font-bold tracking-wider text-slate-900">{b.id}</p>

            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              {[["Attendee", b.name || b.email], ...(b.name ? [["Email", b.email]] : []), ...(b.studentId ? [["Student ID", b.studentId]] : []), ...(b.txn ? [["Ziina reference", b.txn]] : [])].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="truncate text-right font-medium text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <button onClick={() => onDownload(b)} className="u-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>
          Download ticket
        </button>
        <button onClick={() => downloadCalendar([], [b], `${b.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`)}
          className="u-btn mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-white">
          <Icon name="calendar" className="h-4 w-4" /> Add to calendar
        </button>
        <button onClick={onClose} className="u-btn mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-slate-600 hover:bg-white">Done</button>
        <p className="mt-1 text-center text-xs text-slate-400">Show the QR code at the entrance. Screenshots work too.</p>
      </div>
    </div>
  );
}
