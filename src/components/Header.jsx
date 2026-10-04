import { installPath, isStandalone, platform } from "../../install.js";
import { AndroidLogo, AppleLogo } from "./GetApp.jsx";
import { UniteIcon } from "./UniteIcon.jsx";
import { Icon } from "./ui.jsx";
import { Avatar } from "./modals/ProfileModal.jsx";
import { STATUS_BAR_STRIP, glassChip, glassDark } from "../lib/styles.js";

/* `tone` is the surface it sits on (dark glass or light); `dark` is the theme it switches. */
export function ThemeToggle({ dark, onToggle, tone = dark }) {
  return (
    <button onClick={onToggle} role="switch" aria-checked={dark} aria-label="Dark mode" title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`u-keep u-btn relative flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${tone ? "text-slate-200 hover:text-white" : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"}`}
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

/* Sticky top bar: logo, Get the app, theme toggle and the account menu (or Sign in). */
/* Dark glass header: it runs up under the status bar as one see-through surface (the white status text reads on it).
   Light header: a graphite strip behind the status bar keeps the white text readable. */
/* `overHero`: light theme at the top of Home, where the bar sits on the dark hero and turns dark glass to match it. */
export function Header({ dark: theme, overHero = false, user, name, photo, onHome, onToggleTheme, onProfile, onSignIn }) {
  const dark = theme || overHero;
  return (
    <header className={`u-keep u-safe-top sticky top-0 z-30 border-b transition-colors duration-300 ${dark ? "border-white/10" : "border-[rgba(110,90,70,0.14)] bg-[rgba(251,250,248,0.86)]"}`} style={{ backgroundColor: theme ? glassDark.background : overHero ? "#0b0b0e" : undefined, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", ...(dark ? {} : STATUS_BAR_STRIP) }}>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <button onClick={onHome} aria-label="Unite home" className="u-keep flex items-center gap-2.5 rounded-lg">
          <UniteIcon className="h-10 w-10" />
          <span className={`text-xl font-extrabold tracking-tight ${dark ? "text-white" : "text-[#0f172a]"}`}>unite</span>
          <span className={`hidden border-l pl-2.5 text-xs font-medium sm:inline ${dark ? "border-white/15 text-slate-400" : "border-slate-200 text-slate-500"}`}>for UOWD students</span>
        </button>
        <div className="flex items-center gap-2">
        {/* Phones only: on a computer there's nothing to install from here. */}
        {!isStandalone() && platform() !== "desktop" && (
          <a href={installPath(platform())} aria-label="Get the app"
            className="u-keep group inline-flex h-10 items-center gap-2 rounded-full bg-black pl-3 pr-3 text-[13px] font-semibold text-white ring-1 ring-white/15 transition-colors duration-200 hover:bg-slate-800 active:scale-95 sm:pr-3.5">
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
        {/* Phones have the profile / sign-in button in the bottom bar, so here it's computer-only (one button per job). */}
        {user ? (
          <button onClick={onProfile} aria-label="Profile and settings" className="u-keep hidden rounded-full ring-2 ring-transparent transition-shadow hover:ring-crimson-200 sm:block">
            <Avatar name={name} email={user} photo={photo} className="h-10 w-10 text-xs" />
          </button>
        ) : (
          <button onClick={onSignIn}
            className={`u-keep u-btn hidden rounded-lg px-3.5 py-1.5 text-sm font-semibold sm:block ${dark ? "bg-white text-gray-900 hover:bg-gray-100" : "bg-gray-900 text-white shadow-sm hover:bg-gray-800"}`}>Sign in</button>
        )}
        </div>
      </div>
    </header>
  );
}
