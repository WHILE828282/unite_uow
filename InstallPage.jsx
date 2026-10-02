import { useEffect, useRef, useState } from "react";
import { platform, isIOS, isMobile, isStandalone, inAppBrowser, iosNotSafari, promptInstall } from "./install.js";
import { InstallBadge, InAppCard, InstallQr, InstalledToast, useCanPrompt } from "./GetApp.jsx";

/* ------------------------------------------------------------------ */
/*  Step illustrations: a simplified phone with the tap target in crimson */
/* ------------------------------------------------------------------ */
const C = { crimson: "#c0394f", crimsonSoft: "#a83446", screen: "#0f1d36", ui: "#1a2c4d", line: "#2a3d61", text: "#9fb0cc", white: "#e8eefb" };
const Ping = ({ x, y, r = 12 }) => (<><circle className="u-ping" cx={x} cy={y} r={r} fill={C.crimson} /><circle cx={x} cy={y} r={r * 0.55} fill="none" stroke={C.crimson} strokeWidth="2" /></>);
// Fingertip that taps the target.
const Tap = ({ x, y }) => (
  <g className="u-tap" style={{ transformOrigin: `${x}px ${y}px` }}>
    <circle cx={x + 9} cy={y + 13} r="7.5" fill="#f4f6fb" stroke="#0a192f" strokeWidth="1.5" />
  </g>
);
const Phone = ({ children }) => (
  <svg viewBox="22 2 116 216" className="h-full w-full" aria-hidden="true">
    <defs><linearGradient id="ph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#14264a" /><stop offset="1" stopColor="#0c182e" /></linearGradient></defs>
    <rect x="30" y="6" width="100" height="208" rx="18" fill="#060d1a" stroke="#2c4066" strokeWidth="1.5" />
    <rect x="35" y="11" width="90" height="198" rx="14" fill="url(#ph)" />
    <rect x="66" y="15" width="28" height="7" rx="3.5" fill="#060d1a" />
    {children}
  </svg>
);
const Txt = ({ x, y, children, size = 6.5, fill = C.text, weight = 500, anchor = "start" }) => (
  <text x={x} y={y} fontSize={size} fill={fill} fontWeight={weight} textAnchor={anchor} fontFamily="system-ui, -apple-system, sans-serif">{children}</text>
);
const Rows = ({ y0 = 40, n = 4 }) => Array.from({ length: n }, (_, i) => <rect key={i} x="44" y={y0 + i * 14} width={i % 2 ? 56 : 70} height="5" rx="2.5" fill={C.ui} />);
const ShareIcon = ({ x, y, color = C.white }) => (
  <g stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={`M${x} ${y - 5}v8M${x - 3} ${y - 2}l3-3 3 3`} /><path d={`M${x - 4} ${y}h-1.5v6.5h11V${y}H${x + 4}`} />
  </g>
);

const IOS_ART = [
  // 1. Safari with uniteuow.com in the address bar
  <Phone key="1">
    <Rows y0={34} n={6} />
    <circle cx="80" cy="132" r="17" fill="#e8eefb" /><circle cx="80" cy="132" r="14" fill="#2f7cf6" />
    <path d="M80 121l3.2 11H76.8z" fill="#ff5b4f" /><path d="M80 143l-3.2-11h6.4z" fill="#fff" />
    <rect x="41" y="183" width="78" height="15" rx="7.5" fill={C.ui} stroke={C.crimson} strokeWidth="1.6" />
    <Txt x={80} y={193} anchor="middle" fill={C.white} weight={600}>uniteuow.com</Txt>
    <Ping x={118} y={190} r={6} />
  </Phone>,
  // 2. Share button in Safari's toolbar (or inside •••)
  <Phone key="2">
    <Rows y0={34} n={8} />
    <rect x="41" y="164" width="78" height="13" rx="6.5" fill={C.ui} /><Txt x={80} y={173} anchor="middle" fill={C.white}>uniteuow.com</Txt>
    <Txt x={112} y={173.5} anchor="middle" fill={C.text} size={7} weight={700}>•••</Txt>
    <g fill="none" stroke={C.text} strokeWidth="1.5" strokeLinecap="round"><path d="M50 190l-3 3 3 3" /><path d="M64 190l3 3-3 3" /><rect x="102" y="188" width="9" height="9" rx="2" /></g>
    <Ping x={80} y={192} r={11} />
    <ShareIcon x={80} y={192} color="#fff" />
    <Tap x={80} y={192} />
  </Phone>,
  // 3. Share sheet: Add to Home Screen (+ Open as Web App on)
  <Phone key="3">
    <rect x="35" y="60" width="90" height="149" rx="14" fill="#16284a" />
    <rect x="72" y="65" width="16" height="3" rx="1.5" fill={C.line} />
    {["Copy", "Add to Reading List"].map((t, i) => (<g key={t}><rect x="42" y={76 + i * 18} width="76" height="14" rx="4" fill={C.ui} /><Txt x={47} y={85 + i * 18}>{t}</Txt></g>))}
    <rect x="42" y="112" width="76" height="16" rx="4" fill={C.crimsonSoft} stroke={C.crimson} strokeWidth="1.4" />
    <Txt x={47} y={122.5} fill="#fff" weight={700}>Add to Home Screen</Txt>
    <rect x="107" y="115.5" width="8" height="8" rx="2" fill="none" stroke="#fff" strokeWidth="1.2" /><path d="M111 117.5v4M109 119.5h4" stroke="#fff" strokeWidth="1.2" />
    <rect x="42" y="134" width="76" height="16" rx="4" fill={C.ui} /><Txt x={47} y={144.5} fill={C.white}>Open as Web App</Txt>
    <rect x="100" y="138" width="14" height="8" rx="4" fill="#34c759" /><circle cx="110" cy="142" r="3.2" fill="#fff" />
    <Tap x={78} y={120} />
  </Phone>,
  // 4. Add → Unite on the home screen
  <Phone key="4">
    <Txt x={44} y={36} fill={C.text}>Cancel</Txt>
    <Txt x={80} y={36} anchor="middle" fill={C.white} weight={600} size={6}>Add to Home</Txt>
    <Ping x={113} y={34} r={9} /><Txt x={113} y={36.5} anchor="middle" fill="#fff" weight={800} size={7.5}>Add</Txt>
    {Array.from({ length: 12 }, (_, i) => <rect key={i} x={44 + (i % 4) * 19} y={56 + Math.floor(i / 4) * 24} width="14" height="14" rx="4" fill={C.ui} />)}
    <rect x="61" y="134" width="38" height="38" rx="9" fill="none" stroke={C.crimson} strokeWidth="2" />
    <image href="/icons/icon-192.png" x="64" y="137" width="32" height="32" clipPath="inset(0 round 7px)" />
    <Txt x={80} y={182} anchor="middle" fill={C.white} weight={600}>Unite</Txt>
  </Phone>,
];

const ANDROID_ART = [
  // 1. Chrome with uniteuow.com
  <Phone key="1">
    <rect x="40" y="27" width="62" height="13" rx="6.5" fill={C.ui} stroke={C.crimson} strokeWidth="1.6" />
    <Txt x={71} y={36} anchor="middle" fill={C.white} weight={600}>uniteuow.com</Txt>
    <Txt x={114} y={37} anchor="middle" fill={C.text} size={9} weight={700}>⋮</Txt>
    <Rows y0={52} n={6} />
    <circle cx="80" cy="150" r="17" fill="none" stroke="#e8eefb" strokeWidth="3" /><path d="M63 150h34M80 133c6 6 6 28 0 34M80 133c-6 6-6 28 0 34" stroke="#e8eefb" strokeWidth="1.6" fill="none" />
    <Ping x={44} y={33} r={6} />
  </Phone>,
  // 2. ⋮ menu top right
  <Phone key="2">
    <rect x="40" y="27" width="62" height="13" rx="6.5" fill={C.ui} /><Txt x={71} y={36} anchor="middle" fill={C.white}>uniteuow.com</Txt>
    <Ping x={114} y={33} r={10} />
    <Txt x={114} y={37.5} anchor="middle" fill="#fff" size={11} weight={800}>⋮</Txt>
    <Rows y0={56} n={9} />
    <Tap x={114} y={33} />
  </Phone>,
  // 3. Install app in the menu
  <Phone key="3">
    <rect x="40" y="27" width="62" height="13" rx="6.5" fill={C.ui} /><Txt x={71} y={36} anchor="middle" fill={C.white}>uniteuow.com</Txt>
    <rect x="66" y="30" width="56" height="112" rx="6" fill="#16284a" stroke={C.line} />
    {["New tab", "History", "Bookmarks"].map((t, i) => <Txt key={t} x={72} y={44 + i * 15}>{t}</Txt>)}
    <rect x="68" y="83" width="52" height="15" rx="4" fill={C.crimsonSoft} stroke={C.crimson} strokeWidth="1.4" />
    <Txt x={72} y={93} fill="#fff" weight={700}>Install app</Txt>
    {["Share…", "Settings"].map((t, i) => <Txt key={t} x={72} y={112 + i * 15}>{t}</Txt>)}
    <Tap x={92} y={90} />
  </Phone>,
  // 4. Install dialog
  <Phone key="4">
    <Rows y0={34} n={8} />
    <rect x="35" y="84" width="90" height="125" fill="#060d1a" opacity=".55" />
    <rect x="42" y="112" width="76" height="72" rx="9" fill="#1b2f54" />
    <image href="/icons/icon-192.png" x="49" y="119" width="20" height="20" clipPath="inset(0 round 5px)" />
    <Txt x={74} y={128} fill={C.white} weight={700}>Install app?</Txt>
    <Txt x={74} y={137} fill={C.text} size={5.5}>Unite · uniteuow.com</Txt>
    <Txt x={64} y={172} fill={C.text} anchor="middle">Cancel</Txt>
    <rect x="84" y="163" width="28" height="13" rx="6.5" fill={C.crimson} />
    <Txt x={98} y={172} anchor="middle" fill="#fff" weight={700}>Install</Txt>
    <Ping x={98} y={169.5} r={10} />
    <Tap x={98} y={169} />
  </Phone>,
];

const STEPS = {
  ios: [
    ["Open in Safari", "Open uniteuow.com in Safari, Apple's browser on your iPhone."],
    ["Tap Share", "Tap the Share button (a square with an arrow pointing up). On newer iOS versions it may be inside the “•••” menu."],
    ["Add to Home Screen", "Scroll down and tap “Add to Home Screen”. If you see “Open as Web App”, keep it switched on."],
    ["Tap Add", "Tap “Add”. Unite appears on your home screen like a normal app."],
  ],
  android: [
    ["Open in Chrome", "Open uniteuow.com in Chrome."],
    ["Tap the ⋮ menu", "Tap the ⋮ menu in the top-right corner."],
    ["Install app", "Tap “Install app” (or “Add to Home screen”)."],
    ["Tap Install", "Tap “Install”. Unite appears on your home screen."],
  ],
};

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
    <div className="u-keep min-h-screen bg-[#0a192f] text-white" style={{ minHeight: "var(--vvh)", colorScheme: "dark", paddingTop: "var(--sat)", paddingLeft: "var(--sal)", paddingRight: "var(--sar)" }}>
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px]" style={{ background: "radial-gradient(60% 70% at 50% 0%, rgba(168,52,70,0.28), transparent 70%)" }} aria-hidden="true" />
      <header className="relative mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <a href="/" className="inline-flex items-center gap-2 rounded-lg py-1 text-sm font-semibold text-slate-300 hover:text-white">
          <img src="/icons/unite-icon.svg" alt="" className="h-7 w-7 rounded-[22%]" /> <span className="font-extrabold tracking-tight text-white">unite</span>
        </a>
        <a href="/" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 ring-1 ring-white/10 hover:bg-white/10 hover:text-white">Open Unite</a>
      </header>

      <main className="relative mx-auto max-w-2xl px-5" style={{ paddingBottom: "calc(7rem + var(--sab))" }}>
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
              {device === "ios" && <InstallBadge kind="ios" size="lg" onClick={() => { setHint(true); showSteps("ios"); }} />}
              {device === "android" && <InstallBadge kind="android" size="lg" onClick={androidInstall} />}
              {device === "desktop" && (<>
                <InstallBadge kind="ios" size="lg" onClick={() => showSteps("ios")} />
                <InstallBadge kind="android" size="lg" onClick={() => showSteps("android")} />
              </>)}
            </div>
          )}
          {device === "desktop" && !installed && (
            <div className="mx-auto mt-6 flex max-w-sm items-center gap-4 rounded-2xl bg-white/[0.04] p-4 text-left ring-1 ring-white/10">
              <InstallQr size={112} />
              <div>
                <p className="font-semibold">Scan to install on your phone</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">Point your phone's camera at the code. It opens this guide for your device.</p>
              </div>
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
            {STEPS[tab].map(([title, text], i) => (
              <li key={title} className="u-inst-rise overflow-hidden rounded-3xl bg-gradient-to-b from-[#112240] to-[#0d1c36] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/[0.08]" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="h-52 bg-[#0b1730] px-6 pt-3">{(tab === "ios" ? IOS_ART : ANDROID_ART)[i]}</div>
                <div className="flex gap-4 p-5">
                  <span className="text-4xl font-extrabold leading-none tabular-nums text-crimson-400">{i + 1}</span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{text}</p>
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
      {hint && (
        <div className="u-keep u-inst-rise fixed inset-x-0 z-40 flex flex-col items-center px-4" style={{ bottom: "calc(0.5rem + var(--sab))" }}>
          <div className="relative flex w-full max-w-sm items-center gap-3 rounded-2xl bg-white py-3 pl-4 pr-2 text-[#0a192f] shadow-2xl">
            <p className="min-w-0 flex-1 text-sm leading-snug">Tap <b>Share</b> <svg viewBox="0 0 24 24" className="inline h-4 w-4 -translate-y-px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Share icon"><path d="M12 3v12M8 7l4-4 4 4" /><path d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>, then <b>Add to Home Screen</b></p>
            <button onClick={closeHint} aria-label="Close hint" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">✕</button>
          </div>
          <svg viewBox="0 0 24 24" className="u-bob mt-1 h-7 w-7 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v15M6 13l6 6 6-6" /></svg>
        </div>
      )}
      <InstalledToast show={done} onDone={() => setDone(false)} />
    </div>
  );
}
