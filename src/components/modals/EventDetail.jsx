import { Modal } from "./Modal.jsx";
import { Check, ContactButtons, Icon, DateBlock, DayTag, EventLogo, InfoIcon, ShareBtn, Spots } from "../ui.jsx";
import { CAT_ICON, CAT_TINT, dateLabel, partyMapsUrl, whenLabel } from "../../lib/events.js";
import { TRIP_NOTE } from "../../lib/tripText.js";
import { fmtDate, shortVenue } from "../../lib/format.js";



/* The event page content: shared by the event details modal and the host's preview. */
export function EventDetailBody({ p, onShare, groupLink = p.own ? p.groupLink : "" }) {
  const left = p.spots - p.taken;
  const mapsUrl = partyMapsUrl(p);
  return (
    <>
      {/* With a photo: the title sits on it (immersive header). Without one: the classic header below. */}
      {/* Official UOWD events: the category colour and icon instead of a photo. */}
      {p.official && (
        <div className="u-keep relative flex aspect-[16/9] w-full flex-col justify-end overflow-hidden p-5 text-white" style={{ background: CAT_TINT[p.category] || CAT_TINT.Social }}>
          <span className="pointer-events-none absolute -right-8 -top-8 opacity-[0.15]" aria-hidden="true"><Icon name={CAT_ICON[p.category] || "star"} className="h-48 w-48" /></span>
          <span className="mb-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-800"><Check className="h-3 w-3" /> Official UOWD</span>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">{p.category}</p>
          <h2 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl">{p.title}</h2>
          <p className="mt-0.5 text-sm text-white/80">By {p.host}</p>
          <div className="absolute right-14 top-3 z-10"><ShareBtn onClick={() => onShare(p)} /></div>
        </div>
      )}
      {p.cover && (
        <div className="u-keep u-shimmer relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/9]">
          <img src={p.cover} alt="" decoding="async" draggable={false} className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-5">
            {p.logo && <EventLogo p={p} className="h-14 w-14 ring-2 ring-white/20" />}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/75">
                {p.category} · {p.lang}{p.kind === "trip" && <span className="rounded-full bg-white/15 px-2 py-0.5 normal-case tracking-normal text-white backdrop-blur">🚌 Group trip</span>}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold leading-tight text-white sm:text-3xl">{p.title}</h2>
              <p className="mt-0.5 text-sm text-white/70">Hosted by {p.host}</p>
            </div>
          </div>
          <div className="absolute right-14 top-3 z-10"><ShareBtn onClick={() => onShare(p)} /></div>
        </div>
      )}
      {!p.cover && !p.official && <div className="border-b border-slate-200 px-5 pb-5 pt-12">
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
      </div>}

      <div className="space-y-5 p-5">
        {/* Key facts at a glance, as tiles. */}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,0.8fr)] gap-2">
          {[["Date", dateLabel(p)], ["Time", p.allDay ? "All day" : whenLabel(p)], ["Price", p.price > 0 ? `${p.price} AED` : "Free"]].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-slate-100 px-3 py-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{k}</p>
              <p className="mt-0.5 truncate text-[14px] font-semibold text-slate-900">{v}</p>
            </div>
          ))}
        </div>

        {!p.official && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-800">Availability</span>
            <span className="text-slate-500">{p.taken} / {p.spots} booked</span>
          </div>
          <Spots left={left} total={p.spots} unit="seats" wait={p.wait} long />
        </div>}

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
            <div><p className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-900">{fmtDate(p.date)} · {p.until ? `From ${p.time} ${p.until}` : whenLabel(p)} <DayTag iso={p.date} /></p><p className="text-slate-500">{p.official ? "Free · register to get your QR ticket" : "Doors open 30 minutes before"}</p></div>
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
              {groupLink && (
                <a href={groupLink} target="_blank" rel="noopener noreferrer" className="u-btn mt-2 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
                  <Icon name="users" className="h-4 w-4" />Join the {/whatsapp/i.test(groupLink) ? "WhatsApp" : "Telegram"} group ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function EventDetail({ party: p, action, groupLink, onShare, onClose }) {
  return (
    <Modal onClose={onClose} size="lg" side>
      <EventDetailBody p={p} onShare={onShare} groupLink={groupLink} />
      <div className="u-safe-bar sticky bottom-0 flex items-center gap-4 border-t border-slate-200/50 bg-white p-4 shadow-sm">
        <div className="shrink-0">
          <p className="text-lg font-bold leading-tight text-slate-900">{p.price > 0 ? `${p.price} AED` : "Free"}</p>
          <p className={`text-xs ${!p.official && p.spots - p.taken <= 5 ? "font-semibold text-crimson-600" : "text-slate-500"}`}>{p.official ? "Official UOWD" : p.spots - p.taken > 0 ? `${p.spots - p.taken} left` : "Fully booked"}</p>
        </div>
        <div className="min-w-0 flex-1">{action}</div>
      </div>
    </Modal>
  );
}
