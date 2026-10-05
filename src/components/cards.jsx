import { useEffect, useState } from "react";
import { DateBlock, DayTag, EventLogo, Icon, ShareBtn, Spots, VenueChip } from "./ui.jsx";
import { clubDays, dayTag, fmtDate, shortVenue } from "../lib/format.js";
import { GRADIENTS } from "../lib/styles.js";
import { roomLabel } from "../data/clubs.js";

/* An event card as shown in Events (also used in the host's preview). */
export function PartyCard({ p, i = 0, open = {}, onShare, actions, wide = false }) {
  const left = p.spots - p.taken;
  return (
    <article id={"event-" + p.id} {...open}
      className={`group u-card u-rise flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white ${wide ? "md:col-span-2" : ""} focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400`} style={{ animationDelay: `${i * 60}ms` }}>
      {/* The event's own photo up top (when it has one): date, day tag and price sit on it. */}
      {p.cover && (
        <div className="u-keep relative h-40 overflow-hidden bg-slate-900 sm:h-44">
          <img src={p.cover} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" aria-hidden="true" />
          <span className="absolute left-3 top-3 flex gap-1.5">
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">{fmtDate(p.date)}</span>
            {dayTag(p.date) && <span className="rounded-full bg-crimson-600 px-2.5 py-1 text-[11px] font-semibold text-white">{dayTag(p.date)}</span>}
          </span>
          <span className="u-keep absolute right-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-900">{p.price > 0 ? `${p.price} AED` : "Free"}</span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex gap-3.5">
          {!p.cover && (p.logo ? <EventLogo p={p} className="h-14 w-14" /> : <DateBlock iso={p.date} />)}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold leading-snug text-slate-900">{p.title}</h3>
              {!p.cover && <span className="shrink-0 text-sm font-semibold text-slate-900">{p.price > 0 ? `${p.price} AED` : "Free"}</span>}
            </div>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-slate-500">
              {p.logo && !p.cover ? <>{fmtDate(p.date)} · </> : null}{p.time} · {shortVenue(p.where)} {!p.cover && <DayTag iso={p.date} />}
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

// False only if the photo fails to load: cards show the photo layout straight away (no flash of the
// emoji layout while it downloads) and fall back to the plain card on a broken image.
export function usePhotoOk(src) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    if (!src) return;
    let alive = true;
    const img = new Image();
    img.onerror = () => alive && setFailed(true);
    img.src = src;
    return () => { alive = false; };
  }, [src]);
  return !!src && !failed;
}

/* Each club room has its own accent: a tinted icon tile and a hairline along the card's top edge. */
const ROOM_TILE = {
  Tech: "linear-gradient(135deg, #0ea5e9 0%, #1e3a8a 100%)",
  Business: "linear-gradient(135deg, #10b981 0%, #065f46 100%)",
  Arts: "linear-gradient(135deg, #f43f5e 0%, #7c2d12 100%)",
};
export function ClubCard({ c, i, open, members, button }) {
  const photo = usePhotoOk(c.backgroundImage);
  const team = c.category === "Sports";
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
      <article {...open} className={`u-keep u-card u-rise group relative isolate flex min-h-[15rem] cursor-pointer flex-col justify-end overflow-hidden rounded-2xl bg-slate-950 p-5 text-white ${team ? "" : "pt-32"} shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-400`}
        style={{ animationDelay: `${i * 60}ms`, backgroundImage: `url("${c.backgroundImage}")`, backgroundSize: "cover", backgroundPosition: c.focus || (team ? "center" : "center 22%") }}>
        {/* Clubs: clear space on top so faces show, dark only behind the text. Teams keep the ball in the middle. */}
        <span className={`absolute inset-0 -z-10 bg-gradient-to-t transition-opacity duration-300 group-hover:opacity-90 ${team ? "from-slate-950 via-slate-950/75 to-slate-950/20" : "from-slate-950 from-35% via-slate-950/70 via-60% to-transparent"}`} aria-hidden="true" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{roomLabel(c)}</p>
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
    <article {...open} className="u-card u-rise relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" style={{ animationDelay: `${i * 60}ms` }}>
      {ROOM_TILE[c.category] && <span className="u-keep absolute inset-x-0 top-0 h-1 opacity-80" style={{ background: ROOM_TILE[c.category] }} aria-hidden="true" />}
      <div className="flex items-start gap-4">
        <div className={`u-keep flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow-sm ${ROOM_TILE[c.category] ? "" : GRADIENTS[c.category]}`} style={ROOM_TILE[c.category] ? { background: ROOM_TILE[c.category] } : undefined}>{c.emoji}</div>
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

/* Spotlight card for a pinned event (the launch party): locked dark in both themes, live countdown to doors. */
export const dubaiStart = (p) => {
  const [y, m, d] = p.date.split("-").map(Number);
  const t = /(\d+):(\d+)\s*(AM|PM)/i.exec(p.time || "") || [];
  const h = (Number(t[1]) % 12) + (/pm/i.test(t[3] || "") ? 12 : 0);
  return Date.UTC(y, m - 1, d, h, Number(t[2] || 0)) - 4 * 36e5;
};
export function FeaturedCard({ p, open = {}, onShare, action, onDetails }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ms = Math.max(0, dubaiStart(p) - now);
  const parts = [["days", Math.floor(ms / 864e5)], ["hrs", Math.floor(ms / 36e5) % 24], ["min", Math.floor(ms / 6e4) % 60], ["sec", Math.floor(ms / 1e3) % 60]];
  const left = p.spots - p.taken, pct = Math.min(100, Math.round((p.taken / p.spots) * 100));
  return (
    <article id={"event-" + p.id} {...open}
      className="u-keep u-featured u-card u-rise group relative isolate cursor-pointer overflow-hidden rounded-3xl p-5 text-white shadow-xl ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-400 sm:p-7"
      style={{ background: "radial-gradient(120% 90% at 100% 0%, rgba(196,90,104,.55), transparent 55%), radial-gradient(90% 80% at 0% 100%, rgba(116,22,41,.6), transparent 60%), linear-gradient(160deg, #111827 0%, #0a0f1d 100%)" }}>
      <span className="u-featured-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.07]" aria-hidden="true"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-crimson-200 ring-1 ring-inset ring-white/15">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson-400" /> Featured<span className="hidden sm:inline"> · Grand launch</span>
        </span>
        <span className="u-keep whitespace-nowrap rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-900">{p.price > 0 ? `${p.price} AED` : "Free"}</span>
      </div>
      <h3 className="mt-4 max-w-xl text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{p.title}</h3>
      <p className="mt-2 text-sm text-slate-300">{new Date(p.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · From {p.time}{p.until ? ` ${p.until}` : ""}</p>
      <p className="mt-0.5 flex items-start gap-1.5 text-sm text-slate-400"><Icon name="pin" className="mt-0.5 h-3.5 w-3.5 shrink-0" />{p.where}</p>

      <div className="mt-5 grid max-w-sm grid-cols-4 gap-2" aria-label="Countdown to doors">
        {parts.map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white/[0.07] py-2.5 text-center ring-1 ring-inset ring-white/10">
            <div className="text-xl font-bold tabular-nums sm:text-2xl">{String(v).padStart(2, "0")}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{k}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 max-w-sm">
        <div className="flex justify-between text-xs text-slate-300"><span>{left > 0 ? `${left} of ${p.spots} tickets left` : "Sold out"}</span><span>{pct}% sold</span></div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-crimson-500 to-crimson-300" style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="mt-5 flex max-w-md gap-2">
        {action}
        <button onClick={onDetails} className="u-keep u-btn rounded-xl px-4 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/10">Details</button>
        <button onClick={onShare} aria-label="Share" className="u-keep u-btn flex w-11 shrink-0 items-center justify-center rounded-xl text-white ring-1 ring-white/20 hover:bg-white/10"><Icon name="share" className="h-4 w-4" /></button>
      </div>
    </article>
  );
}
