import { useState } from "react";
import { ClubCard } from "../components/cards.jsx";
import { CLUB_ROOMS } from "../data/clubs.js";

/* Clubs tab: every UOWD team, then the clubs in three rooms (Tech & E-sports, Finance & Growth, Music & Arts). */
export function TeamsClubs({ filteredClubs, memberCount, cardOpen, setModal, clubBtn }) {
  const list = filteredClubs;
  const [room, setRoom] = useState(() => { try { return sessionStorage.getItem("unite-room") || "Tech"; } catch (e) { return "Tech"; } });
  const pick = (k) => { setRoom(k); try { sessionStorage.setItem("unite-room", k); } catch (e) { /* ignore */ } };
  const teams = list.filter((c) => c.category === "Sports");
  const rooms = CLUB_ROOMS.map((r) => ({ ...r, clubs: list.filter((c) => c.category === r.k) })).filter((r) => r.clubs.length);
  const active = rooms.find((r) => r.k === room) || rooms[0];
  let n = 0;
  const grid = (xs) => (
    <div className="grid gap-4 md:grid-cols-2">
      {xs.map((c) => (
        <ClubCard key={c.id} c={c} i={n++} members={memberCount(c)}
          open={cardOpen(() => setModal({ type: "club", id: c.id }))}
          button={(onPhoto) => clubBtn(c, "shrink-0 px-4 py-2", onPhoto)} />
      ))}
    </div>
  );
  return (
    <div className="space-y-8">
      {teams.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-baseline gap-2 text-sm font-semibold text-slate-900">Teams<span className="font-normal text-slate-400">{teams.length}</span></h2>
          {grid(teams)}
        </section>
      )}
      {active && (
        <section>
          <h2 className="mb-3 flex items-baseline gap-2 text-sm font-semibold text-slate-900">Clubs<span className="font-normal text-slate-400">{rooms.reduce((s, r) => s + r.clubs.length, 0)}</span></h2>
          <div role="tablist" aria-label="Club rooms" className="mb-4 grid grid-cols-3 gap-1 rounded-2xl border border-slate-800/50 bg-white p-1">
            {rooms.map((r) => (
              <button key={r.k} role="tab" aria-selected={r.k === active.k} onClick={() => pick(r.k)}
                className={`rounded-xl border px-2 py-2 text-xs font-semibold leading-tight transition-colors sm:text-sm ${r.k === active.k ? "border-slate-800/50 bg-slate-900 text-white" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                {r.label} <span className={r.k === active.k ? "text-white/60" : "text-slate-400"}>{r.clubs.length}</span>
              </button>
            ))}
          </div>
          <div key={active.k} className="u-fade">{grid(active.clubs)}</div>
        </section>
      )}
    </div>
  );
}
