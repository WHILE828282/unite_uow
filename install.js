/* "Get the app": device detection and the Android install prompt, shared by the app and the /install page.
   Imported first in main.jsx so Chrome's one-time beforeinstallprompt event is caught before React mounts. */

const ua = () => (typeof navigator === "undefined" ? "" : navigator.userAgent || "");

export const isIOS = () => /iP(hone|od|ad)/.test(ua()) || (/Macintosh/.test(ua()) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1); // iPadOS reports as Mac
export const isAndroid = () => /Android/i.test(ua());
export const isMobile = () => isIOS() || isAndroid();
export const platform = () => (isIOS() ? "ios" : isAndroid() ? "android" : "desktop");

/* In-app browsers (Instagram, Facebook, TikTok, Snapchat, Telegram, LINE, Android WebViews) can't install web apps.
   WhatsApp, and Telegram on iPhone, open links in a system browser sheet whose user agent looks like plain Safari,
   so they can't be detected; the guide's "Open in browser" tip covers them. */
const IN_APP = [
  ["Instagram", /Instagram/i], ["Facebook", /FBAN|FBAV|FB_IAB|FBIOS/i], ["TikTok", /BytedanceWebview|musical_ly|TikTok|Bytedance/i],
  ["Snapchat", /Snapchat/i], ["Telegram", /Telegram/i], ["WhatsApp", /WhatsApp/i], ["LINE", /\bLine\//i],
  ["Messenger", /Messenger/i], ["LinkedIn", /LinkedInApp/i], ["X", /Twitter/i],
];
export const inAppBrowser = () => {
  const s = ua();
  const hit = IN_APP.find(([, re]) => re.test(s));
  if (hit) return hit[0];
  if (isAndroid() && /; wv\)/.test(s)) return "an app"; // Android WebView
  if (isIOS() && !/Safari\//.test(s)) return "an app"; // iOS WKWebView (no Safari token)
  if (isIOS() && /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(s)) return null; // other iOS browsers: handled as "use Safari" below
  return null;
};
// iPhone browsers other than Safari can't add to the home screen reliably either.
export const iosNotSafari = () => isIOS() && /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua());

export const isStandalone = () => {
  try { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; } catch (e) { return false; }
};

/* ---- Android / Chrome install prompt ---- */
let deferred = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(!!deferred));
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; emit(); });
  window.addEventListener("appinstalled", () => { deferred = null; emit(); try { localStorage.setItem(INSTALLED_KEY, "1"); } catch (e) { /* ignore */ } });
}
export const canPrompt = () => !!deferred;
export const onPromptChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
// Opens Chrome's install dialog. Resolves to "accepted", "dismissed" or "unavailable".
export const promptInstall = async () => {
  const e = deferred;
  if (!e) return "unavailable";
  deferred = null; emit(); // the event can only be used once
  try { e.prompt(); const { outcome } = await e.userChoice; return outcome === "accepted" ? "accepted" : "dismissed"; }
  catch (err) { return "unavailable"; }
};

/* ---- Small banner: remembered for 7 days after closing ---- */
const BANNER_KEY = "unite-install-dismissed";
const INSTALLED_KEY = "unite-installed";
const SNOOZE_MS = 7 * 24 * 3600 * 1000;
export const bannerSnoozed = () => {
  try { return localStorage.getItem(INSTALLED_KEY) === "1" || Date.now() - Number(localStorage.getItem(BANNER_KEY) || 0) < SNOOZE_MS; } catch (e) { return false; }
};
export const snoozeBanner = () => { try { localStorage.setItem(BANNER_KEY, String(Date.now())); } catch (e) { /* ignore */ } };

export const INSTALL_URL = "https://uniteuow.com/install";
export const installPath = (p) => `/install${p === "ios" || p === "android" ? `?platform=${p}` : ""}`;
