import { Icon } from "./ui.jsx";

/* Section tabs. Stays under the header while you scroll, so switching sections is always one tap away. The strip behind
   it has the page background, so cards don't show between the header and the tabs. */
export function Tabs({ tabs, tab, changeTab, user, bookings, myEventItems, sessions }) {
  return (
    <div className="u-tabbar sticky z-20 -mx-4 mb-3 hidden px-4 pb-2 pt-2 sm:block" style={{ top: "calc(var(--sat) + 3.75rem)" }}>
    <div id="tabs" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} className="relative grid rounded-2xl border border-slate-200/50 bg-white p-1.5 shadow-sm" role="tablist">
      <div className="u-keep absolute rounded-xl bg-crimson-700 shadow" style={{ top: 6, bottom: 6, left: 6, width: `calc((100% - 12px) / ${tabs.length})`, transform: `translateX(${tabs.findIndex((t) => t[0] === tab) * 100}%)`, transition: "transform .3s cubic-bezier(.2,.8,.2,1)" }} />
      {tabs.map(([k, l, short]) => (
        <button key={k} role="tab" aria-selected={tab === k} onClick={() => changeTab(k)}
          className={`relative z-10 whitespace-nowrap rounded-xl px-1 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${tab === k ? "text-white" : "text-slate-500 hover:text-slate-800"}`}>
          <span className="sm:hidden">{short}</span><span className="hidden sm:inline">{l}</span>
          {k === "tickets" && user && bookings.length > 0 && <span className="ml-1 rounded-full bg-crimson-600 px-1.5 py-0.5 text-xs text-white">{bookings.length}</span>}
          {k === "events" && myEventItems.some(({ r }) => r.status === "review") && <span className="ml-1 hidden rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white sm:inline">{myEventItems.filter(({ r }) => r.status === "review").length}</span>}
          {k === "schedule" && sessions.length > 0 && <span className="ml-1 hidden rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs text-white sm:inline">{sessions.length}</span>}
        </button>
      ))}
    </div>
    </div>
  );
}

/* Phones: Portals-style floating glass bar at the bottom (thumb reach), plus a separate round profile button.
   Active item: white icon and label on a lighter glass capsule; inactive: icon and label fade to 28% white.
   Hidden while typing so it never sits on top of the keyboard. "My events" lives in the profile menu. */
const NAV_ICON = { home: "home", clubs: "trophy", parties: "party", schedule: "calendar", tickets: "ticket" };
const FADED = "rgba(255,255,255,0.28)";
export function BottomNav({ tabs, tab, changeTab, user, bookings, side }) {
  return (
    <nav aria-label="Sections" className="u-keep u-hide-typing fixed inset-x-0 z-[45] flex items-center gap-2 px-3 sm:hidden" style={{ bottom: "calc(var(--sabx) + 10px)" }}>
      <div className="u-glass-bar flex h-[64px] min-w-0 flex-1 items-stretch gap-0.5 rounded-full p-[5px]">
        {tabs.filter(([k]) => k !== "events").map(([k, , short]) => {
          const on = tab === k;
          const badge = k === "tickets" && user && bookings.length ? bookings.length : 0;
          return (
            <button key={k} onClick={() => changeTab(k)} aria-current={on ? "page" : undefined}
              className={`u-keep relative flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-full px-0.5 text-[10.5px] font-semibold leading-none tracking-tight transition-colors duration-200 ${on ? "u-glass-on" : ""}`}
              style={on ? { color: "#FFFFFF" } : { color: FADED, "--icon-accent": FADED }}>
              <span className="relative">
                <Icon name={NAV_ICON[k] || "home"} className="h-6 w-6" />
                {badge > 0 && <span className="absolute -right-2.5 -top-1.5 min-w-[1rem] rounded-full bg-crimson-600 px-1 text-center text-[9.5px] leading-4 text-white">{badge}</span>}
              </span>
              <span className="truncate">{short}</span>
            </button>
          );
        })}
      </div>
      {side}
    </nav>
  );
}
