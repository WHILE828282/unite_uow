import { lazy, Suspense, useEffect, useState } from "react";
import { platform, isIOS, isAndroid, isMobile, isStandalone, inAppBrowser, iosNotSafari, canPrompt, onPromptChange, promptInstall,
  bannerSnoozed, snoozeBanner, installPath, INSTALL_URL } from "./install.js";

const QrCode = lazy(() => import("./QrCode.jsx"));

/* Icons drawn for Unite (not store or brand logos): a phone for iPhone, the Android robot head (CC BY 3.0, Google). */
export const IPhoneGlyph = ({ className = "h-7 w-7" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
    <rect x="6" y="1.75" width="12" height="20.5" rx="3.2" stroke="currentColor" strokeWidth="1.6" />
    <rect x="9.6" y="3.4" width="4.8" height="1.4" rx=".7" fill="currentColor" />
    <path d="M12 9.2v6m0-6l-2.4 2.4M12 9.2l2.4 2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const AndroidGlyph = ({ className = "h-7 w-7" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#3DDC84" d="M17.6 9.48l1.84-3.18a.38.38 0 00-.66-.38l-1.86 3.22A11.3 11.3 0 0012 8.1c-1.77 0-3.43.38-4.92 1.04L5.22 5.92a.38.38 0 10-.66.38L6.4 9.48A10.8 10.8 0 001 18h22a10.8 10.8 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z" />
  </svg>
);

/* Store-style download badge (black, rounded, icon + two lines). Honest labels: Unite installs from the browser. */
export function InstallBadge({ kind, size = "md", onClick, className = "" }) {
  const big = size === "lg";
  return (
    <button type="button" onClick={onClick}
      className={`u-keep group inline-flex select-none items-center rounded-[11px] bg-black text-left text-white ring-1 ring-[#a6a6a6]/70 transition-all duration-200 hover:bg-[#111] hover:ring-white/80 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-400 ${big ? "h-[56px] gap-3 px-4" : "h-[46px] gap-2.5 px-3"} ${className}`}
      aria-label={kind === "ios" ? "Get the app on iPhone" : "Get the app on Android"}>
      {kind === "ios" ? <IPhoneGlyph className={big ? "h-8 w-8" : "h-7 w-7"} /> : <AndroidGlyph className={big ? "h-8 w-8" : "h-7 w-7"} />}
      <span className="flex flex-col leading-none">
        <span className={`${big ? "text-[11px]" : "text-[10px]"} font-medium tracking-wide text-white/85`}>Get the app on</span>
        <span className={`${big ? "mt-1 text-[22px]" : "mt-[3px] text-[18px]"} font-semibold tracking-tight`}>{kind === "ios" ? "iPhone" : "Android"}</span>
      </span>
    </button>
  );
}

const copy = async (t) => {
  try { await navigator.clipboard.writeText(t); return true; } catch (e) { /* fall back */ }
  try { const a = document.createElement("textarea"); a.value = t; a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); const ok = document.execCommand("copy"); a.remove(); return ok; } catch (e) { return false; }
};

/* "Open this page in Safari/Chrome" — in-app browsers (Instagram, TikTok, …) can't install web apps. */
export function InAppCard({ compact = false }) {
  const [copied, setCopied] = useState(false);
  const ios = isIOS();
  const browser = ios ? "Safari" : "Chrome";
  const app = inAppBrowser();
  const doCopy = async () => { if (await copy(INSTALL_URL)) { setCopied(true); setTimeout(() => setCopied(false), 2500); } };
  return (
    <div className="u-keep rounded-2xl bg-gradient-to-br from-crimson-700/30 to-[#112240] p-4 text-left text-white ring-1 ring-crimson-400/40" role="note">
      <p className="text-[15px] font-semibold">Open this page in {browser} to install</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-300">
        {app && app !== "an app" ? `${app}'s` : "This app's"} built-in browser can't add apps to your home screen. Tap <b className="text-white">{ios ? "•••" : "⋮"}</b> and choose <b className="text-white">“Open in {ios ? "Safari" : "browser"}”</b>, or copy the link and paste it into {browser}.
      </p>
      {!compact && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-black/25 p-3 ring-1 ring-white/10" aria-hidden="true">
          <svg viewBox="0 0 120 44" className="h-11 w-[120px] shrink-0">
            <rect x="1" y="1" width="118" height="42" rx="9" fill="#0b1222" stroke="#2a3a57" />
            <rect x="10" y="14" width="64" height="16" rx="8" fill="#16243f" />
            <text x="16" y="25.5" fontSize="8" fill="#94a3b8" fontFamily="system-ui">uniteuow.com</text>
            <circle className="u-ping" cx="98" cy="22" r="11" fill="#a83446" opacity=".5" />
            <text x="98" y="26" fontSize="13" fill="#fff" textAnchor="middle" fontWeight="700" fontFamily="system-ui">{ios ? "•••" : "⋮"}</text>
          </svg>
          <span className="text-xs leading-relaxed text-slate-300">Menu <b className="text-white">{ios ? "•••" : "⋮"}</b> → <b className="text-white">Open in {ios ? "Safari" : "browser"}</b></span>
        </div>
      )}
      <button type="button" onClick={doCopy}
        className="u-keep mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-[#0a192f] transition-all active:scale-[0.98]">
        {copied ? "✓ Link copied" : "Copy link"}
      </button>
    </div>
  );
}

export function InstallQr({ size = 132 }) {
  return (
    <Suspense fallback={<span className="block rounded-xl bg-white" style={{ width: size, height: size }} />}>
      <QrCode value={INSTALL_URL} size={size} />
    </Suspense>
  );
}

const go = (p) => { window.location.assign(installPath(p)); };
// Android badge: Chrome's one-tap install when available, otherwise the guide.
export const installAndroid = async (onInstalled) => {
  if (canPrompt()) { const r = await promptInstall(); if (r === "accepted") { onInstalled && onInstalled(); return; } if (r === "dismissed") return; }
  go("android");
};

export function useCanPrompt() {
  const [can, setCan] = useState(canPrompt());
  useEffect(() => onPromptChange(setCan), []);
  return can;
}

/* Small success note after Chrome installs the app. */
export function InstalledToast({ show, onDone }) {
  useEffect(() => { if (!show) return; const t = setTimeout(onDone, 4500); return () => clearTimeout(t); }, [show, onDone]);
  if (!show) return null;
  return (
    <div role="status" className="u-keep u-inst-rise pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4" style={{ bottom: "calc(1.25rem + var(--sab))" }}>
      <span className="rounded-2xl bg-[#0a192f] px-4 py-3 text-sm font-semibold text-white shadow-2xl ring-1 ring-white/10">🎉 Unite is installed. Open it from your home screen.</span>
    </div>
  );
}

/* Badges for the app (sign-in, header area, footer). Device-aware order, hidden in the installed app. */
export function GetAppBadges({ qr = false, align = "center", heading }) {
  const [done, setDone] = useState(false);
  if (isStandalone()) return null;
  const p = platform();
  const inApp = inAppBrowser() || iosNotSafari();
  const justify = align === "left" ? "justify-start" : "justify-center";
  return (
    <div className="u-keep">
      {heading && <p className={`mb-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 ${align === "left" ? "" : "text-center"}`}>{heading}</p>}
      {inApp && isMobile() ? (
        <button type="button" onClick={() => go(p)} className="u-keep inline-flex h-11 w-full items-center justify-center rounded-xl bg-black px-4 text-sm font-semibold text-white ring-1 ring-white/20">
          Open in {isIOS() ? "Safari" : "Chrome"} to get the app →
        </button>
      ) : (
        <div className={`flex flex-wrap items-center gap-3 ${justify}`}>
          {p === "ios" && <InstallBadge kind="ios" size="lg" onClick={() => go("ios")} />}
          {p === "android" && <InstallBadge kind="android" size="lg" onClick={() => installAndroid(() => setDone(true))} />}
          {p === "desktop" && (<>
            <InstallBadge kind="ios" onClick={() => go("ios")} />
            <InstallBadge kind="android" onClick={() => go("android")} />
            {qr && (
              <a href={installPath()} className="u-keep flex items-center gap-3 rounded-xl bg-white p-2 pr-3 ring-1 ring-slate-200" aria-label="Scan to install Unite on your phone">
                <InstallQr size={72} />
                <span className="max-w-[7rem] text-left text-xs font-medium leading-snug text-slate-600">Scan with your phone camera to install</span>
              </a>
            )}
          </>)}
        </div>
      )}
      <InstalledToast show={done} onDone={() => setDone(false)} />
    </div>
  );
}

/* One small dismissible banner (replaces the old install banner and iPhone hint). Mobile only, never in the
   installed app, hidden for 7 days after closing. */
export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const can = useCanPrompt();
  useEffect(() => {
    if (isStandalone() || bannerSnoozed() || !isMobile()) return;
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const close = () => { snoozeBanner(); setShow(false); };
  const act = async () => {
    if (isAndroid() && can && !inAppBrowser()) {
      const r = await promptInstall();
      if (r === "accepted") { setShow(false); setDone(true); return; }
      if (r === "dismissed") { close(); return; }
    }
    go(platform());
  };
  return (
    <>
      {show && (
        <div role="dialog" aria-label="Get Unite on your home screen" className="u-keep u-up fixed inset-x-0 z-40 mx-auto flex max-w-md px-4" style={{ bottom: "calc(1rem + var(--sab))" }}>
          <div className="flex w-full items-center gap-3 rounded-2xl border border-white/10 py-2.5 pl-3 pr-2 text-white shadow-2xl" style={{ background: "rgba(10,25,47,0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
            <img src="/icons/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-[22%]" />
            <p className="min-w-0 flex-1 text-[13px] font-semibold leading-tight">Get Unite on your home screen</p>
            <button onClick={act} className="u-keep shrink-0 rounded-xl bg-crimson-700 px-4 py-2 text-sm font-semibold text-white hover:bg-crimson-600 active:scale-95">
              Install
            </button>
            <button onClick={close} aria-label="Dismiss" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white">✕</button>
          </div>
        </div>
      )}
      <InstalledToast show={done} onDone={() => setDone(false)} />
    </>
  );
}
