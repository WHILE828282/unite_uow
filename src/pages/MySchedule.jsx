import { ComingUp } from "../components/ComingUp.jsx";
import { useEffect, useRef, useState } from "react";
import { ClubThumb, EventLogo, Icon, ReviewBadge } from "../components/ui.jsx";
import { DAYS } from "../data/options.js";
import { fmtRange, isoDay, shortVenue, slotHours, to24, toMin, weekdayIdx } from "../lib/format.js";
import { HOUR_PX, addDays, hourLabel, layoutDay, mondayOf } from "../lib/schedule.js";
import { GRADIENTS } from "../lib/styles.js";

const BAR = { Sports: "#10b981", Tech: "#0ea5e9", Business: "#8b5cf6", Arts: "#ec4899", Culture: "#f59e0b" };
const EVENT_BAR = "#e0314f", REVIEW_BAR = "#f59e0b";
const fmt12 = (min) => { const h = Math.floor(min / 60) % 24, m = min % 60; return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/* Schedule tab, the way Apple / Google Calendar do it on a phone: the month and a swipeable week strip (dots show
   busy days), then the selected day as an agenda timeline with a "now" line. Computers can switch to a week grid. */
export function MySchedule({ sessions, events, reviews = [], onOpenClub, onOpenTicket, onOpenReview, onBrowse, onExport, suggest = [], onOpenEvent }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
  const today = startOfDay(now);
  const [day, setDay] = useState(today); // selected day
  const anchor = mondayOf(day);
  const [view, setView] = useState(() => (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(min-width: 1024px)").matches ? "week" : "day"));
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Everything on a given date: weekly club sessions, booked events (all-day ones on each of their days), hosted parties.
  const itemsOn = (d) => {
    const iso = isoDay(d), wd = weekdayIdx(d);
    return [
      ...sessions.filter((x) => x.slot.day === wd).map((x) => ({ kind: "session", key: `s-${x.slot.id}`, s: toMin(x.slot.start), e: toMin(x.slot.end), x, color: BAR[x.club.category] || BAR.Culture })),
      ...events.filter((b) => b.date <= iso && iso <= (b.endDate || b.date)).map((b) => {
        const all = b.time === "All day", s = all ? 0 : toMin(to24(b.time));
        return { kind: "event", key: `e-${b.id}`, all, s, e: all ? 1440 : b.endTime && toMin(b.endTime) > s ? toMin(b.endTime) : Math.min(s + 120, 1440), b, color: EVENT_BAR };
      }),
      ...reviews.filter((r) => r.date === iso).map((r) => ({ kind: "review", key: `r-${r.ref}`, s: toMin(r.start), e: toMin(r.end), r, color: REVIEW_BAR })),
    ].sort((a, b) => (a.all === b.all ? a.s - b.s : a.all ? -1 : 1));
  };
  const week = DAYS.map((_, i) => addDays(anchor, i));
  const weekItems = week.map(itemsOn);
  const selItems = itemsOn(day);
  const isToday = +day === +today;
  const weekly = sessions.reduce((h, x) => h + slotHours(x.slot), 0);
  const upcoming = events.filter((b) => (b.endDate || b.date) >= isoDay(today)).sort((a, b) => (a.date + to24(a.time)).localeCompare(b.date + to24(b.time)));

  // Next thing on the calendar (within two weeks).
  let next = null;
  for (let n = 0; n < 14 && !next; n++) {
    const d = addDays(today, n);
    const its = itemsOn(d).filter((x) => n > 0 || x.all || x.e > nowMin);
    const it = its.find((x) => !x.all) || its[0]; // a timed item beats an all-day one
    if (it) next = { ...it, d, n };
  }

  // Swipe the week strip sideways to change week.
  const sw = useRef(null);
  const onTs = (e) => { sw.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTe = (e) => {
    const s0 = sw.current; sw.current = null;
    if (!s0) return;
    const t = e.changedTouches[0], dx = t.clientX - s0.x, dy = t.clientY - s0.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) setDay((d) => addDays(d, dx < 0 ? 7 : -7));
  };

  if (!sessions.length && !events.length && !reviews.length)
    return (
      <>
      <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="calendar" className="h-7 w-7" /></span>
        <h3 className="mt-4 text-lg font-bold text-slate-900">Your week is wide open</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Join a team or club and its weekly sessions appear here, along with the events you're going to.</p>
        <div className="mx-auto mt-5 flex max-w-xs flex-col gap-2 sm:max-w-none sm:flex-row sm:justify-center">
          <button onClick={() => onBrowse("clubs")} className="u-btn rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Browse teams & clubs</button>
          <button onClick={() => onBrowse("parties")} className="u-btn rounded-xl px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Find events</button>
        </div>
      </div>
      <ComingUp events={suggest} onOpen={onOpenEvent} />
      </>
    );

  const open = (it) => it.kind === "session" ? onOpenClub(it.x.club) : it.kind === "event" ? onOpenTicket(it.b) : onOpenReview(it.r);
  const titleOf = (it) => it.kind === "session" ? it.x.club.name : it.kind === "event" ? it.b.title : it.r.title;
  const subOf = (it) => it.kind === "session" ? `${it.x.slot.title} · ${it.x.slot.where}` : it.kind === "event" ? shortVenue(it.b.where) : it.r.venueName;
  const tagOf = (it) => it.kind === "session" ? (it.x.pending ? ["Pending", "bg-amber-50 text-amber-700"] : null)
    : it.kind === "event" ? (it.b.going ? ["Going", "bg-emerald-50 text-emerald-700"] : ["Ticket", "bg-crimson-50 text-crimson-700"])
    : [it.r.status === "approved" ? "Hosting · live" : "Under review", it.r.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"];
  const thumbOf = (it, cls) => it.kind === "session" ? <ClubThumb c={it.x.club} className={cls} /> : <EventLogo p={it.kind === "event" ? it.b : { ...it.r, cover: "" }} className={cls} />;
  const dayName = (d) => (+d === +today ? "Today" : +d === +addDays(today, 1) ? "Tomorrow" : d.toLocaleDateString("en-GB", { weekday: "long" }));

  return (
    <div className="space-y-5">
      {/* Next up */}
      {next && (
        <button onClick={() => open(next)} className="u-card u-keep relative flex w-full items-center gap-4 overflow-hidden rounded-3xl p-4 text-left text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${next.color} 0%, #1c1c1e 130%)` }}>
          {thumbOf(next, "h-12 w-12 !rounded-2xl ring-2 ring-white/25")}
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/75">Next up · {next.n === 0 ? (next.all ? "Today" : next.s <= nowMin ? "Now" : `in ${next.s - nowMin >= 60 ? `${Math.floor((next.s - nowMin) / 60)} h ` : ""}${(next.s - nowMin) % 60} min`) : dayName(next.d)}</span>
            <span className="mt-0.5 block truncate text-lg font-bold leading-tight">{titleOf(next)}</span>
            <span className="block truncate text-sm text-white/80">{next.all ? "All day" : `${fmt12(next.s)} – ${fmt12(next.e)}`} · {subOf(next)}</span>
          </span>
          <Icon name="chevron-right" className="h-5 w-5 shrink-0 text-white/70" />
        </button>
      )}

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        {/* Header: month, week arrows, Today, view switch, export */}
        <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight text-slate-900">{day.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
            <p className="truncate text-xs text-slate-500">{sessions.length} session{sessions.length === 1 ? "" : "s"} a week · {weekly % 1 ? weekly.toFixed(1) : weekly} h</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!isToday && <button onClick={() => setDay(today)} className="u-btn rounded-full bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-crimson-700">Today</button>}
            <button onClick={() => setDay((d) => addDays(d, view === "week" ? -7 : -1))} aria-label="Previous" className="u-btn flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"><Icon name="chevron" className="h-5 w-5 rotate-90" /></button>
            <button onClick={() => setDay((d) => addDays(d, view === "week" ? 7 : 1))} aria-label="Next" className="u-btn flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"><Icon name="chevron" className="h-5 w-5 -rotate-90" /></button>
            <button onClick={onExport} aria-label="Add to my calendar" title="Add to my calendar" className="u-btn flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"><Icon name="download" className="h-[18px] w-[18px]" /></button>
          </div>
        </div>
        <div className="hidden px-4 pb-2 md:block">
          <div className="inline-grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold" role="tablist" aria-label="View">
            {[["day", "Day"], ["week", "Week"]].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)} className={`rounded-lg px-4 py-1.5 ${view === k ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{l}</button>
            ))}
          </div>
        </div>

        {/* Week strip */}
        <div onTouchStart={onTs} onTouchEnd={onTe} className="grid grid-cols-7 gap-1 px-2 pb-3">
          {week.map((d, i) => {
            const sel = +d === +day, tdy = +d === +today, its = weekItems[i];
            const colors = [...new Set(its.map((it) => it.color))].slice(0, 3);
            return (
              <button key={i} onClick={() => setDay(d)} aria-pressed={sel}
                className={`u-btn flex flex-col items-center rounded-2xl py-2 ${sel ? "u-keep bg-crimson-600 text-white" : "hover:bg-slate-50"}`}>
                <span className={`text-[11px] font-semibold uppercase ${sel ? "text-white/80" : tdy ? "text-crimson-600" : "text-slate-400"}`}>{DAYS[i].slice(0, 1)}<span className="hidden min-[400px]:inline">{DAYS[i].slice(1, 3)}</span></span>
                <span className={`mt-0.5 text-lg font-bold tabular-nums leading-tight ${sel ? "text-white" : tdy ? "text-crimson-600" : d < today ? "text-slate-400" : "text-slate-900"}`}>{d.getDate()}</span>
                <span className="mt-1 flex h-1.5 gap-0.5">{colors.map((c) => <span key={c} className="h-1.5 w-1.5 rounded-full" style={{ background: sel ? "#fff" : c }} />)}</span>
              </button>
            );
          })}
        </div>

        {view === "day" || typeof window === "undefined" ? (
          /* Agenda for the selected day */
          <div className="border-t border-slate-100 px-4 py-4">
            <p className="mb-3 text-sm font-semibold text-slate-900">{dayName(day)}<span className="font-normal text-slate-400"> · {day.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</span></p>
            {selItems.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center">
                <p className="font-semibold text-slate-900">Nothing on {+day === +today ? "today" : day.toLocaleDateString("en-GB", { weekday: "long" })}</p>
                <p className="mt-1 text-sm text-slate-500">{next ? <>Next: <button onClick={() => setDay(next.d)} className="font-semibold text-crimson-700">{titleOf(next)}, {dayName(next.d).toLowerCase() === "today" ? "today" : dayName(next.d)}</button></> : "Enjoy the free time."}</p>
              </div>
            ) : (
              <ol className="relative space-y-2">
                {selItems.map((it, k) => {
                  const nowHere = isToday && !it.all && (k === 0 ? nowMin < it.s : selItems[k - 1].all || selItems[k - 1].s <= nowMin) && nowMin < it.s;
                  const live = isToday && !it.all && it.s <= nowMin && nowMin < it.e;
                  const past = (day < today) || (isToday && !it.all && it.e <= nowMin);
                  const tag = tagOf(it);
                  return (
                    <li key={it.key}>
                      {nowHere && <div className="mb-2 flex items-center gap-2" aria-label="Now"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /><span className="h-px flex-1 bg-rose-500" /><span className="text-[11px] font-semibold text-rose-500">{fmt12(nowMin)}</span></div>}
                      <button onClick={() => open(it)} className={`u-card flex w-full items-stretch gap-3 rounded-2xl bg-slate-50 p-3 text-left ${past ? "opacity-55" : ""}`}>
                        <span className="w-[4.2rem] shrink-0 pt-0.5 text-right">
                          <span className="block text-sm font-semibold tabular-nums text-slate-900">{it.all ? "All day" : fmt12(it.s).replace(" ", " ")}</span>
                          {!it.all && <span className="block text-xs tabular-nums text-slate-400">{fmt12(it.e)}</span>}
                        </span>
                        <span className="w-1 shrink-0 rounded-full" style={{ background: it.color, opacity: it.kind === "session" && it.x.pending ? 0.45 : 1 }} />
                        {thumbOf(it, "h-11 w-11 self-center")}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="line-clamp-2 min-w-0 font-semibold leading-snug text-slate-900">{titleOf(it)}</span>
                            {live ? <span className="shrink-0 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">Now</span>
                              : tag && <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tag[1]}`}>{tag[0]}</span>}
                          </span>
                          <span className="mt-0.5 block truncate text-sm text-slate-500">{subOf(it)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
                {isToday && selItems.some((it) => !it.all) && selItems.every((it) => it.all || it.e <= nowMin) && (
                  <li className="flex items-center gap-2 pt-1" aria-label="Now"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /><span className="h-px flex-1 bg-rose-500" /><span className="text-[11px] font-semibold text-rose-500">{fmt12(nowMin)}</span></li>
                )}
              </ol>
            )}
          </div>
        ) : (
          <WeekGrid week={week} weekItems={weekItems} today={today} day={day} nowMin={nowMin} open={open} titleOf={titleOf} subOf={subOf} />
        )}
      </section>

      {/* Party applications */}
      {reviews.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Your party applications</h3>
          <div className="space-y-2">
            {reviews.map((r) => {
              const d = new Date(r.date + "T00:00:00");
              return (
                <button key={r.ref} onClick={() => onOpenReview(r)} className="u-card flex w-full items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-sm">
                  {r.logo && <EventLogo p={r} className="h-14 w-14 ring-1 ring-slate-200/70" />}
                  <span className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br text-white ${GRADIENTS[r.category] || GRADIENTS.Party}`}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ opacity: 0.85 }}>{d.toLocaleDateString("en-GB", { month: "short" })}</span>
                    <span className="text-xl font-bold leading-none">{d.getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{r.title}</span>
                    <span className="block truncate text-sm text-slate-500">{DAYS[weekdayIdx(d)]} · {fmtRange(r.start, r.end)} · {r.venueName}</span>
                  </span>
                  <ReviewBadge r={r} />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming events</h3>
          <div className="space-y-2">
            {upcoming.map((b) => {
              const d = new Date(b.date + "T00:00:00");
              return (
                <button key={b.id} onClick={() => onOpenTicket(b)} className="u-card flex w-full items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-sm">
                  <span className="u-keep flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-crimson-600 text-white">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">{d.toLocaleDateString("en-GB", { month: "short" })}</span>
                    <span className="text-xl font-bold leading-none">{d.getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{b.title}</span>
                    <span className="block truncate text-sm text-slate-500">{DAYS[weekdayIdx(d)]} · {b.time} · {shortVenue(b.where)}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${b.going ? "bg-emerald-50 text-emerald-700" : "bg-crimson-50 text-crimson-700"}`}>{b.going ? "Going" : "Ticket"}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/* Computers: the whole week as a time grid (same items, coloured bars, a "now" line). */
function WeekGrid({ week, weekItems, today, day, nowMin, open, titleOf, subOf }) {
  const timed = weekItems.map((its) => layoutDay(its.filter((it) => !it.all).map((it) => ({ ...it }))));
  const allDay = weekItems.map((its) => its.filter((it) => it.all));
  const flat = timed.flat();
  const startH = flat.length ? Math.max(6, Math.min(...flat.map((it) => Math.floor(it.s / 60))) - 1) : 9;
  const endH = flat.length ? Math.min(24, Math.max(startH + 6, ...flat.map((it) => Math.ceil(it.e / 60) + 1))) : 18;
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const cols = "56px repeat(7, minmax(0, 1fr))";
  return (
    <div className="border-t border-slate-100">
      <div className="grid" style={{ gridTemplateColumns: cols }}>
        <div />
        {week.map((d, i) => (
          <div key={i} className="min-h-[2rem] space-y-1 border-l border-slate-100 p-1">
            {allDay[i].map((it) => <button key={it.key} onClick={() => open(it)} className="block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold text-white" style={{ background: it.color }}>{titleOf(it)}</button>)}
          </div>
        ))}
      </div>
      <div className="relative grid border-t border-slate-100" style={{ gridTemplateColumns: cols, height: (endH - startH) * HOUR_PX }}>
        <div className="relative">
          {hours.map((h, i) => i > 0 && <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-slate-400" style={{ top: i * HOUR_PX }}>{hourLabel(h)}</span>)}
        </div>
        {week.map((d, i) => (
          <div key={i} className="relative border-l border-slate-100" style={+d === +day ? { background: "rgba(224, 49, 79, 0.06)" } : undefined}>
            {hours.map((h, j) => <div key={h} className="absolute inset-x-0 border-t border-slate-100" style={{ top: j * HOUR_PX }} />)}
            {timed[i].map((it) => {
              const top = ((it.s - startH * 60) / 60) * HOUR_PX, height = Math.max(24, ((it.e - it.s) / 60) * HOUR_PX - 3);
              return (
                <button key={it.key} onClick={() => open(it)} title={titleOf(it)}
                  className="absolute overflow-hidden rounded-lg px-1.5 py-1 text-left hover:z-10 hover:shadow-md"
                  style={{ top: top + 1, height, left: `calc(${(it.lane / it.lanes) * 100}% + 2px)`, width: `calc(${100 / it.lanes}% - 4px)`, background: `${it.color}22`, borderLeft: `3px solid ${it.color}` }}>
                  <span className="block truncate text-[11px] font-bold text-slate-900">{titleOf(it)}</span>
                  {height > 40 && <span className="block truncate text-[11px] text-slate-500">{fmt12(it.s)}</span>}
                  {height > 70 && <span className="block truncate text-[11px] text-slate-400">{subOf(it)}</span>}
                </button>
              );
            })}
            {+d === +today && nowMin >= startH * 60 && nowMin <= endH * 60 && (
              <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: ((nowMin - startH * 60) / 60) * HOUR_PX }}>
                <div className="relative h-0.5 bg-rose-500"><span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" /></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* My Schedule tab: a sign-in prompt, or the weekly calendar. */
export function MySchedulePage({ user, onSignIn, ...props }) {
  return !user ? (
    <>
    <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200/70"><Icon name="calendar" className="h-7 w-7" /></span>
      <h3 className="mt-4 text-lg font-bold">Your campus week, in one place</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Sign in, pick club sessions and book events. They show up here as a weekly calendar you can export.</p>
      <button onClick={onSignIn} className="u-btn mt-5 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Sign in</button>
    </div>
    <ComingUp events={props.suggest} onOpen={props.onOpenEvent} />
    </>
  ) : (
    <MySchedule {...props} />
  );
}
