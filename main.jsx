import "./install.js"; // first: catches Chrome's one-time install prompt before anything else loads
import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { startUpdates } from "./updates.js";

// Service worker + active update checks, so the home-screen app picks up every deploy (see updates.js).
startUpdates();

// iPhone layout: expose the visible screen (excluding Safari's toolbars and the on-screen keyboard) as
// --vvh / --vvtop, which overlays, sheets and full-screen panels use instead of 100vh (see index.css).
const syncViewport = () => {
  const vv = window.visualViewport;
  const root = document.documentElement.style;
  root.setProperty("--vvh", `${Math.round(vv ? vv.height : window.innerHeight)}px`);
  root.setProperty("--vvtop", `${Math.round(vv ? vv.offsetTop : 0)}px`);
};
syncViewport();
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", syncViewport);
  window.visualViewport.addEventListener("scroll", syncViewport);
}
window.addEventListener("resize", syncViewport);
window.addEventListener("orientationchange", () => setTimeout(syncViewport, 300));

// Keyboard handling.
// The browser already scrolls a focused field into view, so we never scroll the whole page ourselves (that made the
// screen jump on iPhone). We only nudge the field's own scroll area (a modal sheet or the form body) so the field and
// the main button after it (e.g. "Send verification code") sit above the keyboard.
const FIELD = "input:not([type=file]):not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea, select";
const isField = (el) => !!(el && el.matches && el.matches(FIELD));
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
// After the keyboard closes: put the page back where it belongs (iOS can leave it shifted up).
const settleAfterKeyboard = () => {
  if (isField(document.activeElement)) return;
  document.documentElement.classList.remove("u-typing");
  syncViewport();
  if (document.body.style.position === "fixed") { if (window.scrollY !== 0) window.scrollTo(0, 0); } // modal open: page is pinned
  else if (window.visualViewport && window.visualViewport.offsetTop > 0) window.scrollTo(window.scrollX, window.scrollY);
};
document.addEventListener("focusin", (e) => {
  if (!isField(e.target)) return;
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
const InstallPage = lazy(() => import("./InstallPage.jsx"));
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
