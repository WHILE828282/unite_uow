import { useEffect, useRef, useState } from "react";
import { Icon } from "../ui.jsx";
import { typingNow } from "./Modal.jsx";
import { isSports } from "../../data/clubs.js";
import { scheduleLabel } from "../../lib/schedule.js";
import { GRADIENTS } from "../../lib/styles.js";

/* Official UOWD Sports tryouts registration (Jotform), embedded full-height.
   The sports checkbox is pre-filled through Jotform's URL parameters: ?<field unique name>=Option1,Option2.
   JOTFORM_SPORT_FIELD must match the checkbox's "Unique Name" in the Jotform builder
   (field settings > Advanced > Field Details). Unknown parameters are ignored by Jotform. */
export const UOWD_TRYOUTS_URL = "https://uowd.jotform.com/251912229886062";
export const JOTFORM_SPORT_FIELD = "sport";
export const JOTFORM_SPORTS = ["Badminton", "Basketball", "Cricket", "Football", "Volleyball", "Table Tennis", "Track", "Padel", "Tennis", "Swimming", "Chess"];

export const tryoutUrl = (c) => {
  const picks = (c.form || []).filter((o) => JOTFORM_SPORTS.includes(o));
  return picks.length ? `${UOWD_TRYOUTS_URL}?${JOTFORM_SPORT_FIELD}=${picks.map(encodeURIComponent).join(",")}` : UOWD_TRYOUTS_URL;
};

/* Always dark, whatever the site theme: only fixed dark colours are used here, none that the
   .u-dark palette remap touches, and every surface carries u-keep. */
export function TryoutModal({ club: c, onSent, onClose }) {
  const sentRef = useRef(false); // one registration per tap, even if double-tapped
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const src = tryoutUrl(c);
  const picks = (c.form || []).filter((o) => JOTFORM_SPORTS.includes(o));
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000);
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => { clearTimeout(t); window.removeEventListener("keydown", h); };
  }, [onClose]);

  return (
    <div className="u-keep u-fade u-vv u-full-pad fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 sm:items-center sm:p-6 sm:backdrop-blur-md"
      onMouseDown={(e) => { if (e.target !== e.currentTarget) return; if (typingNow()) { e.preventDefault(); if (document.activeElement) document.activeElement.blur(); return; } onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={`UOWD registration for ${c.name}`}
        className="u-keep u-up u-full-h flex w-full flex-col overflow-hidden bg-[#0b0b0e] text-white shadow-2xl ring-1 ring-white/10 sm:max-w-3xl sm:rounded-3xl"
        style={{ colorScheme: "dark" }}>

        {/* Header: solid, locked dark */}
        <div className="u-keep shrink-0 border-b border-white/10 bg-[#0e0f13] px-4 pb-4 text-white sm:px-6 [@media(max-height:500px)]:pb-2" style={{ paddingTop: "calc(var(--sat) + 0.75rem)", paddingLeft: "max(1rem, var(--sal))", paddingRight: "max(1rem, var(--sar))" }}>
          <div className="flex items-center justify-between gap-2">
            <button onClick={onClose} className="u-keep inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/20">
              <Icon name="arrow-left" className="h-4 w-4" /> Back
            </button>
            <div className="flex items-center gap-2">
              <a href={src} target="_blank" rel="noopener noreferrer" className="u-keep inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-white/20">
                Open in new tab ↗
              </a>
              <button onClick={onClose} aria-label="Close" className="u-keep flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/10 hover:bg-white/20"><Icon name="close" className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="u-short-hide mt-4 flex items-center gap-3">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg ${GRADIENTS[c.category]}`}>{c.emoji}</span>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-crimson-600/20 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-crimson-200 ring-1 ring-inset ring-crimson-400/40">
                <Icon name="shield" className="h-3.5 w-3.5" /> Official UOWD Form
              </p>
              <h2 className="mt-1 truncate text-lg font-bold leading-tight text-white sm:text-xl">{isSports(c) ? "Tryout sign-up" : "Join the club"}</h2>
              <p className="truncate text-sm text-slate-400">For {c.name} · processed by UOWD Student Services</p>
            </div>
          </div>
          <div className="u-short-hide mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            {picks.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                Sport{picks.length > 1 ? "s" : ""}:
                {picks.map((o) => <span key={o} className="rounded-md bg-crimson-700 px-2 py-0.5 font-semibold text-white ring-1 ring-inset ring-crimson-400/40">{o}</span>)}
                <span className="text-slate-400">· pre-selected, please check it's ticked</span>
              </span>
            )}
            <span className="hidden text-slate-400 sm:inline">Answers go straight to UOWD, not to Unite.</span>
          </div>
        </div>

        {/* Form: the white Jotform sits on the dark frame */}
        <div className="u-keep u-scroll relative min-h-0 flex-1 overflow-auto bg-[#0b0b0e] sm:p-3 [@media(max-height:500px)]:p-0" style={{ paddingLeft: "var(--sal)", paddingRight: "var(--sar)" }}>
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="u-spin h-9 w-9 rounded-full border-4 border-white/10 border-t-crimson-400" />
              <p className="text-sm font-medium text-slate-300">Loading the official UOWD form…</p>
              {slow && <p className="text-xs text-slate-400">Taking a while? <a href={src} target="_blank" rel="noopener noreferrer" className="font-semibold text-crimson-400 hover:underline">Open it in a new tab ↗</a></p>}
            </div>
          )}
          <iframe
            key={src}
            title={`UOWD registration form for ${c.name}`}
            src={src}
            onLoad={() => setLoaded(true)}
            allow="fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            className="u-keep h-full w-full border-0 bg-white sm:rounded-2xl"
            style={{ opacity: loaded ? 1 : 0, transition: "opacity .3s ease", colorScheme: "light" }}
          />
        </div>

        {/* Footer: locked dark */}
        <div className="u-keep flex shrink-0 flex-col gap-2 border-t border-white/10 bg-[#0e0f13] p-3 sm:flex-row sm:items-center sm:px-6 [@media(max-height:500px)]:py-2" style={{ paddingBottom: "max(0.75rem, var(--sabx))", paddingLeft: "max(0.75rem, var(--sal))", paddingRight: "max(0.75rem, var(--sar))" }}>
          <button onClick={() => { if (sentRef.current) return; sentRef.current = true; onSent(); }} className="u-keep u-btn flex-1 rounded-xl bg-crimson-700 py-3 text-sm font-semibold text-white hover:bg-crimson-600">
            I've sent the form
            <span className="ml-1.5 font-normal text-white/70">· adds {scheduleLabel(c, true)} to My Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
}
