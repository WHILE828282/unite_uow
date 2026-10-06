import { useEffect, useRef } from "react";
import { overlayStyle } from "../../lib/styles.js";
import { Icon } from "../ui.jsx";

/* True while a field has focus, or when this very tap just closed the keyboard (main.jsx): a backdrop tap then only
   dismisses the keyboard instead of closing the sheet and losing what was typed. */
export const typingNow = () => (document.activeElement && document.activeElement.matches("input, textarea, select")) || Date.now() - (window.__uniteKbClosedAt || 0) < 500;

/* side: on large screens the sheet opens as a full-height panel on the right, so the list stays in view on the left. */
export function Modal({ children, onClose, locked, size = "md", side = false }) {
  useEffect(() => {
    if (locked) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [locked, onClose]);

  // Phones: pull the sheet down from its top to close it (like a native sheet). Ignored while scrolled or typing.
  const sheet = useRef(null), drag = useRef(null);
  const onTouchStart = (e) => {
    const el = sheet.current;
    drag.current = !locked && el && window.innerWidth < 640 && el.scrollTop <= 0 && !typingNow() && !e.target.closest("input, textarea, select, .u-chips") ? { y: e.touches[0].clientY, dy: 0 } : null;
  };
  const onTouchMove = (e) => {
    const d = drag.current, el = sheet.current;
    if (!d || !el) return;
    d.dy = e.touches[0].clientY - d.y;
    if (d.dy < 0 || el.scrollTop > 0) { drag.current = null; el.style.transform = ""; return; }
    if (d.dy < 4) return;
    el.style.transition = "none";
    el.style.transform = `translateY(${d.dy * 0.9}px)`;
  };
  const onTouchEnd = () => {
    const d = drag.current, el = sheet.current;
    drag.current = null;
    if (!d || !el || d.dy < 4) return; // a plain tap: leave the sheet alone so the click goes through first time
    el.style.transition = "transform .25s cubic-bezier(.2,.8,.2,1)";
    if (d.dy > 110) { el.style.transform = "translateY(100%)"; setTimeout(onClose, 180); }
    else el.style.transform = "";
  };

  return (
    <div
      className={`u-fade u-vv fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 ${side ? "lg:items-stretch lg:justify-end lg:p-0 lg:u-side-dim" : ""}`}
      style={overlayStyle}
      onMouseDown={(e) => { if (e.target !== e.currentTarget || locked) return; if (typingNow()) { e.preventDefault(); if (document.activeElement) document.activeElement.blur(); return; } onClose(); }}
    >
      <div ref={sheet} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}
        className={`u-up relative w-full ${size === "lg" ? "max-w-lg" : size === "sm" ? "max-w-sm" : "max-w-md"} u-safe-sheet u-sheet-h overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${side ? "lg:u-side lg:max-h-none lg:max-w-[34rem] lg:rounded-none lg:rounded-l-3xl" : ""}`}>
        {!locked && <span className="pointer-events-none absolute left-1/2 top-2 z-20 h-1.5 w-10 -translate-x-1/2 rounded-full bg-slate-300/80 mix-blend-normal sm:hidden" aria-hidden="true" />}
        {!locked && (
          <button onClick={onClose} aria-label="Close" className="u-btn absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200/70 backdrop-blur hover:bg-slate-200"><Icon name="close" className="h-4 w-4" /></button>
        )}
        {children}
      </div>
    </div>
  );
}
