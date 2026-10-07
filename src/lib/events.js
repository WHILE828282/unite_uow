import { fmtDate, fmtTime, to24 } from "./format.js";
import { UOWD_ADDRESS, UOWD_MAPS } from "../data/events.js";
import { OFFICIAL_ID, clubOf, officialRef } from "../data/official.js";
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
  kind: sub.kind === "trip" ? "trip" : "own", groupLink: sub.groupLink || "", endTime: sub.end || "",
  ...(sub.kind === "trip" ? { extName: sub.extName, seller: sub.seller, minGroup: sub.minGroup, collectUntil: sub.collectUntil } : {}),
});
/* An approved event from another student, loaded from the moderation database (no email exposed). */
export const eventImg = (ref, kind, key) => `/api/events?img=${ref}&kind=${kind}${key ? `&k=${key}` : ""}`;
export const campusToParty = (e) => ({
  ...submissionToParty({ ...e, email: "", cover: e.hasCover ? eventImg(e.ref, "cover") : null, logo: e.hasLogo ? eventImg(e.ref, "logo") : null }),
  host: "student", own: false, contact: { name: "Organizer", role: "Student host", whatsapp: e.whatsapp, telegram: e.telegram },
  taken: Number(e.taken) || 0,
});
/* Group trips collect payments until 23:59 Dubai time on `collectUntil`. */
export const collectEndsMs = (p) => {
  const [y, m, d] = String(p.collectUntil || "").split("-").map(Number);
  return y ? Date.UTC(y, m - 1, d, 23, 59) - 4 * 36e5 : 0;
};
export const tripClosed = (p, now = Date.now()) => p.kind === "trip" && !!p.collectUntil && now > collectEndsMs(p);
export const MOD_STATUSES = ["pending", "under_review", "approved", "rejected"];
export const partyMapsUrl = (p) => (p.mapsUrl ? englishMapsUrl(p.mapsUrl) : mapsLink(p.maps));

export const REVIEW_MS = 2 * 36e5; // admin safety review for student parties

export const PROCESSING_MS = 24 * 36e5; // Student Services turnaround for tryout forms

/* ---- Events feed: official UOWD and student events side by side ---- */
export const FEED_CATS = ["Social", "Career", "Tech", "Gaming", "Arts", "Music", "Sports", "Wellbeing", "Business"];
// Student event types map onto the feed's categories (official events already use them).
const CAT_MAP = { Party: "Social", Social: "Social", "Academic Study": "Career", Networking: "Career", Sports: "Sports", Gaming: "Gaming", Music: "Music", "Arts & Culture": "Arts" };
export const feedCat = (p) => (p.official ? p.category : CAT_MAP[p.category] || p.category);
// Icon for an official event's coloured header, by category.
export const CAT_ICON = { Social: "users", Career: "briefcase", Tech: "laptop", Gaming: "controller", Arts: "palette", Music: "music", Sports: "trophy", Wellbeing: "heart", Business: "chart" };
export const CAT_TINT = {
  Social: "linear-gradient(135deg, #f97316 0%, #be123c 100%)", Career: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
  Tech: "linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%)", Gaming: "linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)",
  Arts: "linear-gradient(135deg, #ec4899 0%, #9d174d 100%)", Music: "linear-gradient(135deg, #f43f5e 0%, #7f1d1d 100%)",
  Sports: "linear-gradient(135deg, #22c55e 0%, #166534 100%)", Wellbeing: "linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)",
  Business: "linear-gradient(135deg, #10b981 0%, #065f46 100%)",
};

// Dubai wall-clock time to a timestamp (UTC+4, no daylight saving).
const dubaiMs = (date, hhmm = "00:00") => { const [y, mo, d] = date.split("-").map(Number), [h, mi] = hhmm.split(":").map(Number); return Date.UTC(y, mo - 1, d, h || 0, mi || 0) - 4 * 36e5; };
export const eventStartMs = (p) => dubaiMs(p.date, p.allDay ? "00:00" : p.start || to24(p.time || ""));
// When an event is over: its end time; all-day events at the end of their (last) day; without an end time,
// 3 hours after the start ("till late" nights: 6 hours).
export const eventEndMs = (p) => {
  if (p.endDate || p.allDay) return dubaiMs(p.endDate || p.date, p.endTime || "23:59");
  const start = eventStartMs(p);
  if (p.endTime) { const end = dubaiMs(p.date, p.endTime); return end > start ? end : end + 864e5; }
  return start + (p.until ? 6 : 3) * 36e5;
};
export const isPastEvent = (p, now = Date.now()) => eventEndMs(p) <= now;
// "All day · until Sun, 11 Oct", "All day" or "4:30 – 6:30 PM".
const range = (a, b) => (a.slice(-2) === b.slice(-2) ? `${a.slice(0, -3)} – ${b}` : `${a} – ${b}`); // "4:30 – 6:30 PM"
export const whenLabel = (p) => p.allDay ? (p.endDate ? `All day · until ${fmtDate(p.endDate)}` : "All day")
  : p.endTime ? range(p.time, fmtTime(p.endTime)) : p.time;

/* An official UOWD event (from the database, or the bundled copy) as a feed event. RSVP is free. */
export const officialToParty = (o) => {
  const club = clubOf(o);
  const host = club ? club.name : o.host || "UOWD";
  const allDay = !o.start;
  return {
    id: OFFICIAL_ID(o.n), ref: officialRef(o.n), official: true, featured: !!o.featured, clubId: club ? club.id : null,
    title: o.title, emoji: club ? club.emoji : "🎓", category: o.category, lang: "English",
    date: o.date, endDate: o.endDate || "", allDay, start: o.start || "", endTime: o.end || "",
    time: allDay ? "All day" : fmtTime(o.start),
    where: o.where || (club && club.where) || "UOWD campus", address: UOWD_ADDRESS, maps: UOWD_MAPS,
    price: 0, spots: 1000, taken: Number(o.taken) || 0, wait: 0, vibe: null, host,
    contact: { name: host, role: "Official UOWD", email: (club && club.lead && club.lead.email) || "studentlife@uowdubai.ac.ae" },
    desc: o.desc || "", perks: [],
  };
};
