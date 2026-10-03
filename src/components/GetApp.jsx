import { useEffect, useState } from "react";
import { Icon } from "./ui.jsx";
import { platform, isIOS, isAndroid, isMobile, isStandalone, inAppBrowser, iosNotSafari, canPrompt, onPromptChange, promptInstall,
  bannerSnoozed, snoozeBanner, installPath, INSTALL_URL } from "../../install.js";


/* Brand marks (vector, no raster watermarks): Apple, Google Play, Android. */
export const AppleLogo = ({ className = "h-7 w-7" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
);
export const PlayLogo = ({ className = "h-7 w-7" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#00C3FF" d="M2.2 1.4 12.6 12 2.2 22.6c-.35-.27-.55-.7-.55-1.2V2.6c0-.5.2-.93.55-1.2z" />
    <path fill="#00E676" d="M2.2 1.4c.42-.32 1-.38 1.55-.08L16.2 8.4 12.6 12z" />
    <path fill="#FFC400" d="M16.2 8.4l4.2 2.38c.95.54.95 1.9 0 2.44L16.2 15.6 12.6 12z" />
    <path fill="#FF3D57" d="M12.6 12l3.6 3.6-12.45 7.08c-.55.3-1.13.24-1.55-.08z" />
  </svg>
);
export const AndroidLogo = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M17.523 15.341c-.5 0-.906-.406-.906-.906s.406-.906.906-.906.906.406.906.906-.406.906-.906.906m-11.046 0c-.5 0-.906-.406-.906-.906s.406-.906.906-.906.906.406.906.906-.406.906-.906.906m11.405-6.02l1.997-3.459a.416.416 0 00-.152-.567.416.416 0 00-.568.152L17.137 8.95C15.627 8.252 13.904 7.86 12 7.86s-3.627.392-5.137 1.09L4.841 5.447a.416.416 0 00-.568-.152.416.416 0 00-.152.567l1.997 3.459C2.689 11.187.343 14.659 0 18.761h24c-.344-4.102-2.69-7.574-6.118-9.44" />
  </svg>
);

/* App Store / Google Play style badges (black, grey hairline, logo + two lines), drawn in vector. */
export function InstallBadge({ kind, size = "md", onClick, className = "" }) {
  const big = size === "lg";
  const ios = kind === "ios";
  return (
    <button type="button" onClick={onClick}
      className={`u-keep group inline-flex select-none items-center rounded-[10px] bg-black text-left text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] ring-1 ring-[#a6a6a6] transition-all duration-200 hover:-translate-y-px hover:bg-[#0d0d0d] hover:shadow-[0_14px_30px_-12px_rgba(0,0,0,0.7)] active:translate-y-0 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-400 ${big ? "h-[56px] gap-2.5 pl-3.5 pr-4" : "h-[46px] gap-2 pl-3 pr-3.5"} ${className}`}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
      aria-label={ios ? "Install Unite on iPhone" : "Install Unite on Android"}>
      {ios ? <AppleLogo className={big ? "h-[30px] w-[30px] -mt-0.5" : "h-[25px] w-[25px] -mt-0.5"} /> : <PlayLogo className={big ? "h-[27px] w-[27px]" : "h-[22px] w-[22px]"} />}
      <span className="flex flex-col leading-none">
        {ios
          ? <span className={`${big ? "text-[11.5px]" : "text-[10px]"} font-medium tracking-[0.01em]`}>Download on the</span>
          : <span className={`${big ? "text-[10.5px]" : "text-[9px]"} font-medium uppercase tracking-[0.06em]`}>Get it on</span>}
        <span className={`${big ? "mt-[3px] text-[23px]" : "mt-[2px] text-[19px]"} font-semibold tracking-[-0.02em]`}>{ios ? "App Store" : "Google Play"}</span>
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
    <div role="status" className="u-keep u-inst-rise pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4" style={{ bottom: "calc(1.25rem + var(--sabx) + var(--nav))" }}>
      <span className="rounded-2xl bg-[#0a192f] px-4 py-3 text-sm font-semibold text-white shadow-2xl ring-1 ring-white/10">Unite is installed. Open it from your home screen.</span>
    </div>
  );
}

/* Badges for the app (sign-in, header area, footer). Device-aware order, hidden in the installed app. */
export function GetAppBadges({ align = "center", heading }) {
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
        <div role="dialog" aria-label="Get Unite on your home screen" className="u-keep u-up u-hide-typing pointer-events-none fixed inset-x-0 z-40 mx-auto flex max-w-md px-4" style={{ bottom: "calc(1rem + var(--sabx) + var(--nav))" }}>
          <div className="u-banner pointer-events-auto flex w-full items-center gap-3 rounded-2xl py-2.5 pl-3 pr-2">
            <img src="/icons/icon-192.png" alt="" className="h-11 w-11 shrink-0 rounded-[22%]" />
            <p className="min-w-0 flex-1 text-[13px] font-semibold leading-tight">Get Unite on your home screen</p>
            <button onClick={act} className="u-keep shrink-0 rounded-xl bg-crimson-700 px-4 py-2 text-sm font-semibold text-white hover:bg-crimson-600 active:scale-95">
              Install
            </button>
            <button onClick={close} aria-label="Dismiss" className="u-keep flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-500/10 hover:text-current"><Icon name="close" className="h-4 w-4" /></button>
          </div>
        </div>
      )}
      <InstalledToast show={done} onDone={() => setDone(false)} />
    </>
  );
}
