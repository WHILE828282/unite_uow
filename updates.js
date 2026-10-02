/* Keeping the installed app current.
   The service worker (sw.js, built by vite-plugin-pwa with skipWaiting + clientsClaim) takes over as soon as a new
   deploy is downloaded. iOS home-screen apps are resumed rather than reloaded, so they never re-check on their own:
   we ask for an update on start, every time the app returns to the foreground, and every 30 minutes.
   When the new version takes over: reload straight away if nothing is in progress, otherwise announce it
   ("unite:update-ready") so the app can offer an Update button. */

const CHECK_EVERY_MS = 30 * 60 * 1000;

// Something the user would lose on reload: an open modal (the page is scroll-locked) or a focused field.
export const isBusy = () =>
  document.body.style.position === "fixed" ||
  !!(document.activeElement && document.activeElement.matches && document.activeElement.matches("input, textarea, select"));

export const applyUpdate = () => window.location.reload();

export function startUpdates() {
  if (!("serviceWorker" in navigator)) return;
  const hadController = !!navigator.serviceWorker.controller; // false on the very first visit: nothing to refresh
  let reg = null, reloading = false, pending = false;

  const check = () => { if (reg) reg.update().catch(() => { /* offline: try again later */ }); };

  navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((r) => { reg = r; check(); }).catch(() => {});

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    if (pending && !isBusy()) { reloading = true; applyUpdate(); return; } // update found earlier: apply on return
    check();
  });
  window.addEventListener("pageshow", (e) => { if (e.persisted) check(); }); // restored from the back/forward cache
  window.addEventListener("online", check);
  setInterval(check, CHECK_EVERY_MS);

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloading) return;
    if (isBusy()) { pending = true; window.dispatchEvent(new CustomEvent("unite:update-ready")); return; }
    reloading = true;
    applyUpdate();
  });
}
