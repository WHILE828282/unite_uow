import { Modal } from "./Modal.jsx";
import { ContactButtons, EventLogo, LangBadge } from "../ui.jsx";
import { TYPE_EMOJI } from "../../lib/events.js";
import { fmtDate, fmtRange } from "../../lib/format.js";
import { englishMapsUrl, mapsLink } from "../../lib/maps.js";
import { GRADIENTS } from "../../lib/styles.js";



/* A submitted party while it waits for the admin safety review. */
export function ReviewModal({ sub: s, r, onClose, onDelete }) {
  const rows = [
    ["Reference", <span className="font-mono font-semibold">{s.ref}</span>],
    ["Type", s.category],
    ["When", `${fmtDate(s.date)} · ${fmtRange(s.start, s.end)}`],
    ["Venue", <a href={s.mapsUrl ? englishMapsUrl(s.mapsUrl) : mapsLink(s.venueName)} target="_blank" rel="noopener noreferrer" className="font-semibold text-crimson-700 hover:underline">{s.venueName}{s.room ? `, ${s.room}` : ""} ↗</a>],
    ["Language", <LangBadge lang={s.lang} />],
    ["Spots · price", `${s.spots} · ${s.price > 0 ? s.price + " AED" : "Free"}`],
    ...(s.dress ? [["Dress code", s.dress]] : []),
    ...(s.reqs ? [["Requirements", s.reqs]] : []),
  ];
  return (
    <Modal onClose={onClose}>
      <div className={`relative overflow-hidden px-6 pb-5 pt-7 text-white ${s.cover ? "bg-slate-900" : `bg-gradient-to-br ${GRADIENTS[s.category] || GRADIENTS.Party}`}`}>
        {s.cover && (<><img src={s.cover} alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ aspectRatio: "16 / 9" }} /><span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" aria-hidden="true" /></>)}
        <span className={`relative block ${s.cover ? "pt-12" : ""}`}>{s.logo ? <EventLogo p={s} className="h-14 w-14 ring-2 ring-white/80 shadow-lg" /> : <span className="text-4xl">{TYPE_EMOJI[s.category] || "🎉"}</span>}</span>
        <h2 className="relative mt-2 pr-8 text-xl font-bold leading-tight">{s.title}</h2>
        {r.status === "rejected" ? (
          <span className="u-keep relative mt-2 inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white">✕ Not approved</span>
        ) : (
          <span className="u-keep relative mt-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-amber-950">{!s.moderated ? `Party Under Review · ~${r.left} left` : s.mod === "under_review" ? "🔍 Additional check in progress" : "Pending moderation"}</span>
        )}
      </div>
      <div className="space-y-4 p-5">
        {r.status === "rejected" ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm leading-relaxed text-rose-800 ring-1 ring-inset ring-rose-200">
            The admin team didn't approve this event, so it won't be published. You're welcome to adjust the plan and submit a new application.
          </p>
        ) : (
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-200">
            {s.mod === "under_review"
              ? <>The admin team is running an additional safety check and may contact you at <span className="font-semibold">{s.email}</span>. It goes live in Events once approved.</>
              : <>Our admin team is verifying your event's safety. Once approved (usually within 2 hours) it goes live in Events. This page updates automatically.</>}
          </p>
        )}
        <dl className="space-y-2 rounded-2xl border border-slate-200/50 bg-slate-50 p-4 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4"><dt className="shrink-0 text-slate-500">{k}</dt><dd className="min-w-0 text-right font-medium text-slate-800">{v}</dd></div>
          ))}
        </dl>
        {s.pitch && (
          <div>
            <p className="mb-1 text-sm font-semibold text-slate-900">Your pitch</p>
            <p className="max-h-40 overflow-y-auto whitespace-pre-line rounded-xl border border-slate-200/50 bg-white p-3 text-sm leading-relaxed text-slate-600">{s.pitch}</p>
          </div>
        )}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-900">Organizer contacts</p>
          <ContactButtons contact={{ whatsapp: s.whatsapp, telegram: s.telegram, email: s.email }} subject={s.title} />
        </div>
        <button onClick={onClose} className="u-btn w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800">Done</button>
        {onDelete && <button onClick={onDelete} className="u-btn -mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">Delete event</button>}
      </div>
    </Modal>
  );
}
