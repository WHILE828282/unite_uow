/* global __APP_VERSION__ */
// Injected at build time (vite.config.js): short commit + build date, shown in the footer.
export const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : { commit: "dev", built: "" };
export const versionLabel = () => {
  const d = APP_VERSION.built ? new Date(APP_VERSION.built) : null;
  const when = d ? d.toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
  return `Version ${APP_VERSION.commit}${when ? ` · ${when}` : ""}`;
};
