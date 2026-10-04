import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DOCS, LEGAL_UPDATED, LEGAL_VERSION } from "../data/legal.js";
import { Icon } from "./ui.jsx";

/* Terms of Use / Privacy Policy: the document body, the full page (/terms, /privacy), the bottom sheet opened from
   consent checkboxes, the consent row itself, and the record of which version was accepted. */

const DEVICE_KEY = "unite-legal";
export const legalRecord = () => ({ version: LEGAL_VERSION, at: Date.now() });
export const deviceAccepted = () => { try { return (JSON.parse(localStorage.getItem(DEVICE_KEY) || "null") || {}).version === LEGAL_VERSION; } catch (e) { return false; } };
export const rememberOnDevice = (rec) => { try { localStorage.setItem(DEVICE_KEY, JSON.stringify(rec)); } catch (e) { /* ignore */ } };

function LegalBody({ doc, toc = true }) {
  return (
    <>
      <p className="text-[15px] leading-relaxed text-slate-600">{doc.intro}</p>
      {toc && (
        <nav aria-label="Contents" className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Contents</p>
          <ol className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {doc.sections.map((s, i) => (
              <li key={s.id}><a href={`#${s.id}`} onClick={(e) => { e.preventDefault(); const el = e.currentTarget.ownerDocument.getElementById(s.id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                className="inline-flex py-1 font-medium text-crimson-700 hover:underline">{i + 1}. {s.title}</a></li>
            ))}
          </ol>
        </nav>
      )}
      {doc.sections.map((s, i) => (
        <section key={s.id} id={s.id} className="scroll-mt-20 pt-8">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">{i + 1}. {s.title}</h2>
          {s.body.map((b, j) => (typeof b === "string"
            ? <p key={j} className="mt-3 text-[15px] leading-7 text-slate-700">{b}</p>
            : <ul key={j} className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-7 text-slate-700 marker:text-crimson-400">{b.list.map((x) => <li key={x}>{x}</li>)}</ul>))}
        </section>
      ))}
    </>
  );
}

/* Full page: /terms and /privacy. */
export function LegalPage({ kind }) {
  const doc = DOCS[kind];
  const dark = (() => { try { return localStorage.getItem("unite-theme") === "dark"; } catch (e) { return false; } })();
  useEffect(() => { document.title = `${doc.title} · Unite`; }, [doc]);
  const back = () => { if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) window.history.back(); else window.location.href = "/"; };
  return (
    <div className={`u-page min-h-screen bg-slate-50 text-slate-900 ${dark ? "u-dark" : "u-light"}`}>
      <header className="u-safe-top sticky top-0 z-10 border-b border-slate-200/60 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button onClick={back} className="u-btn inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
            <Icon name="chevron" className="h-4 w-4 rotate-90" /> Back
          </button>
          <span className="truncate text-sm font-semibold text-slate-500">Unite · {doc.title}</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-8 sm:pt-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{doc.title}</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LEGAL_UPDATED}</p>
        <div className="mt-6"><LegalBody doc={doc} /></div>
        <p className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-500">
          See also: <a href={kind === "terms" ? "/privacy" : "/terms"} className="font-semibold text-crimson-700 hover:underline">{kind === "terms" ? "Privacy Policy" : "Terms of Use"}</a>
        </p>
      </main>
    </div>
  );
}

/* Bottom sheet over a form (full height on phones, centred panel on computers). Closing keeps the form as it was. */
export function LegalSheet({ kind, onClose }) {
  const doc = DOCS[kind];
  const [drag, setDrag] = useState(0);
  const start = useRef(null);
  const bodyRef = useRef(null);
  useEffect(() => {
    // Escape and the phone's Back close only this sheet, not the form underneath.
    const esc = (e) => { if (e.key === "Escape") { e.stopImmediatePropagation(); onClose(); } };
    const back = (e) => { e.preventDefault(); onClose(); };
    window.addEventListener("keydown", esc, true);
    window.addEventListener("unite:back", back);
    return () => { window.removeEventListener("keydown", esc, true); window.removeEventListener("unite:back", back); };
  }, [onClose]);
  const dark = !!document.querySelector(".u-dark");
  const onStart = (e) => { start.current = e.touches[0].clientY; };
  const onMove = (e) => { if (start.current != null) setDrag(Math.max(0, e.touches[0].clientY - start.current)); };
  const onEnd = () => { if (drag > 110) onClose(); else setDrag(0); start.current = null; };
  return createPortal(
    <div className={`u-fade fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-6 ${dark ? "u-dark" : "u-light"}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-label={doc.title}>
      <div className="u-up flex w-full flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:max-w-2xl sm:rounded-3xl"
        style={{ height: "calc(var(--vvh, 100vh) - var(--sat) - 12px)", maxHeight: "min(calc(var(--vvh, 100vh) - var(--sat) - 12px), 860px)", transform: drag ? `translateY(${drag}px)` : undefined, transition: drag ? "none" : "transform .25s ease" }}>
        <div className="shrink-0 border-b border-slate-200/70 bg-white px-5 pb-3 pt-2" onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}>
          <span className="mx-auto block h-1.5 w-10 rounded-full bg-slate-300" aria-hidden="true" />
          <div className="mt-2 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-bold text-slate-900">{doc.title}</h2>
              <p className="text-xs text-slate-500">Last updated: {LEGAL_UPDATED}</p>
            </div>
            <a href={`/${kind}`} target="_blank" rel="noopener" className="u-btn shrink-0 rounded-lg px-3 py-2.5 text-sm font-semibold text-crimson-700 hover:bg-slate-100">Open full page ↗</a>
            <button onClick={onClose} aria-label="Close" className="u-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"><Icon name="close" className="h-4 w-4" /></button>
          </div>
        </div>
        <div ref={bodyRef} className="u-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-5" style={{ paddingBottom: "max(2.5rem, var(--sabx))" }}>
          <div className="mx-auto max-w-[38rem]"><LegalBody doc={doc} toc={false} /></div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* "I agree to the Terms of Use and Privacy Policy": never pre-ticked, the whole row toggles it, the two names open
   the documents in a sheet. `attempt` goes up each time the user tries to continue unticked: the row shakes. */
export function ConsentRow({ checked, onChange, attempt = 0, extra, dark = false, className = "" }) {
  const [doc, setDoc] = useState(null);
  const show = attempt > 0 && !checked;
  const rowRef = useRef(null);
  // Bring the row into view when someone tries to continue without ticking it, so the shake is seen.
  useEffect(() => { if (attempt > 0 && !checked && rowRef.current) rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); }, [attempt]); // eslint-disable-line
  const open = (k) => (e) => { e.preventDefault(); e.stopPropagation(); setDoc(k); };
  const link = `font-semibold underline underline-offset-2 ${dark ? "u-keep text-white decoration-white/40" : "text-slate-900 decoration-slate-400"}`;
  return (
    <div ref={rowRef} className={className}>
      <label key={show ? attempt : "ok"} className={`flex cursor-pointer select-none items-start gap-3 rounded-2xl p-4 ring-1 transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.99] ${show ? "u-shake" : ""} ${dark ? `u-keep ${show ? "ring-rose-400/70 bg-rose-500/[0.06]" : "ring-white/10 hover:bg-white/[0.03]"}` : show ? "bg-rose-50 ring-rose-300" : checked ? "bg-white ring-crimson-200" : "bg-white ring-slate-200 hover:bg-slate-50 hover:ring-slate-300"}`}>
        <span className="relative mt-px flex h-[22px] w-[22px] shrink-0">
          <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
            className="peer h-[22px] w-[22px] cursor-pointer appearance-none rounded-[7px] border-2 border-slate-300 bg-white transition-colors checked:border-crimson-700 checked:bg-crimson-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-400" />
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 scale-50 text-white opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <span className={`text-sm leading-relaxed ${dark ? "u-keep text-slate-300" : "text-slate-700"}`}>
          I agree to the <button type="button" onClick={open("terms")} className={link}>Terms of Use</button> and <button type="button" onClick={open("privacy")} className={link}>Privacy Policy</button>
          {extra && <span className={`mt-1 block text-xs ${dark ? "u-keep text-slate-400" : "text-slate-500"}`}>{extra}</span>}
        </span>
      </label>
      {show && <p role="alert" className={`mt-1.5 text-xs font-medium ${dark ? "u-keep text-rose-300" : "text-rose-600"}`}>Please accept to continue</p>}
      {doc && <LegalSheet kind={doc} onClose={() => setDoc(null)} />}
    </div>
  );
}

/* Shown once to signed-in users when the documents change. */
export function UpdatedTermsSheet({ onAccept }) {
  const [doc, setDoc] = useState(null);
  const dark = !!document.querySelector(".u-dark");
  return createPortal(
    <div className={`u-fade fixed inset-0 z-[65] flex items-end justify-center bg-black/50 sm:items-center sm:p-6 ${dark ? "u-dark" : "u-light"}`} role="dialog" aria-modal="true" aria-labelledby="legal-upd">
      <div className="u-up w-full rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-md sm:rounded-3xl" style={{ paddingBottom: "max(1.5rem, var(--sabx))" }}>
        <span className="mx-auto block h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" aria-hidden="true" />
        <h2 id="legal-upd" className="mt-3 text-lg font-bold text-slate-900">We've updated our Terms</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Please take a moment to read the updated <button type="button" onClick={() => setDoc("terms")} className="font-semibold text-slate-900 underline underline-offset-2">Terms of Use</button> and <button type="button" onClick={() => setDoc("privacy")} className="font-semibold text-slate-900 underline underline-offset-2">Privacy Policy</button>. By tapping Accept you agree to them.</p>
        <button onClick={onAccept} className="u-btn mt-5 w-full rounded-xl bg-slate-900 py-3.5 text-[15px] font-semibold text-white hover:bg-slate-800">Accept</button>
      </div>
      {doc && <LegalSheet kind={doc} onClose={() => setDoc(null)} />}
    </div>,
    document.body,
  );
}
