import { fmtDate, to24, toMin, weekdayIdx } from "./format.js";
import { qrMatrix } from "./qr.js";



// Preloaded so the downloadable ticket can draw the icon synchronously.
export const TICKET_ICON = typeof Image !== "undefined" ? Object.assign(new Image(), { src: "/icons/icon-192.png" }) : null;

/* Renders the ticket as a PNG and triggers a browser download. */
export function downloadTicket(b) {
  const W = 720, H = 1120;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const font = (w, px) => { g.font = `${w} ${px}px system-ui, -apple-system, "Segoe UI", sans-serif`; };
  const clip = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
  g.fillStyle = "#f1f5f9"; g.fillRect(0, 0, W, H);
  const grad = g.createLinearGradient(0, 0, W, 320);
  grad.addColorStop(0, "#4f46e5"); grad.addColorStop(1, "#7c3aed");
  g.fillStyle = grad; g.fillRect(0, 0, W, 300);
  if (TICKET_ICON && TICKET_ICON.complete && TICKET_ICON.naturalWidth) {
    g.save(); rr(48, 46, 60, 60, 13); g.clip(); g.drawImage(TICKET_ICON, 48, 46, 60, 60); g.restore();
    g.fillStyle = "#fff"; font(800, 46); g.fillText("unite", 124, 92);
  } else { g.fillStyle = "#fff"; font(800, 46); g.fillText("unite", 48, 92); }
  font(500, 22); g.fillStyle = "#c7d2fe"; g.fillText("uniteuow.com · UOWD", 48, 126);
  g.fillStyle = "#fff"; font(700, 40); g.fillText(clip(b.title, 26), 48, 206);
  font(500, 26); g.fillStyle = "#e0e7ff"; g.fillText(`${fmtDate(b.date)} · ${b.time}`, 48, 250);
  g.fillStyle = "#fff"; rr(36, 320, W - 72, 740, 36); g.fill();
  const m = qrMatrix(b.qr || b.id), S = Math.floor(294 / m.length), qx = (W - m.length * S) / 2, qy = 360;
  g.fillStyle = "#0f172a";
  m.forEach((row, y) => row.forEach((d, x) => { if (d) g.fillRect(qx + x * S, qy + y * S, S, S); }));
  g.textAlign = "center";
  font(600, 20); g.fillStyle = "#64748b"; g.fillText("BOOKING ID", W / 2, 700);
  font(800, 44); g.fillStyle = "#0f172a"; g.fillText(b.id, W / 2, 752);
  g.textAlign = "left";
  const rows = [["Venue", clip(b.where, 30)], ["Attendee", clip(b.name || b.email, 30)], ["Amount", b.paid ? `${b.price} AED` : "Free"],
    b.studentId ? ["Student ID", clip(b.studentId, 30)] : ["Status", "Confirmed"]];
  rows.forEach(([k, v], i) => { const y = 820 + i * 56; font(500, 24); g.fillStyle = "#64748b"; g.fillText(k, 80, y); g.textAlign = "right"; font(600, 26); g.fillStyle = "#0f172a"; g.fillText(v, W - 80, y); g.textAlign = "left"; });
  g.textAlign = "center"; font(500, 20); g.fillStyle = "#94a3b8"; g.fillText("Scan this code at the entrance", W / 2, 1040);
  c.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${b.id}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, "image/png");
}

/* Builds an .ics file: weekly club sessions (12 weeks) plus booked one-off events. */
export function downloadCalendar(sessions, events, file = "unite-schedule.ics") {
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = (d, hhmm) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${hhmm.replace(":", "")}00`;
  const esc = (t) => String(t).replace(/[,;\\]/g, (m) => "\\" + m);
  const now = new Date();
  const out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Unite//UOWD//EN", "CALSCALE:GREGORIAN"];
  const ev = (uid, start, end, title, where, rrule) => {
    out.push("BEGIN:VEVENT", `UID:${uid}@uniteuow.com`, `DTSTAMP:${stamp(now, "00:00")}`, `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${esc(title)}`, `LOCATION:${esc(where)}`);
    if (rrule) out.push(rrule);
    out.push("END:VEVENT");
  };
  sessions.forEach(({ club, slot, pending }) => {
    const d = new Date(now); d.setDate(d.getDate() + ((slot.day - weekdayIdx(d) + 7) % 7));
    ev(slot.id, stamp(d, slot.start), stamp(d, slot.end), `${club.name}: ${slot.title}${pending ? " (pending approval)" : ""}`, slot.where, "RRULE:FREQ=WEEKLY;COUNT=12");
  });
  events.forEach((b) => {
    const all = b.time === "All day", d = new Date(b.date + "T00:00:00"), st = all ? "09:00" : to24(b.time);
    const endMin = all ? 17 * 60 : b.endTime && toMin(b.endTime) > toMin(st) ? toMin(b.endTime) : toMin(st) + 120, et = `${pad(Math.min(23, Math.floor(endMin / 60)))}:${pad(endMin % 60)}`;
    ev(b.id, stamp(d, st), stamp(d, et), b.title, b.where);
  });
  out.push("END:VCALENDAR");
  const url = URL.createObjectURL(new Blob([out.join("\r\n")], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url; a.download = file;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
