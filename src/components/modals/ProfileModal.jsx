import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal.jsx";
import { Icon } from "../ui.jsx";
import { initials, nameInitials } from "../../lib/format.js";
import { tgHandle, waDigits } from "../../lib/maps.js";
import { MINE_LABEL, STATE_TONE } from "../../lib/apps.js";

/* Round avatar: the profile photo, or initials on crimson. */
export function Avatar({ name, email, photo, className = "h-9 w-9 text-xs" }) {
  return photo
    ? <img src={photo} alt="" className={`u-keep shrink-0 rounded-full object-cover ${className}`} />
    : <span className={`u-keep flex shrink-0 items-center justify-center rounded-full bg-crimson-700 font-bold text-white ${className}`}>{name ? nameInitials(name) : initials(email)}</span>;
}

// Square-crop and shrink a picked photo so it fits in this browser's storage.
const toAvatar = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const s = Math.min(img.width, img.height), out = 256;
    const c = document.createElement("canvas");
    c.width = out; c.height = out;
    c.getContext("2d").drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, out, out);
    URL.revokeObjectURL(url);
    resolve(c.toDataURL("image/jpeg", 0.85));
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
  img.src = url;
});

// Defined outside the modal so inputs inside keep focus while typing.
const Section = ({ title, children }) => (
  <section className="mt-6">
    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{title}</h3>
    {children}
  </section>
);
const ErrLine = ({ msg }) => (msg ? <p className="mt-1.5 text-xs text-rose-600">{msg}</p> : null);

/* Password: set one (accounts made with email codes only) or change it. Forgot it? Log out and use "Forgot password?". */
const passwordApi = async (body) => {
  try {
    const r = await fetch("/api/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    return r.ok && d.ok ? d : { ok: false, field: d.field, error: d.error || "Something went wrong. Please try again." };
  } catch (e) { return { ok: false, error: "Couldn't reach Unite. Check your connection." }; }
};
function PasswordRow({ session, field }) {
  const [has, setHas] = useState(null); // null while loading
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { let on = true; passwordApi({ action: "password-status", s: session }).then((r) => { if (on) setHas(r.ok ? r.hasPassword : null); }); return () => { on = false; }; }, [session]);
  const submit = async () => {
    if (next.length < 8) return setErr({ next: "Use at least 8 characters for your password." });
    if (has && !cur) return setErr({ current: "Enter your current password." });
    setBusy(true);
    const r = await passwordApi({ action: "change-password", s: session, current: cur, next });
    setBusy(false);
    if (!r.ok) return setErr(r.field ? { [r.field]: r.error } : { next: r.error });
    setHas(true); setOpen(false); setCur(""); setNext(""); setErr({}); setDone(true);
  };
  return (
    <div className="mt-4 rounded-xl border border-slate-200 px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-700">Password</p>
          <p className="text-sm text-slate-500">{done ? "Password saved ✓" : has === null ? "…" : has ? "••••••••" : "Not set yet"}</p>
        </div>
        {!open && has !== null && <button type="button" onClick={() => { setOpen(true); setDone(false); }} className="u-btn shrink-0 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-crimson-700 ring-1 ring-slate-200 hover:bg-slate-50">{has ? "Change" : "Set"}</button>}
      </div>
      {open && (
        <div className="mt-3">
          {has && (<>
            <label className="block text-sm font-medium text-slate-700" htmlFor="p-pw-cur">Current password</label>
            <input id="p-pw-cur" type={show ? "text" : "password"} value={cur} onChange={(e) => { setCur(e.target.value.slice(0, 128)); setErr({}); }} autoComplete="current-password" className={field(err.current)} />
            <ErrLine msg={err.current} />
          </>)}
          <label className={`${has ? "mt-3 " : ""}block text-sm font-medium text-slate-700`} htmlFor="p-pw-new">New password</label>
          <input id="p-pw-new" type={show ? "text" : "password"} value={next} onChange={(e) => { setNext(e.target.value.slice(0, 128)); setErr({}); }} autoComplete="new-password" placeholder="At least 8 characters" onKeyDown={(e) => e.key === "Enter" && submit()} className={field(err.next)} />
          <ErrLine msg={err.next} />
          <label className="mt-2 flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords</label>
          {has && <p className="mt-2 text-xs text-slate-400">Forgot it? Sign out, then tap “Forgot password?” on the log in screen.</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => { setOpen(false); setCur(""); setNext(""); setErr({}); }} className="u-btn flex-1 rounded-xl py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
            <button type="button" onClick={submit} disabled={busy} className="u-btn flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Saving…" : "Save password"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Profile & settings: the only place to edit your details, change email and sign out. */
export function ProfileModal({ email, profile, session, onSave, onChangeEmail, onSignOut, onMyEvents, onClose, myClubs = [], myApps = [], onOpenClub, onConnectTelegram, legal }) {
  const [f, setF] = useState({ name: profile.name || "", sid: profile.sid || "", photo: profile.photo || "", telegram: profile.telegram || "", whatsapp: profile.whatsapp || "" });
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);
  const set = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: "" })); };
  const dirty = ["name", "sid", "photo", "telegram", "whatsapp"].some((k) => (f[k] || "") !== (profile[k] || ""));

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\//.test(file.type)) return setErrors((x) => ({ ...x, photo: "Pick a photo (JPG, PNG or WebP)." }));
    try { const photo = await toAvatar(file); setF((x) => ({ ...x, photo })); setErrors((x) => ({ ...x, photo: "" })); }
    catch (err) { setErrors((x) => ({ ...x, photo: "That photo couldn't be read. Try another one." })); }
  };

  const save = () => {
    const e = {};
    const name = f.name.trim().replace(/\s+/g, " ");
    if (name.length < 2) e.name = "Enter your name (at least 2 letters).";
    const tg = tgHandle(f.telegram), wa = waDigits(f.whatsapp);
    if (tg && !/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(tg)) e.telegram = "Telegram usernames are 5–32 letters, numbers or underscores.";
    if (f.whatsapp.trim() && (wa.length < 8 || wa.length > 15)) e.whatsapp = "Use the full number with country code, e.g. +971 50 123 4567.";
    if (!/^\d{4,10}$/.test(f.sid.trim())) e.sid = f.sid.trim() ? "Student IDs are numbers only, e.g. 7654321." : "Enter your student ID.";
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({ name, sid: f.sid.trim(), photo: f.photo, telegram: tg, whatsapp: f.whatsapp.trim() });
  };

  const field = (bad) => `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${bad ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:border-crimson-400 focus:ring-crimson-100"}`;
  const Err = ({ k }) => <ErrLine msg={errors[k]} />;

  return (
    <Modal onClose={onClose}>
      <div className="p-6 pt-7">
        <h2 className="text-lg font-bold text-slate-900">Profile & settings</h2>

        {/* Photo: tapping the avatar is the one way to change it. */}
        <div className="mt-5 flex items-center gap-4">
          <button type="button" onClick={() => fileRef.current && fileRef.current.click()} aria-label="Change profile photo" className="u-btn relative shrink-0 rounded-full">
            <Avatar name={f.name} email={email} photo={f.photo} className="h-20 w-20 text-2xl" />
            <span className="u-keep absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white ring-2 ring-white"><Icon name="camera" className="h-3.5 w-3.5" /></span>
          </button>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">{f.name || "Your name"}</p>
            <p className="truncate text-sm text-slate-500">{email}</p>
            {f.photo && <button type="button" onClick={() => setF((x) => ({ ...x, photo: "" }))} className="mt-1 text-xs font-semibold text-rose-600 hover:underline">Remove photo</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} tabIndex={-1} aria-hidden="true" />
        </div>
        <Err k="photo" />

        <Section title="Account">
          <label className="block text-sm font-medium text-slate-700" htmlFor="p-name">Name</label>
          <input id="p-name" value={f.name} onChange={set("name")} maxLength={60} autoComplete="name" placeholder="e.g. Layla Al Mansoori" className={field(errors.name)} />
          <Err k="name" />
          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="p-sid">Student ID</label>
          <input id="p-sid" value={f.sid} onChange={set("sid")} inputMode="numeric" maxLength={10} placeholder="e.g. 7654321" className={field(errors.sid)} />
          <Err k="sid" />
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700">Email</p>
              <p className="truncate text-sm text-slate-500">{email}</p>
            </div>
            <button type="button" onClick={onChangeEmail} className="u-btn shrink-0 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-crimson-700 ring-1 ring-slate-200 hover:bg-slate-50">Change</button>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">We'll email a code to the new address. Your tickets, clubs and events move with you.</p>
          {session && <PasswordRow session={session} field={field} />}
        </Section>

        {myClubs.length > 0 && (
          <Section title="My clubs">
            <div className="space-y-2">
              {myClubs.map((c) => (
                <button key={c.clubId} type="button" onClick={() => onOpenClub(c.clubId)} className="u-btn flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-left hover:bg-slate-50">
                  <Icon name="people" className="h-5 w-5 text-slate-700" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">{c.club}</span>
                    <span className="block text-xs text-slate-500">{c.role === "owner" ? "Owner" : "Helper"} · {c.total} application{c.total === 1 ? "" : "s"}</span>
                  </span>
                  {c.fresh > 0 && <span className="u-keep rounded-full bg-crimson-700 px-2 py-0.5 text-xs font-bold text-white">{c.fresh} new</span>}
                  <Icon name="chevron-right" className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          </Section>
        )}

        {myApps.length > 0 && (
          <Section title="My applications">
            <ul className="space-y-2">
              {myApps.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{a.club}</span>
                    <span className="block text-xs text-slate-500">Sent {new Date(a.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATE_TONE[a.status]}`}>{MINE_LABEL[a.status]}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Linked contacts">
          <label className="block text-sm font-medium text-slate-700" htmlFor="p-tg">Telegram</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 mt-[3px] -translate-y-1/2 text-[15px] text-slate-400">@</span>
            <input id="p-tg" value={f.telegram.replace(/^@/, "")} onChange={set("telegram")} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="username" className={`${field(errors.telegram)} pl-8`} />
          </div>
          <Err k="telegram" />
          <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="p-wa">WhatsApp</label>
          <input id="p-wa" type="tel" inputMode="tel" autoComplete="tel" value={f.whatsapp} onChange={set("whatsapp")} placeholder="+971 50 123 4567" className={field(errors.whatsapp)} />
          <Err k="whatsapp" />
          <p className="mt-1.5 text-xs text-slate-400">Filled in for you when you host an event or apply to a club.</p>
          {onConnectTelegram && (
            <button type="button" onClick={onConnectTelegram} className="u-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-sky-700 ring-1 ring-slate-200 hover:bg-sky-50">
              <Icon name="send" className="h-4 w-4" /> Get notifications in Telegram
            </button>
          )}
        </Section>

        {onMyEvents && (
          <Section title="Hosting">
            <button type="button" onClick={onMyEvents} className="u-btn flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-left hover:bg-slate-50">
              <Icon name="party" className="h-5 w-5 text-slate-700" />
              <span className="flex-1 text-sm font-medium text-slate-900">My hosted events</span>
              <Icon name="chevron-right" className="h-4 w-4 text-slate-400" />
            </button>
          </Section>
        )}

        {dirty
          ? <button type="button" onClick={save} className="u-btn mt-7 w-full rounded-xl bg-slate-900 py-3.5 text-[15px] font-semibold text-white">Save changes</button>
          : <p className="mt-7 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium text-slate-400"><Icon name="check" className="h-4 w-4" /> All changes saved</p>}

        <Section title="About">
          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
            <a href="mailto:support@uniteuow.com" className="flex items-center justify-between gap-3 px-3.5 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50">
              <span>Help & support<span className="block text-xs font-normal text-slate-500">support@uniteuow.com</span></span>
              <Icon name="mail" className="h-4 w-4 text-slate-400" />
            </a>
            {[["/terms", "Terms of Use"], ["/privacy", "Privacy Policy"]].map(([href, label]) => (
              <a key={href} href={href} target="_blank" rel="noopener" className="flex items-center justify-between px-3.5 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50">
                {label} <Icon name="chevron-right" className="h-4 w-4 text-slate-400" />
              </a>
            ))}
          </div>
          {legal && <p className="mt-1.5 text-xs text-slate-400">You accepted the version of {new Date(legal.version.slice(0, 10) + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} on {new Date(legal.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.</p>}
        </Section>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <button type="button" onClick={onSignOut} className="u-btn flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50">
            <Icon name="logout" className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    </Modal>
  );
}
