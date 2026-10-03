import { Modal } from "./Modal.jsx";
import { Check, ContactButtons, DateBlock, DayTag, EventLogo, InfoIcon, ShareBtn, Spots } from "../ui.jsx";
import { partyMapsUrl } from "../../lib/events.js";
import { TRIP_NOTE } from "../../lib/tripText.js";
import { fmtDate, shortVenue } from "../../lib/format.js";



/* The event page content: shared by the event details modal and the host's preview. */
export function EventDetailBody({ p, onShare }) {
  const left = p.spots - p.taken;
  const mapsUrl = partyMapsUrl(p);
  return (
    <>
      {p.cover && <img src={p.cover} alt="" decoding="async" draggable={false} className="aspect-[16/9] w-full object-cover" />}
      <div className={`border-b border-slate-200 px-5 pb-5 ${p.cover ? "pt-5" : "pt-12"}`}>
        <div className="flex items-start gap-4">
          {p.logo ? <EventLogo p={p} className="h-14 w-14" /> : <DateBlock iso={p.date} />}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.category} · {p.lang} · {p.price > 0 ? `${p.price} AED` : "Free"}</p>
            {p.kind === "trip" && <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">🚌 Group trip</span>}
            <h2 className="mt-1 text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{p.title}</h2>
            <p className="mt-1 text-sm text-slate-500">Hosted by {p.host}</p>
          </div>
        </div>
        <div className="absolute right-14 top-3 z-10"><ShareBtn light onClick={() => onShare(p)} /></div>
      </div>

      <div className="space-y-5 p-5">

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-800">Availability</span>
            <span className="text-slate-500">{p.taken} / {p.spots} booked</span>
          </div>
          <Spots left={left} total={p.spots} unit="seats" wait={p.wait} long />
        </div>

        {p.kind === "trip" && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm">
            <p className="font-semibold text-slate-900">Group trip to {p.extName}</p>
            <dl className="mt-2 space-y-1">
              {[["Official tickets from", p.seller], ["Minimum group", `${p.minGroup} people`], ["Payments close", `${fmtDate(p.collectUntil)}, 11:59 PM`]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium text-slate-800">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{TRIP_NOTE} Your official ticket is delivered in My Tickets before the event.</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-slate-900">About this event</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{p.desc}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.perks.map((t) => <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{t}</span>)}
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex gap-3">
            <InfoIcon name="calendar" />
            <div><p className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-900">{fmtDate(p.date)} · {p.until ? `From ${p.time} ${p.until}` : p.time} <DayTag iso={p.date} /></p><p className="text-slate-500">Doors open 30 minutes before</p></div>
          </div>
          <div className="flex gap-3">
            <InfoIcon name="pin" />
            <div>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-crimson-700 hover:decoration-crimson-400">{p.where} ↗</a>
              {p.address !== p.where && p.address !== shortVenue(p.where) && <p className="text-slate-500">{p.address}</p>}
              <p className="mt-1 flex flex-wrap gap-x-4">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-crimson-700 hover:underline">Open in Google Maps ↗</a>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <InfoIcon name="user" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{p.contact.name} <span className="font-normal text-slate-500">· {p.contact.role}</span></p>
              <p className="mb-2 mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Check className="h-3 w-3" /> Verified organizer contacts</p>
              <ContactButtons contact={p.contact} subject={p.title} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function EventDetail({ party: p, action, onShare, onClose }) {
  return (
    <Modal onClose={onClose} size="lg">
      <EventDetailBody p={p} onShare={onShare} />
      <div className="u-safe-bar sticky bottom-0 border-t border-slate-200/50 bg-white shadow-sm p-4">{action}</div>
    </Modal>
  );
}
