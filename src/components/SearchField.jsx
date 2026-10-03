import { useEffect, useRef } from "react";
import { Icon } from "./ui.jsx";

/* Search box used on the Clubs and Events tabs. "/" focuses it on a keyboard; the ✕ clears it. */
export default function SearchField({ value, onChange, placeholder }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
      e.preventDefault(); ref.current && ref.current.focus();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder}</span>
      <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input ref={ref} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        enterKeyHint="search" autoComplete="off" autoCorrect="off" spellCheck="false"
        onKeyDown={(e) => { if (e.key === "Escape" && value) { e.stopPropagation(); onChange(""); } }}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden" />
      {value && (
        <button type="button" onClick={() => { onChange(""); ref.current && ref.current.focus(); }} aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <Icon name="close" className="h-3.5 w-3.5" />
        </button>
      )}
    </label>
  );
}

// Case- and accent-insensitive match of every word in the query against any of the fields.
export const matches = (query, ...fields) => {
  const norm = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const hay = norm(fields.join(" "));
  return norm(query).split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
};
