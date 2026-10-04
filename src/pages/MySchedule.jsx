import { useEffect, useState } from "react";
import { EventLogo, Icon, ReviewBadge } from "../components/ui.jsx";
import { DAYS } from "../data/options.js";
import { fmtDate, fmtRange, isoDay, shortVenue, slotHours, to24, toMin, weekdayIdx } from "../lib/format.js";
import { CAT_TINT, HOUR_PX, MONTHS, addDays, hourLabel, isoWeek, layoutDay, mondayOf, shortRange } from "../lib/schedule.js";
import { GRADIENTS } from "../lib/styles.js";

export function MySchedule({ sessions, events, reviews = [], onOpenClub, onOpenTicket, onOpenReview, onBrowse, onExport }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [anchor, setAnchor] = useState(() => mondayOf(today));
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  const days = DAYS.map((_, i) => addDays(anchor, i));
  const mid = days[3]; // the week belongs to the month its Thursday falls in
  const thisYear = today.getFullYear();
  const years = [thisYear, thisYear + 1];
  const minAnchor = mondayOf(new Date(thisYear, 0, 4));
  const maxAnchor = mondayOf(new Date(thisYear + 1, 11, 28));
  const go = (d) => setAnchor(d < minAnchor ? minAnchor : d > maxAnchor ? maxAnchor : d);
  const jumpMonth = (y, m) => go(mondayOf(new Date(y, m, 4)));
  const isCurrent = +anchor === +mondayOf(today);
  const fmt = (d, o) => d.toLocaleDateString("en-GB", o);
  const range = `${fmt(days[0], { day: "numeric", month: "short" })} – ${fmt(days[6], { day: "numeric", month: "short", year: "numeric" })}`;

  // Everything on the grid this week.
  const dayItems = days.map((d, i) => {
    const iso = isoDay(d);
    return layoutDay([
      ...sessions.filter((x) => x.slot.day === i).map((x) => ({ kind: "session", key: x.slot.id, s: toMin(x.slot.start), e: toMin(x.slot.end), x })),
      ...events.filter((b) => b.date === iso).map((b) => { const s = toMin(to24(b.time)); return { kind: "event", key: b.id, s, e: Math.min(s + 120, 24 * 60), b }; }),
      ...reviews.filter((r) => r.date === iso).map((r) => ({ kind: "review", key: r.ref, s: toMin(r.start), e: toMin(r.end), r })),
    ]);
  });
  const all = dayItems.flat();
  // Days with overlapping sessions get proportionally wider columns.
  const cols = `60px ${dayItems.map((its) => `minmax(0, ${Math.max(1, ...its.map((it) => Math.min(it.lanes, 3)))}fr)`).join(" ")}`;
  // Fit the grid to this week's items, with an hour of breathing room either side.
  const startH = all.length ? Math.max(6, Math.min(...all.map((it) => Math.floor(it.s / 60))) - 1) : 9;
  const endH = all.length ? Math.min(24, Math.max(startH + 6, ...all.map((it) => Math.ceil(it.e / 60) + 1))) : 18;
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const gridH = (endH - startH) * HOUR_PX;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const weekHours = all.reduce((h, it) => h + (it.e - it.s) / 60, 0);
  const weekly = sessions.reduce((h, x) => h + slotHours(x.slot), 0);
  const upcoming = events.filter((b) => b.date >= isoDay(today)).sort((a, b) => (a.date + to24(a.time)).localeCompare(b.date + to24(b.time)));

  const nextSession = sessions
    .map((x) => { const ahead = (x.slot.day - weekdayIdx(today) + 7) % 7; return { ...x, days: ahead === 0 && toMin(x.slot.start) <= nowMin ? 7 : ahead }; })
    .sort((a, b) => a.days - b.days || toMin(a.slot.start) - toMin(b.slot.start))[0];
  const whenLabel = (n) => (n === 0 ? "Today" : n === 1 ? "Tomorrow" : DAYS[(weekdayIdx(today) + n) % 7]);

  if (!sessions.length && !events.length && !reviews.length)
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200/70"><Icon name="calendar" className="h-7 w-7" /></span>
        <h3 className="mt-4 text-lg font-bold text-slate-900">Your week is wide open</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Register for a team or club and its official weekly schedule appears here, along with any event tickets. Everything you sign up for lands here automatically.</p>
        <div className="mx-auto mt-5 flex max-w-xs flex-col gap-2 sm:max-w-none sm:flex-row sm:justify-center">
          <button onClick={() => onBrowse("clubs")} className="u-btn rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Browse teams & clubs</button>
          <button onClick={() => onBrowse("parties")} className="u-btn rounded-xl px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Find events</button>
        </div>
      </div>
    );

  const selectCls = "u-btn appearance-none rounded-xl border border-slate-200/50 bg-white py-2 pl-3 pr-8 text-sm font-semibold text-slate-900 shadow-sm hover:border-slate-300 focus:border-crimson-400 focus:outline-none focus:ring-2 focus:ring-crimson-100";
  const Chevron = () => <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400"><Icon name="chevron" className="h-4 w-4" /></span>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="min-w-0 rounded-2xl border border-slate-200/50 bg-white p-4 shadow-sm sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Next up</p>
          {nextSession ? (
            <button onClick={() => onOpenClub(nextSession.club)} className="mt-2 flex w-full items-center gap-3 text-left">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl ${GRADIENTS[nextSession.club.category]}`}>{nextSession.club.emoji}</span>
              <span className="min-w-0">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-semibold text-slate-900">{nextSession.club.name} · {nextSession.slot.title}</span>
                  {nextSession.pending && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">Pending</span>}
                </span>
                <span className="block truncate text-sm text-slate-500">{whenLabel(nextSession.days)}, {fmtRange(nextSession.slot.start, nextSession.slot.end)} · {nextSession.slot.where}</span>
              </span>
            </button>
          ) : upcoming[0] ? (
            <button onClick={() => onOpenTicket(upcoming[0])} className="mt-2 flex w-full items-center gap-3 text-left">
              {upcoming[0].logo ? <EventLogo p={upcoming[0]} className="h-11 w-11" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">{upcoming[0].emoji}</span>}
              <span className="min-w-0"><span className="block truncate font-semibold text-slate-900">{upcoming[0].title}</span><span className="block text-sm text-slate-500">{fmtDate(upcoming[0].date)} · {upcoming[0].time}</span></span>
            </button>
          ) : <p className="mt-2 text-sm text-slate-500">Nothing coming up.</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200/50 bg-white p-4 shadow-sm"><p className="text-2xl font-bold tabular-nums text-slate-900">{sessions.length}</p><p className="text-xs text-slate-500">weekly sessions{sessions.some((x) => x.pending) ? <span className="text-amber-600"> · {sessions.filter((x) => x.pending).length} pending</span> : null}</p></div>
          <div className="rounded-2xl border border-slate-200/50 bg-white p-4 shadow-sm"><p className="text-2xl font-bold tabular-nums text-slate-900">{weekly % 1 ? weekly.toFixed(1) : weekly}</p><p className="text-xs text-slate-500">hours a week</p></div>
        </div>
      </div>

      {/* Calendar */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200/50 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select aria-label="Month" value={mid.getMonth()} onChange={(e) => jumpMonth(mid.getFullYear(), +e.target.value)} className={selectCls}>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <Chevron />
            </div>
            <div className="relative">
              <select aria-label="Year" value={mid.getFullYear()} onChange={(e) => jumpMonth(+e.target.value, mid.getMonth())} className={selectCls}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <Chevron />
            </div>
            <div className="ml-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Week {isoWeek(anchor)}{isCurrent && <span className="ml-1.5 rounded-full bg-crimson-50 px-2 py-0.5 text-xs font-semibold text-crimson-700">This week</span>}</p>
              <p className="text-xs text-slate-500">{range}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
            <div className="inline-flex overflow-hidden rounded-xl border border-slate-200/50 bg-white shadow-sm">
              <button onClick={() => go(addDays(anchor, -7))} disabled={+anchor <= +minAnchor} aria-label="Previous week"
                className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                <Icon name="chevron" className="h-4 w-4 rotate-90" /><span className="hidden sm:inline">Previous week</span>
              </button>
              <button onClick={() => go(mondayOf(today))} disabled={isCurrent} className="border-x border-slate-200/50 px-3 py-2 text-sm font-semibold text-crimson-700 hover:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent">Today</button>
              <button onClick={() => go(addDays(anchor, 7))} disabled={+anchor >= +maxAnchor} aria-label="Next week"
                className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                <span className="hidden sm:inline">Next week</span><Icon name="chevron" className="h-4 w-4 -rotate-90" />
              </button>
            </div>
            <button onClick={onExport} className="u-btn inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200/50 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              <Icon name="download" className="h-4 w-4" /> Add to my calendar
            </button>
          </div>
        </div>

        {/* Week grid */}
        <div className="overflow-x-auto">
          <div key={+anchor} className="u-fade min-w-[860px]">
            <div className="grid border-b border-slate-200/50" style={{ gridTemplateColumns: cols }}>
              <div className="px-2 py-3 text-right text-xs font-medium text-slate-400">{weekHours ? `${weekHours % 1 ? weekHours.toFixed(1) : weekHours} h` : ""}</div>
              {days.map((d, i) => {
                const isToday = +d === +today;
                return (
                  <div key={i} className={`border-l border-slate-200/50 px-2 py-2.5 text-center ${i >= 5 ? "bg-slate-50" : ""}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${isToday ? "text-crimson-700" : "text-slate-400"}`}>{DAYS[i].slice(0, 3)}</p>
                    <p className={`mx-auto mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-base font-bold ${isToday ? "bg-slate-900 text-white" : d < today ? "text-slate-400" : "text-slate-900"}`}>{d.getDate()}</p>
                  </div>
                );
              })}
            </div>
            <div className="relative grid" style={{ gridTemplateColumns: cols, height: gridH, transition: "grid-template-columns .3s ease" }}>
              {/* Hour labels + lines */}
              <div className="relative">
                {hours.map((h, i) => (
                  <span key={h} className="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-slate-400" style={{ top: i * HOUR_PX }}>{i === 0 ? "" : hourLabel(h)}</span>
                ))}
              </div>
              {days.map((d, i) => {
                const isToday = +d === +today;
                return (
                  <div key={i} className={`relative border-l border-slate-200/50 ${i >= 5 ? "bg-slate-50" : ""} ${d < today ? "opacity-70" : ""}`}>
                    {hours.map((h, j) => <div key={h} className="absolute inset-x-0 border-t border-slate-100" style={{ top: j * HOUR_PX }} />)}
                    {dayItems[i].map((it) => {
                      const top = ((it.s - startH * 60) / 60) * HOUR_PX;
                      const height = Math.max(26, ((it.e - it.s) / 60) * HOUR_PX - 3);
                      const style = { top: top + 1, height, left: `calc(${(it.lane / it.lanes) * 100}% + 3px)`, width: `calc(${100 / it.lanes}% - 6px)` };
                      const tall = height > 70;
                      const narrow = it.lanes > 1;
                      if (it.kind === "review")
                        return (
                          <button key={it.key} onClick={() => onOpenReview(it.r)} title={`${it.r.title} · ${fmtRange(it.r.start, it.r.end)} · ${it.r.status === "approved" ? "approved, live" : "party under review"}`}
                            className={`absolute overflow-hidden rounded-lg border-2 border-dashed px-2 py-1 text-left hover:z-10 hover:shadow-md ${it.r.status === "approved" ? "border-emerald-400 bg-emerald-50" : "u-review border-amber-400 bg-amber-50"}`} style={style}>
                            <span className={`block truncate text-xs font-bold ${it.r.status === "approved" ? "text-emerald-700" : "text-amber-700"}`}>{it.r.status === "approved" ? "✓ Live · Hosting" : "Party Under Review"}</span>
                            <span className="block truncate text-xs font-semibold tabular-nums text-slate-500">{shortRange(it.r.start, it.r.end)}</span>
                            <span className="block truncate text-xs font-bold text-slate-900">{it.r.title}</span>
                            {tall && <span className="block truncate text-xs text-slate-500">{it.r.venueName}</span>}
                          </button>
                        );
                      return it.kind === "session" ? (
                        <button key={it.key} onClick={() => onOpenClub(it.x.club)} title={`${it.x.club.name} · ${it.x.slot.title} · ${fmtRange(it.x.slot.start, it.x.slot.end)}${it.x.pending ? " · pending approval" : ""}`}
                          className={`absolute overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left shadow-sm hover:z-10 hover:opacity-100 hover:shadow-md ${CAT_TINT[it.x.club.category]} ${it.x.pending ? "u-pending border-dashed opacity-60" : ""}`} style={style}>
                          {it.x.pending && <span className="block truncate text-xs font-bold text-amber-700">Pending</span>}
                          <span className="block truncate text-xs font-semibold tabular-nums text-slate-500">{shortRange(it.x.slot.start, it.x.slot.end)}</span>
                          <span className="block truncate text-xs font-bold text-slate-900">{it.x.club.emoji} {it.x.club.name}</span>
                          {tall && !narrow && <span className="block truncate text-xs text-slate-500">{it.x.slot.title}</span>}
                          {tall && <span className="mt-0.5 block truncate text-xs text-slate-400">{narrow ? it.x.slot.title : it.x.slot.where}</span>}
                        </button>
                      ) : (
                        <button key={it.key} onClick={() => onOpenTicket(it.b)} title={`${it.b.title} · ${it.b.time}`}
                          className="absolute overflow-hidden rounded-lg border border-dashed border-crimson-300 bg-crimson-50 px-2 py-1 text-left hover:z-10 hover:shadow-md" style={style}>
                          <span className="block truncate text-xs font-semibold text-crimson-700">{it.b.time} · Event</span>
                          <span className="block truncate text-xs font-bold text-slate-900">{it.b.emoji} {it.b.title}</span>
                          {tall && <span className="block truncate text-xs text-slate-500">{shortVenue(it.b.where)}</span>}
                        </button>
                      );
                    })}
                    {isToday && nowMin >= startH * 60 && nowMin <= endH * 60 && (
                      <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: ((nowMin - startH * 60) / 60) * HOUR_PX }}>
                        <div className="relative h-0.5 bg-rose-500"><span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" /></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/50 px-4 py-3 text-xs text-slate-500">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[["Sports", "bg-emerald-500"], ["Tech", "bg-sky-500"], ["Business", "bg-violet-500"], ["Arts", "bg-pink-500"]].map(([k, c]) => (
              <span key={k} className="inline-flex items-center gap-1.5"><span className={`h-3 w-1 rounded-full ${c}`} /> {k}</span>
            ))}
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed border-amber-400 bg-amber-50 opacity-70" /> Pending approval</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed border-crimson-400 bg-crimson-50" /> Ticketed event</span>
            {reviews.length > 0 && <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-dashed border-amber-400 bg-amber-50" /> Party under review</span>}
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3 bg-rose-500" /> Now</span>
          </div>
          <span className="sm:hidden">Swipe sideways to see the whole week →</span>
        </div>
      </section>

      {/* Party applications */}
      {reviews.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Your party applications</h3>
          <div className="space-y-2">
            {reviews.map((r) => {
              const d = new Date(r.date + "T00:00:00");
              return (
                <button key={r.ref} onClick={() => onOpenReview(r)} className="u-card flex w-full items-center gap-4 rounded-2xl border border-slate-200/50 bg-white p-3 text-left shadow-sm">
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

      {/* Upcoming events list */}
      {upcoming.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming events</h3>
          <div className="space-y-2">
            {upcoming.map((b) => {
              const d = new Date(b.date + "T00:00:00");
              return (
                <button key={b.id} onClick={() => onOpenTicket(b)} className="u-card flex w-full items-center gap-4 rounded-2xl border border-slate-200/50 bg-white p-3 text-left shadow-sm">
                  <span className="u-keep flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-900 text-white">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">{fmt(d, { month: "short" })}</span>
                    <span className="text-xl font-bold leading-none">{d.getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{b.title}</span>
                    <span className="block text-sm text-slate-500">{DAYS[weekdayIdx(d)]} · {b.time} · {shortVenue(b.where)}</span>
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Ticket</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/* My Schedule tab: a sign-in prompt, or the weekly calendar. */
export function MySchedulePage({ user, onSignIn, ...props }) {
  return !user ? (
    <div className="rounded-3xl border border-slate-200/50 bg-white px-6 py-14 text-center shadow-sm">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200/70"><Icon name="calendar" className="h-7 w-7" /></span>
      <h3 className="mt-4 text-lg font-bold">Your campus week, in one place</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Sign in, pick club sessions and book events. They show up here as a weekly calendar you can export.</p>
      <button onClick={onSignIn} className="u-btn mt-5 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Sign in</button>
    </div>
  ) : (
    <MySchedule {...props} />
  );
}
