import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// App background in the dark theme (navy-900 in tailwind.config.js, .u-dark in index.css).
const APP_BG = "#0a192f";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // A new Vercel deploy installs a fresh service worker and takes over on the next load: no manual cache clearing.
      registerType: "autoUpdate",
      injectRegister: false, // registered in main.jsx via virtual:pwa-register
      includeAssets: ["favicon.ico", "icons/favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Unite · UOWD",
        short_name: "Unite",
        description: "Join official UOWD clubs, discover verified student events and get tickets in seconds.",
        id: "/",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: APP_BG,
        theme_color: APP_BG,
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // App shell + static assets (JS, CSS, icons, team/party photos) are precached so the app opens fast.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff2}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        // Deep links (/events/7, /sports/basketball) open from the home screen via the cached index.html.
        // /api/* is never served from the shell: OTP, pitches, moderation and events always hit the network.
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          { urlPattern: ({ url }) => url.pathname.startsWith("/api/"), handler: "NetworkOnly" },
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
