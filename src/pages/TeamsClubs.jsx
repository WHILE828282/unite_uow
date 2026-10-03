import { ClubCard } from "../components/cards.jsx";

/* Clubs tab: every UOWD team and club, teams first. */
export function TeamsClubs({ filteredClubs, memberCount, cardOpen, setModal, clubBtn }) {
  const list = filteredClubs;
  const groups = [["Teams", list.filter((c) => c.category === "Sports")], ["Clubs", list.filter((c) => c.category !== "Sports")]].filter(([, xs]) => xs.length);
  let n = 0;
  return (
    <>
      <div className="space-y-8">
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
