import { dayTag, shortVenue } from "../lib/format.js";
import { tgHandle, waDigits } from "../lib/maps.js";
import { qrMatrix } from "../lib/qr.js";



export const DayTag = ({ iso }) => {
  const t = dayTag(iso);
  return t ? <span className="rounded-full bg-crimson-50 px-1.5 py-0.5 text-[11px] font-semibold text-crimson-700 ring-1 ring-crimson-100">{t}</span> : null;
};

export const Check = ({ className = "h-3.5 w-3.5" }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
  </svg>
);

export const ICONS = {
  calendar: "M8 2.5v3M16 2.5v3M3.5 9.5h17M5 4.5h14A1.5 1.5 0 0120.5 6v13a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 19V6A1.5 1.5 0 015 4.5z",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  users: "M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20M10 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM20 20v-1.5a3.5 3.5 0 00-2.5-3.35M15.5 4.15a3.5 3.5 0 010 6.7",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  user: "M20 21v-1.5a4 4 0 00-4-4H8a4 4 0 00-4 4V21M12 11.5a4 4 0 100-8 4 4 0 000 8z",
  lock: "M6.5 11h11a1.5 1.5 0 011.5 1.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 19.5v-7A1.5 1.5 0 016.5 11zM8 11V7.5a4 4 0 018 0V11",
  shield: "M12 3l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V6L12 3zM9 12l2 2 4-4",
  card: "M4.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-11A1.5 1.5 0 014.5 5zM3 10h18M7 15h3",
  phone: "M8 2.5h8A1.5 1.5 0 0117.5 4v16a1.5 1.5 0 01-1.5 1.5H8A1.5 1.5 0 016.5 20V4A1.5 1.5 0 018 2.5zM11 18.5h2",
  mail: "M4.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-11A1.5 1.5 0 014.5 5zM3.5 6.5l8.5 6.5 8.5-6.5",
  sun: "M12 16a4 4 0 100-8 4 4 0 000 8zM12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
  moon: "M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3.5 9h17M3.5 15h17M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9s1.2-6.4 3.6-9z",
  chevron: "M6 9l6 6 6-6",
};
export const Icon = ({ name, className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
);
export const InfoIcon = ({ name }) => (
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70"><Icon name={name} /></span>
);

export const VenueChip = ({ where, href }) =>
  href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" title={`Open ${shortVenue(where)} in Google Maps`}
      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200/70 hover:bg-slate-100 hover:text-crimson-700 hover:ring-indigo-200">
      <Icon name="pin" className="h-3 w-3 text-slate-500" />{shortVenue(where)}<span aria-hidden="true" className="text-slate-400">↗</span>
    </a>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200/70">
      <Icon name="pin" className="h-3 w-3 text-slate-500" />{shortVenue(where)}
    </span>
  );

/* Organizer contact buttons: WhatsApp, Telegram, Email (whichever are provided). */
export function ContactButtons({ contact: c, subject }) {
  const btn = "u-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-inset";
  return (
    <div className="flex flex-wrap gap-2">
      {c.whatsapp && (
        <a href={`https://wa.me/${waDigits(c.whatsapp)}?text=${encodeURIComponent(`Hi! I'm interested in ${subject} (via Unite).`)}`} target="_blank" rel="noopener noreferrer"
          className={`${btn} bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100`} aria-label={`WhatsApp ${c.whatsapp}`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.1.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.5-.3z" /></svg>
          WhatsApp
        </a>
      )}
      {c.telegram && (
        <a href={`https://t.me/${tgHandle(c.telegram)}`} target="_blank" rel="noopener noreferrer"
          className={`${btn} bg-sky-50 text-sky-700 ring-sky-200 hover:bg-sky-100`} aria-label={`Telegram @${tgHandle(c.telegram)}`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M21.9 4.3l-3.2 15.2c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.2-8.3c.4-.4-.1-.6-.6-.2L6.1 13.2l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6L20.5 2.8c.9-.3 1.7.2 1.4 1.5z" /></svg>
          @{tgHandle(c.telegram)}
        </a>
      )}
      {c.email && (
        <a href={`mailto:${c.email}?subject=${encodeURIComponent(subject)}`}
          className={`${btn} bg-white text-slate-700 ring-slate-200 hover:bg-slate-50`}>
          <Icon name="mail" className="h-4 w-4" /> Email
        </a>
      )}
    </div>
  );
}

export const LangBadge = ({ lang }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
    <Icon name="globe" className="h-3 w-3" />{lang}
  </span>
);


export const Badge = ({ team }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-crimson-50 px-2 py-0.5 text-xs font-semibold text-crimson-700 ring-1 ring-crimson-200">
    <Check /> Official UOWD {team ? "Team" : "Club"}
  </span>
);


// Calendar-style date: "OCT / 9 / FRI".
export const DateBlock = ({ iso, className = "" }) => {
  const d = new Date(iso + "T00:00:00");
  return (
    <div className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-1.5 leading-none ${className}`} aria-hidden="true">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-crimson-700">{d.toLocaleDateString("en-GB", { month: "short" })}</span>
      <span className="mt-1 text-xl font-bold tabular-nums text-slate-900">{d.getDate()}</span>
      <span className="mt-0.5 text-[10px] font-medium uppercase text-slate-500">{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
    </div>
  );
};
export const ShareBtn = ({ onClick, light = false }) => (
  <button onClick={onClick} aria-label="Share event" title="Share event"
    className={light ? "u-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50" : "u-keep flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white hover:bg-white hover:bg-opacity-30"}
    style={light ? undefined : { background: "rgba(255,255,255,0.22)" }}>
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13" />
    </svg>
  </button>
);

export function Spots({ left, total, unit = "spots", wait = 0, long = false, bar = true }) {
  const pct = Math.min(100, ((total - left) / total) * 100);
  const urgent = left > 0 && left <= 5;
  const noun = left > 1 ? unit : unit.replace(/s$/, "");
  return (
    <div>
      {bar && <div className={`overflow-hidden rounded-full bg-slate-100 ${long ? "h-2" : "h-1"}`}>
        <div
          className={`h-full rounded-full ${left <= 0 ? "bg-slate-400" : urgent ? "bg-crimson-600" : "bg-slate-700"}`}
          style={{ width: pct + "%", transition: "width .6s ease" }}
        />
      </div>}
      <div className={`${bar ? "mt-1.5" : ""} flex items-center gap-2 ${long ? "text-sm" : "text-xs"}`}>
        {left <= 0 ? (
          <span className="font-semibold text-slate-500">Fully booked{wait > 0 ? ` · ${wait} on the waitlist` : ""}</span>
        ) : urgent ? (
          <span className="font-semibold text-crimson-700">Only {left} {noun} {long ? "remaining" : "left"}</span>
        ) : (
          <span className="text-slate-500">{left} of {total} {unit} {long ? "remaining" : "left"}</span>
        )}
      </div>
    </div>
  );
}


export function QRCode({ value, className = "h-40 w-40" }) {
  const m = qrMatrix(value);
  const rects = [];
  m.forEach((row, y) => row.forEach((d, x) => { if (d) rects.push(<rect key={x + "-" + y} x={x} y={y} width="1" height="1" />); }));
  return (
    <svg viewBox="-3 -3 27 27" className={className} shapeRendering="crispEdges" role="img" aria-label={"Ticket QR code " + value} data-qr={value}>
      <rect x="-3" y="-3" width="27" height="27" fill="#ffffff" />
      <g fill="#0f172a">{rects}</g>
    </svg>
  );
}

export const AnimatedCheck = ({ className = "h-16 w-16" }) => (
  <svg viewBox="0 0 52 52" className={className} aria-hidden="true">
    <circle className="u-ring" cx="26" cy="26" r="24" fill="none" stroke="#10b981" strokeWidth="3" />
    <path className="u-tick" d="M15 27l8 8 14-16" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* Event artwork for headers/thumbnails: logo image or emoji fallback. */
export const EventLogo = ({ p, className = "h-12 w-12 text-2xl" }) =>
  p.logo ? <img src={p.logo} alt="" loading="lazy" decoding="async" draggable={false} className={`${className} shrink-0 rounded-xl object-cover`} style={{ aspectRatio: "1 / 1" }} />
    : <span className={`${className} flex shrink-0 items-center justify-center`}>{p.emoji}</span>;

export const ReviewBadge = ({ r }) =>
  r.status === "approved" ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"><Check className="h-3 w-3" /> Approved · Live</span>
  ) : r.status === "rejected" ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">✕ Not approved</span>
  ) : r.moderated ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">{r.mod === "under_review" ? "🔍 Additional check" : "Pending moderation"}</span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">Party Under Review · ~{r.left}</span>
  );
