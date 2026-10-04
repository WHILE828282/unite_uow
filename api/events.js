/* Vercel serverless function: student-hosted events from the moderation database.
   GET /api/events                         -> approved events, visible to the whole campus
   GET /api/events?mine=REF.KEY,REF.KEY    -> status of your own applications (KEY is returned on submit)
   GET /api/events?img=REF&kind=cover|logo -> artwork of an approved event (or your own, with &k=KEY) */
import { isRef, getPitch, ownerOk, STATUSES, sweepTrips, isTrip, tripState } from "./_lib.js";
import { dbConfigured, getEventImage, listApprovedEvents, demoSeats } from "./_store.js";
import { sweepApps } from "./_apps.js";

// What everyone may see: no email, Student ID or account details.
const PUBLIC = ["ref", "taken", "title", "category", "lang", "date", "start", "end", "spots", "price", "venueName", "room", "mapsUrl", "whatsapp", "telegram", "dress", "reqs", "pitch", "at", "hasCover", "hasLogo",
  "kind", "extName", "seller", "minGroup", "collectUntil"];
const pick = (rec) => Object.fromEntries(PUBLIC.map((k) => [k, rec[k]]));

export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ ok: false }); }
  const q = req.query || {};
  if (!dbConfigured()) return res.status(200).json({ ok: true, store: false, events: [], mine: [] });

  try {
    if (q.img) {
      const ref = String(q.img), kind = q.kind === "logo" ? "logo" : "cover";
      if (!isRef(ref)) return res.status(404).end();
      const rec = await getPitch(ref);
      if (!rec || (rec.status !== "approved" && !ownerOk(ref, q.k))) return res.status(404).end();
      const raw = await getEventImage(ref, kind);
      const m = /^data:(image\/(?:webp|jpeg|png));base64,(.+)$/.exec(String(raw || ""));
      if (!m) return res.status(404).end();
      res.setHeader("Content-Type", m[1]);
      res.setHeader("Cache-Control", rec.status === "approved" ? "public, max-age=3600" : "private, max-age=300");
      return res.status(200).send(Buffer.from(m[2], "base64"));
    }

    if (q.mine) {
      const pairs = String(q.mine).split(",").slice(0, 30).map((x) => x.split(".")).filter(([ref, key]) => isRef(ref) && ownerOk(ref, key));
      const mine = await Promise.all(pairs.map(async ([ref]) => {
        const rec = await getPitch(ref);
        return rec && rec.status !== "deleted" ? { ref, status: STATUSES.includes(rec.status) ? rec.status : "pending", updatedAt: rec.updatedAt } : { ref, status: "missing" };
      }));
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ ok: true, store: true, mine });
    }

    await sweepTrips().catch((e) => console.error("Trip sweep failed:", e && e.message)); // group trip deadlines (at most every 2 min)
    await sweepApps().catch((e) => console.error("Application sweep failed:", e && e.message)); // 48-hour application reminders
    // Approved events, minus group trips that were cancelled at their payment deadline.
    const events = (await listApprovedEvents()).filter((r) => !(isTrip(r) && tripState(r) === "cancelled")).map(pick);
    res.setHeader("Cache-Control", "public, max-age=15");
    const seats = await demoSeats().catch(() => ({})); // tickets taken on Unite's built-in events
    return res.status(200).json({ ok: true, store: true, events, seats });
  } catch (e) {
    console.error("Events lookup failed:", e && e.message);
    return res.status(200).json({ ok: false, store: true, events: [], mine: [] });
  }
}
