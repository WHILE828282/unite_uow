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

/* Phones: Telegram-style floating bar at the bottom (thumb reach), plus a separate round profile button.
   One lens sits under the open tab: a soft capsule at rest, a clear glass bubble while it moves. A tap moves it with
   a CSS transition, which the GPU runs even while the new page is being drawn (so it never stutters); sliding the
   finger moves it straight under the finger and letting go opens the tab under it. Nothing changes on touch-down,
   so a tap is a first-time click on iOS. */
const NAV_ICON = { home: "home", clubs: "trophy", parties: "party", schedule: "calendar", tickets: "ticket" };

export function BottomNav({ tabs, tab, changeTab, user, bookings, side }) {
  const items = tabs.filter(([k]) => k !== "events");
  const bar = useRef(null), lens = useRef(null), btns = useRef({});
  const [pending, setPending] = useState(null); // tapped tab, page switch on its way
  useEffect(() => {
    if (!pending) return;
    if (pending === tab) { setPending(null); return; }
    const t = setTimeout(() => setPending(null), 800);
    return () => clearTimeout(t);
  }, [tab, pending]);
  const target = pending || tab;

  const st = useRef({ x: null, w: 0, drag: null, start: null, hot: null, timer: 0 });
  const rectOf = (k) => { const b = btns.current[k], box = bar.current; if (!b || !box) return null; const r = b.getBoundingClientRect(), o = box.getBoundingClientRect(); return { x: r.left - o.left, w: r.width }; };
  const put = (x, w) => { const el = lens.current; if (!el) return; st.current.x = x; if (w) { st.current.w = w; el.style.width = `${w}px`; } el.style.transform = `translate3d(${x}px,0,0)`; };
  const setHot = (k) => { const s = st.current; if (s.hot === k) return; s.hot = k; for (const [key] of items) { const b = btns.current[key]; if (b) b.classList.toggle("u-nav-hot", key === k); } };
  // Show the glass while moving, then fold back into the capsule.
  const pulse = (ms = 380) => {
    const el = lens.current, s = st.current;
    if (!el) return;
    el.classList.add("u-lens-up");
    clearTimeout(s.timer);
    s.timer = setTimeout(() => { if (!s.drag) { el.classList.remove("u-lens-up"); setHot(null); } }, ms);
  };
  const moveTo = (k, animate) => {
    const r = rectOf(k), el = lens.current, s = st.current;
    if (!r || !el) return;
    const far = s.x !== null && Math.abs(r.x - s.x) > 1;
    el.classList.toggle("u-lens-still", !animate || s.x === null);
    put(r.x, r.w);
    if (animate && far) { setHot(k); pulse(); }
  };
  useLayoutEffect(() => { moveTo(target, true); }, [target, items.length]); // eslint-disable-line
  useEffect(() => {
    const re = () => moveTo(tab, false);
    window.addEventListener("resize", re);
    return () => window.removeEventListener("resize", re);
  }, [tab]); // eslint-disable-line
  useEffect(() => () => clearTimeout(st.current.timer), []);

  const go = (k) => { if (k === tab) { window.scrollTo({ top: 0, behavior: "smooth" }); return; } setPending(k); requestAnimationFrame(() => requestAnimationFrame(() => changeTab(k))); };

  const tabAt = (x) => { for (const [k] of items) { const b = btns.current[k]; if (!b) continue; const r = b.getBoundingClientRect(); if (x >= r.left && x <= r.right) return k; } return null; };
  const onTouchStart = (e) => { st.current.drag = null; st.current.start = e.touches.length === 1 ? e.touches[0].clientX : null; };
  const onTouchMove = (e) => {
    const s = st.current, box = bar.current, el = lens.current;
    if (!box || !el || s.start == null) return;
    const x = e.touches[0].clientX;
    if (!s.drag) {
      if (Math.abs(x - s.start) < 8) return;
      s.drag = { k: null };
      box.classList.add("u-dragging");
      el.classList.add("u-lens-up", "u-lens-still");
      clearTimeout(s.timer);
    }
    const o = box.getBoundingClientRect();
    put(Math.max(0, Math.min(box.clientWidth - s.w, x - o.left - s.w / 2)));
    const k = tabAt(x);
    if (k && k !== s.drag.k) { s.drag.k = k; setHot(k); if (navigator.vibrate) { try { navigator.vibrate(4); } catch (err) { /* ignore */ } } }
  };
  const onTouchEnd = () => {
    const s = st.current, d = s.drag, el = lens.current;
    s.drag = null; s.start = null;
    if (bar.current) bar.current.classList.remove("u-dragging");
    if (!d || !el) return;
    const k = d.k || tab, r = rectOf(k);
    el.classList.remove("u-lens-still");
    if (r) put(r.x, r.w);
    pulse(320);
    if (k !== tab) go(k);
  };

  return (
    <nav aria-label="Sections" className="u-keep u-hide-typing fixed inset-x-0 z-[45] flex items-center gap-1.5 px-2.5 min-[390px]:gap-2 min-[390px]:px-3 sm:hidden" style={{ bottom: "calc(var(--sabx) + 10px)" }}>
      <div ref={bar} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd} style={{ touchAction: "none" }}
        className="u-glass-bar relative flex h-[58px] min-w-0 flex-1 items-stretch rounded-full p-1 min-[390px]:h-[62px] min-[390px]:p-[5px]">
        <span ref={lens} aria-hidden="true" className="u-navlens" />
        {items.map(([k, , short]) => {
          const badge = k === "tickets" && user ? liveTickets(bookings) : 0;
          return (
            <button key={k} ref={(el) => { btns.current[k] = el; }} onClick={() => go(k)} aria-current={tab === k ? "page" : undefined}
              className={`u-keep u-haptic u-nav-item relative z-[1] flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-full px-0.5 text-[10px] font-medium leading-none min-[390px]:text-[10.5px] ${target === k ? "u-nav-on" : ""}`}>
              <span className="u-nav-icon relative">
                <Icon name={NAV_ICON[k] || "home"} className="h-[24px] w-[24px] min-[390px]:h-[26px] min-[390px]:w-[26px]" />
                {badge > 0 && <span className="absolute -right-2.5 -top-1 min-w-[1.1rem] rounded-full bg-[#ff3b30] px-1 text-center text-[10px] font-semibold leading-[1.1rem] text-white">{badge}</span>}
              </span>
              <span className="u-nav-label truncate">{short}</span>
            </button>
          );
        })}
      </div>
      {side}
    </nav>
  );
}
