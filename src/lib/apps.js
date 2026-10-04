/* Club applications on the client: API calls, WhatsApp number tidy-up and the demo club. */

export const APP_STATES = ["new", "contacted", "accepted", "declined"];
export const STATE_LABEL = { new: "New", contacted: "Contacted", accepted: "Accepted", declined: "Declined" };
export const STATE_TONE = {
  new: "bg-sky-50 text-sky-700 ring-sky-200",
  contacted: "bg-amber-50 text-amber-700 ring-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  declined: "bg-slate-100 text-slate-500 ring-slate-200",
};
// What the student sees about their own application.
export const MINE_LABEL = { new: "Sent", contacted: "In touch", accepted: "Accepted", declined: "Not this time" };

export const appsApi = async (body) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch("/api/apps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
    const d = await r.json().catch(() => ({}));
    return r.ok && d.ok ? d : { ...d, ok: false, error: d.error || "Something went wrong. Please try again." };
  } catch (e) {
    return { ok: false, error: "Couldn't reach Unite. Check your connection and try again." };
  } finally { clearTimeout(t); }
};

// "+971 50…", "050…" or "50…" → "971501234567" (UAE by default); "" if it can't be a phone number.
export const waNumber = (v) => {
  const raw = String(v || "").trim();
  let d = raw.replace(/\D/g, "");
  if (raw.startsWith("00")) d = d.slice(2);
  else if (!raw.startsWith("+")) { if (d.startsWith("0")) d = `971${d.slice(1)}`; else if (d.length <= 9) d = `971${d}`; }
  return d.length >= 8 && d.length <= 15 ? d : "";
};
export const waLink = (a) => `https://wa.me/${a.whatsapp}?text=${encodeURIComponent(`Hi ${a.name.split(" ")[0]}, this is ${a.club} at UOWD — we saw your application on Unite!`)}`;
export const mailLink = (a) => `mailto:${a.email}?subject=${encodeURIComponent(`Your application to ${a.club}`)}`;

/* Demo account: owns Music Club with three sample applications, kept in this browser only. */
export const DEMO_CLUB_ID = 21;
const DEMO_KEY = "unite-demo-club";
const h = 36e5;
const demoSeed = () => ({
  owner: "demo@uniteuow.com",
  helpers: ["layla.m@uowmail.edu.au"],
  apps: [
    { id: "AP-DEMO0001", clubId: 21, club: "Music Club", name: "Aisha Rahman", email: "aisha.rahman@uowmail.edu.au", whatsapp: "971501234567", year: "Year 2 · Media & Communication", message: "I sing and play keys, and I'd love to join a band for the open mic nights. I've performed at school concerts for 4 years.", status: "new", at: Date.now() - 3 * h },
    { id: "AP-DEMO0002", clubId: 21, club: "Music Club", name: "Omar Haddad", email: "omar.haddad@uowmail.edu.au", whatsapp: "971559876543", year: "Year 1 · Computer Science", message: "Self-taught drummer looking for people to jam with on Mondays. Happy to help set up gear for events too.", status: "new", at: Date.now() - 26 * h },
    { id: "AP-DEMO0003", clubId: 21, club: "Music Club", name: "Priya Nair", email: "priya.nair@uowmail.edu.au", whatsapp: "971524567890", year: "Year 3 · Business", message: "Guitar and vocals. I can also help with promotion for the club's gigs on Instagram.", status: "contacted", at: Date.now() - 52 * h, updatedAt: Date.now() - 30 * h },
  ],
});
export const loadDemoClub = () => {
  try { const v = JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); if (v && Array.isArray(v.apps)) return v; } catch (e) { /* fresh copy */ }
  return demoSeed();
};
export const saveDemoClub = (v) => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(v)); } catch (e) { /* ignore */ } };
