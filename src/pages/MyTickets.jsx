import { Icon } from "../components/ui.jsx";
import { fmtDate } from "../lib/format.js";



/* My Tickets tab: tickets, waitlist spots and a pointer to hosting. */
export function MyTickets({ user, bookings, waitlist, parties, submissions, setModal, changeTab, hostEvent }) {
  return (
    (!user ? (
      <div className="rounded-3xl border border-slate-200/50 bg-white shadow-sm px-6 py-14 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200/70"><Icon name="lock" className="h-7 w-7" /></div>
        <h3 className="mt-4 text-lg font-bold">Sign in to see your tickets</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Your tickets, bookings and event applications live here once you sign in with your email.</p>
        <button onClick={() => setModal({ type: "auth", reason: "Sign in to view your tickets." })} className="u-btn mt-5 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Sign in</button>
      </div>
    ) : (
      <div className="space-y-8">
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Tickets</h3>
          {bookings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="ticket" className="h-6 w-6" /></span>
              <p className="mt-3 font-semibold">No tickets yet</p>
              <p className="text-sm text-slate-500">Grab a spot at an upcoming student event.</p>
              <button onClick={() => changeTab("parties")} className="u-btn mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Browse events</button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {bookings.map((b) => (
                <button key={b.id} onClick={() => setModal({ type: "ticket", booking: b })} className="u-card flex items-center gap-4 rounded-2xl border border-slate-200/50 bg-white shadow-sm p-4 text-left">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">{b.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{b.title}</p>
                    <p className="text-sm text-slate-500">{fmtDate(b.date)} · {b.time}</p>
                    <p className="font-mono text-xs text-slate-400">{b.id}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{b.paid ? "Paid" : "Free"}</span>
                </button>
              ))}
            </div>
          )}
        </section>
        {Object.keys(waitlist).length > 0 && (
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Waitlists</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(waitlist).map(([id, pos]) => {
                const p = parties.find((x) => x.id === Number(id));
                return p ? (
                  <button key={id} onClick={() => setModal({ type: "waitlist", party: p, pos, email: user })} className="u-card flex items-center gap-4 rounded-2xl border border-slate-200/50 bg-white shadow-sm p-4 text-left">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">{p.emoji}</div>
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
