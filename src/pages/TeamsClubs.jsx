import { ClubCard } from "../components/cards.jsx";



/* Official Clubs tab: every UOWD team and club. */
export function TeamsClubs({ filteredClubs, memberCount, cardOpen, setModal, clubBtn }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {filteredClubs.map((c, i) => (
          <ClubCard key={c.id} c={c} i={i} members={memberCount(c)}
            open={cardOpen(() => setModal({ type: "club", id: c.id }))}
            button={(onPhoto) => clubBtn(c, "shrink-0 px-4 py-2", onPhoto)} />
        ))}
      </div>
    </>
  );
}
