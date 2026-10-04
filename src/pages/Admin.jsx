import { useEffect, useMemo, useState } from "react";

/* /admin: tables of users, clubs, applications, events and tickets, with search and CSV export.
   Only for the emails in ADMIN_EMAILS (checked on the server); sign in on Unite with your email code first. */
const TABS = [["users", "Users"], ["clubs", "Clubs"], ["applications", "Applications"], ["events", "Events"], ["tickets", "Tickets"]];
const session = () => { try { return (JSON.parse(localStorage.getItem("unite-session") || "null") || {}).tok || ""; } catch (e) { return ""; } };
const api = async (body) => {
  try {
    const r = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ s: session(), ...body }) });
    const d = await r.json().catch(() => ({}));
    return r.ok && d.ok !== false ? d : { ok: false, code: d.code, error: d.error || "Request failed." };
  } catch (e) { return { ok: false, error: "Couldn't reach Unite." }; }
};
const label = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const cell = (v) => (v === null || v === undefined || v === "" ? "—" : typeof v === "boolean" ? (v ? "Yes" : "No") : /^\d{4}-\d{2}-\d{2}T/.test(String(v)) ? new Date(v).toLocaleString("en-GB", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : String(v));
const csv = (rows) => {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const q = (v) => { const s = v === null || v === undefined ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => q(r[c])).join(","))].join("\n");
};

export default function AdminPage() {
  const dark = (() => { try { return localStorage.getItem("unite-theme") === "dark"; } catch (e) { return false; } })();
  const [me, setMe] = useState(null);
  const [denied, setDenied] = useState("");
  const [counts, setCounts] = useState({});
  const [copyInfo, setCopyInfo] = useState(null);
  const [tab, setTab] = useState("users");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [report, setReport] = useState(null);

  useEffect(() => { document.title = "Admin · Unite"; }, []);
  const overview = async () => {
    const r = await api({ a: "overview" });
    if (!r.ok) return setDenied(r.code === "session" ? "Sign in on Unite with your admin email first, then come back to this page." : r.error);
    setMe(r.me); setCounts(r.counts || {}); setCopyInfo(r.redisCopy);
  };
  useEffect(() => { overview(); }, []);
  useEffect(() => {
    if (!me) return;
    let stop = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const r = await api({ a: "table", table: tab, q, limit: 500 });
      if (!stop) { setRows(r.ok ? r.rows : []); setLoading(false); }
    }, 250);
    return () => { stop = true; clearTimeout(t); };
  }, [me, tab, q]);

  const exportCsv = async () => {
    setBusy("csv");
    const r = await api({ a: "table", table: tab, q, limit: 5000 });
    setBusy("");
    if (!r.ok) return;
    const blob = new Blob([csv(r.rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `unite-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const copy = async (dryRun) => {
    setBusy(dryRun ? "dry" : "copy");
    const r = await api({ a: "copy", dryRun });
    setBusy(""); setReport(r);
    if (!dryRun) overview();
  };
  const cols = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);
  const tableCounts = { users: counts.users, clubs: counts.clubs, applications: counts.club_applications, events: counts.events, tickets: counts.tickets };

  return (
    <div className={`u-page min-h-screen bg-slate-50 text-slate-900 ${dark ? "u-dark" : "u-light"}`}>
      <header className="u-safe-top sticky top-0 z-10 border-b border-slate-200/60 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <a href="/" className="u-btn inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-xl px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">← Unite</a>
          <h1 className="text-lg font-bold">Admin</h1>
          {me && <span className="ml-auto truncate text-sm text-slate-500">{me}</span>}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        {denied ? (
          <div className="mx-auto mt-16 max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <h2 className="text-lg font-bold">No access</h2>
            <p className="mt-2 text-sm text-slate-600">{denied}</p>
            <a href="/" className="u-btn mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Go to Unite</a>
          </div>
        ) : !me ? <p className="mt-16 text-center text-sm text-slate-500">Loading…</p> : (
          <>
            <div role="tablist" className="flex flex-wrap gap-2">
              {TABS.map(([k, l]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setQ(""); }}
                  className={`u-btn rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === k ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
                  {l} {tableCounts[k] != null && <span className="ml-1 tabular-nums opacity-60">{tableCounts[k]}</span>}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${tab}…`} aria-label="Search"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[15px] placeholder:text-slate-400 focus:border-crimson-400 focus:outline-none focus:ring-2 focus:ring-crimson-100" />
              <button onClick={exportCsv} disabled={busy === "csv" || !rows.length} className="u-btn rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy === "csv" ? "Exporting…" : "Export CSV"}</button>
            </div>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>{cols.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2.5 font-semibold">{label(c)}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {cols.map((c) => <td key={c} className="max-w-[18rem] truncate whitespace-nowrap px-3 py-2 text-slate-700" title={cell(r[c])}>{cell(r[c])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && !rows.length && <p className="px-4 py-10 text-center text-sm text-slate-500">Nothing found.</p>}
              {loading && <p className="px-4 py-10 text-center text-sm text-slate-500">Loading…</p>}
            </div>
            <p className="mt-2 text-xs text-slate-400">Showing up to 500 rows. CSV export includes up to 5,000.</p>

            <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold">Database</h2>
              <p className="mt-1 text-sm text-slate-600">
                {copyInfo ? `Data was copied from Redis on ${new Date(copyInfo.at).toLocaleString("en-GB")}.` : "Data hasn't been copied from Redis yet."} Copying again only adds what's missing; it never overwrites.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => copy(true)} disabled={!!busy} className="u-btn rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50">{busy === "dry" ? "Checking…" : "Check what would be copied"}</button>
                <button onClick={() => copy(false)} disabled={!!busy} className="u-btn rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy === "copy" ? "Copying…" : "Copy from Redis again"}</button>
              </div>
              {report && <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700">{JSON.stringify(report.report || report, null, 2)}</pre>}
              <p className="mt-4 text-xs text-slate-500">Rows: {Object.entries(counts).map(([k, v]) => `${k} ${v ?? "?"}`).join(" · ")}</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
