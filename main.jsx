import "./install.js"; // first: catches Chrome's one-time install prompt before anything else loads
import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";

// Service worker for the installable app. autoUpdate: each new deploy is fetched in the background and
// activates on its own, so students never need to clear their cache.
if ("serviceWorker" in navigator) registerSW({ immediate: true });

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

// Keyboard: once the iPhone keyboard has opened (the visual viewport shrinks), keep the focused field in view, and
// if possible the main button that follows it (e.g. "Send verification code"), so neither hides behind the keyboard.
const visibleHeight = () => (window.visualViewport ? window.visualViewport.height : window.innerHeight);
const revealFocused = () => {
  const el = document.activeElement;
  if (!el || !el.matches || !el.matches("input:not([type=file]):not([type=checkbox]):not([type=radio]), textarea, select")) return;
  const scope = el.closest("[role=dialog], .u-sheet-h") || document.body;
  const scopeW = scope.getBoundingClientRect().width;
  const next = [...scope.querySelectorAll("button")].find((b) =>
    (el.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) && b.offsetParent && b.getBoundingClientRect().width >= scopeW * 0.6);
  el.scrollIntoView({ block: "center", behavior: "instant" });
  if (next && next.getBoundingClientRect().bottom > visibleHeight() - 8) {
    next.scrollIntoView({ block: "end", behavior: "instant" });
    if (el.getBoundingClientRect().top < 8) el.scrollIntoView({ block: "start", behavior: "instant" }); // field first if both don't fit
  }
};
if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
  document.addEventListener("focusin", () => setTimeout(revealFocused, 350));
  if (window.visualViewport) window.visualViewport.addEventListener("resize", () => setTimeout(revealFocused, 50));
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
