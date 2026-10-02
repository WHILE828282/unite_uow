import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";

// Service worker for the installable app. autoUpdate: each new deploy is fetched in the background and
// activates on its own, so students never need to clear their cache.
if ("serviceWorker" in navigator) registerSW({ immediate: true });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
