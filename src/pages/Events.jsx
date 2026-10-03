import { PartyCard } from "../components/cards.jsx";
import { Icon } from "../components/ui.jsx";



/* Events tab: language filter, the upcoming feed and the Host an event prompt. */
export function Events({ filteredParties, upcoming, feedLangs, filter, setFilter, langFilter, setLangFilter, hostEvent, cardOpen, setModal, shareEvent, partyBtn }) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-500">
        <span className="whitespace-nowrap">{filteredParties.length} {filteredParties.length === 1 ? "event" : "events"}</span>
        <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-2">
          <span className="sr-only">Language</span>
          <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} aria-label="Filter by event language"
            className="max-w-[10.5rem] rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-slate-700 focus:border-slate-400 focus:outline-none">
            {["All", ...feedLangs].map((l) => <option key={l} value={l}>{l === "All" ? "All languages" : `${l} (${upcoming.filter((p) => p.lang === l).length})`}</option>)}
          </select>
        </label>
          <button onClick={hostEvent} className="u-btn shrink-0 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800">+ Host</button>
        </div>
      </div>
      <>

        {filteredParties.length === 0 && (
          <div className="u-fade rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="globe" className="h-6 w-6" /></span>
            <p className="mt-3 font-semibold text-slate-900">No {langFilter !== "All" ? langFilter + " " : ""}{filter !== "All" ? filter.toLowerCase() + " " : ""}events yet</p>
            <p className="mt-1 text-sm text-slate-500">Try another filter, or host one yourself.</p>
            <div className="mt-4 flex justify-center gap-2">
              <button onClick={() => { setFilter("All"); setLangFilter("All"); }} className="u-btn rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Clear filters</button>
              <button onClick={hostEvent} className="u-btn rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Host an event</button>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {filteredParties.map((p, i) => {
            const left = p.spots - p.taken;
            return (
              <PartyCard key={p.id} p={p} i={i} open={cardOpen(() => setModal({ type: "detail", id: p.id }))} onShare={() => shareEvent(p)}
                actions={<>{partyBtn(p, "flex-1", true)}<button onClick={() => setModal({ type: "detail", id: p.id })} className="u-btn rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Details</button></>} />
            );
          })}
        </div>
        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-semibold text-indigo-950">Got an idea for an event?</p>
            <p className="text-sm text-indigo-800">Submit it for review and sell tickets securely with Ziina.</p>
          </div>
          <button onClick={hostEvent} className="u-btn shrink-0 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Host an event</button>
        </div>
      </>
    </>
  );
}
