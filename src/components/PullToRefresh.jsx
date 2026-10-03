import { useEffect, useRef, useState } from "react";
import { isStandalone } from "../../install.js";

/* Pull to refresh for the installed app (home-screen apps have no browser refresh gesture). Works like the native
   one: at the top of the page the content follows your finger down with a rubber-band feel, a spinner shows in the
   gap, and letting go past the threshold reloads (this also picks up a new version). Short pulls spring back.
   The header stays put; everything marked data-ptr slides. Off while a modal is open (the page is pinned then)
   or while typing. */
const THRESHOLD = 70; // how far the content has to travel before release refreshes
const HOLD = 56; // where the content rests while reloading
const RANGE = 150; // rubber-band limit

const rubber = (dy) => (1 - 1 / (dy / RANGE + 1)) * RANGE;

export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const st = useRef(null);
  useEffect(() => {
    if (!isStandalone()) return;
    const slide = (d, animate) => {
      document.querySelectorAll("[data-ptr]").forEach((el) => {
        el.style.transition = animate ? "transform .35s cubic-bezier(.2,.8,.2,1)" : "none";
        el.style.transform = d ? `translate3d(0, ${d}px, 0)` : "";
      });
    };
    const blocked = () => document.body.style.position === "fixed" || (document.activeElement && document.activeElement.matches("input, textarea, select"));
    const start = (e) => {
      if (e.touches.length !== 1 || window.scrollY > 0 || blocked()) { st.current = null; return; }
      st.current = { y: e.touches[0].clientY, x: e.touches[0].clientX, d: 0, busy: false };
    };
    const move = (e) => {
      const s = st.current;
      if (!s || s.busy) return;
      const dy = e.touches[0].clientY - s.y, dx = e.touches[0].clientX - s.x;
      // Scrolling up, sideways swipe (rails), or the page already scrolled: let the browser have it.
      if (window.scrollY > 0 || (s.d === 0 && (dy <= 0 || Math.abs(dx) > Math.abs(dy)))) { st.current = s.d ? s : null; return; }
      if (e.cancelable) e.preventDefault(); // our rubber band instead of the native bounce
      const d = dy > 0 ? rubber(dy) : 0;
      if (s.d < THRESHOLD && d >= THRESHOLD && navigator.vibrate) navigator.vibrate(10);
      s.d = d;
      slide(d, false);
      setDragging(true);
      setPull(d);
    };
    const end = () => {
      const s = st.current;
      st.current = null;
      setDragging(false);
      if (!s || !s.d) return;
      if (s.d >= THRESHOLD) {
        s.busy = true;
        setBusy(true); setPull(HOLD); slide(HOLD, true);
        setTimeout(() => window.location.reload(), 450);
      } else { setPull(0); slide(0, true); }
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end, { passive: true });
    window.addEventListener("touchcancel", end, { passive: true });
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
      slide(0, false);
    };
  }, []);
  if (!pull && !busy) return null;
  const p = Math.min(1, pull / THRESHOLD);
  return (
    <div className="u-keep pointer-events-none fixed inset-x-0 z-20 flex justify-center" aria-hidden="true"
      style={{ top: "calc(var(--sat) + 3.75rem)", height: pull, alignItems: "center", transition: dragging ? "none" : "height .35s cubic-bezier(.2,.8,.2,1)" }}>
      <span className="u-keep flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200"
        style={{ opacity: p, transform: `scale(${0.6 + 0.4 * p})` }}>
        {busy ? <span className="u-spin h-5 w-5 rounded-full border-2 border-crimson-600 border-t-transparent" />
          : <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${p * 180}deg)`, transition: "transform .1s" }}><path d="M12 5v14m0 0l-6-6m6 6l6-6" /></svg>}
      </span>
    </div>
  );
}
