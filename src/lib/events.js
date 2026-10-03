import { fmtTime } from "./format.js";
import { englishMapsUrl, mapsLink } from "./maps.js";



export const TYPE_EMOJI = { Party: "🎉", Social: "🥂", "Academic Study": "📚", Networking: "🤝", Sports: "🏅", Gaming: "🎮", Music: "🎶", "Arts & Culture": "🎨" };
/* An approved application becomes a regular feed event, with the organizer's contacts and map link. */
export const submissionToParty = (sub) => ({
  id: sub.at, lang: sub.lang, title: sub.title, emoji: TYPE_EMOJI[sub.category] || "🎉", category: sub.category,
  date: sub.date, time: fmtTime(sub.start), where: sub.room ? `${sub.venueName}, ${sub.room}` : sub.venueName,
  address: sub.venueName, maps: sub.venueName, mapsUrl: sub.mapsUrl, price: sub.price, spots: sub.spots, taken: 0, wait: 0, vibe: null,
  host: "you", own: true, dyn: true, ref: sub.ref, cover: sub.cover, logo: sub.logo,
  contact: { name: "You", role: "Organizer", email: sub.email, whatsapp: sub.whatsapp, telegram: sub.telegram },
  desc: sub.pitch || `A student-hosted ${sub.category.toLowerCase()} at ${sub.venueName}.`,
  perks: [sub.dress && `Dress code: ${sub.dress}`, sub.reqs && `Bring: ${sub.reqs}`].filter(Boolean),
});
/* An approved event from another student, loaded from the moderation database (no email exposed). */
export const eventImg = (ref, kind, key) => `/api/events?img=${ref}&kind=${kind}${key ? `&k=${key}` : ""}`;
export const campusToParty = (e) => ({
  ...submissionToParty({ ...e, email: "", cover: e.hasCover ? eventImg(e.ref, "cover") : null, logo: e.hasLogo ? eventImg(e.ref, "logo") : null }),
  host: "student", own: false, contact: { name: "Organizer", role: "Student host", whatsapp: e.whatsapp, telegram: e.telegram },
});
export const MOD_STATUSES = ["pending", "under_review", "approved", "rejected"];
export const partyMapsUrl = (p) => (p.mapsUrl ? englishMapsUrl(p.mapsUrl) : mapsLink(p.maps));

export const REVIEW_MS = 2 * 36e5; // admin safety review for student parties

export const PROCESSING_MS = 24 * 36e5; // Student Services turnaround for tryout forms
