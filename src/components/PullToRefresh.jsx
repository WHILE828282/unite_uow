import { useEffect, useRef, useState } from "react";
import { isStandalone } from "../../install.js";

/* Pull to refresh for the installed app (home-screen apps have no browser refresh gesture): at the top of the page,
   pull down past the threshold and let go to reload (this also picks up a new version). Off while a modal is open
   (the page is pinned then) or while typing. */
const THRESHOLD = 72;
const MAX = 110;

export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const st = useRef(null);
  useEffect(() => {
    if (!isStandalone()) return;
    const blocked = () => document.body.style.position === "fixed" || (document.activeElement && document.activeElement.matches("input, textarea, select"));
    const start = (e) => {
      if (e.touches.length !== 1 || window.scrollY > 0 || blocked()) { st.current = null; return; }
      st.current = { y: e.touches[0].clientY, x: e.touches[0].clientX, d: 0 };
    };
    const move = (e) => {
      const s = st.current;
      if (!s) return;
      const dy = e.touches[0].clientY - s.y, dx = e.touches[0].clientX - s.x;
      if (window.scrollY > 0 || dy <= 0 || (s.d === 0 && Math.abs(dx) > Math.abs(dy))) { if (s.d) setPull(0); st.current = s.d ? null : s; return; }
      s.d = Math.min(MAX, dy * 0.5);
      if (e.cancelable) e.preventDefault(); // our indicator instead of the rubber-band bounce
      setPull(s.d);
    };
    const end = () => {
      const s = st.current;
      st.current = null;
      if (!s || !s.d) return;
      if (s.d >= THRESHOLD) {
        setBusy(true); setPull(THRESHOLD);
        if (navigator.vibrate) navigator.vibrate(15);
        setTimeout(() => window.location.reload(), 250);
      } else setPull(0);
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
    };
  }, []);
  if (!pull && !busy) return null;
  const ready = pull >= THRESHOLD;
  return (
    <div className="u-keep pointer-events-none fixed inset-x-0 z-[45] flex justify-center" style={{ top: `calc(var(--sat) + 3.5rem + ${pull - 40}px)`, transition: st.current ? "none" : "top .2s ease" }} aria-hidden="true">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200" style={{ opacity: Math.min(1, pull / 40) }}>
        {busy ? <span className="u-spin h-5 w-5 rounded-full border-2 border-crimson-600 border-t-transparent" />
          : <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${ready ? 180 : (pull / THRESHOLD) * 180}deg)`, transition: "transform .1s" }}><path d="M12 5v14m0 0l-6-6m6 6l6-6" /></svg>}
      </span>
    </div>
  );
}
