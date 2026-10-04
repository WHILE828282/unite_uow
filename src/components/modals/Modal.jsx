import { useEffect } from "react";
import { overlayStyle } from "../../lib/styles.js";
import { Icon } from "../ui.jsx";

/* True while a field has focus, or when this very tap just closed the keyboard (main.jsx): a backdrop tap then only
   dismisses the keyboard instead of closing the sheet and losing what was typed. */
export const typingNow = () => (document.activeElement && document.activeElement.matches("input, textarea, select")) || Date.now() - (window.__uniteKbClosedAt || 0) < 500;

export function Modal({ children, onClose, locked, size = "md" }) {
  useEffect(() => {
    if (locked) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [locked, onClose]);

  return (
    <div
      className="u-fade u-vv fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      style={overlayStyle}
      onMouseDown={(e) => { if (e.target !== e.currentTarget || locked) return; if (typingNow()) { e.preventDefault(); if (document.activeElement) document.activeElement.blur(); return; } onClose(); }}
    >
      <div className={`u-up relative w-full ${size === "lg" ? "max-w-lg" : size === "sm" ? "max-w-sm" : "max-w-md"} u-safe-sheet u-sheet-h overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl`}>
        {!locked && (
          <button onClick={onClose} aria-label="Close" className="u-btn absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200/70 backdrop-blur hover:bg-slate-200"><Icon name="close" className="h-4 w-4" /></button>
        )}
        {children}
      </div>
    </div>
  );
}
