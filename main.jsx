import "./install.js"; // first: catches Chrome's one-time install prompt before anything else loads
import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./src/App.jsx";
import { startUpdates } from "./updates.js";

// Service worker + active update checks, so the home-screen app picks up every deploy (see updates.js).
startUpdates();

// iPhone layout. Overlays cover the whole screen and size their content with these variables (see index.css):
//   --vvh    visible height (visualViewport), --kbtop / --kb: how much of the screen the keyboard pushes off at the
//   top / bottom while typing (0 otherwise), --tb: the part of the page Safari draws its floating toolbar over
//   (iOS 26), so bottom bars and sheet content can clear it.
const probe = document.createElement("div");
probe.style.cssText = "position:fixed;top:0;bottom:0;left:0;width:0;visibility:hidden;pointer-events:none";
document.documentElement.appendChild(probe);
const FIELD = "input:not([type=file]):not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea, select";
const isField = (el) => !!(el && el.matches && el.matches(FIELD));
// iPhone decides to shove the screen when the keyboard would cover the field. So when you tap a field in a sheet, the
// sheet moves up by the keyboard's height straight away (the last measured one, or a typical one the first time):
// the field is already above the keyboard when it arrives, and the screen stays put. Real sizes take over once known.
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
// The real height is remembered on this device, so from the second time on the sheet lands exactly where it stays.
let lastKb = (() => { try { return Number(localStorage.getItem("unite-kb")) || 0; } catch (e) { return 0; } })();
let kbExpected = 0, kbExpectUntil = 0;
const syncViewport = () => {
  const vv = window.visualViewport;
  const root = document.documentElement.style;
  const H = probe.getBoundingClientRect().height || window.innerHeight; // what position:fixed inset-0 covers
  const h = vv ? vv.height : window.innerHeight, top = vv ? Math.max(0, vv.offsetTop) : 0;
  const gap = Math.max(0, H - top - h);
  const field = isField(document.activeElement);
  let typing = field && gap > 120; // on-screen keyboard is up
  let kbtop = top, kb = gap, vh = h;
  if (typing) {
    const k = Math.round(H - h);
    if (Math.abs(k - lastKb) > 8) { lastKb = k; try { localStorage.setItem("unite-kb", String(k)); } catch (e) { /* ignore */ } }
    kbExpectUntil = 0;
  }
  // Keyboard on its way: the sheet already gets the space left above it (so its top doesn't end up off screen).
  else if (field && kbExpected && Date.now() < kbExpectUntil) { typing = true; kbtop = 0; kb = kbExpected; vh = H - kbExpected; }
  const next = { "--vvh": `${Math.round(vh)}px`, "--kbtop": `${typing ? Math.round(kbtop) : 0}px`, "--kb": `${typing ? Math.round(kb) : 0}px`, "--tb": `${typing ? 0 : Math.round(Math.min(gap, 140))}px` };
  // Writing these restyles the whole page, and visualViewport fires on every scroll frame: only write real changes.
  const key = JSON.stringify(next) + typing;
  if (key === lastViewport) return;
  lastViewport = key;
  document.documentElement.classList.toggle("u-kb", typing);
  Object.entries(next).forEach(([k, v]) => root.setProperty(k, v));
};
let lastViewport = "";
// The keyboard animates for ~300ms and iOS doesn't always report the final size, so measure a few times.
const syncSoon = () => { syncViewport(); [80, 200, 400, 700, 1000].forEach((t) => setTimeout(syncViewport, t)); };
// visualViewport fires many times per frame while the keyboard slides: measure at most once per frame.
let vvFrame = 0;
const syncNextFrame = () => { if (!vvFrame) vvFrame = requestAnimationFrame(() => { vvFrame = 0; syncViewport(); }); };
syncViewport();
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", syncNextFrame);
  window.visualViewport.addEventListener("scroll", syncNextFrame);
}
window.addEventListener("resize", syncNextFrame);
window.addEventListener("orientationchange", syncSoon);

// Keyboard handling.
// The browser already scrolls a focused field into view, so we never scroll the whole page ourselves (that made the
// screen jump on iPhone). We only nudge the field's own scroll area (a modal sheet or the form body) so the field and
// the main button after it (e.g. "Send verification code") sit above the keyboard.
const visibleHeight = () => (window.visualViewport ? window.visualViewport.height : window.innerHeight);
const scrollParent = (el) => {
  for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
    const o = getComputedStyle(a).overflowY;
    if ((o === "auto" || o === "scroll") && a.scrollHeight > a.clientHeight + 1) return a;
  }
  return null;
};
const revealFocused = () => {
  const el = document.activeElement;
  if (!isField(el)) return;
  const box = scrollParent(el);
  if (!box) return; // page-level field: the browser's own scrolling is enough
  const limit = Math.min(box.getBoundingClientRect().bottom, visibleHeight()) - 12;
  const top = box.getBoundingClientRect().top + 12;
  const scope = el.closest("[role=dialog], .u-sheet-h") || box;
  const next = [...scope.querySelectorAll("button")].find((b) =>
    (el.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) && b.offsetParent && box.contains(b) && b.getBoundingClientRect().width >= scope.getBoundingClientRect().width * 0.6);
  const r = el.getBoundingClientRect();
  let delta = 0;
  if (r.bottom > limit) delta = r.bottom - limit; else if (r.top < top) delta = r.top - top;
  if (next) { const nb = next.getBoundingClientRect().bottom - delta; if (nb > limit) delta += Math.min(nb - limit, r.top - delta - top); }
  if (delta) box.scrollTo({ top: box.scrollTop + delta, behavior: "instant" });
};
// The keyboard opening fires focus, resize and scroll events in a burst: adjust once, after it settles.
let revealTimer = 0, settleTimer = 0;
const revealSoon = (ms) => { clearTimeout(revealTimer); revealTimer = setTimeout(revealFocused, ms); };
const settleSoon = (ms) => { clearTimeout(settleTimer); settleTimer = setTimeout(settleAfterKeyboard, ms); };
// Where the sheet/form was scrolled to before the keyboard came up, so closing the keyboard puts it back
// (otherwise the sheet stays scrolled up and its top, e.g. the logo, is cut off).
let before = null;
// After the keyboard closes: put the page back where it belongs (iOS can leave it shifted up).
const settleAfterKeyboard = () => {
  if (isField(document.activeElement)) return;
  document.documentElement.classList.remove("u-typing");
  syncSoon();
  if (before && before.box.isConnected && before.field.isConnected) {
    // Only if the field you just used stays in view (a long form keeps its place).
    const b = before.box.getBoundingClientRect(), r = before.field.getBoundingClientRect(), shift = before.box.scrollTop - before.top;
    if (r.top + shift >= b.top && r.bottom + shift <= b.bottom) before.box.scrollTo({ top: before.top, behavior: "instant" });
  }
  before = null;
  // "instant": the page has scroll-behavior: smooth, and an animated scroll here fights iOS's own and jolts the screen.
  if (document.body.style.position === "fixed") { if (window.scrollY !== 0) window.scrollTo({ top: 0, behavior: "instant" }); } // modal open: page is pinned
  else if (window.visualViewport && window.visualViewport.offsetTop > 0) window.scrollTo({ left: window.scrollX, top: window.scrollY, behavior: "instant" });
};
document.addEventListener("focusin", (e) => {
  if (!isField(e.target)) return;
  if (IOS && !document.documentElement.classList.contains("u-kb") && e.target.closest(".u-vv") && !e.target.matches("select, [type=date], [type=time], [type=datetime-local], [type=month]")) {
    kbExpected = lastKb || Math.round(window.innerHeight * 0.5); // first time: aim high (too low lets iOS shove the screen)
    kbExpectUntil = Date.now() + 1200;
    syncViewport(); // now, before the keyboard starts to slide in
    setTimeout(syncViewport, 1250); // no keyboard after all (e.g. a hardware one): put the sheet back
  }
  if (!before) { const box = scrollParent(e.target); if (box) before = { box, top: box.scrollTop }; }
  if (before) before.field = e.target;
  syncSoon();
  document.documentElement.classList.add("u-typing"); // hides floating bars (install banner) while typing
  clearTimeout(settleTimer); // moving to the next field: the keyboard stays, nothing to put back
  revealSoon(350);
});
document.addEventListener("focusout", () => settleSoon(150));

// Phones: a tap on an empty spot closes the keyboard, like native apps (iOS keeps it open otherwise, covering the
// buttons underneath). Taps on fields, labels, buttons and links behave as before; scrolls are ignored.
let tapStart = null;
const KEEP = "input, textarea, select, label, button, a, [role=button], [role=tab], [role=radio], [role=switch], [contenteditable]";
document.addEventListener("touchstart", (e) => { tapStart = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: e.target } : null; }, { passive: true });
document.addEventListener("touchend", (e) => {
  const s = tapStart; tapStart = null;
  const el = document.activeElement;
  if (!s || !isField(el) || !e.changedTouches[0]) return;
  if (Math.abs(e.changedTouches[0].clientX - s.x) > 10 || Math.abs(e.changedTouches[0].clientY - s.y) > 10) return;
  if (s.t && s.t.closest && s.t.closest(KEEP)) return;
  window.__uniteKbClosedAt = Date.now(); // this tap only closed the keyboard (sheets don't close on it, see modals)
  el.blur();
}, { passive: true });
if (window.visualViewport) {
  let lastH = window.visualViewport.height;
  window.visualViewport.addEventListener("resize", () => {
    const h = window.visualViewport.height;
    if (h < lastH - 80) revealSoon(120); // keyboard opened
    else if (h > lastH + 80) settleSoon(120); // keyboard closed
    lastH = h;
  });
}

// /install is a standalone guide page (shareable link); everything else is the app.
const InstallPage = lazy(() => import("./src/pages/Install.jsx"));
const onInstallPage = /^\/install\/?$/.test(window.location.pathname);
// /terms and /privacy: the full Terms of Use and Privacy Policy pages.
const LegalPage = lazy(() => import("./src/components/Legal.jsx").then((m) => ({ default: m.LegalPage })));
const legalPage = (/^\/(terms|privacy)\/?$/.exec(window.location.pathname) || [])[1];
// /admin: admin tables (access checked on the server against ADMIN_EMAILS).
const AdminPage = lazy(() => import("./src/pages/Admin.jsx"));
const adminPage = /^\/admin\/?$/.test(window.location.pathname);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {onInstallPage ? (
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0e0f13" }} />}><InstallPage /></Suspense>
    ) : adminPage ? (
      <Suspense fallback={null}><AdminPage /></Suspense>
    ) : legalPage ? (
      <Suspense fallback={null}><LegalPage kind={legalPage} /></Suspense>
    ) : (
      <App />
    )}
  </StrictMode>
);
