import { FeaturedCard } from "../components/cards.jsx";
import { Icon } from "../components/ui.jsx";
import { CLUB_ROOMS } from "../data/clubs.js";
import { fmtDate } from "../lib/format.js";

/* Home: the first thing people see. A photo-collage hero (always dark), then the launch party, this week's events,
   popular clubs, teams with open tryouts, how Unite works and a nudge to host. */

const COLLAGE = [
  "/events/rooftop-sunset-mixer-small.webp", "/teams/football-card.webp", "/events/halloween-party-small.webp", "/events/ps5-tournament-small.webp",
  "/teams/basketball-card.webp", "/events/open-mic-chai-small.webp", "/events/yacht-party-small.webp", "/teams/volleyball-card.webp",
  "/events/anime-matcha-night-small.webp", "/events/futsal-tournament-small.webp", "/teams/padel-tennis-card.webp", "/events/arabic-coffee-small.webp",
];
const greeting = () => { const h = new Date().getHours(); return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };

export function HomeHero({ user, firstName, cards, stats, onEvents, onClubs }) {
  return (
    <section className="u-keep relative isolate overflow-hidden bg-[#070d1a] text-white">
      {/* Photo collage, tilted and dimmed behind the text */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -inset-x-24 -top-16 grid -rotate-6 grid-cols-4 gap-3 opacity-40 sm:-inset-x-10 sm:grid-cols-6">
          {[...COLLAGE, ...COLLAGE].slice(0, 18).map((src, i) => (
            <div key={i} className={`aspect-square overflow-hidden rounded-2xl bg-white/5 ${i % 2 ? "translate-y-6" : ""}`}>
              <img src={src} alt="" loading={i < 8 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#070d1a]/70 via-[#070d1a]/85 to-[#070d1a]" />
        <div className="u-hero-glow absolute -right-24 -top-24 h-80 w-80 rounded-full" />
        <div className="u-hero-glow absolute -bottom-32 -left-24 h-72 w-72 rounded-full opacity-60" />
      </div>

      <div className={`relative mx-auto max-w-5xl px-4 ${user ? "pb-10 pt-7 sm:pt-10" : "pb-12 pt-10 sm:pb-16 sm:pt-16"}`}>
        {user ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-crimson-200">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">{greeting()}, {firstName}</h1>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-crimson-100 ring-1 ring-inset ring-white/15 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live at UOWD · Dubai Knowledge Park
            </span>
            <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Where UOWD<br />comes <span className="bg-gradient-to-r from-crimson-300 to-crimson-100 bg-clip-text text-transparent">together.</span>
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
                className={`u-keep u-btn min-w-0 shrink-0 snap-start rounded-2xl p-3.5 text-left backdrop-blur-md sm:w-auto ${cards.length > 1 ? "w-[82%]" : "w-full"} ${x.hot ? "bg-crimson-700/40 ring-1 ring-inset ring-crimson-300/40 hover:bg-crimson-700/50" : "bg-white/[0.07] ring-1 ring-inset ring-white/10 hover:bg-white/[0.12]"}`}>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-crimson-200">{x.k}</span>
                <span className="mt-1 block truncate font-semibold text-white">{x.t}</span>
                <span className="mt-0.5 block truncate text-sm text-slate-300">{x.d}</span>
              </button>
            ))}
          </div>
        )}

        <dl className="mt-7 grid max-w-lg grid-cols-3 gap-2">
          {stats.map(([n, l, go]) => (
            <button key={l} onClick={go} className="u-keep u-btn rounded-2xl bg-white/[0.05] px-3 py-2.5 text-left ring-1 ring-inset ring-white/10 hover:bg-white/10">
              <dt className="sr-only">{l}</dt>
              <dd className="text-xl font-bold tabular-nums sm:text-2xl">{n}</dd>
              <dd className="text-[11px] font-medium text-slate-400">{l}</dd>
            </button>
          ))}
        </dl>
      </div>
    </section>
  );
}

const Section = ({ title, sub, onAll, children }) => (
  <section>
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
        {sub && <p className="text-sm text-slate-500">{sub}</p>}
      </div>
      {onAll && <button onClick={onAll} className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-crimson-700 hover:bg-crimson-50">See all →</button>}
    </div>
    {children}
  </section>
);
const Rail = ({ children }) => (
  <div className="u-chips -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 px-4 pb-2 pt-0.5">{children}</div>
);
const ROOM_TILE = { Tech: "linear-gradient(135deg, #0ea5e9 0%, #1e3a8a 100%)", Business: "linear-gradient(135deg, #10b981 0%, #065f46 100%)", Arts: "linear-gradient(135deg, #f43f5e 0%, #7c2d12 100%)" };
const STEPS = [
  ["🎓", "Sign in with your student email", "Verified UOWD accounts unlock club communities."],
  ["⚡", "Join a club or grab a ticket", "One tap to join, Apple Pay or card for tickets."],
  ["📱", "Show your QR at the door", "Your ticket lives in the app, even offline."],
];

export function HomeSections({ featured, events, clubs, teams, memberCount, partyBtn, cardOpen, setModal, shareEvent, goEvents, goClubs, hostEvent }) {
  return (
    <div className="space-y-10 pt-2">
      {featured && (
        <FeaturedCard p={featured} open={cardOpen(() => setModal({ type: "detail", id: featured.id }))} onShare={() => shareEvent(featured)}
          onDetails={() => setModal({ type: "detail", id: featured.id })}
          action={partyBtn(featured, "u-keep flex-1 !bg-white !text-slate-900 !ring-0 hover:!bg-slate-100", true)} />
      )}

      {events.length > 0 && (
        <Section title="This week on campus" sub="Parties, socials and tournaments coming up" onAll={goEvents}>
          <Rail>
            {events.map((p) => {
              const left = p.spots - p.taken;
              return (
                <button key={p.id} onClick={() => setModal({ type: "detail", id: p.id })}
                  className="u-card group w-60 shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200/60 bg-white text-left shadow-sm">
                  <span className="relative block aspect-[16/10] bg-slate-900">
                    {p.cover || p.logo ? <img src={p.cover || p.logo} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      : <span className="flex h-full items-center justify-center text-4xl">{p.emoji}</span>}
                    <span className="u-keep absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">{fmtDate(p.date)}</span>
                    <span className="u-keep absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-900">{p.price > 0 ? `${p.price} AED` : "Free"}</span>
                    {left > 0 && left <= 10 && <span className="u-keep absolute bottom-2 left-2 rounded-full bg-crimson-600 px-2 py-0.5 text-[11px] font-semibold text-white">🔥 {left} left</span>}
                    {left <= 0 && <span className="u-keep absolute bottom-2 left-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[11px] font-semibold text-white">Waitlist</span>}
                  </span>
                  <span className="block p-3">
                    <span className="block truncate font-semibold text-slate-900">{p.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{p.time} · {p.where.split(",")[0]}</span>
                  </span>
                </button>
              );
            })}
          </Rail>
        </Section>
      )}

      <Section title="Popular clubs" sub="17 student societies across three rooms" onAll={goClubs}>
        <Rail>
          {clubs.map((c) => (
            <button key={c.id} onClick={() => setModal({ type: "club", id: c.id })}
              className="u-card w-44 shrink-0 snap-start rounded-2xl border border-slate-200/60 bg-white p-3.5 text-left shadow-sm">
              <span className="u-keep flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm" style={{ background: ROOM_TILE[c.category] }}>{c.emoji}</span>
              <span className="mt-3 block truncate font-semibold text-slate-900">{c.name}</span>
              <span className="block truncate text-xs text-slate-500">{(CLUB_ROOMS.find((r) => r.k === c.category) || {}).label}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500"><Icon name="users" className="h-3.5 w-3.5" />{memberCount(c)} members</span>
            </button>
          ))}
        </Rail>
      </Section>

      <Section title="Tryouts are open" sub="Represent UOWD in inter-university fixtures" onAll={goClubs}>
        <Rail>
          {teams.map((c) => (
            <button key={c.id} onClick={() => setModal({ type: "club", id: c.id })}
              className="u-keep u-card relative h-32 w-52 shrink-0 snap-start overflow-hidden rounded-2xl bg-slate-900 text-left text-white shadow-sm">
              {c.backgroundImage && <img src={c.backgroundImage} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />}
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <span className="absolute inset-x-3 bottom-2.5">
                <span className="block font-semibold">{c.emoji} {c.name}</span>
                <span className="block text-xs text-white/75">{memberCount(c)} players · {c.where}</span>
              </span>
            </button>
          ))}
        </Rail>
      </Section>

      <Section title="How Unite works">
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STEPS.map(([e, t, d], i) => (
            <li key={t} className="relative rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
              <span className="absolute right-4 top-3 text-3xl font-extrabold text-slate-100">{i + 1}</span>
              <span className="text-2xl" aria-hidden="true">{e}</span>
              <p className="mt-2 font-semibold text-slate-900">{t}</p>
              <p className="mt-0.5 text-sm text-slate-500">{d}</p>
            </li>
          ))}
        </ol>
      </Section>

      <button onClick={hostEvent}
        className="u-keep u-btn flex w-full items-center gap-4 rounded-3xl p-5 text-left text-white shadow-lg sm:p-6"
        style={{ background: "radial-gradient(100% 120% at 100% 0%, rgba(196,90,104,.6), transparent 60%), linear-gradient(135deg, #741629, #2e0811)" }}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl" aria-hidden="true">🎤</span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold">Got an idea? Host it on Unite</span>
          <span className="block text-sm text-white/75">Parties, trips, tournaments: sell tickets and check guests in with QR.</span>
        </span>
        <span className="hidden shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 sm:block">Start →</span>
      </button>
    </div>
  );
}
