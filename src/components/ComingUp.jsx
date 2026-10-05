import { fmtDate } from "../lib/format.js";

/* Under an empty Schedule or Tickets screen: the next few events, one tap to open, so the screen is never a dead end. */
export function ComingUp({ events = [], onOpen, title = "Coming up on campus" }) {
  const list = events.filter((p) => !p.pinned).slice(0, 3);
  if (!list.length) return null;
  return (
    <section className="mt-6">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {list.map((p) => (
          <button key={p.id} type="button" onClick={() => onOpen(p)}
            className="u-card flex items-center gap-3 rounded-2xl border border-slate-200/50 bg-white p-2.5 pr-3.5 text-left shadow-sm">
            {p.logo || p.cover
              ? <img src={p.logo || p.cover} alt="" loading="lazy" decoding="async" className="u-keep h-14 w-14 shrink-0 rounded-xl object-cover" />
              : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl" aria-hidden="true">{p.emoji}</span>}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-slate-900">{p.title}</span>
              <span className="block truncate text-sm text-slate-500">{fmtDate(p.date)} · {p.time}</span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-slate-900">{p.price > 0 ? `${p.price} AED` : "Free"}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
