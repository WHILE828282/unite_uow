/* Client for /api/tickets (Unite tickets for student-hosted events). Every call resolves to the JSON reply;
   network problems resolve to { ok: false, error } so callers never need try/catch. */
const call = async (url, body) => {
  try {
    const r = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" } : { cache: "no-store" });
    return await r.json().catch(() => ({ ok: false, unreachable: true, error: "Unexpected reply from the server." }));
  } catch (e) { return { ok: false, offline: true, error: "You're offline. Try again when you're connected." }; }
};
export const issueTicket = (b, ref) => call("/api/tickets", { a: "issue", ref, id: b.id, name: b.name, email: b.email, studentId: b.studentId, method: b.method });
export const myTickets = (list) => call(`/api/tickets?a=mine&t=${encodeURIComponent(list.map((b) => `${b.ref}.${b.id}.${b.key}`).join(","))}`);
export const hostList = (ref, k) => call(`/api/tickets?a=list&ref=${ref}&k=${encodeURIComponent(k)}`);
export const checkIn = (ref, k, x) => call("/api/tickets", { a: "checkin", ref, k, ...x });
export const deliverTicket = (ref, k, id, x) => call("/api/tickets", { a: "deliver", ref, k, id, ...x });
export const ticketLink = (x) => call("/api/tickets", { a: "link", ...x });
// Opens a private ticket file through a short-lived signed link. The tab is opened first (popup blockers).
export const openTicketFile = async (x) => {
  const w = window.open("", "_blank");
  const d = await ticketLink(x);
  if (d.ok && d.url) { if (w) w.location.href = d.url; else window.location.href = d.url; return true; }
  if (w) w.close();
  return d.error || "Couldn't open the ticket.";
};
