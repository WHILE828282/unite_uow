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
   Flat white icons; the active one takes the accent colour on a soft capsule. The capsule is one "lens" that glides
   to the tab you tap: it swells into a glass bubble while it moves, then settles. Nothing changes on touch-down:
   iOS treats a first tap that changes the page as a hover, which made tabs need a double tap.
   Hidden while typing so it never sits on top of the keyboard. "My events" lives in the profile menu. */
const NAV_ICON = { home: "home", clubs: "trophy", parties: "party", schedule: "calendar", tickets: "ticket" };
export function BottomNav({ tabs, tab, changeTab, user, bookings, side }) {
  const items = tabs.filter(([k]) => k !== "events");
  const bar = useRef(null), lensEl = useRef(null), btns = useRef({});
  const [lens, setLens] = useState(null); // { x, w } of the capsule under the open tab
  // The capsule moves first; the (heavier) page switch follows a couple of frames later.
  const [pending, setPending] = useState(null);
  useEffect(() => {
    if (!pending) return;
    if (pending === tab) { setPending(null); return; }
    const t = setTimeout(() => setPending(null), 800);
    return () => clearTimeout(t);
  }, [tab, pending]);
  const target = pending || tab;
  const measure = (k) => { const b = btns.current[k], box = bar.current; if (!b || !box) return null; const r = b.getBoundingClientRect(), o = box.getBoundingClientRect(); return { x: r.left - o.left, w: r.width }; };
  useLayoutEffect(() => { const m = measure(target); if (m) setLens(m); }, [target, items.length]);
  useEffect(() => {
    const re = () => { const m = measure(tab); if (m) setLens(m); };
    window.addEventListener("resize", re);
    return () => window.removeEventListener("resize", re);
  }, [tab]);
  const go = (k) => { if (k === tab) { window.scrollTo({ top: 0, behavior: "smooth" }); return; } setPending(k); requestAnimationFrame(() => requestAnimationFrame(() => changeTab(k))); };

  /* Hold and slide (like Telegram): the glass follows the finger, the tab under it lights up, letting go opens it.
     The glass is moved straight on the DOM (no React render per finger move), and nothing changes until the finger
     actually moves, so a plain tap stays a normal first-time click. */
  const drag = useRef(null);
  const tabAt = (x) => { for (const [k] of items) { const b = btns.current[k]; if (!b) continue; const r = b.getBoundingClientRect(); if (x >= r.left && x <= r.right) return k; } return null; };
  const light = (k) => { for (const [key] of items) { const b = btns.current[key]; if (b) b.classList.toggle("u-nav-hot", key === k); } };
  const onTouchStart = (e) => { drag.current = e.touches.length === 1 ? { x0: e.touches[0].clientX, on: false, k: null } : null; };
  const onTouchMove = (e) => {
    const d = drag.current, box = bar.current, el = lensEl.current;
    if (!d || !box || !el || !lens) return;
    const x = e.touches[0].clientX;
    if (!d.on) {
      if (Math.abs(x - d.x0) < 8) return;
      d.on = true;
      box.classList.add("u-dragging");
      el.classList.add("u-lens-up", "u-lens-drag");
    }
    const o = box.getBoundingClientRect();
    const left = Math.max(0, Math.min(box.clientWidth - lens.w, x - o.left - lens.w / 2));
    el.style.transform = `translateX(${left}px)`;
    const k = tabAt(x);
    if (k && k !== d.k) { d.k = k; light(k); if (navigator.vibrate) { try { navigator.vibrate(4); } catch (err) { /* ignore */ } } }
  };
  const onTouchEnd = () => {
    const d = drag.current, box = bar.current, el = lensEl.current;
    drag.current = null;
    if (!d || !d.on || !box || !el) return;
    box.classList.remove("u-dragging");
    el.classList.remove("u-lens-drag"); // eases from the finger to the chosen tab
    const k = d.k || tab;
    const m = measure(k);
    if (m) el.style.transform = `translateX(${m.x}px)`;
    setTimeout(() => { el.classList.remove("u-lens-up"); light(null); }, 260);
    if (k !== tab) go(k);
  };

  return (
    <nav aria-label="Sections" className="u-keep u-hide-typing fixed inset-x-0 z-[45] flex items-center gap-1.5 px-2.5 min-[390px]:gap-2 min-[390px]:px-3 sm:hidden" style={{ bottom: "calc(var(--sabx) + 10px)" }}>
      <div ref={bar} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd} style={{ touchAction: "none" }}
        className="u-glass-bar relative flex h-[58px] min-w-0 flex-1 items-stretch rounded-full p-1 min-[390px]:h-[62px] min-[390px]:p-[5px]">
        {lens && <span ref={lensEl} aria-hidden="true" className="u-lens" style={{ width: lens.w, transform: `translateX(${lens.x}px)` }} />}
        {items.map(([k, , short]) => {
          const on = target === k;
          const badge = k === "tickets" && user ? liveTickets(bookings) : 0;
          return (
            <button key={k} ref={(el) => { btns.current[k] = el; }} onClick={() => go(k)} aria-current={tab === k ? "page" : undefined}
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
