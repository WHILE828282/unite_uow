import { useEffect, useState } from "react";
import { ClubThumb, DateBlock, DayTag, EventLogo, Icon, IconTile } from "./ui.jsx";
import { clubDays, dayTag, fmtDate, shortVenue } from "../lib/format.js";
import { GRADIENTS } from "../lib/styles.js";
import { roomLabel } from "../data/clubs.js";
import { CAT_ICON, CAT_TINT, whenLabel } from "../lib/events.js";

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
          </div>
        </div>
        {/* One quiet row: availability only when it matters, then the single action. Tap the card for the rest. */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className={`min-w-0 truncate text-xs font-semibold ${left <= 0 ? "text-slate-500" : "text-crimson-700"}`}>{left <= 0 ? "Fully booked" : left <= 5 ? `Only ${left} left` : ""}</span>
          {actions}
        </div>
      </div>
    </article>
  );
}

/* Portals-style tile for the 2-column feed: big square picture, a two-line title, one meta line and the price
   as a full-width pill. The whole tile opens the event; the pill buys or reserves. */
export function PartyTile({ p, i = 0, open = {}, action }) {
  const left = p.spots - p.taken;
  // Built-in events: the square photo (lighter, made for this shape). Student events: their cover (the logo is a logo).
  const pic = p.dyn ? p.cover || p.logo : p.logo || p.cover;
  return (
    <article id={"event-" + p.id} {...open}
      className="u-tile u-card u-rise group flex cursor-pointer flex-col overflow-hidden rounded-[22px] bg-white p-1.5 ring-1 ring-slate-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-400"
      style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
      <div className="u-keep u-shimmer relative aspect-square overflow-hidden rounded-[17px]">
        {pic ? <img src={pic} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
          : <IconTile category={p.category} className="h-full w-full !rounded-none" />}
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">{dayTag(p.date) || fmtDate(p.date)}</span>
        {left <= 0 ? <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">Full</span>
          : left <= 5 ? <span className="absolute right-2 top-2 rounded-full bg-crimson-600 px-2 py-0.5 text-[11px] font-semibold text-white">{left} left</span> : null}
      </div>
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-2.5">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900">{p.title}</h3>
        <p className="mt-0.5 truncate text-xs text-slate-500">{p.time} · {shortVenue(p.where)}</p>
        <div className="mt-auto pt-2.5">{action}</div>
      </div>
    </article>
  );
}

/* Events feed card, the same size and layout for both kinds:
   student events show their photo; official UOWD events a coloured header with the category icon and the club name.
   Past events are faded with "Ended" in place of the button. */
const OfficialHeader = ({ p, big = false }) => (
  <div className="absolute inset-0 flex flex-col justify-between p-3 text-white" style={{ background: CAT_TINT[p.category] || CAT_TINT.Social }}>
    <span className="pointer-events-none absolute -right-6 -top-6 opacity-[0.16]" aria-hidden="true"><Icon name={CAT_ICON[p.category] || "star"} className={big ? "h-40 w-40" : "h-28 w-28"} /></span>
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"><Icon name={CAT_ICON[p.category] || "star"} className="h-5 w-5" /></span>
    {!big && <span className="relative line-clamp-2 text-[12px] font-semibold leading-tight">{p.host}</span>}
  </div>
);
const KindTag = ({ p }) => p.official
  ? <span className="shrink-0 rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 ring-1 ring-inset ring-sky-200">Official UOWD</span>
  : <span className="shrink-0 rounded-full bg-crimson-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-crimson-700 ring-1 ring-inset ring-crimson-100">Student event</span>;
export function EventCard({ p, i = 0, open = {}, action, past = false }) {
  const left = p.spots - p.taken;
  const pic = p.dyn ? p.cover || p.logo : p.logo || p.cover;
  return (
    <article id={"event-" + p.id} {...open}
      className={`u-tile u-card u-rise group flex cursor-pointer flex-col overflow-hidden rounded-[22px] bg-white p-1.5 ring-1 ring-slate-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-400 ${past ? "opacity-60" : ""}`}
      style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
      <div className="u-keep u-shimmer relative aspect-[4/3] overflow-hidden rounded-[17px]">
        {pic ? <img src={pic} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
          : p.official ? <OfficialHeader p={p} />
          : <IconTile category={p.category} className="h-full w-full !rounded-none" />}
        {!past && left <= 0 ? <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">Full</span>
          : !past && left <= 5 ? <span className="absolute right-2 top-2 rounded-full bg-crimson-600 px-2 py-0.5 text-[11px] font-semibold text-white">{left} left</span> : null}
      </div>
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-2.5">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900">{p.title}</h3>
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500"><KindTag p={p} />{!p.official && <span className="truncate">{p.host}</span>}</p>
        <p className="mt-1.5 truncate text-xs text-slate-600">{whenLabel(p)}</p>
        <p className="truncate text-xs text-slate-500">{shortVenue(p.where)}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
          <span className="whitespace-nowrap text-sm font-bold text-slate-900">{p.price > 0 ? `${p.price} AED` : "Free"}</span>
          {past ? <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-slate-500">Ended</span> : action}
        </div>
      </div>
    </article>
  );
}

/* "Featured this week" slide: big, swipeable; the photo (student events) or the coloured header (official) fills it. */
export function FeaturedSlide({ p, open = {}, action }) {
  const pic = p.cover || p.logo;
  return (
    <article {...open} className="u-keep u-card group relative isolate flex h-60 w-[84%] shrink-0 cursor-pointer snap-start flex-col justify-end overflow-hidden rounded-3xl p-4 text-white shadow-lg sm:h-64 sm:w-[22rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-400">
      <div className="u-shimmer absolute inset-0 -z-10">
        {!pic && p.official ? <OfficialHeader p={p} big /> : pic && <img src={pic} alt="" decoding="async" draggable={false} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
      </div>
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/35 to-transparent" aria-hidden="true" />
      <span className={`u-keep absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide backdrop-blur-md ${p.official ? "bg-white/90 text-sky-800" : "bg-white/90 text-crimson-700"}`}>{p.official ? "Official UOWD" : "Student event"}</span>
      <p className="text-xs font-semibold text-white/80">{dayTag(p.date) || fmtDate(p.date)} · {whenLabel(p)}</p>
      <h3 className="mt-1 line-clamp-2 text-xl font-bold leading-tight">{p.title}</h3>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-white/75">{p.host} · {p.price > 0 ? `${p.price} AED` : p.official ? "Free entry" : "Free"}</p>
        {action}
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
    <p className={`min-w-0 truncate text-xs ${cls}`}>{members} members · {clubDays(c)}</p>
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
        <ClubThumb c={c} className="h-14 w-14 !rounded-2xl shadow-sm" />
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
  return (
    <article id={"event-" + p.id} {...open}
      className={`u-keep ${p.cover ? "" : "u-featured"} u-card u-rise group relative isolate cursor-pointer overflow-hidden rounded-3xl p-5 text-white shadow-xl ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-400 sm:p-7`}
      style={{ background: "radial-gradient(120% 90% at 100% 0%, rgba(196,90,104,.55), transparent 55%), radial-gradient(90% 80% at 0% 100%, rgba(116,22,41,.6), transparent 60%), linear-gradient(160deg, #111827 0%, #0a0f1d 100%)" }}>
      {p.cover && <>
        <img src={p.cover} alt="" decoding="async" draggable={false} className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.03]" />
        <span className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#0a0f1d] from-25% via-[#0a0f1d]/75 to-[#0a0f1d]/10" aria-hidden="true" />
      </>}
      {!p.cover && <span className="u-featured-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.07]" aria-hidden="true"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />}
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-crimson-200 ring-1 ring-inset ring-white/15">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson-400" /> Featured<span className="hidden sm:inline"> · Grand launch</span>
        </span>
        <span className="u-keep whitespace-nowrap rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-900">{p.price > 0 ? `${p.price} AED` : "Free"}</span>
      </div>
      <h3 className="font-display mt-4 max-w-xl text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">{p.title}</h3>
      <p className="mt-2 text-sm text-slate-300">{new Date(p.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · From {p.time}{p.until ? ` ${p.until}` : ""}</p>
      <p className="mt-0.5 flex items-start gap-1.5 text-sm text-slate-400"><Icon name="pin" className="mt-0.5 h-3.5 w-3.5 shrink-0" />{p.where}</p>

      {/* One quiet countdown line instead of four tiles. */}
      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur-md" aria-label="Countdown to doors">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson-400" />
        Starts in <span className="font-semibold tabular-nums text-white">{parts[0][1]}d {String(parts[1][1]).padStart(2, "0")}:{String(parts[2][1]).padStart(2, "0")}:{String(parts[3][1]).padStart(2, "0")}</span>
      </p>


      <div className="mt-5 flex max-w-md gap-2">
        {action}
      </div>
    </article>
  );
}
