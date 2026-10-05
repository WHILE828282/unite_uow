import { useEffect, useState } from "react";
import { UniteIcon } from "./UniteIcon.jsx";
import { Check, EventLogo, Icon, QRCode } from "./ui.jsx";
import { downloadCalendar } from "../lib/downloads.js";
import { fmtDate, shortVenue } from "../lib/format.js";



/* Group trip: the Unite ticket is a place in the group; the official ticket is delivered by the host. */
const TRIP_STEPS = [["waiting", "Waiting for the group"], ["preparing", "Ticket being prepared"], ["ready", "Ticket ready"]];
function TripStatus({ b, onOpenFile }) {
  if (b.state === "cancelled")
    return (
      <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800 ring-1 ring-inset ring-rose-200">
        <p className="font-semibold">Trip cancelled · refunded</p>
        <p className="mt-1 leading-relaxed">The group didn't reach its minimum size by the deadline, so the trip is cancelled.{b.paid ? ` Your ${b.price} AED was refunded automatically (demo).` : ""}</p>
      </div>
    );
  const at = Math.max(0, TRIP_STEPS.findIndex(([k]) => k === (b.state || "waiting")));
  return (
    <div>
      <ol className="space-y-2.5">
        {TRIP_STEPS.map(([k, label], i) => (
          <li key={k} className="flex items-center gap-3 text-sm">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < at || (i === at && k === "ready") ? "bg-emerald-500 text-white" : i === at ? "bg-amber-400 text-amber-950" : "bg-slate-100 text-slate-400"}`}>{i < at || (i === at && k === "ready") ? <Check className="h-3 w-3" /> : i + 1}</span>
            <span className={i === at ? "font-semibold text-slate-900" : i < at ? "text-slate-500" : "text-slate-400"}>{label}</span>
          </li>
        ))}
      </ol>
      {b.state === "ready" && b.delivery ? (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm ring-1 ring-inset ring-emerald-200">
          {b.delivery.hasFile && (
            <button onClick={() => onOpenFile(b)} className="u-btn flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
              <Icon name="ticket" className="h-4 w-4" /> Open concert ticket
            </button>
          )}
          {!b.delivery.hasFile && <p className="font-semibold text-emerald-800">Sent via the official app or email</p>}
          {b.delivery.note && <p className={`${b.delivery.hasFile ? "mt-2" : "mt-1"} whitespace-pre-line leading-relaxed text-emerald-900`}>Note from the host: {b.delivery.note}</p>}
          {b.delivery.hasFile && <p className="mt-2 text-xs text-emerald-700">Private: only you and the host can open it.</p>}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500 ring-1 ring-inset ring-slate-200">
          {b.state === "preparing" ? "The group is confirmed. The host is getting your official ticket and will deliver it here at least 24 hours before the event." : `Payments close ${b.collectUntil ? fmtDate(b.collectUntil) + ", 11:59 PM" : "soon"}. If the group is too small by then, you're refunded automatically.`}
        </p>
      )}
    </div>
  );
}

/* A short burst of confetti over a freshly bought ticket (skipped with reduced motion). */
const CONFETTI = ["#e9b6bc", "#c45a68", "#fbbf24", "#34d399", "#60a5fa", "#ffffff"];
export function Confetti({ fixed = false }) {
  const [on, setOn] = useState(() => !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));
  useEffect(() => { const t = setTimeout(() => setOn(false), 2600); return () => clearTimeout(t); }, []);
  if (!on) return null;
  return (
    <div className={`u-keep pointer-events-none ${fixed ? "fixed z-[60] h-96" : "absolute z-20 h-72"} inset-x-0 top-0 overflow-hidden`} aria-hidden="true">
      {Array.from({ length: 42 }, (_, i) => (
        <span key={i} className="u-confetti absolute top-0 block rounded-[2px]"
          style={{ left: `${(i * 37) % 100}%`, width: 6 + (i % 3) * 2, height: 10 + (i % 4) * 2, background: CONFETTI[i % CONFETTI.length],
            animationDelay: `${(i % 7) * 70}ms`, animationDuration: `${1500 + (i % 5) * 220}ms`, "--dx": `${((i * 53) % 120) - 60}px`, "--rot": `${(i * 97) % 720}deg` }} />
      ))}
    </div>
  );
}

export function Ticket({ booking: b, justPaid, onClose, onDownload, onOpenFile }) {
  const trip = b.kind === "trip";
  const rows = [["Date", fmtDate(b.date)], ["Time", b.time], ["Venue", shortVenue(b.where)], ["Admission", trip ? "Group trip · 1 place" : "General · 1 guest"]];
  return (
    <div className="relative bg-slate-100">
      {justPaid && <Confetti />}
      <div className="u-keep relative isolate overflow-hidden bg-slate-900 px-6 pb-16 pt-8 text-center text-white">
        {b.cover && <><img src={b.cover} alt="" decoding="async" draggable={false} className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover opacity-60 blur-[2px]" />
          <span className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-black/50 to-black/80" aria-hidden="true" /></>}
        {!b.cover && <>
        <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-slate-900" style={{ filter: "blur(70px)", opacity: 0.55 }} />
        <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-emerald-500" style={{ filter: "blur(80px)", opacity: 0.22 }} />
        </>}
        <div className="relative">
          <div className="u-pop mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-200">{justPaid ? (b.paid ? "Payment Successful" : "You're in!") : "Your ticket"}</h2>
          {b.paid && <p className="mt-0.5 text-3xl font-bold tabular-nums tracking-tight">{b.price.toFixed(2)} <span className="text-base font-semibold text-slate-400">AED</span></p>}
          <p className="mt-1 text-sm text-slate-400">{b.paid ? `Paid via Ziina${b.method ? ` · ${b.method}` : ""}` : "Free spot reserved"}</p>
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
            {b.state === "cancelled" ? <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">{trip ? "Refunded" : "Cancelled"}</span>
              : b.checkedIn ? <span className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-2 py-0.5 text-xs font-semibold text-white"><Check className="h-3 w-3" /> Checked in</span>
              : <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white"><Check className="h-3 w-3" /> {trip ? "Place in group" : "Confirmed"}</span>}
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

            {trip ? <TripStatus b={b} onOpenFile={onOpenFile} /> : b.ref && !b.qr ? (
              <div className="mx-auto flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 ring-1 ring-slate-200/60">
                <span className="u-spin h-6 w-6 rounded-full border-2 border-slate-400 border-t-transparent" />Activating your ticket…
              </div>
            ) : (
              <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/60"><QRCode value={b.qr || b.id} className="h-40 w-40" /></div>
            )}
            <p className="mt-3 text-center text-xs font-medium uppercase tracking-widest text-slate-400">{trip ? "Unite booking" : "Booking ID"}</p>
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

        {!trip && <button onClick={() => onDownload(b)} className="u-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>
          Download ticket
        </button>}
        {b.groupLink && b.qr && (
          <a href={b.groupLink} target="_blank" rel="noopener noreferrer" className="u-btn mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
            <Icon name="users" className="h-4 w-4" /> Join the {/whatsapp/i.test(b.groupLink) ? "WhatsApp" : "Telegram"} group ↗
          </a>
        )}
        <button onClick={() => downloadCalendar([], [b], `${b.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`)}
          className="u-btn mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-white">
          <Icon name="download" className="h-4 w-4" /> Add to calendar
        </button>
        <button onClick={onClose} className="u-btn mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-slate-600 hover:bg-white">Done</button>
        <p className="mt-1 text-center text-xs text-slate-400">{trip ? "Your official ticket appears here once the host delivers it." : b.ref ? "Show the QR code at the entrance. Each code works once." : "Show the QR code at the entrance. Screenshots work too."}</p>
      </div>
    </div>
  );
}
