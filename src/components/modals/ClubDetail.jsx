import { roomLabel } from "../../data/clubs.js";
import { Modal } from "./Modal.jsx";
import { Badge, InfoIcon, Icon } from "../ui.jsx";
import { HERO_PHOTOS, heroBackground } from "../../data/clubs.js";
import { UOWD_ADDRESS, UOWD_MAPS } from "../../data/events.js";
import { DAYS } from "../../data/options.js";
import { fmtRange } from "../../lib/format.js";
import { mapsLink } from "../../lib/maps.js";
import { GRADIENTS } from "../../lib/styles.js";



/* Club community chat: unlocked only for students verified with a live code on their UOWD email. */
export function ClubCommunity({ c, verified, onSignIn }) {
  return verified ? (
    <a href={c.whatsapp} target="_blank" rel="noopener noreferrer"
      className="u-keep u-btn flex w-full items-center justify-center gap-2 rounded-xl bg-crimson-800 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/10 hover:bg-crimson-700">
      <Icon name="chat" className="h-4 w-4" /> Join the club's WhatsApp group
    </a>
  ) : (
    <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
      <p className="flex items-start gap-2 font-medium"><Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />The club's WhatsApp group opens once you sign in with your UOWD email.</p>
      {onSignIn && <button onClick={onSignIn} className="mt-1.5 text-xs font-semibold text-crimson-700 hover:underline">Sign in with student email →</button>}
    </div>
  );
}

export function ClubDetail({ club: c, status, action, onClose, onShare, verified, onSignIn }) {
  const joined = status === "joined";
  const mapsUrl = mapsLink(UOWD_MAPS);
  const art = HERO_PHOTOS[c.id];
  return (
    <Modal onClose={onClose} size="lg" side>
      <div className={`relative overflow-hidden px-6 pb-6 text-white ${art ? "u-keep flex min-h-[15rem] flex-col justify-end bg-slate-950 pt-24 sm:min-h-[17rem]" : `bg-gradient-to-br pt-7 ${GRADIENTS[c.category]}`}`}>
        {art && (<>
          <span className="u-fade absolute inset-0" style={{ background: heroBackground(art) }} aria-hidden="true" />
          {art.photo && <img src={art.photo} alt="" decoding="async" onError={(e) => { e.currentTarget.style.display = "none"; }} className="u-fade absolute inset-0 h-full w-full object-cover" />}
          <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" aria-hidden="true" />
        </>)}
        {onShare && (
          <button onClick={() => onShare(c)} aria-label={`Copy link to ${c.name}`} className="absolute right-14 top-3 z-10 inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white backdrop-blur hover:bg-white/30" style={{ background: "rgba(255,255,255,0.18)" }}>
            <Icon name="share" className="h-3.5 w-3.5" />
            Share
          </button>
        )}
        {!(art && art.photo) && <span className="relative text-5xl">{c.emoji}</span>}
        <div className="relative mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.22)" }}>{roomLabel(c)}</span>
          {joined && <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.22)" }}>✓ You're a member</span>}
          {status === "pending" && <span className="u-keep rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-amber-950">Pending approval</span>}
        </div>
        <h2 className="relative mt-2 text-2xl font-bold leading-tight drop-shadow-sm">{c.name}</h2>
        <p className="relative mt-0.5 text-sm" style={{ opacity: 0.9 }}>{c.members + (joined ? 1 : 0)} members · Free to join</p>
      </div>

      <div className="space-y-5 p-5">
        <Badge team={c.category === "Sports"} />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">About the {c.category === "Sports" ? "team" : "club"}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.desc}</p>
        </div>
        {c.whatsapp && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Club community</h3>
            <ClubCommunity c={c} verified={verified} onSignIn={onSignIn} />
            <p className="mt-2 text-xs text-slate-500">Questions? Student Life: <a href="mailto:studentlife@uowdubai.ac.ae" className="font-semibold text-crimson-700 hover:underline">studentlife@uowdubai.ac.ae</a></p>
          </div>
        )}
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Official weekly schedule</h3>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/50">
              {c.slots.map((sl) => (
                <li key={sl.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <span className="w-10 shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-400">{DAYS[sl.day].slice(0, 3)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-slate-900">{fmtRange(sl.start, sl.end)}</span>
                    <span className="block truncate text-xs text-slate-500">{sl.title} · {sl.where} · {sl.level}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">{c.note}</p>
          </div>
          <div className="flex gap-3">
            <InfoIcon name="pin" />
            <div>
              <p className="font-semibold text-slate-900">{c.where}</p>
              <p className="text-slate-500">{UOWD_ADDRESS}</p>
              <p className="mt-1 flex flex-wrap gap-x-4">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-crimson-700 hover:underline">Open in Google Maps ↗</a>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <InfoIcon name="user" />
            <div>
              <p className="font-semibold text-slate-900">{c.lead.name} <span className="font-normal text-slate-500">· {c.lead.role}</span></p>
              <a href={`mailto:${c.lead.email}?subject=${encodeURIComponent(c.name)}`} className="font-semibold text-crimson-700 hover:underline">{c.lead.email}</a>
            </div>
          </div>
        </div>
      </div>

      <div className="u-safe-bar sticky bottom-0 border-t border-slate-200/50 bg-white shadow-sm p-4">{action}</div>
    </Modal>
  );
}
