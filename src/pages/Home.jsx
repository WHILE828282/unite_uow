import { useEffect, useState } from "react";
import { dubaiStart } from "../components/cards.jsx";
import { fmtDate } from "../lib/format.js";

/* Home: its own page, not a copy of the others. A dark photo-collage hero (with the launch party built in), a grid of
   places to explore, two swipeable rails of visual tiles (events, clubs), a three-step explainer and a host banner.
   Every tile on this page shares one style: full-bleed picture or colour, white text at the bottom. */

// Hero backdrop: 18 small square crops (public/collage) of club, team and event photos, faces kept in frame.
// Bump COLLAGE_V whenever a photo is swapped, so phones load the new one instead of a saved copy.
const COLLAGE_V = "?v=2";
const COLLAGE = Array.from({ length: 18 }, (_, i) => `/collage/${String(i + 1).padStart(2, "0")}.webp${COLLAGE_V}`);
const greeting = () => { const h = new Date().getHours(); return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
export const ROOM_BG = {
  Tech: "linear-gradient(140deg, #0ea5e9 0%, #1e3a8a 100%)",
  Business: "linear-gradient(140deg, #10b981 0%, #064e3b 100%)",
  Arts: "linear-gradient(140deg, #f43f5e 0%, #7c2d12 100%)",
  Sports: "linear-gradient(140deg, #f59e0b 0%, #7c2d12 100%)",
  Events: "linear-gradient(140deg, #c45a68 0%, #4a0e1b 100%)",
  Host: "linear-gradient(140deg, #334155 0%, #0f172a 100%)",
};

/* Countdown to doors, ticking once a minute. */
function useCountdown(p) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const ms = p ? Math.max(0, dubaiStart(p) - now) : 0;
  return [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60];
}

function Spotlight({ p, booked, onOpen }) {
  const [d, h, m] = useCountdown(p);
  const left = p.spots - p.taken;
  // "In 21 days" far out, "Tomorrow", then a real countdown on the day.
  const when = d >= 2 ? `In ${d} days` : d === 1 ? `Tomorrow · in ${24 + h}h` : h > 0 ? `Starts in ${h}h ${m}m` : m > 0 ? `Starts in ${m} min` : "Happening now";
  return (
    <button onClick={onOpen}
      className="u-keep u-btn mt-7 flex w-full max-w-2xl items-center gap-3.5 rounded-2xl p-3 pr-3.5 text-left ring-1 ring-inset ring-white/15 backdrop-blur-md sm:p-3.5"
      style={{ background: "linear-gradient(110deg, rgba(116,22,41,.75), rgba(15,23,42,.55))" }}>
      {p.logo ? <img src={p.logo} alt="" className="hidden h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-white/15 min-[390px]:block" /> : <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-2xl min-[390px]:flex" aria-hidden="true">{p.emoji}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-bold uppercase tracking-wider text-crimson-200">Grand launch · {new Date(p.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
        <span className="line-clamp-2 block font-semibold leading-snug text-white">{p.title}</span>
        <span className="mt-0.5 block truncate text-xs tabular-nums text-slate-300">{when} · {left > 0 ? `${left} ticket${left === 1 ? "" : "s"} left` : "Sold out"}</span>
      </span>
      <span className={`u-keep shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${booked ? "bg-emerald-500 text-white" : "bg-white text-slate-900"}`}>{booked ? "Your ticket" : `${p.price} AED`}</span>
    </button>
  );
}

export function HomeHero({ user, firstName, cards, stats, spotlight, spotlightBooked, onSpotlight, onEvents, onClubs }) {
  return (
    <section id="home-hero" className="u-keep relative isolate overflow-hidden rounded-b-[28px] bg-[#0b0b0e] text-white shadow-[0_20px_40px_-24px_rgba(0,0,0,.6)] sm:rounded-b-[44px]">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -inset-x-24 -top-16 grid -rotate-6 grid-cols-4 gap-3 opacity-60 sm:-inset-x-10 sm:grid-cols-6">
          {COLLAGE.map((src, i) => (
            <div key={i} className={`aspect-square overflow-hidden rounded-2xl bg-white/5 ${i % 2 ? "translate-y-6" : ""}`}>
              <img src={src} alt="" loading={i < 8 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0e]/45 via-[#0b0b0e]/75 to-[#0b0b0e]" />
        <div className="u-hero-glow absolute -right-24 -top-24 h-80 w-80 rounded-full" />
        <div className="u-hero-glow absolute -bottom-32 -left-24 h-72 w-72 rounded-full opacity-60" />
      </div>

      <div className={`relative mx-auto max-w-5xl px-4 ${user ? "pb-9 pt-7 sm:pt-10" : "pb-10 pt-10 sm:pb-14 sm:pt-16"}`}>
        {user ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-crimson-200">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">{greeting()}, {firstName}</h1>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-crimson-200">UOWD · Dubai Knowledge Park</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Where UOWD<br />comes <span className="text-crimson-200">together.</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-slate-300 sm:text-lg">Clubs, teams, parties and trips. Join in one tap, get your QR ticket in seconds.</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <button onClick={onEvents} className="u-keep u-btn rounded-xl bg-crimson-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-crimson-900/40 hover:bg-crimson-500">Find events →</button>
              <button onClick={onClubs} className="u-keep u-btn rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm hover:bg-white/15">Join a club</button>
            </div>
          </>
        )}

        {cards.length > 0 && (
          <div className={`u-chips -mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-2.5 px-4 py-1 sm:mx-0 sm:grid sm:px-0 sm:[-webkit-mask-image:none] sm:[mask-image:none] ${cards.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {cards.map((x) => (
              <button key={x.k} onClick={x.go}
                className={`u-keep u-btn min-w-0 shrink-0 snap-start rounded-2xl bg-white/[0.07] p-3.5 text-left ring-1 ring-inset ring-white/10 backdrop-blur-md hover:bg-white/[0.12] sm:w-auto ${cards.length > 1 ? "w-[82%]" : "w-full"}`}>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-crimson-200">{x.k}</span>
                <span className="mt-1 block truncate font-semibold text-white">{x.t}</span>
                <span className="mt-0.5 block truncate text-sm text-slate-300">{x.d}</span>
              </button>
            ))}
          </div>
        )}

        {spotlight && <Spotlight p={spotlight} booked={spotlightBooked} onOpen={onSpotlight} />}

        <div className="mt-6 grid max-w-lg grid-cols-3 divide-x divide-white/10 rounded-2xl bg-white/[0.05] py-2.5 ring-1 ring-inset ring-white/10">
          {stats.map(([n, l]) => (
            <div key={l} className="px-3">
              <span className="block text-lg font-bold tabular-nums leading-tight text-white sm:text-xl">{n}</span>
              <span className="block text-[11px] leading-tight text-slate-400">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const Head = ({ eyebrow, title, onAll }) => (
  <div className="mb-4 flex items-end justify-between gap-3">
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-crimson-700">{eyebrow}</p>
      <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">{title}</h2>
    </div>
    {onAll && <button onClick={onAll} className="-my-2 shrink-0 rounded-lg px-2.5 py-2.5 text-sm font-semibold text-crimson-700 hover:bg-crimson-50">See all</button>}
  </div>
);
/* Phones and tablets: a row you swipe. Computers: a tidy grid (no card cut in half at the edge). */
const Rail = ({ children, cols = "lg:grid-cols-4" }) => (
  <div className={`u-chips -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 px-4 pb-1 sm:mx-0 sm:px-0 sm:[-webkit-mask-image:none] sm:[mask-image:none] lg:grid lg:overflow-visible ${cols}`}>{children}</div>
);
/* The one tile style of this page: picture or colour, dark fade, white text at the bottom. */
const Tile = ({ onClick, bg, img, tint, className = "", children }) => (
  <button onClick={onClick} className={`u-keep u-card group relative shrink-0 snap-start overflow-hidden rounded-2xl text-left text-white shadow-sm ${className}`} style={{ background: bg || "#0f172a" }}>
    {img && <img src={img} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
    <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" aria-hidden="true" />
    {tint && <span className="absolute inset-0" style={{ background: `linear-gradient(to top, ${tint}e6 0%, ${tint}66 38%, transparent 72%)` }} aria-hidden="true" />}
    <span className="relative flex h-full flex-col justify-between p-3.5">{children}</span>
  </button>
);

/* Explore photos and the room colour that tints the bottom of each one. */
const EXPLORE_ART = {
  Events: ["/explore/parties.webp", "#7a1730"], Sports: ["/explore/sports.webp", "#7c3a0a"], Tech: ["/explore/tech.webp", "#1e3a8a"],
  Business: ["/explore/finance.webp", "#064e3b"], Arts: ["/explore/arts.webp", "#881337"], Host: ["/explore/host.webp", "#0f172a"],
};
export function HomeSections({ user, events, clubs, roomCounts, upcomingCount, memberCount, setModal, goEvents, goRoom, hostEvent }) {
  const explore = [
    ["Events", "Parties & events", `${upcomingCount} upcoming`, goEvents],
    ["Sports", "Sports teams", `${roomCounts.Sports} squads`, () => goRoom("Sports")],
    ["Tech", "Tech & Gaming", `${roomCounts.Tech} clubs`, () => goRoom("Tech")],
    ["Business", "Business & Careers", `${roomCounts.Business} clubs`, () => goRoom("Business")],
    ["Arts", "Arts & Culture", `${roomCounts.Arts} clubs`, () => goRoom("Arts")],
    ["Host", "Host an event", "Sell tickets with QR", hostEvent],
  ];
  return (
    <div className="space-y-12 pt-2">
      <section>
        <Head eyebrow="Explore" title="What are you into?" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {explore.map(([k, t, d, go]) => (
            <Tile key={k} onClick={go} bg={ROOM_BG[k]} img={EXPLORE_ART[k][0]} tint={EXPLORE_ART[k][1]} className="h-40 w-full sm:h-44">
              <span aria-hidden="true" />
              <span><span className="block text-[15px] font-bold leading-tight [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">{t}</span><span className="mt-0.5 block text-xs text-white/80">{d}</span></span>
            </Tile>
          ))}
        </div>
      </section>

      {events.length > 0 && (
        <section>
          <Head eyebrow="This week" title="Happening on campus" onAll={goEvents} />
          <Rail>
            {events.map((p) => {
              const left = p.spots - p.taken;
              return (
                <Tile key={p.id} onClick={() => setModal({ type: "detail", id: p.id })} img={p.cover || p.logo} bg={ROOM_BG.Events} className="h-56 w-52 sm:w-56 lg:w-auto">
                  <span className="flex items-start justify-between gap-2">
                    <span className="rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold backdrop-blur-sm">{fmtDate(p.date)}</span>
                    <span className="u-keep rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-900">{p.price > 0 ? `${p.price} AED` : "Free"}</span>
                  </span>
                  <span>
                    {left > 0 && left <= 10 && <span className="mb-1.5 inline-block rounded-full bg-crimson-600 px-2 py-0.5 text-[11px] font-semibold">Only {left} left</span>}
                    {left <= 0 && <span className="mb-1.5 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">Waitlist open</span>}
                    <span className="line-clamp-2 block font-bold leading-snug">{p.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-white/75">{p.time} · {p.where.split(",")[0]}</span>
                  </span>
                </Tile>
              );
            })}
          </Rail>
        </section>
      )}

      <section>
        <Head eyebrow="Clubs" title="Most popular right now" onAll={() => goRoom()} />
        <Rail cols="lg:grid-cols-4">
          {clubs.map((c) => (
            <Tile key={c.id} onClick={() => setModal({ type: "club", id: c.id })} bg={ROOM_BG[c.category]} img={c.backgroundImage} className="h-44 w-44 lg:h-48 lg:w-auto">
              {c.backgroundImage ? <span aria-hidden="true" /> : <span className="text-4xl drop-shadow" aria-hidden="true">{c.emoji}</span>}
              <span>
                <span className="block text-[15px] font-bold leading-tight [hyphens:auto]" lang="en">{c.name}</span>
                <span className="mt-0.5 block text-xs text-white/75">{memberCount(c)} members</span>
              </span>
            </Tile>
          ))}
        </Rail>
      </section>


    </div>
  );
}
