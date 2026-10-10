import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "./ui.jsx";
import { dubaiDay } from "../lib/format.js";

// Badge: tickets you can still use (not cancelled, event not over).
const liveTickets = (bs) => bs.filter((b) => b.state !== "cancelled" && !((b.endDate || b.date) && (b.endDate || b.date) < dubaiDay())).length;

/* Section tabs. Stays under the header while you scroll, so switching sections is always one tap away. The strip behind
   it has the page background, so cards don't show between the header and the tabs. */
export function Tabs({ tabs, tab, changeTab, user, bookings, myEventItems, sessions }) {
  return (
    <div className="u-tabbar sticky z-20 -mx-4 mb-3 hidden px-4 pb-2 pt-2 sm:block" style={{ top: "calc(var(--sat) + 3.75rem)" }}>
    <div id="tabs" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} className="relative grid rounded-full border border-slate-200/50 bg-white p-1.5 shadow-sm" role="tablist">
      <div className="u-keep absolute rounded-full bg-crimson-700 shadow" style={{ top: 6, bottom: 6, left: 6, width: `calc((100% - 12px) / ${tabs.length})`, transform: `translateX(${tabs.findIndex((t) => t[0] === tab) * 100}%)`, transition: "transform .3s cubic-bezier(.2,.8,.2,1)" }} />
      {tabs.map(([k, l, short]) => (
        <button key={k} role="tab" aria-selected={tab === k} onClick={() => changeTab(k)}
          className={`relative z-10 whitespace-nowrap rounded-full px-1 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${tab === k ? "text-white" : "text-slate-500 hover:text-slate-800"}`}>
          <span className="sm:hidden">{short}</span><span className="hidden sm:inline">{l}</span>
          {k === "tickets" && user && liveTickets(bookings) > 0 && <span className="ml-1 rounded-full bg-crimson-600 px-1.5 py-0.5 text-xs text-white">{liveTickets(bookings)}</span>}
          {k === "events" && myEventItems.some(({ r }) => r.status === "review") && <span className="ml-1 hidden rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white sm:inline">{myEventItems.filter(({ r }) => r.status === "review").length}</span>}
          {k === "schedule" && sessions.length > 0 && <span className="ml-1 hidden rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs text-white sm:inline">{sessions.length}</span>}
        </button>
      ))}
    </div>
    </div>
  );
}

/* Phones: the bottom bar, built the way Telegram's TabBarComponent + LiquidLensView work:
   - two identical rows of tabs: the normal one, and an accent-coloured copy that is only visible inside the lens
     (so whatever the lens passes over turns accent, edge by edge);
   - the lens rests 4 px inside the selected tab; touching the bar "lifts" it to 4 px outside, jumps it under the
     finger with a spring, and the tabs inside it grow to 1.15x; sliding moves it with the finger, letting go selects
     the tab under it and it settles back (spring, 0.4 s);
   - the newly selected icon does a small bounce.
   All movement is transform-only (GPU). Touches are handled here (the tap is ours, not a delayed browser click), so
   there's no iOS double-tap delay. Hidden while typing so it never sits on top of the keyboard. */
const NAV_ICON = { home: "home", clubs: "trophy", parties: "party", schedule: "calendar", tickets: "ticket" };
const INSET = 4; // Telegram: inner inset of the bar and of the lens

export function BottomNav({ tabs, tab, changeTab, user, bookings, side }) {
  const items = tabs.filter(([k]) => k !== "events");
  const bar = useRef(null), lens = useRef(null), copy = useRef(null), btns = useRef({});
  const [sel, setSel] = useState(tab); // the selected tab as the bar shows it (ahead of the page switch)
  useEffect(() => { setSel(tab); }, [tab]);
  const g = useRef({ cx: null, lifted: false, drag: null });

  const geo = (k) => {
    const b = btns.current[k], box = bar.current;
    if (!b || !box) return null;
    return { cx: b.offsetLeft + b.offsetWidth / 2, w: b.offsetWidth, W: box.clientWidth, H: box.clientHeight };
  };
  // Lens frame for a centre and a state (Telegram: base frame = tab + inset; rest = base - inset; lifted = base + inset).
  const apply = (cx, lifted, animate) => {
    const el = lens.current, cp = copy.current, m = geo(sel) || geo(items[0][0]);
    if (!el || !cp || !m) return;
    const baseW = m.w + INSET * 2, baseH = m.H;
    const half = baseW / 2;
    cx = Math.max(half, Math.min(m.W - half, cx));
    const w = lifted ? baseW + INSET * 2 : baseW - INSET * 2, h = lifted ? baseH + INSET * 2 : baseH - INSET * 2;
    const L = cx - w / 2, T = (m.H - h) / 2;
    el.classList.toggle("u-tgl-anim", animate);
    cp.classList.toggle("u-tgl-anim", animate);
    el.classList.toggle("u-tgl-lifted", lifted);
    cp.classList.toggle("u-tgl-lifted", lifted);
    el.style.width = `${w}px`; el.style.height = `${h}px`;
    el.style.transform = `translate3d(${L}px,${T}px,0)`;
    cp.style.width = `${m.W}px`; cp.style.height = `${m.H}px`;
    cp.style.transform = `translate3d(${-L}px,${-T}px,0)`;
    g.current.cx = cx; g.current.lifted = lifted;
  };
  const first = useRef(true);
  useLayoutEffect(() => {
    const m = geo(sel);
    if (m && !g.current.drag) apply(m.cx, false, !first.current);
    first.current = false;
  }, [sel, items.length]); // eslint-disable-line
  useEffect(() => {
    const re = () => { const m = geo(sel); if (m) apply(m.cx, false, false); };
    window.addEventListener("resize", re);
    return () => window.removeEventListener("resize", re);
  }, [sel]); // eslint-disable-line

  // A short bounce on the icon that just got selected (both rows).
  const pop = (k) => {
    for (const root of [bar.current, copy.current]) {
      const el = root && root.querySelector(`[data-k="${k}"] .u-nav-icon`);
      if (el) { el.classList.remove("u-nav-pop"); void el.offsetWidth; el.classList.add("u-nav-pop"); }
    }
  };
  const select = (k) => {
    if (k === tab) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setSel(k); pop(k);
    requestAnimationFrame(() => requestAnimationFrame(() => changeTab(k)));
  };

  const tabAt = (x) => {
    const box = bar.current;
    if (!box) return null;
    const o = box.getBoundingClientRect();
    for (const [k] of items) { const b = btns.current[k]; if (b && x - o.left >= b.offsetLeft && x - o.left <= b.offsetLeft + b.offsetWidth) return k; }
    return null;
  };
  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    const x = e.touches[0].clientX, k = tabAt(x), m = k && geo(k);
    if (!m) return;
    g.current.drag = { x0: x, cx0: m.cx, k, moved: false };
    apply(m.cx, true, true); // lift and jump under the finger
  };
  const onTouchMove = (e) => {
    const d = g.current.drag;
    if (!d) return;
    const x = e.touches[0].clientX;
    if (!d.moved && Math.abs(x - d.x0) < 4) return;
    d.moved = true;
    apply(d.cx0 + (x - d.x0), true, false);
    const k = tabAt(x);
    if (k && k !== d.k) { d.k = k; if (navigator.vibrate) { try { navigator.vibrate(4); } catch (err) { /* ignore */ } } }
  };
  const onTouchEnd = (e) => {
    const d = g.current.drag;
    g.current.drag = null;
    if (!d) return;
    if (e.cancelable) e.preventDefault(); // we handled the tap: no extra (delayed) click
    const m = geo(d.k);
    if (m) apply(m.cx, false, true);
    select(d.k);
  };
  const onTouchCancel = () => {
    g.current.drag = null;
    const m = geo(sel);
    if (m) apply(m.cx, false, true);
  };

  const row = (accent) => items.map(([k, , short]) => {
    const badge = k === "tickets" && user ? liveTickets(bookings) : 0;
    const inner = (
      <>
        <span className="u-nav-icon relative">
          <Icon name={NAV_ICON[k] || "home"} className="h-[25px] w-[25px] min-[390px]:h-[27px] min-[390px]:w-[27px]" />
          {badge > 0 && <span className="absolute -right-2.5 -top-1 min-w-[1.1rem] rounded-full bg-[#ff3b30] px-1 text-center text-[10px] font-semibold leading-[1.1rem] text-white">{badge}</span>}
        </span>
        <span className="truncate">{short}</span>
      </>
    );
    const cls = "u-keep u-tgl-item relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] px-0.5 text-[10px] font-semibold leading-none";
    return accent
      ? <span key={k} data-k={k} className={`${cls} u-tgl-accent`}>{inner}</span>
      : <button key={k} data-k={k} ref={(el) => { btns.current[k] = el; }} onClick={() => select(k)} aria-current={tab === k ? "page" : undefined} aria-label={short} className={cls}>{inner}</button>;
  });

  return (
    <nav aria-label="Sections" className="u-keep u-hide-typing fixed inset-x-0 z-[45] flex items-center gap-1.5 px-2.5 min-[390px]:gap-2 min-[390px]:px-3 sm:hidden" style={{ bottom: "calc(var(--sabx) + 10px)" }}>
      <div ref={bar} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchCancel} style={{ touchAction: "none" }}
        className="u-glass-bar relative flex h-[60px] min-w-0 flex-1 items-stretch rounded-full p-1 min-[390px]:h-[64px]">
        {row(false)}
        <span ref={lens} aria-hidden="true" className="u-tgl-lens">
          <span ref={copy} className="u-tgl-copy flex items-stretch p-1">{row(true)}</span>
        </span>
      </div>
      {side}
    </nav>
  );
}
