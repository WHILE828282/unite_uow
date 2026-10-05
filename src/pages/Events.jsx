import { useState } from "react";
import { FeaturedCard, PartyTile } from "../components/cards.jsx";
import { Icon } from "../components/ui.jsx";
import SearchField, { matches } from "../components/SearchField.jsx";
import { dubaiDay, isoDay, weekdayIdx } from "../lib/format.js";

// "This week" (to Sunday), "Next week", then "Later".
const sectionOf = (iso) => {
  const now = new Date(dubaiDay() + "T00:00:00"); // weeks follow the Dubai calendar
  const endThis = new Date(now); endThis.setDate(now.getDate() + (6 - weekdayIdx(now)));
  const endNext = new Date(endThis); endNext.setDate(endThis.getDate() + 7);
  return iso <= isoDay(endThis) ? "This week" : iso <= isoDay(endNext) ? "Next week" : "Later";
};

/* Events tab: search, language filter, the upcoming feed grouped by week, and the Host an event prompt. */
export function Events({ filteredParties, upcoming, feedLangs, filter, setFilter, langFilter, setLangFilter, hostEvent, cardOpen, setModal, shareEvent, partyBtn }) {
  const [q, setQ] = useState("");
  const list = filteredParties.filter((p) => matches(q, p.title, p.host, p.where, p.category, p.lang));
  const groups = [];
  list.forEach((p) => { const s = p.pinned ? "Featured" : sectionOf(p.date); const g = groups.find((x) => x.s === s); g ? g.items.push(p) : groups.push({ s, items: [p] }); });
  const clear = () => { setQ(""); setFilter("All"); setLangFilter("All"); };
  let n = 0;
  // Category chips: only the types that have upcoming events.
  const types = ["All", ...[...new Set(upcoming.map((p) => p.category))]];
  return (
    <>
      {/* Search with the Host button beside it, then one scrollable row of filters (language first, then types). */}
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1"><SearchField value={q} onChange={setQ} placeholder="Search events or places" /></div>
        <button onClick={hostEvent} aria-label="Host an event" title="Host an event"
          className="u-btn u-haptic flex h-12 shrink-0 items-center gap-1.5 rounded-2xl bg-crimson-600 px-4 text-sm font-semibold text-white hover:bg-crimson-500">
          <Icon name="plus" className="h-4 w-4" /><span>Host</span>
        </button>
      </div>
      <div className="u-chips -mx-4 mb-5 mt-3 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {feedLangs.length > 1 && (
          <label className="relative shrink-0">
            <span className="sr-only">Language</span>
            <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} aria-label="Filter by event language" style={{ minHeight: 38 }}
              className={`h-[38px] appearance-none rounded-full py-0 pl-4 pr-8 text-sm font-semibold leading-[38px] focus:outline-none ${langFilter !== "All" ? "u-keep bg-crimson-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
              {["All", ...feedLangs].map((l) => <option key={l} value={l}>{l === "All" ? "Any language" : l}</option>)}
            </select>
            <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${langFilter !== "All" ? "text-white" : "text-slate-400"}`}>▼</span>
          </label>
        )}
        {types.length > 2 && types.map((t) => (
          <button key={t} onClick={() => setFilter(t)} aria-pressed={filter === t}
            className={`u-btn shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${filter === t ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>{t}</button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="u-fade rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="search" className="h-6 w-6" /></span>
          <p className="mt-3 font-semibold text-slate-900">{q ? `Nothing matches “${q}”` : `No ${langFilter !== "All" ? langFilter + " " : ""}events yet`}</p>
          <p className="mt-1 text-sm text-slate-500">Try another search, or host one yourself.</p>
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={clear} className="u-btn rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Clear</button>
            <button onClick={hostEvent} className="u-btn rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Host an event</button>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.s}>
            {g.s === "Featured" ? (
              <div className="space-y-4">
                {g.items.map((p) => (
                  <FeaturedCard key={p.id} p={p} open={cardOpen(() => setModal({ type: "detail", id: p.id }))} onShare={() => shareEvent(p)}
                    onDetails={() => setModal({ type: "detail", id: p.id })}
                    action={partyBtn(p, "u-keep w-full sm:w-auto sm:px-8 !bg-white !text-slate-900 !ring-0 hover:!bg-slate-100", true)} />
                ))}
              </div>
            ) : (<>
            <h2 className="mb-3 flex items-baseline gap-2 text-sm font-semibold text-slate-900">{g.s}<span className="font-normal text-slate-400">{g.items.length}</span></h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {g.items.map((p) => (
                <PartyTile key={p.id} p={p} i={n++} open={cardOpen(() => setModal({ type: "detail", id: p.id }))}
                  action={partyBtn(p, "w-full !rounded-full !py-2", true, false, true)} />
              ))}
            </div>
            </>)}
          </section>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-center sm:flex-row sm:text-left">
        <div>
          <p className="font-semibold text-slate-900">Got an idea for an event?</p>
          <p className="text-sm text-slate-500">Submit it for review and sell tickets securely with Ziina.</p>
        </div>
        <button onClick={hostEvent} className="u-btn shrink-0 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Host an event</button>
      </div>
    </>
  );
}
