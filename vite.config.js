import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { execSync } from "node:child_process";

// Build version shown in the app footer, so you can see which deploy a phone is running.
const commit = (() => {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try { return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch (e) { return "dev"; }
})();
const APP_VERSION = { commit, built: new Date().toISOString() };

// Brand colours from the Unite logo pack.
const BRAND_BG = "#0b1222"; // splash background (the icon's navy)
const BRAND_THEME = "#0f172a"; // browser / status bar

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
  plugins: [
    react(),
    VitePWA({
      // A new deploy's service worker takes over as soon as it is downloaded (skipWaiting + clientsClaim below);
      // updates.js registers it and checks for updates on start, on return to the foreground and every 30 minutes.
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.ico", "icons/*.png", "icons/unite-icon.svg"],
      manifest: {
        name: "Unite · UOWD clubs & events",
        short_name: "Unite",
        description: "UOWD clubs, sport, events and parties in one app. Join clubs and teams, discover verified student events and get tickets.",
        id: "/",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: BRAND_BG,
        theme_color: BRAND_THEME,
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        // Phone screenshots: Chrome on Android shows them in its larger, store-like install dialog.
        screenshots: [
          { src: "/screenshots/home.webp", sizes: "780x1688", type: "image/webp", form_factor: "narrow", label: "Unite home: UOWD clubs, sport and events" },
          { src: "/screenshots/clubs.webp", sizes: "780x1688", type: "image/webp", form_factor: "narrow", label: "Official UOWD teams and clubs" },
          { src: "/screenshots/team.webp", sizes: "780x1688", type: "image/webp", form_factor: "narrow", label: "Team details and weekly schedule" },
          { src: "/screenshots/events.webp", sizes: "780x1688", type: "image/webp", form_factor: "narrow", label: "Student events and tickets" },
        ],
      },
      workbox: {
        // Only the app shell (JS, CSS, icons) is precached. Photos are cached the first time they're shown ("photos"
        // below): precaching ~3.5 MB of photos right after the first visit fought the visible page for bandwidth.
        // The page itself (HTML) is not precached: see the "pages" rule below.
        globPatterns: ["**/*.{js,css,ico,svg}", "icons/*.png"],
        globIgnores: ["icons/icon-1024.png"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Opening the app loads the page fresh from the network (the old cached page showed the previous version for a
        // second, then reloaded into the new one). The last page is kept for offline use only. Deep links
        // (/events/7, /sports/basketball) get the same app page.
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) => request.mode === "navigate" && !url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: { cacheName: "pages", networkTimeoutSeconds: 4, expiration: { maxEntries: 8 } },
          },
          { urlPattern: ({ url }) => url.pathname.startsWith("/api/"), handler: "NetworkOnly" },
          {
            urlPattern: ({ url }) => url.origin === self.location.origin && /^\/(clubs|events|official|teams|collage|explore|install)\/.+\.(webp|png|jpe?g)$/.test(url.pathname),
            handler: "CacheFirst",
            options: { cacheName: "photos", expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 3600 } },
          },
          {
            // Google Fonts: stylesheet revalidates, font files are cached for a year.
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-css" },
          },
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: { cacheName: "google-fonts", expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 3600 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
});
