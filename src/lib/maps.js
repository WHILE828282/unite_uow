/* Google Maps link that always opens in English (hl=en) with UAE results (gl=ae); otherwise Google
   localises the place name to the visitor's browser language. */
export const mapsLink = (query) => `https://maps.google.com/maps?${new URLSearchParams({ q: query, hl: "en", gl: "ae" })}`;

/* Contact helpers shared by the form and the event details. */
export const waDigits = (v) => (v || "").replace(/\D/g, "");
export const tgHandle = (v) => (v || "").trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");
/* Google Maps links only: google.<tld>/maps, maps.google.<tld>, maps.app.goo.gl, goo.gl/maps.
   Pasted links are tidied first: scheme added if missing, http upgraded to https. */
export const normalizeMapsUrl = (u) => {
  const t = (u || "").trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t.replace(/^http:\/\//i, "https://") : `https://${t}`;
};
export const isGoogleMapsUrl = (u) => {
  try {
    const x = new URL(normalizeMapsUrl(u));
    const host = x.hostname.toLowerCase().replace(/^www\./, "");
    if (x.protocol !== "https:") return false;
    if (/^google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host)) return /^\/maps(\/|$|\?)/.test(x.pathname + (x.search ? "?" : ""));
    if (/^maps\.google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(host)) return true;
    if (host === "maps.app.goo.gl") return x.pathname.length > 1;
    if (host === "goo.gl") return /^\/maps\//.test(x.pathname);
    return false;
  } catch (e) { return false; }
};
/* Organizer-supplied Google Maps links are forced to English (short maps.app.goo.gl links can't carry params). */
export const englishMapsUrl = (u) => {
  try {
    const x = new URL(u);
    if (/(^|\.)google\.[a-z.]+$/i.test(x.hostname)) { x.searchParams.set("hl", "en"); x.searchParams.set("gl", "ae"); }
    return x.toString();
  } catch (e) { return u; }
};
