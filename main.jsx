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
const syncViewport = () => {
  const vv = window.visualViewport;
  const root = document.documentElement.style;
  const H = probe.getBoundingClientRect().height || window.innerHeight; // what position:fixed inset-0 covers
  const h = vv ? vv.height : window.innerHeight, top = vv ? Math.max(0, vv.offsetTop) : 0;
  const gap = Math.max(0, H - top - h);
  const typing = isField(document.activeElement) && gap > 120; // on-screen keyboard is up
  document.documentElement.classList.toggle("u-kb", typing);
  root.setProperty("--vvh", `${Math.round(h)}px`);
  root.setProperty("--kbtop", `${typing ? Math.round(top) : 0}px`);
  root.setProperty("--kb", `${typing ? Math.round(gap) : 0}px`);
  root.setProperty("--tb", `${typing ? 0 : Math.round(Math.min(gap, 140))}px`);
};
// The keyboard animates for ~300ms and iOS doesn't always report the final size, so measure a few times.
const syncSoon = () => { syncViewport(); [80, 200, 400, 700, 1000].forEach((t) => setTimeout(syncViewport, t)); };
syncViewport();
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", syncViewport);
  window.visualViewport.addEventListener("scroll", syncViewport);
}
window.addEventListener("resize", syncViewport);
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
  if (delta) box.scrollTop += delta;
};
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
  if (document.body.style.position === "fixed") { if (window.scrollY !== 0) window.scrollTo(0, 0); } // modal open: page is pinned
  else if (window.visualViewport && window.visualViewport.offsetTop > 0) window.scrollTo(window.scrollX, window.scrollY);
};
document.addEventListener("focusin", (e) => {
  if (!isField(e.target)) return;
  if (!before) { const box = scrollParent(e.target); if (box) before = { box, top: box.scrollTop }; }
  if (before) before.field = e.target;
  syncSoon();
  document.documentElement.classList.add("u-typing"); // hides floating bars (install banner) while typing
  setTimeout(revealFocused, 350);
});
document.addEventListener("focusout", () => setTimeout(settleAfterKeyboard, 120));
if (window.visualViewport) {
  let lastH = window.visualViewport.height;
  window.visualViewport.addEventListener("resize", () => {
    const h = window.visualViewport.height;
    if (h < lastH - 80) setTimeout(revealFocused, 60); // keyboard opened
    else if (h > lastH + 80) setTimeout(settleAfterKeyboard, 60); // keyboard closed
    lastH = h;
  });
}

// /install is a standalone guide page (shareable link); everything else is the app.
const InstallPage = lazy(() => import("./src/pages/Install.jsx"));
const onInstallPage = /^\/install\/?$/.test(window.location.pathname);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {onInstallPage ? (
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0a192f" }} />}><InstallPage /></Suspense>
    ) : (
      <App />
    )}
  </StrictMode>
);
