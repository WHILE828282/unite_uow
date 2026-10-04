import { useEffect, useRef, useState } from "react";
import { platform, isIOS, isMobile, isStandalone, inAppBrowser, iosNotSafari, promptInstall } from "../../install.js";
import { InAppCard, InstallBadge, InstalledToast, useCanPrompt } from "../components/GetApp.jsx";
import { Icon } from "../components/ui.jsx";

/* ------------------------------------------------------------------ */
/*  Install steps: real screenshots from public/install (.webp, .png fallback) */
/* ------------------------------------------------------------------ */
// img: file name in public/install; w/h: the image's own size (keeps the aspect ratio, no layout jump).
const STEPS = {
  ios: [
    { title: "Tap the ••• button", text: "In Safari, tap the ••• button at the bottom right.", img: "ios-step-1-more", w: 736, h: 182,
      alt: "Safari's address bar showing uniteuow.com, with the ••• button at the right highlighted" },
    { title: "Tap Share", text: "Choose Share from the menu.", img: "ios-step-2-share", w: 460, h: 606,
      alt: "Safari menu with Share highlighted at the top" },
    { title: "Tap Add to Home Screen", text: "Scroll down (tap View More if you see it) and tap Add to Home Screen.", img: "ios-step-3-add-to-home", w: 736, h: 1210,
      alt: "iPhone share sheet for Unite with Add to Home Screen highlighted at the bottom of the list" },
    { title: "Done!", text: "Unite is now on your home screen. Open it like any other app.", img: "ios-step-5-done", w: 980, h: 300,
      alt: "iPhone home screen with the Unite app icon highlighted" },
  ],
  android: [
    { title: "Tap the ⋮ menu", text: "In Chrome, tap the ⋮ button in the top-right corner.", img: "android-step-1-menu", w: 1472, h: 300,
      alt: "Chrome's address bar showing uniteuow.com, with the ⋮ menu button highlighted" },
    { title: "Tap Add to Home screen", text: "Choose Add to Home screen (on some phones it's called Install app).", img: "android-step-2-add", w: 920, h: 1544,
      alt: "Chrome menu with Add to Home screen highlighted" },
    { title: "Tap Install", text: "Confirm by tapping Install.", img: "android-step-3-install", w: 1120, h: 660,
      alt: "Install app dialog for Unite with the Install button highlighted" },
    { title: "Done!", text: "Unite is now on your home screen. Open it like any other app.", img: "android-step-4-done", w: 980, h: 300,
      alt: "Android home screen with the Unite app icon highlighted" },
  ],
};

/* One step image: WebP with PNG fallback, natural aspect ratio, about 340px wide at most on phones. */
function StepImage({ step, eager }) {
  const src = `/install/${step.img}`;
  return (
    <div className="flex items-center justify-center bg-[#0b1730] p-5">
      <picture className="block w-full max-w-[340px]">
        <source srcSet={`${src}.webp`} type="image/webp" />
        <img src={`${src}.png`} alt={step.alt} width={step.w} height={step.h}
          loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} decoding="async"
          className="mx-auto block h-auto max-h-[460px] w-auto max-w-full rounded-xl shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10" />
      </picture>
    </div>
  );
}

export default function InstallPage() {
  const params = new URLSearchParams(window.location.search);
  const forced = params.get("platform");
  const device = platform();
  const [tab, setTab] = useState(forced === "android" || forced === "ios" ? forced : device === "android" ? "android" : "ios");
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState(false);
  const can = useCanPrompt();
  const stepsRef = useRef(null);
  const installed = isStandalone();
  const inApp = (inAppBrowser() || iosNotSafari()) && isMobile();
  const iosSafari = isIOS() && !inApp && !installed;

  useEffect(() => {
    document.title = "Get the Unite app";
    if (!iosSafari) return;
    try { if (sessionStorage.getItem("unite-ios-hint") === "closed") return; } catch (e) { /* ignore */ }
    const t = setTimeout(() => setHint(true), 1200);
    return () => clearTimeout(t);
  }, [iosSafari]);

  const showSteps = (p) => { setTab(p); setTimeout(() => stepsRef.current && stepsRef.current.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };
  const androidInstall = async () => {
    if (can && !inApp) { const r = await promptInstall(); if (r === "accepted") { setDone(true); return; } if (r === "dismissed") return; }
    showSteps("android");
  };
  const primary = () => {
    if (tab === "android") return androidInstall();
    if (iosSafari) setHint(true);
    showSteps("ios");
  };
  const closeHint = () => { setHint(false); try { sessionStorage.setItem("unite-ios-hint", "closed"); } catch (e) { /* ignore */ } };

  return (
    <div className="u-keep min-h-screen bg-[#0e0f13] text-white" style={{ minHeight: "var(--vvh)", colorScheme: "dark", paddingTop: "var(--sat)", paddingLeft: "var(--sal)", paddingRight: "var(--sar)" }}>
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px]" style={{ background: "radial-gradient(60% 70% at 50% 0%, rgba(168,52,70,0.28), transparent 70%)" }} aria-hidden="true" />
      <header className="relative mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <a href="/" className="inline-flex items-center gap-2 rounded-lg py-1 text-sm font-semibold text-slate-300 hover:text-white">
          <img src="/icons/unite-icon-small.svg" alt="" className="h-7 w-7 rounded-[22%] ring-1 ring-white/15" /> <span className="font-extrabold tracking-tight text-white">unite</span>
        </a>
        <a href="/" className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 ring-1 ring-white/10 hover:bg-white/10 hover:text-white">Open Unite</a>
      </header>

      <main className="relative mx-auto max-w-2xl px-5" style={{ paddingBottom: hint && tab === "ios" ? "calc(10rem + var(--sabx))" : "calc(7rem + var(--sabx))" }}>
        {inApp && <div className="u-inst-rise mb-6"><InAppCard /></div>}

        {/* Hero */}
        <section className="u-inst-rise pt-4 text-center">
          <img src="/icons/icon-512.png" alt="Unite app icon" className="mx-auto h-24 w-24 rounded-[22%] shadow-[0_20px_50px_-12px_rgba(192,57,79,0.55)] ring-1 ring-white/10 sm:h-28 sm:w-28" />
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight">Unite</h1>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-slate-300">UOWD clubs, sport, events and parties in one app</p>
          {installed ? (
            <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-400/30">✓ You're using the installed app. <a href="/" className="font-semibold text-white underline underline-offset-4">Open Unite</a></div>
          ) : !inApp && (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {/* On a phone the badge follows the selected tab (an iPhone user can switch to Android and back). */}
              {device !== "desktop" && tab === "ios" && <InstallBadge kind="ios" size="lg" onClick={() => { if (iosSafari) setHint(true); showSteps("ios"); }} />}
              {device !== "desktop" && tab === "android" && <InstallBadge kind="android" size="lg" onClick={androidInstall} />}
              {device === "desktop" && (<>
                <InstallBadge kind="ios" size="lg" onClick={() => showSteps("ios")} />
                <InstallBadge kind="android" size="lg" onClick={() => showSteps("android")} />
              </>)}
            </div>
          )}
        </section>

        {/* Steps */}
        <section ref={stepsRef} className="mt-12 scroll-mt-4" aria-label="How to install">
          <div role="tablist" aria-label="Device" className="relative mx-auto grid max-w-xs grid-cols-2 rounded-2xl bg-white/[0.05] p-1.5 ring-1 ring-white/10">
            <span className="absolute bottom-1.5 left-1.5 top-1.5 rounded-xl bg-crimson-700 shadow-lg transition-transform duration-300 ease-out" style={{ width: "calc(50% - 6px)", transform: tab === "android" ? "translateX(100%)" : "none" }} aria-hidden="true" />
            {[["ios", "iPhone"], ["android", "Android"]].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`relative z-10 rounded-xl py-2.5 text-sm font-semibold transition-colors ${tab === k ? "text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
            ))}
          </div>
          <ol key={tab} className="mt-6 grid gap-4 sm:grid-cols-2">
            {STEPS[tab].map((step, i) => (
              <li key={step.title} className="u-inst-rise overflow-hidden rounded-3xl bg-gradient-to-b from-[#1b1c22] to-[#0d1c36] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.08]" style={{ animationDelay: `${i * 80}ms` }}>
                <StepImage step={step} eager={i === 0} />
                <div className="flex gap-4 p-5">
                  <span className="text-4xl font-extrabold leading-none tabular-nums text-crimson-400">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{step.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Bottom action */}
        {!installed && (
          <section className="mt-10 text-center">
            {inApp ? null : (
              <button onClick={primary}
                className="u-keep inline-flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-crimson-700 text-base font-semibold text-white shadow-[0_14px_30px_-12px_rgba(192,57,79,0.7)] transition-all hover:bg-crimson-600 active:scale-[0.98]">
                {tab === "android" ? (can ? "Install Unite" : "Install on Android") : "Add Unite to your Home Screen"}
              </button>
            )}
            <p className="mt-4 text-sm text-slate-400">Already installed? Open Unite from your home screen.</p>
          </section>
        )}
      </main>

      {/* iPhone: floating hint pointing at Safari's toolbar */}
      {hint && tab === "ios" && (
        <div className="u-keep u-inst-rise pointer-events-none fixed inset-x-0 z-40 flex flex-col items-end px-4" style={{ bottom: "calc(0.5rem + var(--sabx))" }}>
          <div className="pointer-events-auto relative flex w-full max-w-sm items-center gap-3 self-center rounded-2xl bg-white py-3 pl-4 pr-2 text-[#0e0f13] shadow-2xl">
            <p className="min-w-0 flex-1 text-sm font-medium leading-snug">Tap <b>•••</b> → <b>Share</b> → <b>Add to Home Screen</b></p>
            <button onClick={closeHint} aria-label="Close hint" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"><Icon name="close" className="h-4 w-4" /></button>
          </div>
          {/* points at Safari's ••• button, bottom right */}
          <svg viewBox="0 0 24 24" className="u-bob mr-3 mt-1 h-7 w-7 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v15M6 13l6 6 6-6" /></svg>
        </div>
      )}
      <InstalledToast show={done} onDone={() => setDone(false)} />
    </div>
  );
}
