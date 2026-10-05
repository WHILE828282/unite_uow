import { useState } from "react";
import { FeaturedCard, PartyCard } from "../components/cards.jsx";
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
  return (
    <>
      <SearchField value={q} onChange={setQ} placeholder="Search events or places" />
      <div className="mb-5 mt-3 flex items-center justify-between gap-3 text-sm text-slate-500">
        <span className="hidden whitespace-nowrap min-[360px]:inline">{list.length} {list.length === 1 ? "event" : "events"}</span>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <label className="inline-flex items-center gap-2">
            <span className="sr-only">Language</span>
            <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} aria-label="Filter by event language"
              className="w-[9rem] shrink-0 rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm font-medium text-slate-700 focus:border-slate-400 focus:outline-none">
              {["All", ...feedLangs].map((l) => <option key={l} value={l}>{l === "All" ? "Language" : `${l} (${upcoming.filter((p) => p.lang === l).length})`}</option>)}
            </select>
          </label>
          <button onClick={hostEvent} className="u-btn shrink-0 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">+ Host</button>
        </div>
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
                    action={partyBtn(p, "u-keep flex-1 !bg-white !text-slate-900 !ring-0 hover:!bg-slate-100", true)} />
                ))}
              </div>
            ) : (<>
            <h2 className="mb-3 flex items-baseline gap-2 text-sm font-semibold text-slate-900">{g.s}<span className="font-normal text-slate-400">{g.items.length}</span></h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {g.items.map((p, k) => (
                <PartyCard key={p.id} p={p} i={n++} wide={g.items.length % 2 === 1 && k === g.items.length - 1} open={cardOpen(() => setModal({ type: "detail", id: p.id }))} onShare={() => shareEvent(p)}
                  actions={<>{partyBtn(p, "flex-1", true, true)}<button onClick={() => setModal({ type: "detail", id: p.id })} className="u-btn rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Details</button></>} />
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
