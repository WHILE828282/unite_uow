import { EventLogo, Icon } from "../components/ui.jsx";
import { ComingUp } from "../components/ComingUp.jsx";
import { useState } from "react";
import { dubaiDay, fmtDate } from "../lib/format.js";



// Status of a ticket at a glance: group trips go Waiting for the group → Ticket being prepared → Ticket ready.
const CHIP = {
  waiting: ["Waiting for the group", "bg-amber-50 text-amber-700"], preparing: ["Ticket being prepared", "bg-sky-50 text-sky-700"],
  ready: ["Ticket ready", "bg-emerald-50 text-emerald-700"], cancelled: ["Cancelled · refunded", "bg-rose-50 text-rose-700"],
};
const TicketChip = ({ b }) => {
  const [label, cls] = b.kind === "trip" ? CHIP[b.state] || CHIP.waiting
    : b.state === "cancelled" ? ["Event cancelled", "bg-rose-50 text-rose-700"]
    : b.date && b.date < dubaiDay() ? [b.checkedIn ? "Attended" : "Ended", "bg-slate-100 text-slate-500"] : b.checkedIn ? ["Checked in", "bg-sky-50 text-sky-700"] : [b.paid ? "Paid" : "Free", "bg-emerald-50 text-emerald-700"];
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
};

/* My Tickets tab: tickets, waitlist spots and a pointer to hosting. */
export function MyTickets({ user, bookings, waitlist, parties, submissions, setModal, changeTab, hostEvent, upcoming = [] }) {
  // Active: upcoming and still valid. Past: the date has gone, or the event was cancelled.
  const [view, setView] = useState("active");
  const today = dubaiDay();
  const isPast = (b) => b.state === "cancelled" || (b.date && b.date < today);
  const active = bookings.filter((b) => !isPast(b)).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const past = bookings.filter(isPast).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const shown = view === "active" ? active : past;
  return (
    (!user ? (
      <>
      <div className="rounded-3xl border border-slate-200/50 bg-white shadow-sm px-6 py-14 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200/70"><Icon name="lock" className="h-7 w-7" /></div>
        <h3 className="mt-4 text-lg font-bold">Sign in to see your tickets</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Your tickets, bookings and event applications live here once you sign in with your email.</p>
        <button onClick={() => setModal({ type: "auth", reason: "Sign in to view your tickets." })} className="u-btn mt-5 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Sign in</button>
      </div>
      <ComingUp events={upcoming} onOpen={(p) => setModal({ type: "detail", id: p.id })} />
      </>
    ) : (
      <div className="space-y-8">
        <section>
          {bookings.length > 0 && (
            <div role="tablist" aria-label="Tickets" className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 sm:max-w-sm">
              {[["active", "Active", active.length], ["past", "Past", past.length]].map(([k, l, n]) => (
                <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}
                  className={`u-btn u-haptic rounded-xl py-2 text-sm font-semibold ${view === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
                  {l}<span className={`ml-1.5 tabular-nums ${view === k ? "text-slate-400" : "text-slate-400/70"}`}>{n}</span>
                </button>
              ))}
            </div>
          )}
          {bookings.length > 0 && shown.length === 0 ? (
            <div className="rounded-3xl bg-white px-6 py-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="ticket" className="h-6 w-6" /></span>
              <p className="mt-3 font-semibold">{view === "active" ? "No active tickets" : "Nothing here yet"}</p>
              <p className="text-sm text-slate-500">{view === "active" ? "Your upcoming tickets show up here." : "Tickets for events that have ended or were cancelled show up here."}</p>
              {view === "active" && <button onClick={() => changeTab("parties")} className="u-btn mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Browse events</button>}
            </div>
          ) : bookings.length === 0 ? (
            <div>
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="ticket" className="h-6 w-6" /></span>
              <p className="mt-3 font-semibold">No tickets yet</p>
              <p className="text-sm text-slate-500">Grab a spot at an upcoming student event.</p>
              <button onClick={() => changeTab("parties")} className="u-btn mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Browse events</button>
              </div>
              <ComingUp events={upcoming} onOpen={(p) => setModal({ type: "detail", id: p.id })} title="Pick one" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {shown.map((b) => {
                // Wallet pass: the event's photo behind the ticket (cancelled tickets stay plain).
                const ev = parties.find((p) => p.id === b.partyId) || {};
                if (ev.cover && !isPast(b)) return (
                  <button key={b.id} onClick={() => setModal({ type: "ticket", booking: b })}
                    className="u-keep u-card u-shimmer relative isolate flex h-40 flex-col justify-between overflow-hidden rounded-3xl p-4 text-left text-white shadow-lg">
                    <img src={ev.cover} alt="" loading="lazy" decoding="async" draggable={false} className="absolute inset-0 -z-10 h-full w-full object-cover" />
                    <span className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/10" aria-hidden="true" />
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/70">{fmtDate(b.date)} · {b.time}</span>
                        <span className="mt-1 line-clamp-2 block text-xl font-bold leading-tight">{b.title}</span>
                      </span>
                      <span className="u-keep flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-900 shadow"><Icon name="qr" className="h-6 w-6" /></span>
                    </span>
                    <span className="flex items-end justify-between gap-3">
                      <span className="font-mono text-xs text-white/70">{b.id}</span>
                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">{b.kind === "trip" ? (CHIP[b.state] || CHIP.waiting)[0] : b.checkedIn ? "Checked in" : b.paid ? "Paid" : "Free"}</span>
                    </span>
                  </button>
                );
                return (
                <button key={b.id} onClick={() => setModal({ type: "ticket", booking: b })} className={`u-card flex items-center gap-4 ${isPast(b) ? "opacity-75" : ""} rounded-2xl border border-slate-200/50 bg-white shadow-sm p-4 text-left`}>
                  {(() => { const logo = b.logo || (parties.find((p) => p.id === b.partyId) || {}).logo; return logo ? <EventLogo p={{ logo, id: b.id, key: b.key, emoji: b.emoji }} className="h-12 w-12 ring-1 ring-slate-200/70" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">{b.emoji}</div>; })()}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{b.title}</p>
                    <p className="text-sm text-slate-500">{fmtDate(b.date)} · {b.time}</p>
                    <p className="font-mono text-xs text-slate-400">{b.id}</p>
                  </div>
                  <TicketChip b={b} />
                </button>
                );
              })}
            </div>
          )}
        </section>
        {Object.keys(waitlist).length > 0 && (
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Waitlists</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Object.entries(waitlist).map(([id, pos]) => {
                const p = parties.find((x) => x.id === Number(id));
                return p ? (
                  <button key={id} onClick={() => setModal({ type: "waitlist", party: p, pos, email: user })} className="u-card flex items-center gap-4 rounded-2xl border border-slate-200/50 bg-white shadow-sm p-4 text-left">
                    {p.logo ? <EventLogo p={p} className="h-12 w-12 ring-1 ring-slate-200/70" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">{p.emoji}</div>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.title}</p>
                      <p className="text-sm text-slate-500">{fmtDate(p.date)} · {p.time}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">#{pos} waitlist</span>
                  </button>
                ) : null;
              })}
            </div>
          </section>
        )}
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Hosting</h3>
          {submissions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/50 bg-white shadow-sm p-5 text-sm text-slate-500">
              Want to run your own party or meetup? The admin team reviews every application for safety.
              <button onClick={hostEvent} className="ml-1 font-semibold text-crimson-700 hover:underline">Host an event</button>
            </div>
          ) : (
            <button onClick={() => changeTab("events")} className="u-card flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/50 bg-white p-4 text-left text-sm shadow-sm">
              <span><span className="font-semibold text-slate-900">Your events are in My Events</span><span className="block text-slate-500">Pending moderation and live events, side by side.</span></span>
              <span className="font-semibold text-crimson-700">Open →</span>
            </button>
          )}
        </section>
      </div>
    ))
  );
}
