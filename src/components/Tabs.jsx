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
   White icons; the open tab is accent-coloured on a soft capsule. Tapping or sliding the finger along the bar turns
   the capsule into a round glass lens that magnifies what's under it (a scaled copy of the bar inside the lens),
   glides with a spring and settles back into the capsule. Nothing changes on touch-down, so a tap is always a
   first-time click on iOS. Hidden while typing so it never sits on top of the keyboard. */
const NAV_ICON = { home: "home", clubs: "trophy", parties: "party", schedule: "calendar", tickets: "ticket" };
const MAG = 1.22; // lens magnification
const NavItem = ({ k, short, on, badge, ...rest }) => (
  <>
    <span className="u-nav-icon relative">
      <Icon name={NAV_ICON[k] || "home"} className="h-[24px] w-[24px] min-[390px]:h-[26px] min-[390px]:w-[26px]" />
      {badge > 0 && <span className="absolute -right-2.5 -top-1 min-w-[1.1rem] rounded-full bg-[#ff3b30] px-1 text-center text-[10px] font-semibold leading-[1.1rem] text-white">{badge}</span>}
    </span>
    <span className="truncate">{short}</span>
  </>
);
const itemCls = (on) => `u-keep u-nav-item relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-full px-0.5 text-[10px] font-medium leading-none min-[390px]:text-[10.5px] ${on ? "u-nav-on" : ""}`;

export function BottomNav({ tabs, tab, changeTab, user, bookings, side }) {
  const items = tabs.filter(([k]) => k !== "events");
  const bar = useRef(null), lensEl = useRef(null), copyEl = useRef(null), btns = useRef({});
  const [geo, setGeo] = useState(null); // { cx, w, W, H }: centre and width of the tab under the lens, bar size
  const [up, setUp] = useState(false); // lens open (moving or dragged)
  const [pending, setPending] = useState(null); // tab tapped, page switch on its way
  useEffect(() => {
    if (!pending) return;
    if (pending === tab) { setPending(null); return; }
    const t = setTimeout(() => setPending(null), 800);
    return () => clearTimeout(t);
  }, [tab, pending]);
  const target = pending || tab;
  const measure = (k) => {
    const b = btns.current[k], box = bar.current;
    if (!b || !box) return null;
    const r = b.getBoundingClientRect(), o = box.getBoundingClientRect();
    return { cx: r.left - o.left + r.width / 2, w: r.width, W: box.clientWidth, H: box.clientHeight };
  };
  const last = useRef(null);
  useLayoutEffect(() => {
    const m = measure(target);
    if (!m) return;
    if (last.current && Math.abs(last.current - m.cx) > 1) setUp(true);
    last.current = m.cx;
    setGeo(m);
  }, [target, items.length]);
  useEffect(() => { if (!up || drag.current) return; const t = setTimeout(() => setUp(false), 430); return () => clearTimeout(t); }, [up, geo]);
  useEffect(() => {
    const re = () => { const m = measure(tab); if (m) { last.current = m.cx; setGeo(m); } };
    window.addEventListener("resize", re);
    return () => window.removeEventListener("resize", re);
  }, [tab]);
  const go = (k) => { if (k === tab) { window.scrollTo({ top: 0, behavior: "smooth" }); return; } setPending(k); requestAnimationFrame(() => requestAnimationFrame(() => changeTab(k))); };

  // Lens geometry: a little wider than a tab and taller than the bar, so it bulges out like Telegram's.
  const ew = geo ? Math.round(Math.min(geo.w * 1.3, geo.w + 26)) : 0, eh = geo ? geo.H + 16 : 0;
  const place = (cx) => {
    const L = cx - ew / 2;
    return {
      lens: `translate3d(${L}px,0,0)`,
      copy: `translate(${ew / 2}px, ${eh / 2}px) scale(${MAG}) translate(${-cx}px, ${-geo.H / 2}px)`,
    };
  };

  /* Sliding: the lens follows the finger (moved straight on the DOM, no React render per move), the tab under it
     lights up inside the lens, letting go opens it. */
  const drag = useRef(null);
  const tabAt = (x) => { for (const [k] of items) { const b = btns.current[k]; if (!b) continue; const r = b.getBoundingClientRect(); if (x >= r.left && x <= r.right) return k; } return null; };
  const hot = (k) => { const c = copyEl.current; if (c) c.querySelectorAll("[data-k]").forEach((el) => el.classList.toggle("u-nav-on", el.dataset.k === k)); };
  const onTouchStart = (e) => { drag.current = e.touches.length === 1 ? { x0: e.touches[0].clientX, on: false, k: null } : null; };
  const onTouchMove = (e) => {
    const d = drag.current, box = bar.current, el = lensEl.current, cp = copyEl.current;
    if (!d || !box || !el || !cp || !geo) return;
    const x = e.touches[0].clientX;
    if (!d.on) {
      if (Math.abs(x - d.x0) < 8) return;
      d.on = true;
      el.classList.add("u-lens-up", "u-lens-drag");
    }
    const o = box.getBoundingClientRect();
    const cx = Math.max(geo.w / 2, Math.min(geo.W - geo.w / 2, x - o.left));
    const p = place(cx);
    el.style.transform = p.lens; cp.style.transform = p.copy;
    const k = tabAt(x);
    if (k && k !== d.k) { d.k = k; hot(k); if (navigator.vibrate) { try { navigator.vibrate(4); } catch (err) { /* ignore */ } } }
  };
  const onTouchEnd = () => {
    const d = drag.current, el = lensEl.current, cp = copyEl.current;
    drag.current = null;
    if (!d || !d.on || !el || !cp) return;
    el.classList.remove("u-lens-drag"); // eases from the finger onto the chosen tab
    const k = d.k || tab, m = measure(k);
    if (m) { const p = place(m.cx); el.style.transform = p.lens; cp.style.transform = p.copy; }
    // The lens stays where it landed; React moves it on from there when the tab changes.
    setTimeout(() => { el.classList.remove("u-lens-up"); hot(null); }, 300);
    if (k !== tab) go(k);
  };

  const badgeOf = (k) => (k === "tickets" && user ? liveTickets(bookings) : 0);
  const p = geo ? place(geo.cx) : null;
  return (
    <nav aria-label="Sections" className="u-keep u-hide-typing fixed inset-x-0 z-[45] flex items-center gap-1.5 px-2.5 min-[390px]:gap-2 min-[390px]:px-3 sm:hidden" style={{ bottom: "calc(var(--sabx) + 10px)" }}>
      <div ref={bar} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd} style={{ touchAction: "none" }}
        className="u-glass-bar relative flex h-[58px] min-w-0 flex-1 items-stretch rounded-full p-1 min-[390px]:h-[62px] min-[390px]:p-[5px]">
        {geo && (
          <span ref={lensEl} aria-hidden="true" className={`u-tglens ${up ? "u-lens-up" : ""}`}
            style={{ width: ew, height: eh, top: (geo.H - eh) / 2, transform: p.lens }}>
            <span className="u-tglens-cap" style={{ width: geo.w, height: geo.H - 10, left: (ew - geo.w) / 2, top: (eh - geo.H + 10) / 2 }} />
            <span className="u-tglens-glass">
              <span ref={copyEl} className="u-tglens-copy flex items-stretch p-1 min-[390px]:p-[5px]" style={{ width: geo.W, height: geo.H, transform: p.copy }}>
                {items.map(([k, , short]) => <span key={k} data-k={k} className={itemCls(target === k)}><NavItem k={k} short={short} badge={badgeOf(k)} /></span>)}
              </span>
            </span>
          </span>
        )}
        {items.map(([k, , short]) => (
          <button key={k} ref={(el) => { btns.current[k] = el; }} onClick={() => go(k)} aria-current={tab === k ? "page" : undefined}
            className={`u-haptic z-[1] ${itemCls(target === k)}`}>
            <NavItem k={k} short={short} badge={badgeOf(k)} />
          </button>
        ))}
      </div>
      {side}
    </nav>
  );
}
