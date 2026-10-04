import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal.jsx";
import { Check, Icon } from "../ui.jsx";
import { checkIn, deliverTicket, openTicketFile } from "../../lib/tickets.js";
import { fmtDate, fmtTime } from "../../lib/format.js";

/* Host tools for a live event: money, attendees, check-in (own events) and ticket delivery (group trips). */
export const aed = (n) => `${Math.round(Number(n) || 0).toLocaleString("en-US")} AED`;
const clock = (ms) => new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const dubaiWhen = (ms) => new Date(ms).toLocaleString("en-GB", { timeZone: "Asia/Dubai", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const payoutText = (sub, d) => `Collected: ${aed(d ? d.stats.collected : 0)} · Paid out to you after ${sub.kind === "trip" ? "all tickets are delivered" : "the event"}`;

export function DeliveryBar({ d }) {
  const total = d.stats.sold, done = d.stats.delivered, pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-800">{done} of {total} tickets delivered</span>
        <span className="text-slate-500">by {dubaiWhen(d.event.deliverBy)}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${done === total && total ? "bg-emerald-500" : "bg-crimson-600"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export const tripStateLabel = (d) => (!d || !d.event.tripState ? null
  : d.event.tripState === "cancelled" ? "Cancelled · everyone refunded"
  : d.event.tripState === "confirmed" ? "Group confirmed · deliver tickets"
  : `Collecting payments until ${dubaiWhen(d.event.collectEnds)} · ${d.stats.sold} of ${d.event.minGroup} minimum`);

/* Live camera scanner. Uses the browser's BarcodeDetector where available, otherwise jsQR on video frames. */
function Scanner({ onCode }) {
  const videoRef = useRef(null);
  const [err, setErr] = useState("");
  const cb = useRef(onCode);
  cb.current = onCode;
  useEffect(() => {
    let stream, stop = false, timer;
    (async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("This browser can't use the camera. Use the attendee list below.");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (stop) return;
        const v = videoRef.current;
        v.srcObject = stream; v.setAttribute("playsinline", ""); await v.play();
        let detect;
        if ("BarcodeDetector" in window) {
          try {
            const bd = new window.BarcodeDetector({ formats: ["qr_code"] });
            detect = async () => { const r = await bd.detect(v); return r[0] && r[0].rawValue; };
          } catch (e) { detect = null; }
        }
        if (!detect) {
          const jsQR = (await import("jsqr")).default;
          const c = document.createElement("canvas"), g = c.getContext("2d", { willReadFrequently: true });
          detect = async () => {
            if (!v.videoWidth) return null;
            const s = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
            c.width = Math.round(v.videoWidth * s); c.height = Math.round(v.videoHeight * s);
            g.drawImage(v, 0, 0, c.width, c.height);
            const r = jsQR(g.getImageData(0, 0, c.width, c.height).data, c.width, c.height, { inversionAttempts: "dontInvert" });
            return r && r.data;
          };
        }
        const tick = async () => {
          if (stop) return;
          try { const code = await detect(); if (code) cb.current(code); } catch (e) { /* next frame */ }
          timer = setTimeout(tick, 250);
        };
        tick();
      } catch (e) {
        setErr(e && e.name === "NotAllowedError" ? "Camera access was blocked. Allow the camera for uniteuow.com in your browser settings, or use the attendee list below." : (e && e.message) || "Couldn't start the camera.");
      }
    })();
    return () => { stop = true; clearTimeout(timer); if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, []);
  return err ? <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">{err}</p> : (
    <div className="u-keep relative overflow-hidden rounded-2xl bg-black" style={{ aspectRatio: "1 / 1" }}>
      <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
      <span className="pointer-events-none absolute inset-[18%] rounded-3xl ring-4 ring-white/80" aria-hidden="true" />
    </div>
  );
}

// Photos are shrunk to a sharp JPEG so they upload quickly; PDFs go as they are (max 2.5 MB).
const MAX_FILE = 2.5 * 1024 * 1024;
const readFile = (file) => new Promise((resolve, reject) => {
  if (!file) return reject(new Error("No file chosen."));
  const okType = file.type === "application/pdf" || /^image\/(jpeg|png|webp)$/.test(file.type);
  if (!okType) return reject(new Error("Upload a PDF or an image (JPG, PNG, WebP)."));
  const r = new FileReader();
  r.onerror = () => reject(new Error("Couldn't read that file."));
  r.onload = () => {
    if (file.type === "application/pdf" || file.size <= 1.5 * 1024 * 1024) {
      if (file.size > MAX_FILE) return reject(new Error(`That PDF is ${(file.size / 1048576).toFixed(1)} MB. The maximum is 2.5 MB.`));
      return resolve(r.result);
    }
    const img = new Image();
    img.onerror = () => reject(new Error("Couldn't open that image."));
    img.onload = () => {
      const s = Math.min(1, 2200 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.9));
    };
    img.src = r.result;
  };
  r.readAsDataURL(file);
});

function AttendeeRow({ a, sub, d, onCheckIn, onDelivered, notify }) {
  const trip = sub.kind === "trip";
  const [mode, setMode] = useState(null); // null | "external"
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);
  const canDeliver = trip && d.event.tripState === "confirmed" && !a.refunded;
  const send = async (x) => {
    setBusy(true); setErr("");
    const r = await deliverTicket(sub.ref, sub.key, a.id, x);
    setBusy(false);
    if (!r.ok) return setErr(r.error || "Couldn't save that. Try again.");
    setMode(null); setNote("");
    onDelivered(a, r.attendee);
  };
  const upload = async (file) => {
    try { send({ mode: "file", file: await readFile(file), name: file.name }); }
    catch (e) { setErr(e.message); }
  };
  const status = a.refunded ? <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">Refunded</span>
    : trip ? (a.delivery ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">✓ Delivered{a.delivery.mode === "file" ? " · file" : " · official app/email"}</span>
      : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Not delivered</span>)
    : a.checkedIn ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">✓ Checked in {clock(a.checkedIn)}</span> : null;
  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{a.name || a.email}</p>
          <p className="truncate text-xs text-slate-500">{a.email}{a.studentId ? ` · ${a.studentId}` : ""}</p>
          <p className="mt-0.5 font-mono text-[11px] text-slate-400">{a.id}</p>
          <div className="mt-1">{status}</div>
          {a.delivery && a.delivery.note && <p className="mt-1 text-xs text-slate-500">Note: {a.delivery.note}</p>}
        </div>
        {!trip && !a.checkedIn && !a.refunded && (
          <button onClick={() => onCheckIn(a)} className="u-btn shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">Check in</button>
        )}
        {trip && a.delivery && a.delivery.mode === "file" && (
          <button onClick={async () => { const r = await openTicketFile({ ref: sub.ref, k: sub.key, id: a.id }); if (r !== true) notify(r, 3500); }}
            className="u-btn shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Open</button>
        )}
      </div>
      {canDeliver && (
        <div className="mt-2.5">
          {mode === "external" ? (
            <div className="space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
              <label className="block text-xs font-medium text-slate-600" htmlFor={`note-${a.id}`}>Note for {a.name ? a.name.split(" ")[0] : "them"} <span className="text-slate-400">· optional</span></label>
              <input id={`note-${a.id}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Check your email from the seller"
                enterKeyHint="send" onKeyDown={(e) => { if (e.key === "Enter" && !busy) { e.preventDefault(); e.currentTarget.blur(); send({ mode: "external", note }); } }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" />
              <div className="flex gap-2">
                <button disabled={busy} onClick={() => send({ mode: "external", note })} className="u-btn flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{busy ? "Saving…" : "Mark as delivered"}</button>
                <button disabled={busy} onClick={() => setMode(null)} className="u-btn rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={() => fileRef.current && fileRef.current.click()} className="u-btn inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                {busy ? "Uploading…" : a.delivery ? "Replace with upload" : "Upload ticket"}
              </button>
              <button disabled={busy} onClick={() => setMode("external")} className="u-btn rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60">Sent via the official app/email</button>
              <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { upload(e.target.files && e.target.files[0]); e.target.value = ""; }} />
            </div>
          )}
          {err && <p role="alert" className="mt-1.5 text-xs text-rose-600">{err}</p>}
        </div>
      )}
    </li>
  );
}

export function HostManage({ sub, data: d, onRefresh, notify, onClose, startScan = false }) {
  const trip = sub.kind === "trip";
  const [scan, setScan] = useState(startScan && !trip);
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState(null); // { tone: "ok" | "bad", title, body }
  const [list, setList] = useState(d ? d.attendees : []);
  const recent = useRef({});
  const flashTimer = useRef(null);
  useEffect(() => { if (d) setList(d.attendees); }, [d]);
  useEffect(() => () => clearTimeout(flashTimer.current), []);
  const show = (f) => { setFlash(f); clearTimeout(flashTimer.current); flashTimer.current = setTimeout(() => setFlash(null), 3000); };
  const update = (a) => setList((xs) => xs.map((x) => (x.id === a.id ? a : x)));
  const result = (r, fallbackName) => {
    if (!r.ok) return show({ tone: "bad", title: "Couldn't check in", body: r.error || "Try again." });
    if (r.attendee) update(r.attendee);
    const who = (r.attendee && (r.attendee.name || r.attendee.email)) || fallbackName || "";
    if (r.result === "ok") show({ tone: "ok", title: "Checked in", body: who });
    else if (r.result === "used") show({ tone: "bad", title: "Already used", body: `${who}${r.attendee && r.attendee.checkedIn ? ` · checked in at ${clock(r.attendee.checkedIn)}` : ""}` });
    else show({ tone: "bad", title: "Invalid", body: r.reason || "Not a ticket for this event." });
    onRefresh();
  };
  const onCode = async (code) => {
    const now = Date.now();
    if (recent.current[code] && now - recent.current[code] < 4000) return; // same code still in front of the camera
    recent.current[code] = now;
    if (navigator.vibrate) navigator.vibrate(60);
    result(await checkIn(sub.ref, sub.key, { code }));
  };
  const manual = async (a) => result(await checkIn(sub.ref, sub.key, { id: a.id }), a.name);
  const term = q.trim().toLowerCase();
  const shown = list.filter((a) => !term || [a.name, a.email, a.id, a.studentId].some((v) => String(v || "").toLowerCase().includes(term)));

  return (
    <Modal onClose={onClose} size="lg">
      <div className="space-y-4 p-5">
        <div className="pr-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{trip ? "Group trip · Attendees" : "Check-in"}</p>
          <h2 className="mt-1 text-xl font-bold leading-tight text-slate-900">{sub.title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">{fmtDate(sub.date)} · {fmtTime(sub.start)}{trip && sub.extName ? ` · ${sub.extName}` : ""}</p>
        </div>

        {!d ? <p className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">Loading attendees…</p> : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-900">{payoutText(sub, d)}</p>
              <p className="mt-1 text-xs text-slate-500">{d.stats.sold} {trip ? "in the group" : "tickets"}{!trip ? ` · ${d.stats.checkedIn} checked in` : ""}{d.stats.refunded ? ` · ${d.stats.refunded} refunded` : ""} · demo payments, no real transfers</p>
              {trip && <p className="mt-2 text-xs font-semibold text-slate-700">{tripStateLabel(d)}</p>}
              {trip && d.event.tripState === "confirmed" && <div className="mt-3"><DeliveryBar d={d} /></div>}
            </div>

            {!trip && (
              scan ? (
                <div className="space-y-2">
                  <Scanner onCode={onCode} />
                  <button onClick={() => setScan(false)} className="u-btn w-full rounded-xl py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">Close camera</button>
                </div>
              ) : (
                <button onClick={() => setScan(true)} className="u-btn flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                  <Icon name="ticket" className="h-4 w-4" /> Scan tickets with the camera
                </button>
              )
            )}

            {flash && (
              <div role="status" className={`u-pop flex items-center gap-3 rounded-2xl px-4 py-3 text-white ${flash.tone === "ok" ? "bg-emerald-600" : "bg-rose-600"}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold">{flash.tone === "ok" ? <Check className="h-5 w-5" /> : "✕"}</span>
                <span className="min-w-0"><span className="block font-bold">{flash.title}</span>{flash.body && <span className="block truncate text-sm text-white/90">{flash.body}</span>}</span>
              </div>
            )}

            {trip && d.event.tripState === "collecting" && (
              <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-200">You can deliver tickets after payments close and the group is confirmed. Then deliver each person's ticket at least 24 hours before the event.</p>
            )}

            <div>
              <label htmlFor="att-q" className="sr-only">Search attendees</label>
              <input id="att-q" type="search" enterKeyHint="search" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }} placeholder="Search by name, email or ticket ID"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none" />
              {shown.length ? (
                <ul className="mt-2 divide-y divide-slate-100">
                  {shown.map((a) => <AttendeeRow key={a.id} a={a} sub={sub} d={d} onCheckIn={manual} notify={notify}
                    onDelivered={(old, next) => { update(next); onRefresh(); notify(`Ticket delivered to ${next.name || next.email}`); }} />)}
                </ul>
              ) : <p className="mt-3 text-center text-sm text-slate-500">{list.length ? "No one matches that search." : "No tickets sold yet."}</p>}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
