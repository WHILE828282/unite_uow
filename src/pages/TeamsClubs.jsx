import { useState } from "react";
import { ClubCard } from "../components/cards.jsx";
import { CLUB_ROOMS } from "../data/clubs.js";

/* Clubs tab: one switcher on top (Teams + the three club rooms), so every section is one tap away
   instead of the clubs sitting below all the team cards. The choice is remembered for the visit. */
// Clubs first, teams last.
const SECTIONS = [
  ...CLUB_ROOMS.map((r) => ({ ...r, ...{
    Tech: { emoji: "💻", blurb: "Code, compete and create: tech, e-sports, cars and content." },
    Business: { emoji: "📈", blurb: "Startups, markets, marketing, leadership and HR. Applications go straight to the committee." },
    Arts: { emoji: "🎨", blurb: "Music, dance, photography, art, anime, culture, writing and the student magazine." },
  }[r.k] })),
  { k: "Sports", label: "Sports Teams", emoji: "🏆", blurb: "Official UOWD squads: tryouts, weekly training and inter-university fixtures." },
];

export function TeamsClubs({ filteredClubs, memberCount, cardOpen, setModal, clubBtn }) {
  const [sec, setSec] = useState(() => { try { return sessionStorage.getItem("unite-section") || "Tech"; } catch (e) { return "Tech"; } });
  const pick = (k) => { setSec(k); try { sessionStorage.setItem("unite-section", k); } catch (e) { /* ignore */ } };
  const sections = SECTIONS.map((s) => ({ ...s, clubs: filteredClubs.filter((c) => c.category === s.k) })).filter((s) => s.clubs.length);
  const active = sections.find((s) => s.k === sec) || sections[0];
  if (!active) return null;
  return (
    <div>
      <div role="tablist" aria-label="Teams and club rooms" className="u-chips -mx-4 flex gap-2 px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:[-webkit-mask-image:none] sm:[mask-image:none]">
        {sections.map((s) => {
          const on = s.k === active.k;
          return (
            <button key={s.k} role="tab" aria-selected={on} onClick={() => pick(s.k)}
              className={`u-btn flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border px-3.5 py-2.5 text-left text-sm font-semibold ${on ? "u-keep border-crimson-700 bg-crimson-700 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"}`}>
              <span aria-hidden="true">{s.emoji}</span>
              <span>{s.label}</span>
              <span className={`ml-auto rounded-full px-1.5 text-xs tabular-nums ${on ? "bg-white/15 text-white/80" : "bg-slate-100 text-slate-500"}`}>{s.clubs.length}</span>
            </button>
          );
        })}
      </div>
      <p className="mb-4 mt-3 text-sm text-slate-500">{active.blurb}</p>
      <div key={active.k} className="u-fade grid grid-cols-1 gap-4 md:grid-cols-2">
        {active.clubs.map((c, i) => (
          <ClubCard key={c.id} c={c} i={i} members={memberCount(c)}
            open={cardOpen(() => setModal({ type: "club", id: c.id }))}
            button={(onPhoto) => clubBtn(c, "shrink-0 px-4 py-2.5", onPhoto)} />
        ))}
      </div>
    </div>
  );
}
