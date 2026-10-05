import { useEffect, useRef, useState } from "react";
import { PartyCard } from "../components/cards.jsx";
import { ConsentRow } from "../components/Legal.jsx";
import { EventDetailBody } from "../components/modals/EventDetail.jsx";
import { Icon } from "../components/ui.jsx";
import { DRESS_CODES, EVENT_TYPES, LANGUAGES } from "../data/options.js";
import { collectEndsMs, submissionToParty } from "../lib/events.js";
import { TRIP_NOTE } from "../lib/tripText.js";
import { fmtDate, fmtRange, fmtTime, makeId, toMin, validEmail } from "../lib/format.js";
import { isGoogleMapsUrl, normalizeMapsUrl, tgHandle, waDigits } from "../lib/maps.js";

/* Uploads must be JPEG/PNG/WebP, at most 10 MB and at least the minimum size. They are centre-cropped to the
   right shape in the browser and re-encoded as WebP (JPEG where WebP encoding is unavailable):
   logo → 512×512, cover → 1600×900. */
export const IMAGE_SPECS = {
  logo: { w: 512, h: 512, minW: 512, minH: 512 },
  cover: { w: 1600, h: 900, minW: 1376, minH: 768 }, // 1376×768 (≈16:9, common AI/phone export) is accepted
};
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const PHOTO_COPY = {
  logo: { title: "Event logo", where: "Shown on event cards", ratio: "1 / 1", empty: "Add a square logo",
    specs: ["Square 1:1", "Recommended 1080 × 1080 px", "Minimum 512 × 512 px", "JPG, PNG or WebP · max 10 MB"] },
  cover: { title: "Event cover", where: "Shown at the top of the event page", ratio: "16 / 9", empty: "Add a widescreen cover",
    specs: ["Widescreen 16:9", "Recommended 1920 × 1080 px", "Also fits: 1600 × 900 or 1376 × 768 px", "Minimum 1376 × 768 px", "JPG, PNG or WebP · max 10 MB"] },
};

export const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.decoding = "async";
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("load"));
  img.src = src;
});

/* The admin's Telegram message carries one picture: the cover with the logo set into its corner (Telegram can't
   put moderation buttons under an album of two photos). */
export const composeCard = async (coverSrc, logoSrc) => {
  if (!coverSrc) return "";
  const cover = await loadImage(coverSrc);
  const W = 1280, H = 720, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.drawImage(cover, 0, 0, W, H);
  if (logoSrc) {
    const logo = await loadImage(logoSrc);
    const s = 210, x = 36, y = H - s - 36, r = 40;
    const box = (pad) => { g.beginPath(); if (g.roundRect) g.roundRect(x - pad, y - pad, s + 2 * pad, s + 2 * pad, r + pad); else g.rect(x - pad, y - pad, s + 2 * pad, s + 2 * pad); };
    g.save(); g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = 28; g.shadowOffsetY = 8; g.fillStyle = "#fff"; box(6); g.fill(); g.restore();
    g.save(); box(0); g.clip(); g.drawImage(logo, x, y, s, s); g.restore();
  }
  return c.toDataURL("image/jpeg", 0.88);
};

export const encodeCrop = (img, spec) => {
  const target = spec.w / spec.h, ratio = img.naturalWidth / img.naturalHeight;
  const sw = ratio > target ? img.naturalHeight * target : img.naturalWidth;
  const sh = ratio > target ? img.naturalHeight : img.naturalWidth / target;
  const c = document.createElement("canvas");
  c.width = spec.w; c.height = spec.h;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, spec.w, spec.h);
  const out = c.toDataURL("image/webp", 0.85);
  return out.startsWith("data:image/webp") ? out : c.toDataURL("image/jpeg", 0.88);
};

// Returns { src, cropped }: cropped is true when the photo wasn't already the right shape (±1%).
export async function readImageFile(file, kind) {
  const spec = IMAGE_SPECS[kind];
  if (!file || !IMAGE_TYPES.includes(file.type)) throw new Error("That file type isn't supported. Use a JPG, PNG or WebP photo.");
  if (file.size > IMAGE_MAX_BYTES) throw new Error(`That photo is ${(file.size / 1048576).toFixed(1)} MB. The maximum is 10 MB.`);
  const url = URL.createObjectURL(file);
  try {
    let img;
    try { img = await loadImage(url); } catch (e) { throw new Error("We couldn't open that photo. Try another file."); }
    if (img.naturalWidth < spec.minW || img.naturalHeight < spec.minH)
      throw new Error(`Too small: ${img.naturalWidth} × ${img.naturalHeight} px. It needs to be at least ${spec.minW} × ${spec.minH} px.`);
    const cropped = Math.abs(img.naturalWidth / img.naturalHeight - spec.w / spec.h) > 0.01 * (spec.w / spec.h);
    return { src: encodeCrop(img, spec), cropped };
  } finally { URL.revokeObjectURL(url); }
}

export const PhotoIcon = ({ className }) => <Icon name="image" className={className} />;

/* One photo upload (locked dark styling): a frame in the photo's shape, live preview, Replace / Remove,
   the requirements underneath and its own inline error. value = null | { src, cropped } */
export function PhotoDrop({ kind, value, onChange, error }) {
  const copy = PHOTO_COPY[kind];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const browse = () => inputRef.current && inputRef.current.click();
  const take = async (file) => {
    if (!file) return;
    setBusy(true); setErr("");
    try { onChange(await readImageFile(file, kind)); }
    catch (e) { setErr(e.message || "Couldn't use that photo."); }
    finally { setBusy(false); }
  };
  const msg = err || error;
  return (
    <div id={`c-${kind}`} tabIndex={-1} className="min-w-0 focus:outline-none">
      <p className={DK.label}>{copy.title} <span className="font-normal text-slate-500">· {copy.where}</span></p>
      <div
        role="button" tabIndex={0} aria-label={value ? `Replace ${copy.title.toLowerCase()}` : `Upload ${copy.title.toLowerCase()}`}
        onClick={browse}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); browse(); } }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files && e.dataTransfer.files[0]); }}
        className={`u-keep group relative mt-3 w-full cursor-pointer overflow-hidden rounded-2xl transition-all duration-200 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-400/60 ${value ? "ring-1 ring-white/10" : `border border-dashed ${drag ? "border-crimson-400 bg-crimson-400/[0.06]" : msg ? "border-rose-400/70 bg-white/[0.02]" : "border-white/20 bg-white/[0.02] hover:border-crimson-400/60 hover:bg-white/[0.04]"}`}`}
        style={{ aspectRatio: copy.ratio }}>
        {value ? (
          <>
            <img src={value.src} alt={`${copy.title} preview`} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
            {value.cropped && <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">We'll crop it to fit</span>}
          </>
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-3 text-center">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 transition-colors ${drag ? "text-crimson-300 ring-crimson-400/50" : "text-slate-400 ring-white/10 group-hover:text-crimson-300 group-hover:ring-crimson-400/40"}`}><PhotoIcon className="h-6 w-6" /></span>
            <span>
              <span className="block text-sm font-semibold text-white">{drag ? "Drop to upload" : copy.empty}</span>
              <span className="mt-0.5 block text-xs text-slate-400">Drag a photo here, or click to browse</span>
            </span>
          </span>
        )}
        {busy && <span className="absolute inset-0 flex items-center justify-center bg-[#0e0f13]/70"><span className="u-spin h-7 w-7 rounded-full border-2 border-crimson-400 border-t-transparent" /></span>}
      </div>
      <input ref={inputRef} type="file" accept={IMAGE_TYPES.join(",")} className="hidden" aria-hidden="true" tabIndex={-1}
        onChange={(e) => { take(e.target.files && e.target.files[0]); e.target.value = ""; }} />
      {value && (
        <div className="mt-2.5 flex gap-2">
          <button type="button" onClick={browse} className="u-keep rounded-lg px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/10 active:scale-95">Replace</button>
          <button type="button" onClick={() => { setErr(""); onChange(null); }} className="u-keep rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-rose-500/10 hover:text-rose-200 active:scale-95">Remove</button>
        </div>
      )}
      {msg && <p role="alert" className={DK.err}>{msg}</p>}
      <ul className="mt-2.5 space-y-0.5 text-xs leading-relaxed text-slate-500">{copy.specs.map((t) => <li key={t}>{t}</li>)}</ul>
    </div>
  );
}

export const REQ_CHIPS = ["Bring your own laptop", "Bring your own racket", "Sportswear & trainers", "Student ID at the door", "No experience needed"];

export const PITCH_MIN_CHARS = 50;
/* Field order on the page, used to bring the first problem into view on submit. */
export const FIELD_ORDER = ["logo", "cover", "title", "pitch", "date", "time", "end", "venueName", "mapsUrl", "spots", "price", "extName", "seller", "minGroup", "collectUntil", "whatsapp", "telegram", "email"];

/* The two kinds of event a student can host. */
export const EVENT_KINDS = [
  { k: "own", icon: "party", emoji: "🏠", title: "Our own event", body: "You run it yourself: party, yacht, tournament, dinner, workshop." },
  { k: "trip", icon: "ticket", emoji: "🚌", title: "Group trip to an external event", body: "You buy tickets from an official seller (concert, match, theme park) and bring a group." },
];
export const kindLabel = (k) => (k === "trip" ? "Group trip to an external event" : "Our own event");


/* Event times are entered and checked in Dubai time (UTC+4, no daylight saving), whatever the device's zone.
   Applications must arrive at least 24 hours before the event starts. */
export const DUBAI_OFFSET_MS = 4 * 36e5;
export const LEAD_MS = 24 * 36e5;
export const dubaiStartMs = (date, time) => {
  const [y, mo, d] = date.split("-").map(Number), [h, mi] = time.split(":").map(Number);
  return Date.UTC(y, mo - 1, d, h, mi) - DUBAI_OFFSET_MS;
};
// Earliest allowed start, as Dubai date + time (rounded up to the next 5 minutes).
export const earliestStart = (now = Date.now()) => {
  const step = 5 * 6e4;
  const x = new Date(Math.ceil((now + LEAD_MS) / step) * step + DUBAI_OFFSET_MS).toISOString();
  return { date: x.slice(0, 10), time: x.slice(11, 16) };
};

/* Locked-dark form primitives (fixed colours; u-keep opts out of the theme remap). */
export const DK = {
  label: "block text-[13px] font-medium tracking-wide text-slate-300",
  input: (bad) => `u-keep mt-2 w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 ${bad ? "border-rose-400/70 focus:ring-rose-400/20" : "border-white/10 hover:border-white/20 focus:border-crimson-400/70 focus:ring-crimson-400/15"}`,
  chip: (on) => `u-keep rounded-full border px-4 py-2 text-sm transition-all duration-200 active:scale-95 ${on ? "border-crimson-500 bg-crimson-700 font-semibold text-white shadow-[0_0_0_3px_rgba(196,90,104,0.18)]" : "border-white/15 text-slate-300 hover:border-white/35 hover:text-white"}`,
  err: "mt-2 text-sm text-rose-300",
  hint: "mt-2 text-xs text-slate-400",
};
/* Date picker in the form's own style (the browser's calendar popup looked out of place). Opens inline under
   the field; days before `min` are disabled. Values are "YYYY-MM-DD". */
export function DkDatePicker({ id, value, min, onChange, bad }) {
  const [open, setOpen] = useState(false);
  const first = (iso) => { const [y, m] = iso.split("-").map(Number); return new Date(y, m - 1, 1); };
  const [month, setMonth] = useState(() => first(value || min));
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const minMonth = first(min);
  const lastMonth = new Date(minMonth.getFullYear(), minMonth.getMonth() + 11, 1);
  const lead = (month.getDay() + 6) % 7; // Monday first
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const label = value ? new Date(value + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "Choose a date";
  const shift = (n) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  return (
    <div onKeyDown={(e) => { if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); } }}>
      <button id={id} type="button" onClick={() => { setMonth(first(value || min)); setOpen((o) => !o); }} aria-expanded={open} aria-haspopup="dialog"
        className={`${DK.input(bad)} flex items-center justify-between text-left ${value ? "" : "text-slate-500"}`}>
        {label}<Icon name="calendar" className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <div role="dialog" aria-label="Choose a date" className="u-keep u-fade mt-2 rounded-2xl border border-white/10 bg-[#15161b] p-3">
          <div className="flex items-center justify-between px-1">
            <button type="button" onClick={() => shift(-1)} disabled={month <= minMonth} aria-label="Previous month" className="u-keep flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-30"><Icon name="chevron" className="h-4 w-4 rotate-90" /></button>
            <span className="text-sm font-semibold text-white">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
            <button type="button" onClick={() => shift(1)} disabled={month >= lastMonth} aria-label="Next month" className="u-keep flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-30"><Icon name="chevron" className="h-4 w-4 -rotate-90" /></button>
          </div>
          <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-medium uppercase text-slate-500">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="py-1">{d}</span>)}</div>
          <div className="u-cal grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const k = iso(d), off = k < min, on = k === value;
              return (
                <button key={k} type="button" disabled={off} onClick={() => { onChange(k); setOpen(false); }} aria-pressed={on} aria-label={d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                  className={`u-keep h-10 rounded-lg text-sm tabular-nums transition-colors ${on ? "bg-crimson-700 font-semibold text-white" : off ? "text-slate-600" : "text-slate-200 hover:bg-white/10"}`}>{d.getDate()}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
// Times in 15-minute steps, shown as "8:00 PM". Earlier than `min` is disabled; an off-step value stays selectable.
export function DkTimeSelect({ id, value, min, onChange, bad }) {
  const opts = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`);
  if (value && !opts.includes(value)) opts.push(value), opts.sort();
  return (
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${DK.input(bad)} appearance-none pr-10`}>
        {opts.map((t) => <option key={t} value={t} disabled={!!min && t < min}>{fmtTime(t)}</option>)}
      </select>
      <Icon name="chevron" className="pointer-events-none absolute right-4 top-[calc(50%+4px)] h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
export const DkSection = ({ n, title, children }) => (
  <section className="space-y-6 border-t border-white/[0.06] pt-10 first:border-0 first:pt-0">
    <h3 className="flex items-baseline gap-3 text-lg font-semibold tracking-tight text-white">
      <span className="text-xs font-semibold tabular-nums text-crimson-400">{String(n).padStart(2, "0")}</span>{title}
    </h3>
    {children}
  </section>
);

/* Host preview: frames for the event card and the event page. */
export const PreviewBlock = ({ title, note, onEdit, children }) => (
  <section className="min-w-0">
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h4 className="text-sm font-semibold text-white">{title}{note && <span className="font-normal text-slate-400"> · {note}</span>}</h4>
      {onEdit && <button type="button" onClick={onEdit} className="u-keep shrink-0 rounded-md text-xs font-semibold text-crimson-300 underline-offset-4 hover:text-crimson-200 hover:underline">Edit</button>}
    </div>
    {children}
  </section>
);

/* Phone-shaped frame on desktop, a plain full-width panel on mobile. */
export const PhoneFrame = ({ children }) => (
  <div className="u-host-keep lg:mx-auto lg:w-[360px] lg:rounded-[2.75rem] lg:bg-[#020617] lg:p-2.5 lg:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] lg:ring-1 lg:ring-white/10">
    <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-white/10 lg:rounded-[2.2rem] lg:ring-0">
      <span className="pointer-events-none absolute left-1/2 top-2 z-20 hidden h-6 w-24 -translate-x-1/2 rounded-full bg-[#020617] lg:block" aria-hidden="true" />
      {/* Phones: no scroll box of its own (it trapped the finger, so the form wouldn't scroll past the preview). */}
      <div className="lg:h-[640px] lg:overflow-y-auto lg:overscroll-contain">{children}</div>
    </div>
  </div>
);

export function HostPreview({ sub, onEdit }) {
  const p = { ...submissionToParty(sub), host: "you" };
  const fake = (label, primary) => (
    <span className={`u-btn inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold ${primary ? "flex-1 bg-slate-900 text-white" : "text-slate-700 ring-1 ring-slate-200"}`}>{label}</span>
  );
  const buy = p.price > 0 ? `Buy ticket · ${p.price} AED` : "Reserve free spot";
  const rows = [
    ["Event type", kindLabel(sub.kind), "kind"],
    ...(sub.kind === "trip" ? [
      ["External event", sub.extName, "extName"],
      ["Official seller", sub.seller, "seller"],
      ["Minimum group", `${sub.minGroup} people`, "minGroup"],
      ["Collect payments until", `${fmtDate(sub.collectUntil)}, 11:59 PM (Dubai time)`, "collectUntil"],
    ] : []),
    ["When", `${fmtDate(sub.date)} · ${fmtRange(sub.start, sub.end)} (Dubai time)`, "date"],
    ["Venue", sub.room ? `${sub.venueName}, ${sub.room}` : sub.venueName, "venueName"],
    ["Capacity · price", `${sub.spots} spots · ${sub.price > 0 ? `${sub.price} AED` : "Free"}`, "spots"],
    ["Type · language", `${sub.category} · ${sub.lang}`, "title"],
    ...(sub.dress || sub.reqs ? [["Dress code · bring", [sub.dress, sub.reqs].filter(Boolean).join(" · "), "reqs"]] : []),
    ["Contacts", [sub.whatsapp && `WhatsApp ${sub.whatsapp}`, sub.telegram && `@${sub.telegram}`, sub.email].filter(Boolean).join(" · "), "whatsapp"],
  ];
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-crimson-300">Preview</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">Here's how your event will look</h3>
        <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-400">This is what students will see once the Unite team approves it. Spotted something? Tap Edit and you'll go straight back to that part of the form.</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-10">
          <PreviewBlock title="Event card" note="Events" onEdit={() => onEdit("logo")}>
            <div className="pointer-events-none select-none" aria-hidden="true">
              <PartyCard p={p} onShare={() => {}} actions={fake(p.price > 0 ? "Buy ticket" : "Reserve a spot")} />
            </div>
          </PreviewBlock>
          <PreviewBlock title="Application details" onEdit={() => onEdit("title")}>
            <dl className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
              {rows.map(([k, v, field]) => (
                <div key={k} className="flex items-start gap-3 px-4 py-3 text-sm">
                  <dt className="w-32 shrink-0 text-slate-400">{k}</dt>
                  <dd className="min-w-0 flex-1 break-words text-slate-100">{v}</dd>
                  <button type="button" onClick={() => onEdit(field)} className="u-keep shrink-0 text-xs font-semibold text-crimson-300 hover:text-crimson-200 hover:underline">Edit</button>
                </div>
              ))}
            </dl>
          </PreviewBlock>
        </div>
        <PreviewBlock title="Event page" note="when a student opens it" onEdit={() => onEdit("cover")}>
          <PhoneFrame>
            <div className="pointer-events-none select-none" aria-hidden="true">
              <EventDetailBody p={p} onShare={() => {}} />
              <div className="border-t border-slate-200/50 bg-white p-4">{fake(buy, true)}</div>
            </div>
          </PhoneFrame>
        </PreviewBlock>
      </div>
    </div>
  );
}

export function CreateModal({ email: defaultEmail, contacts = {}, onClose, onSubmitted, dark = true }) {
  const [f, setF] = useState({
    title: "", category: "Party", lang: "English", pitch: "", date: "", time: "20:00", end: "22:00", venueName: "", room: "", mapsUrl: "",
    spots: 30, price: 0, dress: "", reqs: "", whatsapp: contacts.whatsapp || "", telegram: contacts.telegram || "", email: defaultEmail, logo: null, cover: null, website: "",
    kind: "", extName: "", seller: "", minGroup: 10, collectUntil: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("type"); // type | form | preview
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendError, setSendError] = useState("");
  const [focusField, setFocusField] = useState(null);
  const bodyRef = useRef(null);
  const yesRef = useRef(null);
  const earliest = earliestStart();
  const clearErr = (...ks) => setErrors((x) => { const n = { ...x }; ks.forEach((k) => { n[k] = undefined; }); return n; });
  const set = (k) => (e) => {
    const v = e.target.value;
    setF((x) => ({ ...x, [k]: v }));
    clearErr(k, ...(k === "whatsapp" || k === "telegram" ? ["whatsapp", "telegram"] : []), ...(k === "date" || k === "time" || k === "end" ? ["date", "time", "end", "collectUntil"] : []), ...(k === "spots" ? ["minGroup"] : []));
  };

  // Escape steps back: closes the confirmation, then leaves the preview, then closes the form.
  useEffect(() => {
    const h = (e) => {
      if (e.key !== "Escape" || submitting) return;
      if (confirm) setConfirm(false);
      else if (step === "preview") setStep("form");
      else if (step === "form") setStep("type");
      else onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [submitting, confirm, step, onClose]);
  // Phone back gesture / browser back (see App): same steps as Escape, but never closes while sending.
  useEffect(() => {
    const h = (e) => {
      if (submitting) { e.preventDefault(); return; }
      if (confirm) { setConfirm(false); e.preventDefault(); }
      else if (step === "preview") { setStep("form"); e.preventDefault(); }
      else if (step === "form") { setStep("type"); e.preventDefault(); }
    };
    window.addEventListener("unite:back", h);
    return () => window.removeEventListener("unite:back", h);
  }, [submitting, confirm, step]);
  // Keyboard: "Next" on every single-line field, "Done" on the last; Enter moves on instead of doing nothing.
  // Fields you type into. Enter skips dropdowns and date/time pickers: focusing one opens its popup, which then swallows the next keystrokes.
  const formFields = () => (bodyRef.current ? [...bodyRef.current.querySelectorAll("input:not([type=file]):not([type=date]):not([type=time]):not([type=checkbox]):not([type=radio]):not([name=website]), textarea")].filter((el) => el.offsetParent) : []);
  // Only when the set of fields changes (not on every keystroke: measuring every field per key press made typing lag on phones).
  useEffect(() => {
    const list = formFields();
    list.forEach((el, i) => { if (el.tagName === "INPUT") el.setAttribute("enterkeyhint", i === list.length - 1 ? "done" : "next"); });
    // eslint-disable-next-line
  }, [step, f.kind]);
  const onFieldEnter = (e) => {
    if (e.key !== "Enter" || e.target.tagName !== "INPUT" || e.target.type === "file") return;
    e.preventDefault();
    const list = formFields(), next = list[list.indexOf(e.target) + 1];
    if (next) next.focus(); else e.target.blur();
  };
  useEffect(() => { if (confirm && yesRef.current) yesRef.current.focus(); }, [confirm]);
  // After switching steps: top of the preview, or straight to the field the host wants to edit.
  useEffect(() => {
    if (step !== "form") { if (bodyRef.current) bodyRef.current.scrollTop = 0; return; }
    if (!focusField) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`c-${focusField}`);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); if (el.focus) el.focus({ preventScroll: true }); }
      setFocusField(null);
    }, 60);
    return () => clearTimeout(t);
  }, [step, focusField]);

  const validate = () => {
    const e = {};
    if (!f.logo) e.logo = "Add a square logo for your event card.";
    if (!f.cover) e.cover = "Add a 16:9 cover for your event page.";
    if (f.title.trim().length < 3) e.title = "Give your event a title (3+ characters).";
    const chars = f.pitch.trim().length;
    if (chars < PITCH_MIN_CHARS) e.pitch = `Please describe your event in more detail: at least ${PITCH_MIN_CHARS} characters (you have ${chars}).`;
    if (!f.date) e.date = "Pick the date of your event.";
    else if (f.date < new Date(Date.now() + DUBAI_OFFSET_MS).toISOString().slice(0, 10)) e.date = "That date has already passed. Pick an upcoming date.";
    else if (f.date < earliest.date) e.date = "Events must be submitted at least 24 hours before they start.";
    if (!f.time) e.time = "Add a start time.";
    if (f.date && f.time && !e.date && dubaiStartMs(f.date, f.time) < Date.now() + LEAD_MS) e.date = "Events must be submitted at least 24 hours before they start.";
    if (!f.end) e.end = "Add an end time.";
    else if (f.time && toMin(f.end) <= toMin(f.time)) e.end = "The end time must be after the start time.";
    if (f.venueName.trim().length < 3) e.venueName = "Add the venue name, e.g. Marina Rooftop Lounge.";
    if (!f.mapsUrl.trim() || !isGoogleMapsUrl(f.mapsUrl)) e.mapsUrl = "Please paste a Google Maps link to the venue";
    if (!(Number(f.spots) >= 1)) e.spots = "At least 1 spot.";
    if (Number(f.price) < 0 || f.price === "") e.price = "Enter 0 for free events.";
    const wa = waDigits(f.whatsapp), tg = tgHandle(f.telegram);
    if (f.whatsapp.trim() && (wa.length < 8 || wa.length > 15)) e.whatsapp = "Use the full number with country code, e.g. +971 50 123 4567.";
    if (f.telegram.trim() && !/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(tg)) e.telegram = "Telegram usernames are 5–32 letters, numbers or underscores.";
    if (!wa && !tg && !e.whatsapp && !e.telegram) e.whatsapp = "Add a WhatsApp number or a Telegram username so guests can reach you.";
    if (!validEmail(f.email.trim())) e.email = "Enter a valid contact email.";
    if (f.kind === "trip") {
      if (f.extName.trim().length < 2) e.extName = "Add the name of the external event, e.g. Coldplay at Etihad Park.";
      if (f.seller.trim().length < 2) e.seller = "Add the official ticket seller, e.g. Platinumlist.";
      const min = Number(f.minGroup);
      if (!(min >= 1) || !Number.isInteger(min)) e.minGroup = "At least 1 person.";
      else if (Number(f.spots) >= 1 && min > Number(f.spots)) e.minGroup = "The minimum can't be bigger than the capacity.";
      if (!f.collectUntil) e.collectUntil = "Pick the last day students can pay.";
      else if (collectEndsMs({ collectUntil: f.collectUntil }) < Date.now()) e.collectUntil = "That date has already passed.";
      else if (f.date && f.time && collectEndsMs({ collectUntil: f.collectUntil }) > dubaiStartMs(f.date, f.time) - LEAD_MS) e.collectUntil = "Payments must close at least 24 hours before the event (they close at 11:59 PM on this day).";
    }
    return e;
  };

  const buildSub = () => ({
    ref: makeId("REQ", 6), at: Date.now(), title: f.title.trim(), category: f.category, lang: f.lang, pitch: f.pitch.trim(),
    date: f.date, start: f.time, end: f.end, venueName: f.venueName.trim(), room: f.room.trim(), mapsUrl: normalizeMapsUrl(f.mapsUrl),
    spots: Number(f.spots), price: Number(f.price), dress: f.dress.trim(), reqs: f.reqs.trim(),
    whatsapp: f.whatsapp.trim(), telegram: tgHandle(f.telegram), email: f.email.trim(),
    cover: f.cover ? f.cover.src : "", logo: f.logo ? f.logo.src : "",
    kind: f.kind === "trip" ? "trip" : "own",
    ...(f.kind === "trip" ? { extName: f.extName.trim(), seller: f.seller.trim(), minGroup: Number(f.minGroup), collectUntil: f.collectUntil } : {}),
  });

  // Step 1: check everything, then show the preview instead of sending.
  const review = () => {
    const e = validate();
    setErrors(e);
    const first = FIELD_ORDER.find((k) => e[k]);
    if (first) { setFocusField(first); return; }
    setSendError("");
    setStep("preview");
  };
  // Step 3: only after "Submit".
  const send = async () => {
    const e = validate();
    if (FIELD_ORDER.some((k) => e[k])) { setErrors(e); setConfirm(false); setStep("form"); setFocusField(FIELD_ORDER.find((k) => e[k])); return; }
    setSubmitting(true); setSendError("");
    try {
      await onSubmitted(buildSub(), f.website); // delivers the pitch to the moderation chat, then queues it for review
    } catch (err) {
      setSubmitting(false);
      setSendError(err.message || "The review team couldn't be reached. Please try again.");
    }
  };
  const edit = (field) => { setConfirm(false); if (field === "kind") { setStep("type"); return; } setStep("form"); setFocusField(field); };
  const addReq = (r) => { if (!f.reqs.includes(r)) setF({ ...f, reqs: f.reqs.trim() ? `${f.reqs.trim().replace(/[.,;]$/, "")}; ${r}` : r }); };
  const E = ({ k }) => (errors[k] ? <p className={DK.err}>{errors[k]}</p> : null);
  const chars = f.pitch.trim().length;
  const preview = step === "preview";
  const typeStep = step === "type";
  const trip = f.kind === "trip";
  const todayDubai = new Date(Date.now() + DUBAI_OFFSET_MS).toISOString().slice(0, 10);
  const dubai = <span className="ml-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-slate-300">Dubai time</span>;

  return (
    <div className="u-keep u-fade u-vv u-full-pad fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 sm:items-center sm:p-6 sm:backdrop-blur-md">
      {/* A tap on a button while typing keeps the keyboard up (mousedown never cancels the click), so the form doesn't
          resize under the finger. */}
      <div role="dialog" aria-modal="true" aria-labelledby="host-title"
        onMouseDown={(e) => { if (e.target.closest("button") && document.activeElement && document.activeElement.matches("input, textarea")) e.preventDefault(); }}
        className={`u-keep u-up u-full-h relative flex w-full flex-col overflow-hidden bg-[#0e0f13] text-white shadow-2xl ring-1 ring-white/10 transition-[max-width] duration-300 sm:rounded-3xl ${dark ? "" : "u-host-light"} ${preview ? "sm:max-w-2xl lg:max-w-5xl" : "sm:max-w-2xl"}`}
        style={{ colorScheme: dark ? "dark" : "light" }}>
        {/* Header */}
        <div className="u-keep u-short-tight shrink-0 border-b border-white/[0.06] px-6 pb-6 sm:px-10" style={{ paddingTop: "max(2rem, calc(var(--sat) + 1rem))", paddingLeft: "max(1.5rem, var(--sal))", paddingRight: "max(1.5rem, var(--sar))" }}>
          {/* Below the status bar: in the installed iPhone app, taps up there belong to iOS and never reach the page. */}
          <button onClick={onClose} disabled={submitting} aria-label="Close"
            style={{ top: "max(1.25rem, calc(var(--sat) + 0.5rem))", right: "max(1.25rem, calc(var(--sar) + 0.75rem))" }}
            className="u-keep absolute z-10 flex h-10 w-10 items-center justify-center rounded-full text-slate-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-40"><Icon name="close" className="h-4 w-4" /></button>
          <p className="u-short-hide pr-12 text-xs font-semibold uppercase tracking-[0.2em] text-crimson-300"><span className="hidden sm:inline">Unite · Student events · </span>Step {typeStep ? 1 : preview ? 3 : 2} of 3</p>
          <h2 id="host-title" className="mt-3 pr-12 text-3xl font-semibold tracking-tight text-white sm:text-4xl [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:text-2xl">{preview ? "Preview your event" : typeStep ? "What are you hosting?" : "Host an event"}</h2>
          <p className="u-short-hide mt-2 max-w-md text-[15px] leading-relaxed text-slate-400">{preview ? "Check everything looks right before it goes to the Unite team." : typeStep ? "Tap the one that fits. It decides how tickets work for your guests." : "Pitch your party or event. The admin team reviews every submission for safety, usually within 2 hours. Questions? events@uniteuow.com"}</p>
        </div>

        {/* Body */}
        <div ref={bodyRef} onKeyDown={onFieldEnter} className="u-scroll min-h-0 flex-1 overflow-y-auto px-6 py-10 sm:px-10" style={{ paddingLeft: "max(1.5rem, var(--sal))", paddingRight: "max(1.5rem, var(--sar))" }}>
          {typeStep ? (
            <div key="type" className="u-slide space-y-4" role="radiogroup" aria-label="Event type">
              {EVENT_KINDS.map((x) => {
                const on = f.kind === x.k;
                return (
                  <button key={x.k} type="button" role="radio" aria-checked={on} onClick={() => { setF((y) => ({ ...y, kind: x.k })); setTimeout(() => setStep("form"), 180); }}
                    className={`u-keep flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-200 active:scale-[0.99] sm:p-6 ${on ? "border-crimson-500 bg-crimson-700/15 shadow-[0_0_0_3px_rgba(196,90,104,0.18)]" : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]"}`}>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white ring-1 ring-white/10" aria-hidden="true"><Icon name={x.icon} className="h-6 w-6" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold text-white">{x.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-slate-400">{x.body}</span>
                    </span>
                    <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-2 ${on ? "bg-crimson-500 ring-crimson-500" : "ring-white/25"}`} aria-hidden="true">{on && <span className="h-2 w-2 rounded-full bg-white" />}</span>
                  </button>
                );
              })}
              {trip && <p className="rounded-xl bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-slate-300 ring-1 ring-white/10">{TRIP_NOTE}</p>}
            </div>
          ) : preview ? (
            <div key="preview" className="u-slide"><HostPreview sub={buildSub()} onEdit={edit} /></div>
          ) : (
          <div key="form" className="u-slide space-y-12">
            <p className="-mb-4 flex flex-wrap items-center gap-x-2 text-sm text-slate-400">
              <span className="font-semibold text-white">{kindLabel(f.kind)}</span>
              <button type="button" onClick={() => setStep("type")} className="u-keep text-xs font-semibold text-crimson-300 hover:text-crimson-200 hover:underline">Change</button>
            </p>
            <DkSection n={1} title="Photos">
              <p className="-mt-2 text-sm text-slate-400">Two photos: a square logo for the event card and a widescreen cover for the event page. Both are required.</p>
              <div className="grid gap-8 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-6">
                <div className="w-full max-w-[13rem]">
                  <PhotoDrop kind="logo" value={f.logo} error={errors.logo} onChange={(v) => { setF((x) => ({ ...x, logo: v })); clearErr("logo"); }} />
                </div>
                <PhotoDrop kind="cover" value={f.cover} error={errors.cover} onChange={(v) => { setF((x) => ({ ...x, cover: v })); clearErr("cover"); }} />
              </div>
            </DkSection>

            <DkSection n={2} title="The event">
              <div>
                <label className={DK.label} htmlFor="c-title">Event name</label>
                <input id="c-title" value={f.title} onChange={set("title")} placeholder="Sunset Beach Social"
                  className={`u-keep mt-1 w-full border-0 border-b bg-transparent px-0 py-2 text-2xl font-semibold tracking-tight text-white placeholder:text-slate-600 focus:outline-none focus:ring-0 ${errors.title ? "border-rose-400/70" : "border-white/10 focus:border-crimson-400"}`} />
                <E k="title" />
              </div>
              <div>
                <span className={DK.label}>Type</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {EVENT_TYPES.map((c) => <button key={c} type="button" aria-pressed={f.category === c} onClick={() => setF({ ...f, category: c })} className={DK.chip(f.category === c)}>{c}</button>)}
                </div>
              </div>
              <div>
                <label className={DK.label} htmlFor="c-lang">Language spoken</label>
                <div className="relative">
                  <select id="c-lang" value={f.lang} onChange={set("lang")} className={`${DK.input(false)} appearance-none pr-10`}>
                    {LANGUAGES.map((l) => <option key={l} value={l} className="bg-[#0e0f13]">{l}</option>)}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 mt-2 flex items-center text-slate-400"><Icon name="chevron" className="h-4 w-4" /></span>
                </div>
              </div>
              <div>
                <label className={DK.label} htmlFor="c-pitch">Tell us more details (What exactly do you want to host? Explain your setup, requirements, and full plan).</label>
                <textarea id="c-pitch" rows={7} value={f.pitch} onChange={set("pitch")} maxLength={2500}
                  placeholder="The concept and who it's for, the run of show from doors to close, your setup (music, food and drinks, decorations, equipment), safety and supervision, how guests get there, and anything you need from the venue or from us."
                  className={`${DK.input(!!errors.pitch)} resize-y leading-relaxed`} />
                <div className="mt-2 flex items-start justify-between gap-4 text-xs">
                  {errors.pitch ? <span className="text-sm text-rose-300">{errors.pitch}</span> : <span className="text-slate-400">A thorough plan gets approved faster.</span>}
                  <span aria-live="polite" className={`shrink-0 tabular-nums font-medium transition-colors ${chars >= PITCH_MIN_CHARS ? "text-emerald-400" : "text-slate-400"}`}>
                    {chars >= PITCH_MIN_CHARS && "✓ "}{chars} / {PITCH_MIN_CHARS} characters minimum
                  </span>
                </div>
              </div>
            </DkSection>

            <DkSection n={3} title="When & where">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={DK.label} htmlFor="c-date">Date</label>
                  <DkDatePicker id="c-date" min={earliest.date} value={f.date} onChange={(v) => set("date")({ target: { value: v } })} bad={!!errors.date} />
                </div>
                <div>
                  <label className={DK.label} htmlFor="c-time">Starts {dubai}</label>
                  <DkTimeSelect id="c-time" min={f.date === earliest.date ? earliest.time : undefined} value={f.time} onChange={(v) => set("time")({ target: { value: v } })} bad={!!errors.time || !!errors.date} />
                </div>
                <div>
                  <label className={DK.label} htmlFor="c-end">Ends {dubai}</label>
                  <DkTimeSelect id="c-end" value={f.end} onChange={(v) => set("end")({ target: { value: v } })} bad={!!errors.end} />
                </div>
              </div>
              {errors.date || errors.time || errors.end
                ? <div className="-mt-3 space-y-1">{["date", "time", "end"].map((k) => <E key={k} k={k} />)}</div>
                : <p className="-mt-3 text-xs text-slate-400">Applications close 24 hours before the start. Earliest start right now: {fmtDate(earliest.date)}, {fmtTime(earliest.time)} (Dubai time).</p>}
              <div>
                <label className={DK.label} htmlFor="c-venueName">Venue name</label>
                <input id="c-venueName" value={f.venueName} onChange={set("venueName")} autoComplete="off" placeholder="e.g. Marina Rooftop Lounge" className={DK.input(!!errors.venueName)} />
                <E k="venueName" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={DK.label} htmlFor="c-room">Room or meeting point <span className="text-slate-500">· optional</span></label>
                  <input id="c-room" value={f.room} onChange={set("room")} autoComplete="off" placeholder="Level 3 terrace" className={DK.input(false)} />
                </div>
                <div>
                  <label className={DK.label} htmlFor="c-mapsUrl">Google Maps link</label>
                  <input id="c-mapsUrl" type="url" inputMode="url" autoComplete="off" value={f.mapsUrl} onChange={set("mapsUrl")} placeholder="https://maps.app.goo.gl/…" className={DK.input(!!errors.mapsUrl)} />
                  {errors.mapsUrl ? <E k="mapsUrl" /> : <p className={DK.hint}>In Google Maps: open the venue → Share → Copy link.</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={DK.label} htmlFor="c-spots">Capacity</label>
                  <input id="c-spots" type="number" inputMode="numeric" min="1" value={f.spots} onChange={set("spots")} className={DK.input(!!errors.spots)} />
                  <E k="spots" />
                </div>
                <div>
                  <label className={DK.label} htmlFor="c-price">Ticket price (AED)</label>
                  <input id="c-price" type="number" inputMode="decimal" min="0" value={f.price} onChange={set("price")} className={DK.input(!!errors.price)} />
                  {errors.price ? <E k="price" /> : <p className={DK.hint}>{Number(f.price) > 0 ? "Paid securely via Ziina." : "0 means free entry."}</p>}
                </div>
              </div>
            </DkSection>

            {trip && (
              <DkSection n={4} title="Group trip">
                <p className="-mt-2 rounded-xl bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-slate-300 ring-1 ring-white/10">{TRIP_NOTE}</p>
                <div>
                  <label className={DK.label} htmlFor="c-extName">External event name</label>
                  <input id="c-extName" value={f.extName} onChange={set("extName")} autoComplete="off" placeholder="e.g. Coldplay · Music of the Spheres" className={DK.input(!!errors.extName)} />
                  <E k="extName" />
                </div>
                <div>
                  <label className={DK.label} htmlFor="c-seller">Official ticket seller</label>
                  <input id="c-seller" value={f.seller} onChange={set("seller")} autoComplete="off" placeholder="e.g. Platinumlist, Ticketmaster, the venue's website" className={DK.input(!!errors.seller)} />
                  {errors.seller ? <E k="seller" /> : <p className={DK.hint}>Where you'll buy the real tickets for your group.</p>}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={DK.label} htmlFor="c-minGroup">Minimum group size</label>
                    <input id="c-minGroup" type="number" inputMode="numeric" min="1" value={f.minGroup} onChange={set("minGroup")} className={DK.input(!!errors.minGroup)} />
                    {errors.minGroup ? <E k="minGroup" /> : <p className={DK.hint}>The trip only goes ahead with at least this many people.</p>}
                  </div>
                  <div>
                    <label className={DK.label} htmlFor="c-collectUntil">Collect payments until</label>
                    <DkDatePicker id="c-collectUntil" min={todayDubai} value={f.collectUntil} onChange={(v) => set("collectUntil")({ target: { value: v } })} bad={!!errors.collectUntil} />
                    {errors.collectUntil ? <E k="collectUntil" /> : <p className={DK.hint}>Closes at 11:59 PM (Dubai time) that day, at least 24 hours before the event.</p>}
                  </div>
                </div>
              </DkSection>
            )}

            <DkSection n={trip ? 5 : 4} title="Details">
              <div>
                <span className={DK.label}>Dress code</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DRESS_CODES.map((d) => <button key={d} type="button" aria-pressed={f.dress === d} onClick={() => setF({ ...f, dress: f.dress === d ? "" : d })} className={DK.chip(f.dress === d)}>{d}</button>)}
                </div>
              </div>
              <div>
                <label className={DK.label} htmlFor="c-reqs">What guests should bring or know <span className="text-slate-500">· optional</span></label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {REQ_CHIPS.map((r) => <button key={r} type="button" aria-pressed={f.reqs.includes(r)} onClick={() => addReq(r)} className={DK.chip(f.reqs.includes(r))}>{r}</button>)}
                </div>
                <textarea id="c-reqs" rows={2} value={f.reqs} onChange={set("reqs")} placeholder="Anything else guests need to know" className={`${DK.input(false)} mt-3 resize-none`} />
              </div>
            </DkSection>

            <DkSection n={trip ? 6 : 5} title="Organizer contacts">
              <p className="-mt-2 text-sm text-slate-400">Shown on your event once it's approved. Add WhatsApp, Telegram or both.</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={DK.label} htmlFor="c-whatsapp">WhatsApp number</label>
                  <input id="c-whatsapp" type="tel" inputMode="tel" autoComplete="tel" value={f.whatsapp} onChange={set("whatsapp")} placeholder="+971 50 123 4567" className={DK.input(!!errors.whatsapp)} />
                  <E k="whatsapp" />
                </div>
                <div>
                  <label className={DK.label} htmlFor="c-telegram">Telegram username</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 mt-2 flex items-center text-[15px] text-slate-500">@</span>
                    <input id="c-telegram" value={f.telegram} onChange={(e) => set("telegram")({ target: { value: e.target.value.replace(/^@+/, "") } })} placeholder="username"
                      autoCapitalize="off" autoCorrect="off" spellCheck="false" className={`${DK.input(!!errors.telegram)} pl-8`} />
                  </div>
                  <E k="telegram" />
                </div>
              </div>
              <div>
                <label className={DK.label} htmlFor="c-email">Contact email</label>
                <input id="c-email" type="email" value={f.email} onChange={set("email")} className={DK.input(!!errors.email)} />
                {errors.email ? <E k="email" /> : <p className={DK.hint}>Your approval notification is sent here too.</p>}
              </div>
            </DkSection>
          </div>
          )}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set("website")}
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
        </div>

        {/* Footer */}
        <div className="u-keep shrink-0 border-t border-white/[0.06] bg-[#0e0f13] px-6 py-4 sm:px-10" style={{ paddingBottom: "max(1rem, var(--sabx))", paddingLeft: "max(1.5rem, var(--sal))", paddingRight: "max(1.5rem, var(--sar))" }}>
          {sendError && !confirm && <p role="alert" className="mb-3 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200 ring-1 ring-inset ring-rose-400/30">{sendError}</p>}
          {step === "form" && Object.values(errors).some(Boolean) && <p className="mb-3 text-sm text-rose-300">A few details need your attention above.</p>}
          {typeStep ? (
            <button onClick={() => { setStep("form"); }} disabled={!f.kind}
              className="u-keep flex w-full items-center justify-center gap-2 rounded-xl bg-crimson-700 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-crimson-600 active:scale-[0.98] disabled:opacity-40">{f.kind ? "Continue →" : "Choose a type to continue"}</button>
          ) : preview ? (
            <>
            <ConsentRow className="mb-3" checked={agreed} onChange={setAgreed} attempt={attempt} />
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button onClick={() => setStep("form")} disabled={submitting}
                className="u-keep rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white ring-1 ring-white/15 transition-all hover:bg-white/10 active:scale-[0.98] disabled:opacity-50 sm:w-auto">← Keep editing</button>
              <button onClick={() => (agreed ? setConfirm(true) : setAttempt((n) => n + 1))} disabled={submitting}
                className="u-keep flex flex-1 items-center justify-center gap-2 rounded-xl bg-crimson-700 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-crimson-600 active:scale-[0.98] disabled:opacity-80">Submit for review</button>
            </div>
            </>
          ) : (
            <button onClick={review}
              className="u-keep flex w-full items-center justify-center gap-2 rounded-xl bg-crimson-700 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-crimson-600 active:scale-[0.98]">Preview event →</button>
          )}
        </div>

        {/* Confirmation */}
        {confirm && (
          <div className="u-keep u-fade absolute inset-0 z-20 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
            onMouseDown={(e) => e.target === e.currentTarget && !submitting && setConfirm(false)}>
            <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-text"
              className="u-up u-sheet-h w-full max-w-sm overflow-y-auto rounded-3xl bg-[#15161b] p-6 text-center shadow-2xl ring-1 ring-white/10" style={{ marginBottom: "var(--sabx)" }}>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-crimson-700/25 text-crimson-200 ring-1 ring-inset ring-crimson-400/30" aria-hidden="true"><Icon name="mail" className="h-5 w-5" /></span>
              <h3 id="confirm-title" className="mt-4 text-lg font-semibold text-white">Submit for review?</h3>
              <p id="confirm-text" className="mt-2 text-sm leading-relaxed text-slate-300">Your event will be sent to the Unite team for review. You can still edit it while it's pending.</p>
              {sendError && <p role="alert" className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200 ring-1 ring-inset ring-rose-400/30">{sendError}</p>}
              <div className="mt-6 flex gap-3">
                <button onClick={() => setConfirm(false)} disabled={submitting}
                  className="u-keep flex-1 rounded-xl py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition-all hover:bg-white/10 active:scale-[0.98] disabled:opacity-50">Not yet</button>
                <button ref={yesRef} onClick={send} disabled={submitting}
                  className="u-keep flex flex-1 items-center justify-center gap-2 rounded-xl bg-crimson-700 py-3 text-sm font-semibold text-white transition-all hover:bg-crimson-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-300 active:scale-[0.98] disabled:opacity-80">
                  {submitting ? (<><span className="u-spin inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent" /> Sending…</>) : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
