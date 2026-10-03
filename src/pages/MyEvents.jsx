import { useState } from "react";
import { LangBadge, ReviewBadge, VenueChip } from "../components/ui.jsx";
import { TYPE_EMOJI } from "../lib/events.js";
import { fmtDate, fmtRange } from "../lib/format.js";
import { GRADIENTS } from "../lib/styles.js";
import { DeliveryBar, payoutText, tripStateLabel } from "../components/modals/HostManage.jsx";

/* Under a live event: where the money stands, the group trip's progress and the host tools. */
function HostPanel({ s, d, onManage }) {
  const trip = s.kind === "trip";
  if (!s.moderated || !s.key) return <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Check-in and ticket delivery need the Unite database, so they aren't available for this event.</p>;
  return (
    <div className="space-y-3 border-t border-slate-100 p-4">
      <p className="text-sm font-semibold text-slate-900">{d ? payoutText(s, d) : "Loading tickets and payments…"}</p>
      {trip && d && <p className="text-xs font-medium text-slate-600">{tripStateLabel(d)}</p>}
      {trip && d && d.event.tripState === "confirmed" && <DeliveryBar d={d} />}
      {!(trip && d && d.event.tripState === "cancelled") && (
        <div className="flex gap-2">
          <button onClick={() => onManage(s, !trip)} className="u-btn flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">{trip ? "Attendees & tickets" : "Check-in"}</button>
          {!trip && <button onClick={() => onManage(s, false)} className="u-btn rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Attendees</button>}
        </div>
      )}
    </div>
  );
}

/* My Events: the host's own applications, split into "Pending Moderation" and "Live Events". */
export function MyEventCard({ s, r, onOpen }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <button onClick={() => onOpen(s)} className="u-card group flex flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white text-left shadow-sm">
      <span className={`relative block aspect-[16/9] w-full bg-gradient-to-br ${GRADIENTS[s.category] || GRADIENTS.Party}`}>
        {s.cover && imgOk ? <img src={s.cover} alt="" loading="lazy" decoding="async" onError={() => setImgOk(false)} className="absolute inset-0 h-full w-full object-cover" />
          : <span className="absolute inset-0 flex items-center justify-center text-5xl" aria-hidden="true">{TYPE_EMOJI[s.category] || "🎉"}</span>}
        <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" aria-hidden="true" />
        <span className="absolute left-3 top-3"><ReviewBadge r={r} /></span>
      </span>
      <span className="block p-4">
        <span className="block truncate font-semibold text-slate-900">{s.title}</span>
        <span className="mt-0.5 block text-sm text-slate-500">{fmtDate(s.date)} · {fmtRange(s.start, s.end)}</span>
        <span className="mt-2 flex flex-wrap items-center gap-1.5"><VenueChip where={s.room ? `${s.venueName}, ${s.room}` : s.venueName} /><LangBadge lang={s.lang} /></span>
        <span className="mt-2 block font-mono text-[11px] text-slate-400">{s.ref}</span>
      </span>
    </button>
  );
}

export function MyEvents({ items, onOpen, onHost, hostData = {}, onManage }) {
  const pending = items.filter(({ r }) => r.status === "review");
  const live = items.filter(({ r }) => r.status === "approved");
  const declined = items.filter(({ r }) => r.status === "rejected");
  const Grid = ({ list, host }) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map(({ s, r }) => host ? (
      <div key={s.ref} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm [&>button]:rounded-none [&>button]:border-0 [&>button]:shadow-none">
        <MyEventCard s={s} r={r} onOpen={onOpen} />
        <HostPanel s={s} d={hostData[s.ref]} onManage={onManage} />
      </div>
    ) : <MyEventCard key={s.ref} s={s} r={r} onOpen={onOpen} />)}</div>
  );
  const Empty = ({ children }) => <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">{children}</div>;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">My Events</h2>
          <p className="mt-0.5 text-sm text-slate-500">Everything you host on Unite. Decisions from the admin team appear here automatically.</p>
        </div>
        <button onClick={onHost} className="u-btn rounded-xl bg-crimson-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-crimson-600 active:scale-95">+ Host another event</button>
      </div>
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Pending Moderation <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{pending.length}</span></h3>
        {pending.length ? <Grid list={pending} /> : <Empty>Nothing waiting for review.</Empty>}
      </section>
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Live Events <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{live.length}</span></h3>
        {live.length ? <Grid list={live} host /> : <Empty>Approved events show up here and in Events for the whole campus.</Empty>}
      </section>
      {declined.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Not approved</h3>
          <Grid list={declined} />
        </section>
      )}
    </div>
  );
}
