import { useEffect, useState } from "react";
import { DateBlock, DayTag, EventLogo, Icon, ShareBtn, Spots, VenueChip } from "./ui.jsx";
import { clubDays, fmtDate, shortVenue } from "../lib/format.js";
import { GRADIENTS } from "../lib/styles.js";

/* An event card as shown in Events (also used in the host's preview). */
export function PartyCard({ p, i = 0, open = {}, onShare, actions }) {
  const left = p.spots - p.taken;
  return (
    <article id={"event-" + p.id} {...open}
      className="group u-card u-rise flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400" style={{ animationDelay: `${i * 60}ms` }}>
      {p.cover && (
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          <img src={p.cover} alt="" loading="lazy" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex gap-3.5">
          {p.logo && !p.cover ? <EventLogo p={p} className="h-14 w-14" /> : <DateBlock iso={p.date} />}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold leading-snug text-slate-900">{p.title}</h3>
              <span className="shrink-0 text-sm font-semibold text-slate-900">{p.price > 0 ? `${p.price} AED` : "Free"}</span>
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-slate-500">
              {(p.logo && !p.cover) || p.cover ? <>{fmtDate(p.date)} · </> : null}{p.time} · {shortVenue(p.where)} <DayTag iso={p.date} />
            </p>
            <p className="mt-0.5 truncate text-sm text-slate-500">{p.category} · {p.lang} · by {p.host}</p>
          </div>
        </div>
        <div className="mt-3 text-xs"><Spots left={left} total={p.spots} unit={p.price > 0 ? "tickets" : "spots"} wait={p.wait} bar={false} /></div>
        <div className="mt-auto flex gap-2 pt-3">{actions}<ShareBtn light onClick={onShare} /></div>
      </div>
    </article>
  );
}

/* True once `src` has loaded as an image; cards only switch to the photo design then,
   so a missing or non-image link keeps the standard card instead of a blank one. */
export function useImageReady(src) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    if (!src) return;
    let alive = true;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => alive && img.naturalWidth > 0 && setReady(true);
    img.onerror = () => {};
    img.src = src;
    return () => { alive = false; };
  }, [src]);
  return ready;
}

export function ClubCard({ c, i, open, members, button }) {
  const photo = useImageReady(c.backgroundImage);
  const meta = (cls) => (
    <div className={`min-w-0 space-y-1.5 text-xs ${cls}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        {photo
          ? <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-sm"><Icon name="pin" className="h-3 w-3" />{shortVenue(c.where)}</span>
          : <VenueChip where={c.where} />}
        <span className="inline-flex items-center gap-1"><Icon name="users" className="h-3.5 w-3.5" />{members} members</span>
      </div>
      <p className="flex items-center gap-1.5"><Icon name="calendar" className="h-3.5 w-3.5" />{c.slots.length} weekly session{c.slots.length > 1 ? "s" : ""} · {clubDays(c)}</p>
    </div>
  );
  if (photo)
    return (
      <article {...open} className="u-keep u-card u-rise group relative isolate flex min-h-[15rem] cursor-pointer flex-col justify-end overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-400"
        style={{ animationDelay: `${i * 60}ms`, backgroundImage: `url("${c.backgroundImage}")`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <span className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/20 transition-opacity duration-300 group-hover:opacity-90" aria-hidden="true" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{c.category === "Sports" ? "Team" : `${c.category} club`}</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">{c.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-200">{c.desc}</p>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          {meta("text-slate-200")}
          {button(true)}
        </div>
      </article>
    );
  return (
    <article {...open} className="u-card u-rise cursor-pointer rounded-2xl border border-slate-200/50 bg-white shadow-sm p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" style={{ animationDelay: `${i * 60}ms` }}>
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl ${GRADIENTS[c.category]}`}>{c.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{c.name}</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        {meta("text-slate-500")}
        {button(false)}
      </div>
    </article>
  );
}
