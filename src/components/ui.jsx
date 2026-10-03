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

// Outline icons with a crimson accent dot (Unite icon set). `d`: stroked path; `dot`: [cx, cy, r] filled accent.
const ACCENT = "#e11d48";
export const ICONS = {
  calendar: { d: "M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v10a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 17.5v-10zM4 10h16M8.5 3v4M15.5 3v4", dot: [15.5, 15.5, 1.6] },
  pin: { d: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z", dot: [12, 10, 2.3] },
  users: { d: "M5.5 20v-.5A4.5 4.5 0 0110 15h4a4.5 4.5 0 014.5 4.5v.5M2.5 17.5v-.3A3.2 3.2 0 015 14.1M21.5 17.5v-.3a3.2 3.2 0 00-2.5-3.1M5.5 9.3a2.2 2.2 0 100-4.4 2.2 2.2 0 000 4.4zM18.5 9.3a2.2 2.2 0 100-4.4 2.2 2.2 0 000 4.4z", dot: [12, 9, 3] },
  user: { d: "M5.5 21v-1a6.5 6.5 0 0113 0v1", dot: [12, 7.5, 3.5] },
  clock: { d: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7.5V12l3 2", dot: [12, 12, 1.4] },
  share: { d: "M9 9.5H7.5a2 2 0 00-2 2V18a2 2 0 002 2h9a2 2 0 002-2v-6.5a2 2 0 00-2-2H15M12 14V3.5M8.75 6.75L12 3.5l3.25 3.25" },
  sun: { d: "M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4", dot: [12, 12, 4] },
  moon: { d: "M19.5 14.5A8 8 0 019.5 4.5a8 8 0 1010 10z", dot: [18.5, 4.5, 1.4] },
  chevron: { d: "M6 9l6 6 6-6" },
  image: { d: "M3.5 7A2.5 2.5 0 016 4.5h12A2.5 2.5 0 0120.5 7v10a2.5 2.5 0 01-2.5 2.5H6A2.5 2.5 0 013.5 17V7zM3.5 16l5-5 4.5 4.5 2.5-2.5 5 5", dot: [15.5, 9, 1.6] },
  ticket: { d: "M3.5 7.5A2 2 0 015.5 5.5h13a2 2 0 012 2v2a2.5 2.5 0 000 5v2a2 2 0 01-2 2h-13a2 2 0 01-2-2v-2a2.5 2.5 0 000-5v-2zM14.5 6v2M14.5 11v2M14.5 16v2", dot: [9, 12, 1.6] },
  close: { d: "M6 6l12 12M18 6L6 18" },
  plus: { d: "M12 5v14M5 12h14" },
  arrow: { d: "M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5" },
  check: { d: "M4.5 12.5l5 5 10-11" },
  search: { d: "M10.5 17.5a7 7 0 100-14 7 7 0 000 14zM15.5 15.5l5 5" },
  lock: { d: "M6.5 11h11a1.5 1.5 0 011.5 1.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 19.5v-7A1.5 1.5 0 016.5 11zM8 11V7.5a4 4 0 018 0V11", dot: [12, 16, 1.5] },
  shield: { d: "M12 3l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V6L12 3zM9 12l2 2 4-4" },
  card: { d: "M3 7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5v9a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5v-9zM3 10h18M7 15h3" },
  phone: { d: "M8 2.5h8A1.5 1.5 0 0117.5 4v16a1.5 1.5 0 01-1.5 1.5H8A1.5 1.5 0 016.5 20V4A1.5 1.5 0 018 2.5zM11 18.5h2" },
  mail: { d: "M3 7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5v9a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5v-9zM3.5 7l8.5 6.5L20.5 7" },
  globe: { d: "M12 21a9 9 0 100-18 9 9 0 000 18zM3.5 9h17M3.5 15h17M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9s1.2-6.4 3.6-9z" },
};
ICONS.people = ICONS.users; ICONS.person = ICONS.user;
export const Icon = ({ name, className = "h-4 w-4" }) => {
  const ic = ICONS[name] || ICONS.check;
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ic.d} />
      {ic.dot && <circle cx={ic.dot[0]} cy={ic.dot[1]} r={ic.dot[2]} fill={ACCENT} stroke="none" />}
    </svg>
  );
};
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
    <Icon name="share" className="h-4 w-4" />
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
  const m = qrMatrix(value), n = m.length;
  const rects = [];
  m.forEach((row, y) => row.forEach((d, x) => { if (d) rects.push(<rect key={x + "-" + y} x={x} y={y} width="1" height="1" />); }));
  return (
    <svg viewBox={`-3 -3 ${n + 6} ${n + 6}`} className={className} shapeRendering="crispEdges" role="img" aria-label={"Ticket QR code " + value} data-qr={value}>
      <rect x="-3" y="-3" width={n + 6} height={n + 6} fill="#ffffff" />
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
