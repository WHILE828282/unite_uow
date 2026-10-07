import { useState } from "react";
import { EventCard, FeaturedSlide } from "../components/cards.jsx";
import { Icon } from "../components/ui.jsx";
import SearchField, { matches } from "../components/SearchField.jsx";
import { dubaiDay } from "../lib/format.js";
import { FEED_CATS, eventStartMs, feedCat } from "../lib/events.js";

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "Today", "Tomorrow", "Yesterday", or "Thu, 8 Oct".
const dayLabel = (iso, today, tomorrow, yesterday) => {
  if (iso === today) return "Today";
  if (iso === tomorrow) return "Tomorrow";
  if (iso === yesterday) return "Yesterday";
  const d = new Date(iso + "T00:00:00");
  return `${WD[d.getDay()]}, ${d.getDate()} ${MO[d.getMonth()]}`;
};
// Group a list into days. Upcoming: an event that already started (multi-day) sits under Today.
// Past: under its last day, newest day first.
const byDay = (list, past, today) => {
  const groups = new Map();
  for (const p of list) {
    const key = past ? p.endDate || p.date : p.date < today ? today : p.date;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  const order = (a, b) => (a.allDay === b.allDay ? eventStartMs(a) - eventStartMs(b) : a.allDay ? -1 : 1);
  return [...groups].sort(([a], [b]) => (past ? b.localeCompare(a) : a.localeCompare(b)))
    .map(([day, items]) => ({ day, items: items.sort(past ? (a, b) => -order(a, b) : order) }));
};

/* "Featured this week": the pinned launch, big official events and student events with photos coming up soon,
   alternating so neither kind dominates. */
const featuredOf = (upcoming, clock) => {
  const soon = clock + 7 * 864e5;
  const student = upcoming.filter((p) => !p.official && (p.pinned || ((p.cover || p.logo) && eventStartMs(p) < soon)));
  const official = upcoming.filter((p) => p.official && p.featured);
  student.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || eventStartMs(a) - eventStartMs(b));
  official.sort((a, b) => eventStartMs(a) - eventStartMs(b));
  const out = [];
  for (let i = 0; out.length < 8 && (i < student.length || i < official.length); i++) {
    if (student[i]) out.push(student[i]);
    if (official[i] && out.length < 8) out.push(official[i]);
  }
  return out;
};

/* Events tab: one feed for official UOWD and student-hosted events, grouped by day, with filters, a featured
   carousel and the past events behind a button. */
export function Events({ upcoming, past, clock, hostEvent, cardOpen, setModal, partyBtn }) {
  const [q, setQ] = useState("");
  const [src, setSrc] = useState("all"); // all | official | student
  const [cat, setCat] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const today = dubaiDay(clock), tomorrow = dubaiDay(clock, 1), yesterday = dubaiDay(clock, -1);

  const keep = (p) => (src === "all" || (src === "official") === !!p.official) && (!cat || feedCat(p) === cat)
    && matches(q, p.title, p.host, p.where, p.category, feedCat(p));
  const list = (showPast ? past : upcoming).filter(keep);
  const groups = byDay(list, showPast, today);
  const filtered = src !== "all" || !!cat || !!q;
  const featured = !showPast && !filtered ? featuredOf(upcoming, clock) : [];
  const open = (p) => cardOpen(() => setModal({ type: "detail", id: p.id }));
  const toTop = () => { const el = document.getElementById("tabs-anchor"); window.scrollTo({ top: el ? el.getBoundingClientRect().top + window.scrollY - 80 : 0, behavior: "smooth" }); };
  const setPast = (v) => { setShowPast(v); toTop(); };
  const clear = () => { setQ(""); setSrc("all"); setCat(null); };
  const chip = (on) => `u-btn shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${on ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`;
  const cta = (p) => partyBtn(p, "shrink-0 !rounded-full !px-3.5 !py-1.5 text-[13px]", true, false, false, true);

  return (
    <>
      {/* Search, with the one Host button on the right. */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1"><SearchField value={q} onChange={setQ} placeholder="Search events" /></div>
        <button onClick={hostEvent} className="u-btn u-haptic flex h-12 shrink-0 items-center gap-1.5 rounded-2xl bg-crimson-600 px-4 text-sm font-semibold text-white hover:bg-crimson-500">
          <Icon name="plus" className="h-4 w-4" /><span>Host<span className="hidden min-[360px]:inline"> event</span></span>
        </button>
      </div>

      {/* Filters: who runs it, then categories. Past events are a quiet link at the end of the feed. */}
      <div className="u-chips -mx-4 mb-5 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="toolbar" aria-label="Filter events">
        <button onClick={() => { setSrc("all"); setCat(null); }} aria-pressed={src === "all" && !cat} className={chip(src === "all" && !cat)}>All</button>
        <button onClick={() => setSrc(src === "official" ? "all" : "official")} aria-pressed={src === "official"} className={chip(src === "official")}>Official UOWD</button>
        <button onClick={() => setSrc(src === "student" ? "all" : "student")} aria-pressed={src === "student"} className={chip(src === "student")}>Student events</button>
        {FEED_CATS.map((c) => <button key={c} onClick={() => setCat(cat === c ? null : c)} aria-pressed={cat === c} className={chip(cat === c)}>{c}</button>)}
      </div>

      {showPast && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Past events</h2>
          <button onClick={() => setPast(false)} className="inline-flex items-center gap-1 text-sm font-semibold text-crimson-600 hover:underline">
            <Icon name="arrow-left" className="h-3.5 w-3.5" /> Back to upcoming
          </button>
        </div>
      )}

      {/* Featured this week: swipe sideways on phones. */}
      {featured.length > 0 && (
        <section className="mb-8" aria-label="Featured this week">
          <h2 className="mb-3 text-lg font-bold tracking-tight text-slate-900">Featured this week</h2>
          <div className="u-chips -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {featured.map((p) => <FeaturedSlide key={p.id} p={p} open={open(p)} action={partyBtn(p, "u-keep shrink-0 !rounded-full !px-4 !py-2 text-[13px] !bg-white !text-slate-900 !ring-0 hover:!bg-slate-100", true, false, false, true)} />)}
          </div>
        </section>
      )}

      {list.length === 0 && (
        <div className="u-fade rounded-2xl bg-white px-6 py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name={q ? "search" : "calendar"} className="h-6 w-6" /></span>
          <p className="mt-3 font-semibold text-slate-900">{q ? `Nothing matches “${q}”` : showPast ? "No past events here" : "Nothing coming up here yet"}</p>
          <p className="mt-1 text-sm text-slate-500">{filtered ? "Try another filter." : "Check back soon, or host one yourself."}</p>
          {filtered && <button onClick={clear} className="u-btn mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Clear filters</button>}
        </div>
      )}

      {/* The feed, one section per day. */}
      <div className="space-y-8">
        {groups.map((g) => {
          const items = g.items;
          return (
            <section key={g.day}>
              <h2 className="mb-3 flex items-baseline gap-2 text-[15px] font-bold tracking-tight text-slate-900">
                {dayLabel(g.day, today, tomorrow, yesterday)}<span className="text-sm font-medium text-slate-400">{items.length}</span>
              </h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {items.map((p, i) => <EventCard key={p.id} p={p} i={i} past={showPast} open={open(p)} action={showPast ? null : cta(p)} />)}
              </div>
            </section>
          );
        })}
      </div>

      {!showPast && past.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button onClick={() => setPast(true)} className="px-3 py-2 text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline">Show past events</button>
        </div>
      )}
    </>
  );
}
