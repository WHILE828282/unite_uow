import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "./ui.jsx";
import { dubaiDay } from "../lib/format.js";

// Badge: tickets you can still use (not cancelled, event not over).
const liveTickets = (bs) => bs.filter((b) => b.state !== "cancelled" && !(b.date && b.date < dubaiDay())).length;

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
   Flat white icons; the active one takes the accent colour on a soft capsule. The capsule is one "lens" that glides
   to the tab you tap: it swells into a glass bubble while it moves, then settles. Nothing changes on touch-down:
   iOS treats a first tap that changes the page as a hover, which made tabs need a double tap.
   Hidden while typing so it never sits on top of the keyboard. "My events" lives in the profile menu. */
const NAV_ICON = { home: "home", clubs: "trophy", parties: "party", schedule: "calendar", tickets: "ticket" };
export function BottomNav({ tabs, tab, changeTab, user, bookings, side }) {
  const items = tabs.filter(([k]) => k !== "events");
  const bar = useRef(null), btns = useRef({}), last = useRef(null);
  const [lens, setLens] = useState(null); // { x, w } of the capsule
  const [moving, setMoving] = useState(false);
  // The lens starts moving first; the (heavier) page switch follows a couple of frames later.
  const [pending, setPending] = useState(null);
  useEffect(() => {
    if (!pending) return;
    if (pending === tab) { setPending(null); return; }
    const t = setTimeout(() => setPending(null), 800);
    return () => clearTimeout(t);
  }, [tab, pending]);
  // Hold and slide along the bar (like Telegram): the glass follows the finger, the tab under it lights up, and
  // letting go opens it. Nothing happens until the finger actually moves, so a plain tap is still a normal click.
  const drag = useRef(null);
  const [dragX, setDragX] = useState(null), [hover, setHover] = useState(null);
  const tabAt = (x) => { for (const [k] of items) { const b = btns.current[k]; if (!b) continue; const r = b.getBoundingClientRect(); if (x >= r.left && x <= r.right) return k; } return null; };
  const onTouchStart = (e) => { if (e.touches.length === 1) drag.current = { x0: e.touches[0].clientX, on: false }; };
  const onTouchMove = (e) => {
    const d = drag.current, box = bar.current;
    if (!d || !box) return;
    const x = e.touches[0].clientX;
    if (!d.on && Math.abs(x - d.x0) < 8) return;
    d.on = true;
    setDragX(x - box.getBoundingClientRect().left);
    const k = tabAt(x);
    if (k) setHover(k);
  };
  const onTouchEnd = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.on) return;
    const k = hover;
    setDragX(null); setHover(null);
    if (k && k !== tab) { setPending(k); requestAnimationFrame(() => requestAnimationFrame(() => changeTab(k))); }
  };
  const target = hover || pending || tab;
  useLayoutEffect(() => {
    const b = btns.current[target], box = bar.current;
    if (!b || !box) return;
    const r = b.getBoundingClientRect(), o = box.getBoundingClientRect();
    const next = { x: r.left - o.left, w: r.width };
    if (last.current && Math.abs(last.current.x - next.x) > 1) setMoving(true);
    last.current = next;
    setLens(next);
  }, [target, items.length]);
  useEffect(() => {
    if (!moving) return;
    const t = setTimeout(() => setMoving(false), 420);
    return () => clearTimeout(t);
  }, [moving, lens]);
  // Keep the capsule aligned when the bar resizes (rotation, font load).
  useEffect(() => {
    const re = () => { const b = btns.current[tab], box = bar.current; if (b && box) { const r = b.getBoundingClientRect(), o = box.getBoundingClientRect(); setLens({ x: r.left - o.left, w: r.width }); } };
    window.addEventListener("resize", re);
    return () => window.removeEventListener("resize", re);
  }, [tab]);
  return (
    <nav aria-label="Sections" className="u-keep u-hide-typing fixed inset-x-0 z-[45] flex items-center gap-1.5 px-2.5 min-[390px]:gap-2 min-[390px]:px-3 sm:hidden" style={{ bottom: "calc(var(--sabx) + 10px)" }}>
      <div ref={bar} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd} style={{ touchAction: "none" }}
        className={`u-glass-bar ${moving || dragX !== null ? "u-moving" : ""} relative flex h-[58px] min-w-0 flex-1 items-stretch rounded-full p-1 min-[390px]:h-[62px] min-[390px]:p-[5px]`}>
        {lens && <span aria-hidden="true" className={`u-lens ${moving || dragX !== null ? "u-lens-up" : ""} ${dragX !== null ? "u-lens-drag" : ""}`}
          style={{ width: lens.w, transform: `translateX(${dragX !== null && bar.current ? Math.max(0, Math.min(bar.current.clientWidth - lens.w, dragX - lens.w / 2)) : lens.x}px)` }} />}
        {items.map(([k, , short]) => {
          const on = target === k;
          const badge = k === "tickets" && user ? liveTickets(bookings) : 0;
          return (
            <button key={k} ref={(el) => { btns.current[k] = el; }} onClick={() => { if (k === tab) { window.scrollTo({ top: 0, behavior: "smooth" }); return; } setPending(k); requestAnimationFrame(() => requestAnimationFrame(() => changeTab(k))); }} aria-current={tab === k ? "page" : undefined}
              className={`u-keep u-haptic u-nav-item relative z-[1] flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-full px-0.5 text-[10px] font-medium leading-none min-[390px]:text-[10.5px] ${on ? "u-nav-on" : ""}`}>
              <span className="u-nav-icon relative">
                <Icon name={NAV_ICON[k] || "home"} className="h-[24px] w-[24px] min-[390px]:h-[26px] min-[390px]:w-[26px]" />
                {badge > 0 && <span className="absolute -right-2.5 -top-1 min-w-[1.1rem] rounded-full bg-[#ff3b30] px-1 text-center text-[10px] font-semibold leading-[1.1rem] text-white">{badge}</span>}
              </span>
              <span className="truncate">{short}</span>
            </button>
          );
        })}
      </div>
      {side}
    </nav>
  );
}
