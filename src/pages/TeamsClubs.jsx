import { useState } from "react";
import { ClubCard } from "../components/cards.jsx";
import SearchField, { matches } from "../components/SearchField.jsx";

/* Clubs tab: every UOWD team and club, teams first, with search. */
export function TeamsClubs({ filteredClubs, memberCount, cardOpen, setModal, clubBtn }) {
  const [q, setQ] = useState("");
  const list = filteredClubs.filter((c) => matches(q, c.name, c.category, c.desc, c.where));
  const groups = [["Teams", list.filter((c) => c.category === "Sports")], ["Clubs", list.filter((c) => c.category !== "Sports")]].filter(([, xs]) => xs.length);
  let n = 0;
  return (
    <>
      <SearchField value={q} onChange={setQ} placeholder="Search teams and clubs" />
      {list.length === 0 && <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">Nothing matches “{q}”.</p>}
      <div className="mt-5 space-y-8">
        {groups.map(([title, xs]) => (
          <section key={title}>
            <h2 className="mb-3 flex items-baseline gap-2 text-sm font-semibold text-slate-900">{title}<span className="font-normal text-slate-400">{xs.length}</span></h2>
            <div className="grid gap-4 md:grid-cols-2">
              {xs.map((c) => (
                <ClubCard key={c.id} c={c} i={n++} members={memberCount(c)}
                  open={cardOpen(() => setModal({ type: "club", id: c.id }))}
                  button={(onPhoto) => clubBtn(c, "shrink-0 px-4 py-2", onPhoto)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
