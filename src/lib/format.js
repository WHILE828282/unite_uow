import { DAYS } from "../data/options.js";




export const fmtDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
// "Today" / "Tomorrow" for dates that close (isoDay is defined below; only called at render time).
export const dayTag = (iso) => {
  if (iso === dubaiDay()) return "Today";
  if (iso === dubaiDay(Date.now(), 1)) return "Tomorrow";
  return null;
};
// "ilyas.gasanov.2020@gmail.com" -> "Ilyas"
export const firstName = (email) => {
  const w = (email.split("@")[0].split(/[._+\-\d]+/).find(Boolean) || "there");
  return w.charAt(0).toUpperCase() + w.slice(1);
};

export const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
export const fmtTime = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
export const fmtRange = (a, b) => `${fmtTime(a)} – ${fmtTime(b)}`;
/* "7:00 PM" -> "19:00" */
export const to24 = (t) => { const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return "00:00"; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return `${String(h).padStart(2, "0")}:${m[2]}`; };
export const weekdayIdx = (d) => (d.getDay() + 6) % 7; // Monday = 0
// Today's date in Dubai (UTC+4, no daylight saving) as "YYYY-MM-DD", whatever the phone's own time zone.
export const dubaiDay = (ms = Date.now(), plusDays = 0) => new Date(ms + 4 * 3600e3 + plusDays * 864e5).toISOString().slice(0, 10);
export const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const clubDays = (c) => [...new Set(c.slots.map((s) => s.day))].sort().map((d) => DAYS[d].slice(0, 3)).join(" · ");
export const slotHours = (s) => (toMin(s.end) - toMin(s.start)) / 60;
export const nameInitials = (n) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
export const initials = (email) => (email || "??").slice(0, 2).toUpperCase();
export const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const makeId = (prefix, n = 6) =>
  prefix + "-" + Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
export const maskEmail = (e) => {
  const [l, d] = e.split("@");
  return l.slice(0, 2) + "•".repeat(Math.max(2, l.length - 2)) + "@" + d;
};

export const shortVenue = (where) => where.split(",")[0].replace(/^UOWD /, "");

export const fmtLeft = (ms) => { const m = Math.max(1, Math.ceil(ms / 6e4)); return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m` : `${m}m`; };
