import { DAYS } from "../data/options.js";
import { toMin, weekdayIdx } from "./format.js";



export const overlaps = (a, b) => a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);


export const CAT_TINT = {
  Sports: "border-emerald-500 bg-emerald-50", Tech: "border-sky-500 bg-sky-50", Business: "border-violet-500 bg-violet-50",
  Arts: "border-pink-500 bg-pink-50", Culture: "border-amber-500 bg-amber-50",
};
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const HOUR_PX = 56;
export const mondayOf = (d) => { const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - weekdayIdx(m)); return m; };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const isoWeek = (d) => { const t = addDays(mondayOf(d), 3); const jan4 = new Date(t.getFullYear(), 0, 4); return 1 + Math.round((t - mondayOf(jan4)) / 6048e5); };
export const shortTime = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""}`; };
export const shortRange = (a, b) => `${shortTime(a)}–${shortTime(b)} ${+b.split(":")[0] < 12 ? "AM" : "PM"}`;
/* "Mondays & Wednesdays · 5–7 PM", or per session when the times differ. */
export const scheduleLabel = (c, short = false) => {
  const same = c.slots.every((x) => x.start === c.slots[0].start && x.end === c.slots[0].end);
  const day = (d) => (short ? DAYS[d].slice(0, 3) : DAYS[d] + "s");
  return same
    ? `${c.slots.map((x) => day(x.day)).join(" & ")} · ${shortRange(c.slots[0].start, c.slots[0].end)}`
    : c.slots.map((x) => `${DAYS[x.day].slice(0, 3)} ${shortRange(x.start, x.end)}`).join(" & ");
};
export const hourLabel = (h) => `${((h + 11) % 12) + 1} ${h < 12 || h === 24 ? "AM" : "PM"}`;

/* Side-by-side lanes for overlapping blocks within one day. */
export function layoutDay(items) {
  const sorted = [...items].sort((a, b) => a.s - b.s || b.e - a.e);
  const lanes = [];
  sorted.forEach((it) => {
    let l = lanes.findIndex((end) => end <= it.s);
    if (l < 0) { l = lanes.length; lanes.push(0); }
    lanes[l] = it.e; it.lane = l;
  });
  sorted.forEach((it) => { it.lanes = Math.max(...sorted.filter((o) => o.s < it.e && it.s < o.e).map((o) => o.lane)) + 1; });
  return sorted;
}
