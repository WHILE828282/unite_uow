import { useEffect, useRef, useState } from "react";
import { installPath, isStandalone, platform } from "../../install.js";
import { AndroidLogo, AppleLogo } from "./GetApp.jsx";
import { UniteIcon } from "./UniteIcon.jsx";
import { Icon } from "./ui.jsx";
import { initials, nameInitials } from "../lib/format.js";
import { STATUS_BAR_STRIP, glassChip, glassDark } from "../lib/styles.js";

/* `tone` is the surface it sits on (dark glass or light); `dark` is the theme it switches. */
export function ThemeToggle({ dark, onToggle, tone = dark }) {
  return (
    <button onClick={onToggle} role="switch" aria-checked={dark} aria-label="Dark mode" title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`u-keep u-btn relative flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${tone ? "text-slate-200 hover:text-white" : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"}`}
      style={tone ? glassChip : undefined}>
      <span className="absolute inset-0 flex items-center justify-center" style={{ transition: "transform .35s cubic-bezier(.2,.8,.2,1), opacity .25s", transform: dark ? "rotate(90deg) scale(.5)" : "none", opacity: dark ? 0 : 1 }}>
        <Icon name="moon" className="h-[18px] w-[18px]" />
      </span>
      <span className={`absolute inset-0 flex items-center justify-center ${dark ? "text-slate-200" : "text-crimson-600"}`} style={{ transition: "transform .35s cubic-bezier(.2,.8,.2,1), opacity .25s", transform: dark ? "none" : "rotate(-90deg) scale(.5)", opacity: dark ? 1 : 0 }}>
        <Icon name="sun" className="h-[18px] w-[18px]" />
      </span>
    </button>
  );
}

/* Avatar in the header; tap for account details, shortcuts and Sign out. */
export function AccountMenu({ name, email, studentId, dark, onTickets, onSchedule, onSignOut, onMyEvents, up = false, label = "Account", triggerClass }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  const item = `u-keep flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm ${dark ? "text-slate-200 hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"}`;
  const go = (fn) => () => { setOpen(false); fn(); };
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={label}
        className={triggerClass || "u-keep flex h-9 w-9 items-center justify-center rounded-full bg-crimson-700 text-xs font-bold text-white ring-2 ring-transparent hover:ring-crimson-200"}>
        {name ? nameInitials(name) : initials(email)}
      </button>
      {open && (
        <div role="menu" className={`u-keep u-fade absolute right-0 ${up ? "bottom-full mb-3" : "top-11"} z-40 w-64 rounded-2xl p-1.5 shadow-xl ring-1 ${dark ? "bg-[#112240] ring-white/10" : "bg-white ring-slate-200"}`}>
          <div className="px-3 pb-2 pt-2">
            {name && <p className={`truncate text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{name}</p>}
            <p className={`truncate text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{email}{studentId ? ` · ID ${studentId}` : ""}</p>
          </div>
          <div className={`my-1 h-px ${dark ? "bg-white/10" : "bg-slate-100"}`} />
          <button role="menuitem" onClick={go(onTickets)} className={item}><Icon name="ticket" /> My tickets</button>
          <button role="menuitem" onClick={go(onSchedule)} className={item}><Icon name="calendar" /> My schedule</button>
          {onMyEvents && <button role="menuitem" onClick={go(onMyEvents)} className={item}><Icon name="party" /> My events</button>}
          <div className={`my-1 h-px ${dark ? "bg-white/10" : "bg-slate-100"}`} />
          <button role="menuitem" onClick={go(onSignOut)} className={`${item} ${dark ? "!text-rose-300" : "!text-rose-600"}`}><Icon name="lock" /> Sign out</button>
        </div>
      )}
    </div>
  );
}

/* Sticky top bar: logo, Get the app, theme toggle and the account menu (or Sign in). */
/* `overHero`: light theme at the top of Home, where the bar sits on the dark hero and turns dark glass to match it. */
export function Header({ dark: theme, overHero = false, user, name, studentId, onHome, onToggleTheme, onTickets, onSchedule, onSignOut, onSignIn }) {
  const dark = theme || overHero;
  return (
    <header className={`u-keep u-safe-top sticky top-0 z-30 border-b transition-colors duration-300 ${dark ? "border-white/10" : "border-slate-200/50 bg-white/80"}`} style={{ backgroundColor: theme ? glassDark.background : overHero ? "#070d1a" : undefined, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", ...STATUS_BAR_STRIP }}>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <button onClick={onHome} aria-label="Unite home" className="u-keep flex items-center gap-2.5 rounded-lg">
          <UniteIcon className="h-9 w-9" />
          <span className={`text-xl font-extrabold tracking-tight ${dark ? "text-white" : "text-[#0f172a]"}`}>unite</span>
          <span className={`hidden border-l pl-2.5 text-xs font-medium sm:inline ${dark ? "border-white/15 text-slate-400" : "border-slate-200 text-slate-500"}`}>for UOWD students</span>
        </button>
        <div className="flex items-center gap-2">
        {!isStandalone() && (
          <a href={installPath(platform())} aria-label="Get the app"
            className="u-keep group inline-flex h-9 items-center gap-2 rounded-full bg-black pl-2.5 pr-2.5 text-[13px] font-semibold text-white ring-1 ring-white/15 transition-colors duration-200 hover:bg-slate-800 active:scale-95 sm:pr-3.5">
            {/* iPhone: Apple only · Android: Android only · computer: both */}
            <span className="flex items-center gap-1.5" aria-hidden="true">
              {platform() !== "android" && <AppleLogo className="h-[15px] w-[15px] -mt-px" />}
              {platform() === "desktop" && <span className="h-3.5 w-px bg-white/25" />}
              {platform() !== "ios" && <AndroidLogo className="h-[15px] w-[15px] text-[#3DDC84]" />}
            </span>
            <span className="hidden sm:inline">Get the app</span>
          </a>
        )}
        <ThemeToggle dark={theme} tone={dark} onToggle={onToggleTheme} />
        {user ? (
          <AccountMenu name={name} email={user} studentId={studentId} dark={dark}
            onTickets={onTickets} onSchedule={onSchedule}
            onSignOut={onSignOut} />
        ) : (
          <button onClick={onSignIn}
            className={`u-keep u-btn rounded-lg px-3.5 py-1.5 text-sm font-semibold ${dark ? "bg-white text-gray-900 hover:bg-gray-100" : "bg-gray-900 text-white shadow-sm hover:bg-gray-800"}`}>Sign in</button>
        )}
        </div>
      </div>
    </header>
  );
}
