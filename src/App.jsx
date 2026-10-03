import { useEffect, useRef, useState } from "react";
import { isStandalone } from "../install.js";
import { applyUpdate } from "../updates.js";
import { GetAppBadges, InstallBanner } from "./components/GetApp.jsx";
import { Header } from "./components/Header.jsx";
import { PullToRefresh } from "./components/PullToRefresh.jsx";
import { Tabs } from "./components/Tabs.jsx";
import { Ticket } from "./components/Ticket.jsx";
import { AuthModal } from "./components/modals/AuthModal.jsx";
import { Checkout } from "./components/modals/Checkout.jsx";
import { ClubDetail } from "./components/modals/ClubDetail.jsx";
import { ConfirmModal, LeaveConfirm } from "./components/modals/ConfirmModal.jsx";
import { EventDetail } from "./components/modals/EventDetail.jsx";
import { HostManage } from "./components/modals/HostManage.jsx";
import { Modal } from "./components/modals/Modal.jsx";
import { ReviewModal } from "./components/modals/ReviewModal.jsx";
import { TryoutModal } from "./components/modals/TryoutModal.jsx";
import { WaitlistModal } from "./components/modals/WaitlistModal.jsx";
import { Check, Icon } from "./components/ui.jsx";
import { CLUBS, clubFromPath, clubPath, isSports } from "./data/clubs.js";
import { PARTIES } from "./data/events.js";
import { LANGUAGES } from "./data/options.js";
import { copyText } from "./lib/clipboard.js";
import { downloadCalendar, downloadTicket } from "./lib/downloads.js";
import { MOD_STATUSES, PROCESSING_MS, REVIEW_MS, campusToParty, eventImg, submissionToParty, tripClosed } from "./lib/events.js";
import { firstName, fmtDate, fmtLeft, fmtTime, isoDay, makeId, shortVenue, to24, weekdayIdx } from "./lib/format.js";
import { overlaps, scheduleLabel } from "./lib/schedule.js";
import { isCampusEmail, RESTRICTED_MSG } from "./lib/auth.js";
import { hostList, issueTicket, myTickets, openTicketFile } from "./lib/tickets.js";
import { CSS, glassChip, glassDark } from "./lib/styles.js";
import { versionLabel } from "./lib/version.js";
import { Events } from "./pages/Events.jsx";
import { CreateModal } from "./pages/HostEvent.jsx";
import { MyEvents } from "./pages/MyEvents.jsx";
import { MySchedulePage } from "./pages/MySchedule.jsx";
import { MyTickets } from "./pages/MyTickets.jsx";
import { UniteIcon } from "./components/UniteIcon.jsx";
import { TeamsClubs } from "./pages/TeamsClubs.jsx";

// Signed-in session kept in this browser, so a reload (e.g. tapping the logo) keeps you signed in with your
// tickets, teams/clubs and waitlist spots.
const SESSION_KEY = "unite-session";
const loadSession = () => {
  try { const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); return s && s.user ? s : null; } catch (e) { return null; }
};

export default function App() {
  const [saved] = useState(loadSession);
  const [user, setUser] = useState(() => (saved ? saved.user : null));
  const [tab, setTab] = useState("clubs");
  const [filter, setFilter] = useState("All");
  const [langFilter, setLangFilter] = useState("All");
  const clubs = CLUBS;
  // clubId -> { status: "pending" | "joined", at }. Sports tryout forms start as pending and are processed by
  // Student Services within ~24h (never rejected); clubs without a form join straight away.
  const [joinedClubs, setJoinedClubs] = useState(() => (saved && saved.joinedClubs) || {});
  const [clock, setClock] = useState(Date.now());
  const [bookings, setBookings] = useState(() => (saved && Array.isArray(saved.bookings) ? saved.bookings : []));
  // Seat and waitlist counts include your own saved tickets and waitlist spots.
  const [parties, setParties] = useState(() => PARTIES.map((p) => ({
    ...p,
    taken: p.taken + bookings.filter((b) => b.partyId === p.id).length,
    wait: p.wait + (saved && saved.waitlist && saved.waitlist[p.id] ? 1 : 0),
  })));
  // Party applications. Moderated ones (database connected) carry { moderated, mod: status, key } and follow the
  // admin's Telegram decision; otherwise the 2-hour demo review applies. Saved per account in this browser.
  const [submissions, setSubmissions] = useState(() => {
    if (!saved) return [];
    try { const x = JSON.parse(localStorage.getItem(`unite-events:${saved.user}`) || "[]"); return Array.isArray(x) ? x : []; } catch (e) { return []; }
  });
  const [campus, setCampus] = useState([]); // approved student events from the database, visible to everyone
  const [campusLoaded, setCampusLoaded] = useState(false); // first feed request finished (either way)
  const seenRef = useRef({}); // last review status shown per application, to announce changes once
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [waitlist, setWaitlist] = useState(() => (saved && saved.waitlist) || {});
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("unite-theme") === "dark"; } catch (e) { return false; }
  });
  const toastTimer = useRef(null);
  const studentIdRef = useRef(saved ? saved.sid || "" : "");
  const [name, setName] = useState(() => (saved && saved.name) || "");
  const verifiedRef = useRef(saved ? !!saved.verified : false); // true when the email was confirmed with a live code

  useEffect(() => {
    try {
      if (!user) localStorage.removeItem(SESSION_KEY);
      else localStorage.setItem(SESSION_KEY, JSON.stringify({ user, name, sid: studentIdRef.current, verified: verifiedRef.current, joinedClubs, bookings, waitlist }));
    } catch (e) { /* storage full or blocked */ }
  }, [user, name, joinedClubs, bookings, waitlist]);

  // One-off cleanup: test events created before launch, removed from this browser's saved applications.
  useEffect(() => {
    const gone = (t) => ["blabla", "цццц"].includes(String(t || "").trim().toLowerCase());
    setSubmissions((x) => (x.some((y) => gone(y.title)) ? x.filter((y) => !gone(y.title)) : x));
  }, [user]);

  // Browser tab title follows what's open (handy when sharing or switching tabs).
  const titleOf = !modal ? null
    : modal.type === "detail" ? (parties.find((x) => x.id === modal.id) || {}).title
    : modal.type === "club" ? (clubs.find((x) => x.id === modal.id) || {}).name
    : modal.type === "create" ? "Host an event" : null;
  useEffect(() => { document.title = titleOf ? `${titleOf} · Unite` : "Unite · UOWD clubs & events"; }, [titleOf]);

  useEffect(() => {
    try {
      const m = window.location.pathname.match(/\/events\/(\d+)/);
      if (m) { setTab("parties"); setModal({ type: "detail", id: Number(m[1]) }); }
      const clubId = clubFromPath(window.location.pathname);
      if (clubId) { setTab("clubs"); setModal({ type: "club", id: clubId }); }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem("unite-theme", dark ? "dark" : "light"); } catch (e) { /* ignore */ }
    document.documentElement.style.backgroundColor = dark ? "#070c18" : "#f8fafc";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  // Lock the page behind an open modal. iOS Safari ignores overflow:hidden on <body> for touch scrolling, so the
  // body is pinned in place (position: fixed at the current scroll offset) and restored on close.
  const modalOpen = !!modal;
  useEffect(() => {
    if (!modalOpen) return;
    const y = window.scrollY, b = document.body.style;
    const prev = { overflow: b.overflow, position: b.position, top: b.top, left: b.left, right: b.right, width: b.width };
    Object.assign(b, { overflow: "hidden", position: "fixed", top: `-${y}px`, left: "0", right: "0", width: "100%" });
    return () => { Object.assign(b, prev); window.scrollTo({ top: y, behavior: "instant" }); };
  }, [modalOpen]);

  // Phone back gesture / browser back: closes the open modal (or steps back inside it) instead of leaving the app,
  // and returns to the previous tab. Each open modal and each tab change gets a history entry.
  const modalRef = useRef(modal);
  modalRef.current = modal;
  const ownBack = useRef(false); // a history.back() we triggered ourselves
  useEffect(() => {
    const st = window.history.state || {};
    if (modalOpen && !st.uniteModal) window.history.pushState({ ...st, uniteModal: true }, "", window.location.href);
    else if (!modalOpen && st.uniteModal) { ownBack.current = true; window.history.back(); }
  }, [modalOpen]);
  useEffect(() => {
    if (!(window.history.state || {}).uniteTab) window.history.replaceState({ ...(window.history.state || {}), uniteTab: "clubs" }, "", window.location.href);
    const onPop = (e) => {
      if (ownBack.current) { ownBack.current = false; return; }
      if (modalRef.current) {
        const ev = new CustomEvent("unite:back", { cancelable: true });
        window.dispatchEvent(ev);
        if (ev.defaultPrevented) window.history.pushState({ ...(window.history.state || {}), uniteModal: true }, "", window.location.href);
        else setModal(null);
        return;
      }
      setTab((e.state && e.state.uniteTab) || "clubs");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // A new version took over while something was open: offer to reload (updates.js).
  const [updateReady, setUpdateReady] = useState(false);
  // Connection status: a slim bar while offline (saved tickets still work; booking and sign-in need the internet).
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);
  useEffect(() => {
    const on = () => setOffline(false), off = () => setOffline(true);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  useEffect(() => {
    const h = () => setUpdateReady(true);
    window.addEventListener("unite:update-ready", h);
    return () => window.removeEventListener("unite:update-ready", h);
  }, []);

  // Keep the address bar on the open team or club, so the link can be copied straight from the browser.
  useEffect(() => {
    try {
      const club = modal && modal.type === "club" && CLUBS.find((x) => x.id === modal.id);
      const path = window.location.pathname;
      if (club && path !== clubPath(club)) window.history.replaceState(window.history.state, "", clubPath(club));
      else if (!club && clubFromPath(path) && !(modal && ["tryout", "leave"].includes(modal.type))) window.history.replaceState(window.history.state, "", "/");
      else if (/^\/events\/\d+/.test(path) && !(modal && ["detail", "checkout", "confirm", "auth", "ticket", "waitlist"].includes(modal.type))) window.history.replaceState(window.history.state, "", "/");
    } catch (e) { /* ignore */ }
  }, [modal]);

  useEffect(() => { const t = setInterval(() => setClock(Date.now()), 60000); return () => clearInterval(t); }, []);
  const reviewOf = (sub) => {
    if (sub.moderated) return sub.mod === "approved" ? "approved" : sub.mod === "rejected" ? "rejected" : "review";
    return clock - sub.at >= REVIEW_MS ? "approved" : "review";
  };
  // Announce review decisions once (approved / extra check / not approved).
  useEffect(() => {
    submissions.forEach((sub) => {
      const st = reviewOf(sub) + (sub.mod === "under_review" ? ":check" : "");
      const prev = seenRef.current[sub.ref];
      seenRef.current[sub.ref] = st;
      if (prev === undefined || prev === st) return;
      if (st === "approved") notify({ title: "Your event is approved", body: `"${sub.title}" passed the safety review and is now live in Events.` }, 5000);
      else if (st === "rejected") notify({ title: "Application not approved", body: `The admin team didn't approve "${sub.title}". See My Events for details.` }, 5000);
      else if (st === "review:check") notify({ title: "Additional check", body: `The admin team is taking a closer look at "${sub.title}".` }, 4500);
    });
    // eslint-disable-next-line
  }, [clock, submissions]);

  // Live student events in the feed: your approved applications plus everyone else's from the database.
  const [hostData, setHostData] = useState({}); // ref -> attendees, check-ins, deliveries and money for your live events
  const ownLive = submissions.filter((sub) => reviewOf(sub) === "approved" && !(hostData[sub.ref] && hostData[sub.ref].event.tripState === "cancelled"));
  const liveKey = ownLive.map((x) => x.ref).join() + "|" + campus.map((e) => e.ref).join();
  useEffect(() => {
    const mine = new Set(submissions.map((x) => x.ref));
    const want = [...ownLive.map(submissionToParty), ...campus.filter((e) => !mine.has(e.ref)).map(campusToParty)];
    setParties((ps) => {
      const prev = new Map(ps.filter((x) => x.dyn).map((x) => [x.id, x]));
      if (want.length === prev.size && want.every((x) => prev.has(x.id))) return ps;
      // Keep ticket and waitlist counts for events that stay.
      return [...ps.filter((x) => !x.dyn), ...want.map((x) => (prev.has(x.id) ? { ...x, taken: prev.get(x.id).taken, wait: prev.get(x.id).wait } : x))];
    });
    // eslint-disable-next-line
  }, [liveKey]);

  // Campus feed of approved student events (refreshed every minute).
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const d = await (await fetch("/api/events")).json();
        if (!stop && d && Array.isArray(d.events)) setCampus((old) => (JSON.stringify(old) === JSON.stringify(d.events) ? old : d.events));
      } catch (e) { /* offline or no database: keep what we have */ }
      if (!stop) setCampusLoaded(true);
    };
    load();
    const t = setInterval(load, 60000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  // Follow the admin's decisions on your own applications (every 15 s while signed in).
  const modKey = submissions.filter((x) => x.moderated && x.key).map((x) => `${x.ref}.${x.key}`).join(",");
  useEffect(() => {
    if (!user || !modKey) return;
    let stop = false;
    const poll = async () => {
      try {
        const d = await (await fetch(`/api/events?mine=${encodeURIComponent(modKey)}`, { cache: "no-store" })).json();
        if (stop || !d || !Array.isArray(d.mine)) return;
        setSubmissions((xs) => {
          let changed = false;
          const next = xs.map((x) => {
            const m = d.mine.find((y) => y.ref === x.ref);
            if (!m || !MOD_STATUSES.includes(m.status) || m.status === x.mod) return x;
            changed = true;
            return { ...x, mod: m.status };
          });
          return changed ? next : xs;
        });
      } catch (e) { /* try again next tick */ }
    };
    poll();
    const t = setInterval(poll, 15000);
    return () => { stop = true; clearInterval(t); };
  }, [user, modKey]);

  // Your Unite tickets for student-hosted events: QR check-ins, group trip progress and delivered tickets (every 45 s).
  const tixKey = bookings.filter((b) => b.ref && b.key).map((b) => `${b.ref}.${b.id}.${b.key}`).join(",");
  useEffect(() => {
    if (!user || !tixKey) return;
    let stop = false;
    const poll = async () => {
      const d = await myTickets(bookings.filter((b) => b.ref && b.key));
      if (stop || !d.ok || !Array.isArray(d.tickets)) return;
      const news = [];
      setBookings((bs) => {
        let changed = false;
        const next = bs.map((b) => {
          const t = d.tickets.find((x) => x.id === b.id);
          if (!t) return b;
          const upd = { ...b, state: t.state, checkedIn: t.checkedIn, delivery: t.delivery };
          if (JSON.stringify([b.state, b.checkedIn, b.delivery]) === JSON.stringify([upd.state, upd.checkedIn, upd.delivery])) return b;
          changed = true;
          if (b.state && b.state !== t.state) news.push([b, t.state]);
          return upd;
        });
        return changed ? next : bs;
      });
      setTimeout(() => news.forEach(([b, st]) => {
        if (st === "ready") notify({ title: "Your ticket is ready", body: `${b.title}: open My Tickets to see it.` }, 6000);
        else if (st === "preparing") notify({ title: "Group confirmed", body: `${b.title} is going ahead. The host is preparing your ticket.` }, 5000);
        else if (st === "cancelled") notify({ title: "Trip cancelled · refunded", body: `${b.title} didn't reach its minimum group size. ${b.paid ? `Your ${b.price} AED was refunded.` : ""}` }, 6500);
      }), 0);
    };
    poll();
    const t = setInterval(poll, 45000);
    return () => { stop = true; clearInterval(t); };
    // eslint-disable-next-line
  }, [user, tixKey]);

  // Host tools: attendees and money for your live events (every 30 s), plus delivery reminders 48 h and 24 h before a group trip.
  const hostKey = submissions.filter((x) => x.moderated && x.key && (x.mod === "approved")).map((x) => `${x.ref}.${x.key}`).join(",");
  const loadHost = async (ref, key) => {
    const d = await hostList(ref, key);
    if (d.ok && d.event) setHostData((h) => (JSON.stringify(h[ref]) === JSON.stringify(d) ? h : { ...h, [ref]: d }));
    return d;
  };
  useEffect(() => {
    if (!user || !hostKey) return;
    let stop = false;
    const poll = async () => {
      for (const pair of hostKey.split(",")) {
        if (stop) return;
        const [ref, key] = pair.split(".");
        const d = await loadHost(ref, key);
        if (!d.ok || !d.event || d.event.kind !== "trip" || d.event.tripState !== "confirmed") continue;
        const missing = d.stats.sold - d.stats.delivered, left = d.event.startsAt - Date.now();
        for (const h of [24, 48]) {
          const k = `unite-remind:${ref}:${h}`;
          if (!missing || left > h * 36e5 || left < 0) continue;
          try { if (localStorage.getItem(k)) break; localStorage.setItem(k, "1"); } catch (e) { /* ignore */ }
          const sub = submissions.find((x) => x.ref === ref);
          notify({ title: `${missing} ticket${missing > 1 ? "s" : ""} still to deliver`, body: `${sub ? sub.title : "Your group trip"} starts in about ${Math.round(left / 36e5)} hours. Deliver every ticket at least 24 hours before: My Events → Attendees & tickets.` }, 8000);
          break;
        }
      }
    };
    poll();
    const t = setInterval(poll, 30000);
    return () => { stop = true; clearInterval(t); };
    // eslint-disable-next-line
  }, [user, hostKey]);

  // Remember applications per account in this browser (artwork as server links, not raw uploads).
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(`unite-events:${user}`, JSON.stringify(submissions.map((x) => ({
        ...x,
        cover: x.moderated ? eventImg(x.ref, "cover", x.key) : null,
        logo: x.moderated && x.logo ? eventImg(x.ref, "logo", x.key) : null,
      }))));
    } catch (e) { /* storage full or blocked */ }
  }, [user, submissions]);

  const notify = (m, ms = 2400) => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), ms); };
  const closeModal = () => setModal(null);
  const requireAuth = (reason, action) => (user ? action(user) : setModal({ type: "auth", reason, action }));

  const signIn = (email, sid, verified, fullName) => {
    const action = modal && modal.action;
    setName(fullName || "");
    studentIdRef.current = sid || "";
    verifiedRef.current = !!verified;
    try {
      const saved = JSON.parse(localStorage.getItem(`unite-events:${email}`) || "[]");
      setSubmissions(Array.isArray(saved) ? saved : []);
    } catch (e) { setSubmissions([]); }
    setUser(email);
    setModal(null);
    notify(verified ? { title: "Email verified", body: `Welcome to Unite${fullName ? ", " + fullName.split(" ")[0] : ""}! Signed in as ${email}` } : "Signed in as " + email, verified ? 3500 : 2400);
    if (action) setTimeout(() => action(email), 250);
  };

  // Scroll so the section starts right under the (sticky) tab bar. Only moves up: if the tabs are still in view,
  // nothing jumps.
  const toTabs = (behavior = "instant", always = false) => {
    const a = document.getElementById("tabs-anchor"), head = document.querySelector("header");
    if (!a) return;
    const y = a.getBoundingClientRect().top + window.scrollY - (head ? head.offsetHeight : 0) + 1;
    if (always || window.scrollY > y) window.scrollTo({ top: Math.max(0, y), behavior });
  };
  const changeTab = (t) => {
    if (t !== tab) { try { window.history.pushState({ ...(window.history.state || {}), uniteTab: t, uniteModal: false }, "", window.location.href); } catch (e) { /* ignore */ } }
    setTab(t); setFilter("All"); setLangFilter("All");
    if (t !== tab) toTabs();
  };
  const jumpTo = (t) => { changeTab(t); setTimeout(() => toTabs("smooth", true), 0); };
  // Logo: reload the app from the top (also picks up a new version if one was deployed).
  const goHome = () => {
    try { window.history.scrollRestoration = "manual"; window.history.replaceState(null, "", "/"); } catch (e) { /* ignore */ }
    window.scrollTo({ top: 0, behavior: "instant" });
    window.location.reload();
  };

  const statusOf = (c) => {
    const r = user && joinedClubs[c.id];
    if (!r) return null;
    return r.status === "pending" && clock - r.at >= PROCESSING_MS ? "joined" : r.status;
  };
  // clock ticks once a minute, so it can trail a just-made submission: clamp to the 24h window.
  const pendingHours = (c) => Math.min(24, Math.max(1, Math.ceil((joinedClubs[c.id].at + PROCESSING_MS - clock) / 36e5)));
  const isJoined = (c) => !!statusOf(c); // pending or registered: either way the sessions are on the schedule
  const memberCount = (c) => c.members + (statusOf(c) === "joined" ? 1 : 0);
  const sessions = clubs.filter(isJoined).flatMap((c) => c.slots.map((slot) => ({ club: c, slot, pending: statusOf(c) === "pending" })));

  // Each team/club has one fixed official schedule; registering adds all of its sessions.
  const registerClub = (c, pending = false) => {
    const clash = c.slots.map((sl) => sessions.find((o) => o.club.id !== c.id && overlaps(o.slot, sl))).find(Boolean);
    setJoinedClubs((x) => ({ ...x, [c.id]: { status: pending ? "pending" : "joined", at: Date.now() } }));
    const heads = clash ? ` Heads up: it overlaps with ${clash.club.name}.` : "";
    if (pending) notify(`Form sent for ${c.name}. Student Services usually confirms within 24 hours.${heads}`, 4200);
    else notify(`You're in ${c.name}! ${scheduleLabel(c)} added to My Schedule.${heads}`, 4200);
  };
  const reviewLeft = (sub) => fmtLeft(Math.min(REVIEW_MS, sub.at + REVIEW_MS - clock));
  // Sends the pitch to the admin moderation chat (via /api/pitch, which holds the bot token), then
  // queues it for review locally. Throws with a readable message if it couldn't be delivered.
  const submitParty = async (sub, website) => {
    // Fail-safe: whatever happens on the way to Telegram, the student's submission completes.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    let saved = sub;
    try {
      const res = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sub, account: user, accountName: name, studentId: studentIdRef.current, verified: verifiedRef.current, website }),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.delivered) console.warn("Pitch forwarding issue", res.status, data);
      if (data.moderated && data.ref && data.key) saved = { ...sub, ref: data.ref, key: data.key, moderated: true, mod: "pending" };
    } catch (e) {
      console.warn("Pitch forwarding failed", e);
    } finally { clearTimeout(timer); }
    setSubmissions((x) => [saved, ...x]);
    setModal(null);
    notify({ title: "Sent for review!", body: "Our admin team will verify your event safety and approve it within 2 hours." }, 6500);
  };
  const askLeave = (c) => setModal({ type: "leave", id: c.id });
  // Sports sections register through UOWD's official tryouts form; clubs join in one tap.
  // Every team and club registers through the official UOWD form; status changes only after
  // "I've submitted the form" (pending, then registered once Student Services processes it).
  const openJoin = (c) => {
    if (isJoined(c)) return setModal({ type: "club", id: c.id });
    // Teams: the official UOWD tryouts form. Clubs: join in one tap; business clubs' applications also reach the admin in Telegram.
    requireAuth(`Sign in to join ${c.name}`, (email) => setModal(isSports(c) ? {
      type: "confirm",
      title: `Sign up for ${c.name} tryouts?`,
      body: `Next you'll fill in the official UOWD form. ${scheduleLabel(c)} will be added to My Schedule.`,
      confirmLabel: "Continue",
      onConfirm: () => setModal({ type: "tryout", id: c.id }),
    } : {
      type: "confirm",
      title: c.notifyAdmin ? `Apply to ${c.name}?` : `Join ${c.name}?`,
      body: `${scheduleLabel(c)} will be added to My Schedule.${c.notifyAdmin ? " The committee is notified of your application straight away." : ""}`,
      confirmLabel: c.notifyAdmin ? "Apply" : "Join",
      onConfirm: () => {
        setModal({ type: "club", id: c.id });
        registerClub(c);
        if (c.notifyAdmin) fetch("/api/club", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ club: c.name, room: c.category, email, name, studentId: studentIdRef.current, verified: isVerified }) }).catch(() => {});
      },
    }));
  };
  const leaveClub = (c) => {
    const wasPending = statusOf(c) === "pending";
    setJoinedClubs((x) => { const n = { ...x }; delete n[c.id]; return n; });
    setModal(null);
    notify(wasPending ? `Sign-up for ${c.name} cancelled` : `You left ${c.name}`);
  };

  // Verified UOWD student: signed in with a live emailed code on a campus address (not the demo account).
  const isVerified = !!user && verifiedRef.current && isCampusEmail(user);
  const bookingFor = (id) => (user ? bookings.find((b) => b.partyId === id) : undefined);

  // Student-hosted events: the ticket is registered with Unite, which signs its QR code (own events) or holds the
  // place in the group (group trips). If that fails, the (demo) payment is reversed and the ticket removed.
  const createBooking = (p, email, method) => {
    const b = { id: makeId("UNT-2026", 5), partyId: p.id, title: p.title, emoji: p.emoji, logo: p.logo, date: p.date, time: p.time, where: p.where, price: p.price, paid: p.price > 0, method, email, name, studentId: studentIdRef.current, txn: p.price > 0 ? makeId("ZN", 8) : null,
      ...(p.ref ? { ref: p.ref, kind: p.kind || "own", state: p.kind === "trip" ? "waiting" : "valid", ...(p.kind === "trip" ? { extName: p.extName, collectUntil: p.collectUntil } : {}) } : {}) };
    setBookings((bs) => [b, ...bs]);
    setParties((ps) => ps.map((x) => (x.id === p.id ? { ...x, taken: x.taken + 1 } : x)));
    if (p.ref) {
      (async () => {
        let d = await issueTicket(b, p.ref);
        for (let i = 0; i < 2 && d.offline; i++) { await new Promise((r) => setTimeout(r, 3000)); d = await issueTicket(b, p.ref); }
        if (d.ok) return setBookings((bs) => bs.map((x) => (x.id === b.id ? { ...x, qr: d.code, key: d.key, state: d.ticket ? d.ticket.state : x.state } : x)));
        if (d.store === false) return setBookings((bs) => bs.map((x) => (x.id === b.id ? { ...x, qr: x.id } : x))); // no database: demo ticket, booking ID as the code
        setBookings((bs) => bs.filter((x) => x.id !== b.id));
        setParties((ps) => ps.map((x) => (x.id === p.id ? { ...x, taken: Math.max(0, x.taken - 1) } : x)));
        setModal((m) => (m && ((m.type === "ticket" && m.booking.id === b.id) || m.type === "checkout") ? null : m));
        notify({ title: "Ticket not confirmed", body: `${d.error || "Unite couldn't confirm it."}${b.paid ? ` Your ${b.price} AED payment was reversed (demo).` : ""}` }, 6500);
      })();
    }
    return b;
  };
  // Latest copy of a ticket; bookings saved before events had logos borrow the event's logo.
  const liveBooking = (b) => { const x = bookings.find((y) => y.id === b.id) || b; return x.logo ? x : { ...x, logo: (parties.find((p) => p.id === x.partyId) || {}).logo }; };
  const openFile = async (b) => { const r = await openTicketFile({ ref: b.ref, id: b.id, key: b.key }); if (r !== true) notify(r, 3500); };

  const joinWaitlist = (p, email) => {
    const pos = p.wait + 1;
    setParties((ps) => ps.map((x) => (x.id === p.id ? { ...x, wait: x.wait + 1 } : x)));
    setWaitlist((w) => ({ ...w, [p.id]: pos }));
    setModal({ type: "waitlist", party: p, pos, email, fresh: true });
  };

  const leaveWaitlist = (p) => {
    setParties((ps) => ps.map((x) => (x.id === p.id ? { ...x, wait: Math.max(0, x.wait - 1) } : x)));
    setWaitlist((w) => { const n = { ...w }; delete n[p.id]; return n; });
    setModal(null);
    notify("You left the waitlist");
  };

  const onParty = (p) => {
    const existing = bookingFor(p.id);
    if (existing) return setModal({ type: "ticket", booking: existing });
    if (tripClosed(p)) return notify("Payments for this group trip are closed.");
    if (p.spots - p.taken <= 0) {
      if (user && waitlist[p.id]) return setModal({ type: "waitlist", party: p, pos: waitlist[p.id], email: user });
      return requireAuth(`Sign in to join the waitlist for ${p.title}`, (email) => setModal({
        type: "confirm", title: `Join the waitlist for ${p.title}?`,
        body: "It's fully booked. If a spot opens up, we'll email you a code to claim it.",
        confirmLabel: "Join waitlist", onConfirm: () => joinWaitlist(p, email),
      }));
    }
    requireAuth(p.price > 0 ? `Sign in to buy a ticket for ${p.title}` : `Sign in to reserve your spot at ${p.title}`, (email) => {
      if (p.price > 0) setModal({ type: "checkout", party: p, email });
      else setModal({
        type: "confirm", title: `Reserve a spot at ${p.title}?`,
        body: `${fmtDate(p.date)} · ${p.time} · ${shortVenue(p.where)}. It's free; you'll get a ticket with a QR code.`,
        confirmLabel: "Reserve", onConfirm: () => setModal({ type: "ticket", booking: createBooking(p, email, "Free"), justPaid: true }),
      });
    });
  };

  // Phones: the system share sheet (WhatsApp, Telegram, Instagram…). Elsewhere, or if it's unavailable: copy the link.
  const nativeShare = async (title, url) => {
    if (!navigator.share || !(window.matchMedia && window.matchMedia("(pointer: coarse)").matches)) return false;
    try { await navigator.share({ title, url }); } catch (e) { /* closed the sheet: nothing to do */ }
    return true;
  };
  const shareClub = async (c) => {
    const url = `${window.location.origin}${clubPath(c)}`;
    if (await nativeShare(`${c.name} · Unite`, url)) return;
    const ok = await copyText(url);
    notify(ok ? `Link to ${c.name} copied! Share it with your squad.` : `Copy this link to share: ${url}`, ok ? 3000 : 6000);
  };
  const shareEvent = async (p) => {
    const url = `${window.location.origin}/events/${p.id}`;
    if (await nativeShare(`${p.title} · Unite`, url)) return;
    const ok = await copyText(url);
    notify(ok ? "Link copied to clipboard! Share it with your squad." : `Copy this link to share: ${url}`, ok ? 3000 : 6000);
  };


  const handleDownload = (b) => {
    try { downloadTicket(b); notify(`Ticket saved as ${b.id}.png`, 3000); }
    catch (e) { notify("Couldn't create the download. Take a screenshot of your ticket instead.", 3600); }
  };

  // Card click / Enter opens details, unless the event came from a control inside the card
  // (join, buy, share, venue link), which handle themselves.
  const cardOpen = (open) => ({
    tabIndex: 0,
    onClick: (e) => { if (!e.target.closest("button, a")) open(); },
    onKeyDown: (e) => { if (e.key === "Enter" && e.target === e.currentTarget) open(); },
  });

  const clubBtn = (c, extra = "shrink-0 px-4 py-2", onPhoto = false) => {
    const st = statusOf(c);
    const tone = onPhoto
      ? `u-keep ${st === "pending" ? "bg-amber-700 text-white hover:bg-amber-600" : st === "joined" ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-white text-slate-900 hover:bg-slate-100"}`
      : st === "pending" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100" : st === "joined" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100" : "bg-slate-900 text-white hover:bg-slate-800";
    return (
      <button onClick={() => openJoin(c)} className={`u-btn ${extra} rounded-xl text-sm font-semibold ${tone}`}>
        {st === "pending" ? `In review · ~${pendingHours(c)}h` : st === "joined" ? (isSports(c) ? "On the team" : "Member") : isSports(c) ? "Join tryouts" : c.notifyAdmin ? "Apply to join" : "Join the club"}
      </button>
    );
  };

  // `short`: on cards, where the price is already shown next to the title.
  const partyBtn = (p, extra = "w-full", short = false) => {
    const mine = bookingFor(p.id);
    const wl = user ? waitlist[p.id] : undefined;
    let label, cls;
    if (mine) { label = "Show ticket"; cls = "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"; }
    else if (tripClosed(p, clock)) return <button disabled className={`u-btn ${extra} rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-500`}>Payments closed</button>;
    else if (p.spots - p.taken <= 0) {
      label = wl ? `Waitlisted · #${wl}` : "Join waitlist";
      cls = wl ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100" : "bg-slate-900 text-white hover:bg-slate-800";
    } else { label = p.price > 0 ? (short ? "Buy ticket" : `Buy ticket · ${p.price} AED`) : (short ? "Reserve a spot" : "Reserve a free spot"); cls = "bg-slate-900 text-white hover:bg-slate-800"; }
    return <button onClick={() => onParty(p)} className={`u-btn ${extra} rounded-xl py-2.5 text-sm font-semibold ${cls}`}>{label}</button>;
  };

  const hostEvent = () => requireAuth("Sign in to host a student event", (email) => setModal({ type: "create", email }));

  const filteredClubs = clubs.filter((c) => filter === "All" || c.category === filter);
  // The feed: upcoming events only (past dates drop off), soonest first.
  const today = isoDay(new Date(clock));
  // Pinned events (the launch party) lead the feed.
  const upcoming = parties.filter((p) => p.date >= today).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (a.date + to24(a.time)).localeCompare(b.date + to24(b.time)));
  const filteredParties = upcoming.filter((p) => (filter === "All" || p.category === filter) && (langFilter === "All" || p.lang === langFilter));
  const feedLangs = LANGUAGES.filter((l) => upcoming.some((p) => p.lang === l));
  const myClubs = clubs.filter(isJoined).length;
  const myPending = clubs.filter((c) => statusOf(c) === "pending").length;
  const totalMembers = clubs.reduce((s, c) => s + memberCount(c), 0);
  // Signed-in strip: the next thing on your calendar (ticket or team session) and a nudge about teams.
  const nextUp = (() => {
    const now = new Date(clock);
    const at = (d, hhmm) => { const [h, m] = hhmm.split(":").map(Number); const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
    const items = bookings.map((b) => ({ at: at(new Date(b.date + "T00:00:00"), to24(b.time)), title: b.title, open: () => setModal({ type: "ticket", booking: b }) }));
    sessions.forEach(({ club, slot, pending }) => {
      const d = new Date(now); d.setDate(d.getDate() + ((slot.day - weekdayIdx(now) + 7) % 7));
      let t = at(d, slot.start); if (t <= now) t = new Date(t.getTime() + 7 * 864e5);
      items.push({ at: t, title: `${club.name}${pending ? " (pending)" : ""}`, sub: slot.title, open: () => setModal({ type: "club", id: club.id }) });
    });
    const next = items.filter((x) => x.at > now).sort((a, b) => a.at - b.at)[0];
    if (!next) return null;
    const days = Math.round((new Date(next.at).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 864e5);
    const when = days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`;
    return { ...next, when: `${when} · ${next.at.toLocaleDateString("en-GB", { weekday: "short" })} ${fmtTime(`${String(next.at.getHours()).padStart(2, "0")}:${String(next.at.getMinutes()).padStart(2, "0")}`)}` };
  })();

  const showMyEvents = !!user && submissions.length > 0; // only for accounts that host or have applied
  const tabs = [["clubs", "Clubs", "Clubs"], ["parties", "Events", "Events"], ["schedule", "Schedule", "Schedule"], ["tickets", "Tickets", "Tickets"],
    ...(showMyEvents ? [["events", "My Events", "Mine"]] : [])];
  const myEventItems = submissions.map((sub) => ({ s: sub, r: { ...sub, status: reviewOf(sub), left: reviewLeft(sub) } }));
  useEffect(() => { if (tab === "events" && !showMyEvents) setTab("clubs"); }, [tab, showMyEvents]);
  // A shared link or saved view pointing at something that no longer exists (event removed or ended, application
  // deleted): close it, otherwise an empty overlay keeps the page locked.
  const gone = !!modal && (
    (modal.type === "detail" && campusLoaded && !parties.some((x) => x.id === modal.id) && !campus.some((e) => e.at === modal.id) && !ownLive.some((x) => x.at === modal.id))
    || (["review", "host"].includes(modal.type) && !submissions.some((x) => x.ref === modal.ref))
    || (["club", "leave", "tryout"].includes(modal.type) && !clubs.some((x) => x.id === modal.id)));
  useEffect(() => {
    if (!gone) return;
    const wasEvent = modal.type === "detail";
    setModal(null);
    if (wasEvent) {
      try { if (/^\/events\//.test(window.location.pathname)) window.history.replaceState(window.history.state, "", "/"); } catch (e) { /* ignore */ }
      notify("This event isn't available any more.", 3000);
    }
    // eslint-disable-next-line
  }, [gone]);
  const openOwn = (sub) => (reviewOf(sub) === "approved" ? setModal({ type: "detail", id: sub.at }) : setModal({ type: "review", ref: sub.ref }));

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${dark ? "u-dark" : ""}`}>
      <style>{CSS}</style>

      {/* Nav */}
      <Header dark={dark} user={user} name={name} studentId={studentIdRef.current}
        onHome={goHome} onToggleTheme={() => setDark((d) => !d)}
        onTickets={() => jumpTo("tickets")} onSchedule={() => jumpTo("schedule")}
        onSignOut={() => setModal({
          type: "confirm", title: "Sign out of Unite?", body: "You'll need to sign in again to see your tickets and teams.",
          confirmLabel: "Sign out", danger: true,
          onConfirm: () => { setModal(null); setUser(null); setName(""); setSubmissions([]); seenRef.current = {}; setTab("clubs"); notify("Signed out"); },
        })}
        onSignIn={() => setModal({ type: "auth", reason: "Sign in with your email to join clubs and get tickets." })} />

      {/* Hero: explicit light and dark text/control palettes (u-keep opts out of the dark remap) */}
      {/* No background of its own: the hero shows the page background, so it is seamless in both themes. */}
      <section className="u-keep relative">
        <div className={`relative mx-auto max-w-5xl px-4 ${user ? "pb-12 pt-6 sm:pt-8" : "pb-14 pt-9 sm:pt-14"}`}>
          {user ? (
            <>
              <h1 className={`text-lg font-semibold ${dark ? "text-white" : "text-gray-900"}`}>Hi, {name ? name.split(" ")[0] : firstName(user)}</h1>
              {(nextUp || myClubs > 0) && <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {[
                  nextUp
                    ? { k: "Next up", t: nextUp.title, d: nextUp.when + (nextUp.sub ? ` · ${nextUp.sub}` : ""), go: nextUp.open }
                    : null,
                  myClubs === 0
                    ? null
                    : { k: "Teams & clubs", t: `You're in ${myClubs} ${myClubs > 1 ? "teams & clubs" : "team or club"}`, d: myPending ? `${myPending} waiting for approval` : "See your week →", go: () => jumpTo("schedule") },
                ].filter(Boolean).map((x) => (
                  <button key={x.k} onClick={x.go}
                    className={`u-keep u-btn min-w-0 rounded-2xl p-3.5 text-left ${dark ? "hover:bg-white/10" : "bg-white ring-1 ring-slate-200 hover:ring-slate-300"}`} style={dark ? glassChip : undefined}>
                    <span className={`block text-[11px] font-semibold uppercase tracking-wider ${dark ? "text-crimson-200" : "text-crimson-700"}`}>{x.k}</span>
                    <span className={`mt-1 block truncate font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{x.t}</span>
                    <span className={`mt-0.5 block truncate text-sm ${dark ? "text-slate-400" : "text-gray-500"}`}>{x.d}</span>
                  </button>
                ))}
              </div>}
            </>
          ) : (
            <>
            <h1 className={`max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl ${dark ? "text-white" : "text-gray-900"}`}>
              Where UOWD comes together.
            </h1>
            <p className={`mt-3 max-w-lg ${dark ? "text-slate-300" : "text-gray-600"}`}>Teams, clubs and student events at UOWD, all in one place.</p>
            </>
          )}
          {!user && (
            <p className={`mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm ${dark ? "text-slate-400" : "text-gray-500"}`}>
              <button onClick={() => jumpTo("clubs")} className="u-keep hover:underline"><b className={dark ? "text-white" : "text-gray-900"}>{clubs.length}</b> teams & clubs</button>
              <button onClick={() => jumpTo("parties")} className="u-keep hover:underline"><b className={dark ? "text-white" : "text-gray-900"}>{upcoming.length}</b> upcoming events</button>
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <main className="relative mx-auto -mt-7 max-w-5xl px-4 pb-28">
        <div id="tabs-anchor" aria-hidden="true" />
        <Tabs tabs={tabs} tab={tab} changeTab={changeTab} user={user} bookings={bookings} myEventItems={myEventItems} sessions={sessions} />

        <div key={tab} className="u-tab">
        {/* Events */}
        {tab === "parties" && (
          <Events filteredParties={filteredParties} upcoming={upcoming} feedLangs={feedLangs} filter={filter} setFilter={setFilter}
            langFilter={langFilter} setLangFilter={setLangFilter} hostEvent={hostEvent} cardOpen={cardOpen} setModal={setModal}
            shareEvent={shareEvent} partyBtn={partyBtn} />
        )}

        {/* Clubs */}
        {tab === "clubs" && <TeamsClubs filteredClubs={filteredClubs} memberCount={memberCount} cardOpen={cardOpen} setModal={setModal} clubBtn={clubBtn} />}

        {/* My schedule */}
        {tab === "schedule" && (
          <MySchedulePage
            user={user}
            onSignIn={() => setModal({ type: "auth", reason: "Sign in to see your schedule." })}
            sessions={sessions}
            events={bookings.map(liveBooking)}
            onOpenClub={(c) => setModal({ type: "club", id: c.id })}
            reviews={submissions.filter((sub) => reviewOf(sub) !== "rejected").map((sub) => ({ ...sub, status: reviewOf(sub), left: reviewLeft(sub) }))}
            onOpenReview={openOwn}
            onOpenTicket={(b) => setModal({ type: "ticket", booking: b })}
            onBrowse={changeTab}
            onExport={() => { downloadCalendar(sessions, bookings); notify("Calendar file saved. Open it to add your schedule to Google, Apple or Outlook Calendar.", 3600); }}
          />
        )}

        {/* My events (hosts only) */}
        {tab === "events" && showMyEvents && <MyEvents items={myEventItems} onOpen={openOwn} onHost={hostEvent} hostData={hostData}
          onManage={(sub, scan) => { setModal({ type: "host", ref: sub.ref, scan }); loadHost(sub.ref, sub.key); }} />}

        {/* My tickets */}
        {tab === "tickets" && (
          <MyTickets user={user} bookings={bookings} waitlist={waitlist} parties={parties} submissions={submissions}
            setModal={setModal} changeTab={changeTab} hostEvent={hostEvent} />
        )}

        </div>

        <footer className="mt-16 border-t border-slate-200 pt-8 text-sm text-slate-500">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="flex items-center gap-2 font-extrabold tracking-tight text-slate-900"><UniteIcon className="h-6 w-6" /> unite</p>
              <p className="mt-1.5 max-w-xs">A student-built platform for UOWD clubs, teams and events.</p>
            </div>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 font-medium">
              <button onClick={() => jumpTo("clubs")} className="hover:text-slate-900">Clubs</button>
              <button onClick={() => jumpTo("parties")} className="hover:text-slate-900">Events</button>
              <button onClick={hostEvent} className="hover:text-slate-900">Host an event</button>
              {!isStandalone() && <a href="/install" className="hover:text-slate-900">Get the app</a>}
            </nav>
          </div>
          {!isStandalone() && <div className="mt-8"><GetAppBadges heading="Get the Unite app" /></div>}
          <p className="mt-8 text-xs text-slate-400">Payments via Ziina (demo mode) · <span className="text-slate-400/80">{versionLabel()}</span></p>
        </footer>
      </main>

      <InstallBanner />
      <PullToRefresh />

      {/* Modals */}
      {modal && modal.type === "auth" && <AuthModal reason={modal.reason} onClose={closeModal} onSignIn={signIn} onRestricted={() => notify({ title: "Access Restricted", body: RESTRICTED_MSG.replace(/^🔒 Access Restricted: /, ""), tone: "lock" }, 5000)} />}
      {modal && modal.type === "create" && (
        <CreateModal email={modal.email} onClose={closeModal} onSubmitted={submitParty} />
      )}
      {modal && modal.type === "checkout" && <Checkout party={modal.party} email={modal.email} onPaid={createBooking} onDownload={handleDownload} onClose={closeModal} live={liveBooking} onOpenFile={openFile} />}
      {modal && modal.type === "detail" && parties.find((x) => x.id === modal.id) && (
        <EventDetail
          party={parties.find((x) => x.id === modal.id)}
          action={partyBtn(parties.find((x) => x.id === modal.id), "w-full")}
          onShare={shareEvent}
          onClose={closeModal}
        />
      )}
      {modal && modal.type === "club" && clubs.find((x) => x.id === modal.id) && (
        <ClubDetail
          club={clubs.find((x) => x.id === modal.id)}
          verified={isVerified}
          onSignIn={() => setModal({ type: "auth", reason: "Sign in with your UOWD student email to unlock club communities." })}
          status={statusOf(clubs.find((x) => x.id === modal.id))}
          action={(() => {
            const c = clubs.find((x) => x.id === modal.id);
            const st = statusOf(c);
            if (st === "pending")
              return (
                <div className="space-y-2.5">
                  <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-200">
                    
                    <span>Student Services is processing your tryout form. This usually takes about 24 hours (~{pendingHours(c)}h left). Your sessions already show in My Schedule as pending.</span>
                  </p>
                  <div className="flex gap-2">
                    <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-50 py-3 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">In review</span>
                    <button onClick={() => askLeave(c)} className="u-btn rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-rose-600">Cancel request</button>
                  </div>
                </div>
              );
            if (st === "joined")
              return (
                <div className="flex gap-2">
                  <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200"><Check className="h-4 w-4" /> {isSports(c) ? "You're on the team" : "You're a member"}</span>
                  <button onClick={() => askLeave(c)} className="u-btn rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-rose-600">{isSports(c) ? "Leave team" : "Leave club"}</button>
                </div>
              );
            return clubBtn(c, "w-full py-3");
          })()}
          onShare={shareClub}
          onClose={closeModal}
        />
      )}
      {modal && modal.type === "review" && submissions.find((x) => x.ref === modal.ref) && (() => {
        const sub = submissions.find((x) => x.ref === modal.ref);
        return <ReviewModal sub={sub} r={{ ...sub, status: reviewOf(sub), left: reviewLeft(sub) }} onClose={closeModal}
          onDelete={() => setModal({
            type: "confirm", title: `Delete “${sub.title}”?`, body: "It disappears from Events and My Events. This can't be undone.",
            confirmLabel: "Delete", danger: true,
            onConfirm: () => { setSubmissions((x) => x.filter((y) => y !== sub)); setModal(null); notify(`“${sub.title}” deleted`); },
          })} />;
      })()}
      {modal && modal.type === "leave" && clubs.find((x) => x.id === modal.id) && (
        <LeaveConfirm
          club={clubs.find((x) => x.id === modal.id)}
          pending={statusOf(clubs.find((x) => x.id === modal.id)) === "pending"}
          onConfirm={() => leaveClub(clubs.find((x) => x.id === modal.id))}
          onCancel={() => setModal({ type: "club", id: modal.id })}
        />
      )}
      {modal && modal.type === "tryout" && clubs.find((x) => x.id === modal.id) && (() => {
        const c = clubs.find((x) => x.id === modal.id);
        return (
          <TryoutModal
            club={c}
            onSent={() => { closeModal(); registerClub(c, true); }}
            onClose={closeModal}
          />
        );
      })()}
      {modal && modal.type === "confirm" && (
        <ConfirmModal title={modal.title} body={modal.body} confirmLabel={modal.confirmLabel} danger={modal.danger}
          onConfirm={modal.onConfirm} onCancel={closeModal} />
      )}
      {modal && modal.type === "ticket" && <Modal onClose={closeModal}><Ticket booking={liveBooking(modal.booking)} justPaid={modal.justPaid} onClose={closeModal} onDownload={handleDownload} onOpenFile={openFile} /></Modal>}
      {modal && modal.type === "host" && submissions.find((x) => x.ref === modal.ref) && (() => {
        const sub = submissions.find((x) => x.ref === modal.ref);
        return <HostManage sub={sub} data={hostData[sub.ref]} startScan={modal.scan} notify={notify} onClose={closeModal} onRefresh={() => loadHost(sub.ref, sub.key)} />;
      })()}
      {modal && modal.type === "waitlist" && (
        <WaitlistModal party={modal.party} pos={modal.pos} email={modal.email} fresh={modal.fresh} onClose={closeModal} onLeave={() => leaveWaitlist(modal.party)} />
      )}

      {offline && (
        <div role="status" className="u-keep pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4" style={{ bottom: "calc(1rem + var(--sabx))" }}>
          <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg ring-1 ring-white/10">You're offline · your tickets still work</span>
        </div>
      )}
      {updateReady && (
        <div className="u-keep pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4" style={{ bottom: "calc(1rem + var(--sabx))" }}>
          <div role="status" className="u-up pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl py-2.5 pl-4 pr-2 text-sm text-white shadow-2xl ring-1 ring-white/10" style={glassDark}>
            <span className="min-w-0 flex-1 font-semibold">New version available</span>
            <button onClick={applyUpdate} className="shrink-0 rounded-xl bg-crimson-700 px-4 py-2 font-semibold text-white active:scale-95">Update</button>
            <button onClick={() => setUpdateReady(false)} aria-label="Later" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400"><Icon name="close" className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {toast && (
        <div className="u-safe-toast pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4">
          <div key={typeof toast === "string" ? toast : toast.title + toast.body} role="status" className="u-up flex max-w-sm items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-xl" style={glassDark}>
            {toast.tone === "lock"
              ? <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-crimson-700 text-[11px]" aria-hidden="true">🔒</span>
              : <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500"><Check className="h-3 w-3" /></span>}
            {typeof toast === "string" ? <span>{toast}</span> : <span><span className="block font-bold">{toast.title}</span><span className="block font-normal text-slate-200">{toast.body}</span></span>}
          </div>
        </div>
      )}

    </div>
  );
}
