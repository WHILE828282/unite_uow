/* Vercel serverless function: Unite tickets for student-hosted events.
   Students (holder key returned on purchase):
     POST { a: "issue", ref, id, name, email, studentId, method, price } -> { code, key }  (code goes in the QR)
     GET  ?a=mine&t=REF.ID.KEY,…                                            -> status of your tickets
     POST { a: "link", id, key }                                         -> short-lived link to your delivered ticket file
   Hosts (owner key from /api/pitch):
     GET  ?a=list&ref=REF&k=KEY                                          -> attendees, check-ins, deliveries, money
     POST { a: "checkin", ref, k, code } or { a: "checkin", ref, k, id } -> ok | used | invalid
     POST { a: "deliver", ref, k, id, mode: "file", file, name } or { mode: "external", note }
     POST { a: "link", ref, k, id }                                      -> short-lived link to that person's file
   Files: GET ?a=file&t=ID&exp=…&s=… (signed, expires after 5 minutes). Payments are demo only. */
import {
  isRef, getPitch, ownerOk, isTicketId, ticketCode, holderKey, holderOk, parseTicketCode,
  fileLink, fileLinkOk, isTrip, tripState, startMs, collectMs, getTickets, saveTicket, sweepTrip,
} from "./_lib.js";
import { dbConfigured, getTicket, countTickets, insertTicket, saveDeliveryFile, getDeliveryFile } from "./_store.js";

const str = (v, max) => String(v == null ? "" : v).trim().slice(0, max);
const FILE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_FILE_CHARS = 3_500_000; // ~2.5 MB file as base64
const DELIVER_LEAD_MS = 24 * 36e5; // tickets must be delivered 24 h before the event

// What a ticket holder sees about their own ticket.
// An event the moderators took down (rejected or deleted after approval): its tickets are void.
const eventOff = (rec) => !!rec && (rec.status === "deleted" || rec.status === "rejected");
const holderView = (t, rec) => ({
  id: t.id, ref: t.ref, checkedIn: !!t.checkedIn, refunded: !!t.refunded,
  kind: rec ? rec.kind || "own" : "own",
  state: !rec ? "missing" : eventOff(rec) || t.refunded || (isTrip(rec) && tripState(rec) === "cancelled") ? "cancelled"
    : !isTrip(rec) ? "valid" : t.delivery ? "ready" : tripState(rec) === "confirmed" ? "preparing" : "waiting",
  delivery: t.delivery ? { mode: t.delivery.mode, note: t.delivery.note || "", at: t.delivery.at, hasFile: t.delivery.mode === "file" } : null,
  // The host's guest group chat: only for a live ticket.
  groupLink: rec && rec.groupLink && !t.refunded && !eventOff(rec) && !(isTrip(rec) && tripState(rec) === "cancelled") ? rec.groupLink : "",
});
// What the host sees about each attendee.
const hostView = (t) => ({
  id: t.id, name: t.name, email: t.email, studentId: t.studentId, price: t.price, method: t.method, at: t.at,
  checkedIn: t.checkedIn || null, refunded: !!t.refunded,
  delivery: t.delivery ? { mode: t.delivery.mode, note: t.delivery.note || "", at: t.delivery.at, fileName: t.delivery.fileName || "" } : null,
});

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST"].includes(req.method)) { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ ok: false }); }
  if (!dbConfigured()) return res.status(200).json({ ok: false, store: false, error: "The Unite database isn't connected yet." });
  let b = req.method === "POST" ? req.body : req.query || {};
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const a = String(b.a || "");
  const fail = (error, status = 400) => res.status(status).json({ ok: false, store: true, error });

  try {
    /* ---- Private file behind a short-lived signed link ---- */
    if (a === "file" && req.method === "GET") {
      const id = String(b.t || "");
      if (!isTicketId(id) || !fileLinkOk(id, b.exp, b.s)) return res.status(403).send("This link has expired. Open the ticket again in Unite.");
      const file = await getDeliveryFile(id);
      if (!file) return res.status(404).send("Ticket file not found.");
      const { type, name } = file;
      res.setHeader("Content-Type", type);
      res.setHeader("Content-Disposition", `inline; filename="${String(name).replace(/[^\w.\- ]+/g, "_") || "ticket"}"`);
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Robots-Tag", "noindex");
      return res.status(200).send(Buffer.from(file.data, "base64"));
    }

    /* ---- Ticket holder: status of my tickets ---- */
    if (a === "mine" && req.method === "GET") {
      const triples = String(b.t || "").split(",").slice(0, 40).map((x) => x.split(".")).filter(([ref, id, key]) => isRef(ref) && isTicketId(id) && holderOk(id, key));
      const tickets = [];
      for (const [ref, id] of triples) {
        const t = await getTicket(ref, id);
        if (t) tickets.push(holderView(t, await getPitch(ref)));
      }
      return res.status(200).json({ ok: true, store: true, tickets });
    }

    /* ---- Student: issue a ticket after (demo) payment or a free reservation ---- */
    if (a === "issue" && req.method === "POST") {
      const ref = String(b.ref || ""), id = String(b.id || "");
      if (!isRef(ref) || !isTicketId(id)) return fail("Invalid ticket.");
      const rec = await getPitch(ref);
      if (!rec || rec.status !== "approved") return fail("This event isn't available any more.");
      if (Date.now() > startMs(rec)) return fail("This event has already started.");
      if (isTrip(rec) && (tripState(rec) !== "collecting" || Date.now() > collectMs(rec))) return fail("Payments for this group trip are closed.");
      const count = await countTickets(ref);
      if (count >= rec.spots) return fail("Sold out.");
      const t = {
        id, ref, at: Date.now(), name: str(b.name, 80), email: str(b.email, 120), studentId: str(b.studentId, 20),
        method: str(b.method, 60), price: Number(rec.price) || 0, checkedIn: null, delivery: null, refunded: false,
      };
      if (!(await insertTicket(t, ticketCode(id)))) return fail("That ticket already exists.");
      return res.status(200).json({ ok: true, store: true, code: ticketCode(id), key: holderKey(id), ticket: holderView(t, rec) });
    }

    /* ---- Signed link to a delivered file: the ticket holder or the host ---- */
    if (a === "link" && req.method === "POST") {
      const id = String(b.id || ""), ref = String(b.ref || "");
      if (!isTicketId(id) || !isRef(ref)) return fail("Invalid ticket.");
      if (!(holderOk(id, b.key) || ownerOk(ref, b.k))) return fail("Not allowed.", 403);
      const t = await getTicket(ref, id);
      if (!t || !t.delivery || t.delivery.mode !== "file") return fail("No file was uploaded for this ticket.", 404);
      return res.status(200).json({ ok: true, store: true, url: fileLink(id) });
    }

    /* ---- Host actions (owner key) ---- */
    const ref = String(b.ref || "");
    if (!isRef(ref) || !ownerOk(ref, b.k)) return fail("Not allowed.", 403);
    const rec = await getPitch(ref);
    if (!rec) return fail("This event wasn't found.", 404);

    if (a === "list" && req.method === "GET") {
      if (isTrip(rec)) await sweepTrip(ref).catch(() => {}); // payment deadline, reminders, admin flag
      const fresh = (await getPitch(ref)) || rec;
      const tix = await getTickets(ref), live = tix.filter((t) => !t.refunded);
      return res.status(200).json({
        ok: true, store: true,
        event: {
          ref, kind: fresh.kind || "own", tripState: isTrip(fresh) ? tripState(fresh) : null, minGroup: fresh.minGroup || 0,
          collectUntil: fresh.collectUntil || "", startsAt: startMs(fresh), collectEnds: isTrip(fresh) ? collectMs(fresh) : null,
          deliverBy: startMs(fresh) - DELIVER_LEAD_MS, status: fresh.status,
        },
        stats: {
          sold: live.length, checkedIn: live.filter((t) => t.checkedIn).length, delivered: live.filter((t) => t.delivery).length,
          collected: live.reduce((s, t) => s + (Number(t.price) || 0), 0), refunded: tix.length - live.length,
        },
        attendees: tix.map(hostView),
      });
    }

    if (a === "checkin" && req.method === "POST") {
      if (isTrip(rec)) return fail("Group trips use the official tickets you deliver, not Unite check-in.");
      const id = b.code ? parseTicketCode(b.code) : isTicketId(b.id) ? String(b.id) : null;
      if (!id) return res.status(200).json({ ok: true, result: "invalid", reason: "Not a Unite ticket." });
      const t = await getTicket(ref, id);
      if (!t) return res.status(200).json({ ok: true, result: "invalid", reason: "This ticket is for a different event." });
      if (t.refunded) return res.status(200).json({ ok: true, result: "invalid", reason: "This ticket was refunded.", attendee: hostView(t) });
      if (eventOff(rec)) return res.status(200).json({ ok: true, result: "invalid", reason: "This event was cancelled.", attendee: hostView(t) });
      if (t.checkedIn) return res.status(200).json({ ok: true, result: "used", attendee: hostView(t) });
      const next = { ...t, checkedIn: Date.now() };
      await saveTicket(next);
      return res.status(200).json({ ok: true, result: "ok", attendee: hostView(next) });
    }

    if (a === "deliver" && req.method === "POST") {
      if (!isTrip(rec)) return fail("Only group trips deliver external tickets.");
      if (tripState(rec) === "collecting" && Date.now() >= collectMs(rec)) { await sweepTrip(ref).catch(() => {}); Object.assign(rec, (await getPitch(ref)) || {}); }
      if (tripState(rec) !== "confirmed") return fail(tripState(rec) === "cancelled" ? "This trip was cancelled." : "You can deliver tickets once payments close and the group is confirmed.");
      const id = String(b.id || "");
      const t = isTicketId(id) && (await getTicket(ref, id));
      if (!t) return fail("That attendee wasn't found.", 404);
      if (t.refunded) return fail("This purchase was refunded.");
      let delivery;
      if (b.mode === "file") {
        const m = /^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.file || ""));
        if (!m || !FILE_TYPES.includes(m[1])) return fail("Upload a PDF or an image (JPG, PNG, WebP).");
        if (m[2].length > MAX_FILE_CHARS) return fail("That file is too large (max 2.5 MB).");
        delivery = { mode: "file", at: Date.now(), fileName: str(b.name, 100), note: str(b.note, 300), file: { type: m[1], name: str(b.name, 100) || "ticket", data: m[2] } };
      } else if (b.mode === "external") {
        delivery = { mode: "external", at: Date.now(), note: str(b.note, 300) };
      } else return fail("Choose how the ticket was delivered.");
      const { file, ...meta } = delivery;
      const next = { ...t, delivery: meta };
      await saveTicket(next);
      if (file) await saveDeliveryFile(id, file);
      return res.status(200).json({ ok: true, store: true, attendee: hostView(next) });
    }

    return fail("Unknown action.");
  } catch (e) {
    console.error("Tickets API failed:", e && e.message);
    return res.status(500).json({ ok: false, store: true, error: "Something went wrong. Please try again." });
  }
}
