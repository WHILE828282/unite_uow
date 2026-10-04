import { useState } from "react";
import { Modal } from "./Modal.jsx";
import { Icon } from "../ui.jsx";
import { APP_STATES, STATE_LABEL, STATE_TONE, mailLink, waLink } from "../../lib/apps.js";

const ago = (t) => {
  const m = Math.max(1, Math.round((Date.now() - t) / 6e4));
  return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

/* Manage club: the club's applications (owner and helpers) and, for the owner, the helpers list.
   Each application has one button per action: WhatsApp (marks it contacted), Email, Accept, Decline. */
export function ManageClub({ club, onStatus, onHelper, onClose }) {
  const [filter, setFilter] = useState(() => (club.apps.some((a) => a.status === "new") ? "new" : "contacted"));
  const [who, setWho] = useState("");
  const [helperErr, setHelperErr] = useState("");
  const [busy, setBusy] = useState("");
  const list = club.apps.filter((a) => a.status === filter);
  const count = (s) => club.apps.filter((a) => a.status === s).length;

  const act = async (a, status) => { setBusy(a.id + status); await onStatus(a, status); setBusy(""); };
  const addHelper = async (e) => {
    e.preventDefault();
    if (!who.trim()) return;
    setBusy("helper");
    const err = await onHelper("add", who.trim());
    setBusy("");
    if (err) setHelperErr(err); else { setWho(""); setHelperErr(""); }
  };

  return (
    <Modal onClose={onClose} size="lg">
      <div className="p-6 pt-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-crimson-700">Manage club · {club.role === "owner" ? "Owner" : "Helper"}</p>
        <h2 className="mt-1 pr-10 text-lg font-bold text-slate-900">{club.club}</h2>

        <div role="tablist" aria-label="Application status" className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
          {APP_STATES.map((s) => (
            <button key={s} role="tab" aria-selected={filter === s} onClick={() => setFilter(s)}
              className={`u-keep rounded-lg px-1 py-2 text-xs font-semibold transition-colors ${filter === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              {STATE_LABEL[s]} <span className="tabular-nums text-slate-400">{count(s)}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {list.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">No {STATE_LABEL[filter].toLowerCase()} applications.</p>}
          {list.map((a) => (
            <article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">{a.name}</h3>
                  {a.year && <p className="text-sm text-slate-500">{a.year}</p>}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATE_TONE[a.status]}`}>{STATE_LABEL[a.status]}</span>
              </div>
              {a.message && <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">“{a.message}”</p>}
              <p className="mt-2 break-all text-xs text-slate-500">{a.email} · +{a.whatsapp} · {ago(a.at)}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <a href={waLink(a)} target="_blank" rel="noopener noreferrer" onClick={() => a.status === "new" && onStatus(a, "contacted", true)}
                  className="u-keep u-btn flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">WhatsApp</a>
                <a href={mailLink(a)} className="u-btn flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"><Icon name="mail" className="h-4 w-4" /> Email</a>
                <button onClick={() => act(a, "accepted")} disabled={!!busy || a.status === "accepted"}
                  className="u-btn rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40">{busy === a.id + "accepted" ? "…" : "Accept"}</button>
                <button onClick={() => act(a, "declined")} disabled={!!busy || a.status === "declined"}
                  className="u-btn rounded-xl py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-slate-200 hover:bg-rose-50 disabled:opacity-40">{busy === a.id + "declined" ? "…" : "Decline"}</button>
              </div>
            </article>
          ))}
        </div>

        {club.role === "owner" && (
          <section className="mt-7 border-t border-slate-100 pt-5">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Helpers</h3>
            <p className="mt-1 text-sm text-slate-500">Helpers see and answer applications with you.</p>
            <ul className="mt-3 space-y-2">
              {club.helpers.length === 0 && <li className="text-sm text-slate-400">No helpers yet.</li>}
              {club.helpers.map((h) => (
                <li key={h} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2">
                  <span className="min-w-0 truncate text-sm text-slate-700">{h}</span>
                  <button onClick={() => onHelper("remove", h)} disabled={!!busy} className="u-btn shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">Remove</button>
                </li>
              ))}
            </ul>
            <form onSubmit={addHelper} className="mt-3 flex gap-2">
              <input value={who} onChange={(e) => { setWho(e.target.value); setHelperErr(""); }} autoCapitalize="none" autoCorrect="off" spellCheck={false}
                placeholder="Email or @telegram" aria-label="Helper email or Telegram username"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-crimson-400 focus:outline-none focus:ring-2 focus:ring-crimson-100" />
              <button type="submit" disabled={!who.trim() || busy === "helper"} className="u-btn shrink-0 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-40">Add</button>
            </form>
            {helperErr && <p className="mt-1.5 text-xs text-rose-600">{helperErr}</p>}
          </section>
        )}
      </div>
    </Modal>
  );
}
