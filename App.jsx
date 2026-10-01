import { useState, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Config & data                                                      */
/* ------------------------------------------------------------------ */
const TODAY = new Date().toISOString().slice(0, 10);

const GRADIENTS = {
  Sports: "from-emerald-500 to-teal-600",
  Tech: "from-sky-500 to-indigo-600",
  Culture: "from-amber-500 to-orange-600",
  Arts: "from-pink-500 to-rose-600",
  Business: "from-violet-500 to-purple-700",
  Gaming: "from-cyan-500 to-blue-600",
  Social: "from-fuchsia-500 to-violet-600",
  Music: "from-rose-500 to-orange-500",
  Career: "from-blue-500 to-cyan-600",
  Party: "from-fuchsia-500 to-pink-600",
  "Academic Study": "from-sky-500 to-blue-600",
  Networking: "from-blue-500 to-cyan-600",
  "Arts & Culture": "from-amber-500 to-rose-500",
};

const CLUBS = [
  { id: 1, form: ["Football"], name: "Football Team", emoji: "⚽", category: "Sports", desc: "UOWD's football squad: weekly training, friendlies and inter-university fixtures across Dubai.", members: 64, slots: [{ id: "fb-mon", day: 0, start: "17:00", end: "19:00", title: "Team training", level: "Squad & trialists", where: "Outdoor Pitch" }, { id: "fb-wed", day: 2, start: "17:00", end: "19:00", title: "Match practice", level: "Squad & trialists", where: "Outdoor Pitch" }], where: "Outdoor Pitch", lead: { name: "UOWD Sports & Recreation", role: "Football coordinator", email: "football@uniteuow.com" }, note: "Boots or turf shoes and shin pads. New players register through the tryouts form." },
  { id: 2, form: ["Basketball"], name: "Basketball Team", emoji: "🏀", category: "Sports", desc: "Men's and women's squads training for the inter-university basketball league.", members: 48, slots: [{ id: "bb-tue", day: 1, start: "16:30", end: "18:30", title: "Team training", level: "Squad & trialists", where: "Sports Hall" }, { id: "bb-thu", day: 3, start: "16:30", end: "18:30", title: "Scrimmage & drills", level: "Squad & trialists", where: "Sports Hall" }], where: "Sports Hall", lead: { name: "UOWD Sports & Recreation", role: "Basketball coordinator", email: "basketball@uniteuow.com" }, note: "Court shoes required; balls and bibs provided." },
  { id: 3, form: ["Volleyball"], name: "Volleyball Team", emoji: "🏐", category: "Sports", desc: "Indoor volleyball for every level, with a competitive squad for university tournaments.", members: 36, slots: [{ id: "vb-mon", day: 0, start: "18:00", end: "20:00", title: "Team training", level: "Squad & trialists", where: "Sports Hall" }, { id: "vb-thu", day: 3, start: "18:00", end: "20:00", title: "Match practice", level: "Squad & trialists", where: "Sports Hall" }], where: "Sports Hall", lead: { name: "UOWD Sports & Recreation", role: "Volleyball coordinator", email: "volleyball@uniteuow.com" }, note: "Knee pads recommended. Mixed sessions." },
  { id: 4, form: ["Cricket"], name: "Cricket Team", emoji: "🏏", category: "Sports", desc: "Nets, fielding drills and T20 fixtures against other Dubai universities.", members: 42, slots: [{ id: "cr-fri", day: 4, start: "16:00", end: "19:00", title: "Nets & match practice", level: "Squad & trialists", where: "Cricket Nets" }], where: "Cricket Nets", lead: { name: "UOWD Sports & Recreation", role: "Cricket coordinator", email: "cricket@uniteuow.com" }, note: "Whites not required for training. Helmets and pads available to borrow." },
  { id: 5, form: ["Table Tennis", "Badminton"], name: "Table Tennis & Badminton", emoji: "🏓", category: "Sports", desc: "Racket sports for beginners and competitive players, with a weekly ladder.", members: 40, slots: [{ id: "tt-tue", day: 1, start: "15:00", end: "17:00", title: "Table tennis & badminton", level: "All levels", where: "Multi-purpose Hall" }, { id: "tt-sat", day: 5, start: "11:00", end: "13:00", title: "Open play & ladder", level: "All levels", where: "Multi-purpose Hall" }], where: "Multi-purpose Hall", lead: { name: "UOWD Sports & Recreation", role: "Racket sports coordinator", email: "rackets@uniteuow.com" }, note: "Bring your own racket if you have one; spares available." },
  { id: 6, form: ["Padel", "Tennis"], name: "Padel & Tennis", emoji: "🎾", category: "Sports", desc: "Coached padel and tennis sessions, plus friendly doubles.", members: 28, slots: [{ id: "pt-wed", day: 2, start: "16:00", end: "18:00", title: "Coached session", level: "All levels", where: "Padel & Tennis Courts" }], where: "Padel & Tennis Courts", lead: { name: "UOWD Sports & Recreation", role: "Padel & tennis coordinator", email: "padel@uniteuow.com" }, note: "Rackets and balls provided. Non-marking court shoes please." },
  { id: 7, form: ["Chess"], name: "Chess Team", emoji: "♟️", category: "Sports", desc: "Rated training games, opening prep and inter-university chess tournaments.", members: 30, slots: [{ id: "ch-wed", day: 2, start: "14:00", end: "16:00", title: "Training & rated games", level: "All levels", where: "Student Lounge" }], where: "Student Lounge", lead: { name: "UOWD Sports & Recreation", role: "Chess coordinator", email: "chess@uniteuow.com" }, note: "Boards and clocks provided. All ratings welcome." },
  { id: 11, form: ["Track", "Swimming"], name: "Track & Swimming", emoji: "🏃", category: "Sports", desc: "Sprint, distance and pool sessions for athletics and swimming meets between Dubai universities.", members: 34, slots: [{ id: "ts-fri", day: 4, start: "15:00", end: "17:00", title: "Track & pool training", level: "Squad & trialists", where: "Running Track & Pool" }], where: "Running Track & Pool", lead: { name: "UOWD Sports & Recreation", role: "Track & swimming coordinator", email: "athletics@uniteuow.com" }, note: "Bring running shoes, swimwear and a towel. Times are recorded at the first session." },
  { id: 8, name: "Tech & E-sports Club", emoji: "🎮", category: "Tech", desc: "Build projects, run hackathons and compete in campus e-sports leagues.", members: 72, slots: [{ id: "te-tue", day: 1, start: "16:00", end: "18:00", title: "Build night & e-sports scrims", level: "All levels", where: "Computer Lab" }], where: "Computer Lab", lead: { name: "Tech & E-sports committee", role: "Club committee", email: "tech@uniteuow.com" }, note: "Bring a laptop for build nights; consoles and PCs provided for scrims." },
  { id: 9, name: "Finance & Entrepreneurship Society", emoji: "💼", category: "Business", desc: "Market simulations, pitch practice and networking with founders and finance professionals.", members: 85, slots: [{ id: "fe-thu", day: 3, start: "15:00", end: "17:00", title: "Workshop & pitch session", level: "All levels", where: "Innovation Studio" }], where: "Innovation Studio", lead: { name: "Finance & Entrepreneurship committee", role: "Society committee", email: "finance@uniteuow.com" }, note: "Smart casual for networking events." },
  { id: 10, name: "Music & Dance Club", emoji: "🎵", category: "Arts", desc: "Jam sessions, choreography and performances at campus events.", members: 58, slots: [{ id: "md-mon", day: 0, start: "16:00", end: "18:00", title: "Rehearsal & jam", level: "All levels", where: "Multi-purpose Room" }], where: "Multi-purpose Room", lead: { name: "Music & Dance committee", role: "Club committee", email: "music@uniteuow.com" }, note: "Comfortable clothes for dance; instruments welcome." },
];

const UOWD_ADDRESS = "University of Wollongong in Dubai, Dubai Knowledge Park, Dubai, UAE";
const UOWD_MAPS = "University of Wollongong in Dubai";

const PARTIES = [
  { id: 1, lang: "English", title: "Rooftop Sunset Mixer", emoji: "🌇", category: "Social", date: "2026-10-09", time: "7:00 PM", where: "Rooftop Terrace, Block 5", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 40, spots: 60, taken: 52, wait: 0, vibe: { score: 4.9, count: 42 }, host: "Layla Al Mansoori",
    contact: { name: "Layla Al Mansoori", role: "Event lead", email: "sunset@uniteuow.com" },
    desc: "A golden-hour mixer on the Block 5 rooftop with a live DJ, a mocktail bar and skyline views. The easiest way to meet students from every faculty after a busy week.",
    perks: ["Live DJ", "Mocktail bar", "Skyline views"] },
  { id: 2, lang: "English", title: "UOWD Futsal Tournament", emoji: "⚽", category: "Sports", date: "2026-10-15", time: "7:30 PM", where: "UOWD Sports Hall", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 25, spots: 40, taken: 35, wait: 0, vibe: { score: 4.7, count: 58 }, host: "Omar Khalid",
    contact: { name: "Omar Khalid", role: "Tournament organizer", email: "futsal@uniteuow.com" },
    desc: "Five-a-side knockout across eight teams, with referees, a trophy and pizza after the final. Register as a player and we balance the squads on the night, so you don't need a full team.",
    perks: ["Referees", "Trophy", "Pizza after"] },
  { id: 3, lang: "Arabic", title: "PS5 Tournament", emoji: "🎮", category: "Gaming", date: "2026-10-12", time: "6:00 PM", where: "Student Lounge, Block 5", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 15, spots: 32, taken: 20, wait: 0, vibe: { score: 4.8, count: 37 }, host: "Karim Haddad",
    contact: { name: "Karim Haddad", role: "Gaming lead", email: "ps5@uniteuow.com" },
    desc: "1v1 football and fighting-game brackets on big screens in the Student Lounge. Controllers are provided, the final is shoutcasted live, and the winner takes home the prize pot.",
    perks: ["Big screens", "Live shoutcast", "Prize pot"] },
  { id: 4, lang: "Hindi", title: "Open Mic & Chai", emoji: "☕", category: "Music", date: "2026-10-17", time: "8:00 PM", where: "Courtyard Café", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 0, spots: 50, taken: 22, wait: 0, vibe: null, host: "Yusuf Ibrahim",
    contact: { name: "Yusuf Ibrahim", role: "Host", email: "openmic@uniteuow.com" },
    desc: "Sing, play, recite or just listen. Sign up for a five-minute slot on the night or come for the karak and the atmosphere. All talent levels welcome.",
    perks: ["5-min slots", "Free karak", "Acoustic setup"] },
  { id: 5, lang: "English", title: "Finance Society Networking Night", emoji: "💼", category: "Career", date: "2026-10-22", time: "6:00 PM", where: "Auditorium Foyer, Block 3", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 0, spots: 100, taken: 64, wait: 0, vibe: { score: 4.6, count: 73 }, host: "Finance & Entrepreneurship Society",
    contact: { name: "Finance & Entrepreneurship Society", role: "Organizers", email: "finance@uniteuow.com" },
    desc: "Meet finance professionals, alumni and recruiters over canapés. A short panel on breaking into banking and fintech in the UAE is followed by open networking. Smart casual.",
    perks: ["Industry panel", "Alumni mentors", "Canapés"] },
  { id: 6, lang: "English", title: "Halloween Costume Party", emoji: "🎃", category: "Social", date: "2026-10-30", time: "8:30 PM", where: "Grand Ballroom, Dubai Knowledge Park", address: "Dubai Knowledge Park, Dubai, UAE", maps: "Dubai Knowledge Park", price: 75, spots: 120, taken: 120, wait: 4, vibe: { score: 4.9, count: 156 }, host: "Student Council",
    contact: { name: "Student Council", role: "Organizers", email: "council@uniteuow.com" },
    desc: "The biggest night of the semester: costume contest, two dance floors and a haunted photo booth. It sold out fast, so join the waitlist in case a spot opens up.",
    perks: ["Costume contest", "2 dance floors", "Photo booth"] },
  { id: 7, lang: "English", title: "Post-Midterm Yacht Party", emoji: "🛥️", category: "Social", date: "2026-10-24", time: "5:00 PM", where: "Dubai Marina, Pier 7", address: "Dubai Marina, Dubai, UAE", maps: "Dubai Marina", price: 120, spots: 80, taken: 76, wait: 0, vibe: { score: 4.8, count: 31 }, host: "Class of 2027 Committee",
    contact: { name: "Class of 2027 Committee", role: "Organizers", email: "yacht@uniteuow.com" },
    desc: "Three hours cruising the Marina skyline with a DJ, a buffet and a sunset deck. The boat leaves on time: arrive 20 minutes early with your ticket QR.",
    perks: ["Buffet", "DJ", "Sunset deck"] },
  { id: 8, lang: "Russian", title: "Russian Movie Night", emoji: "🎬", category: "Social", date: "2026-10-14", time: "7:00 PM", where: "Lecture Theatre 2, Block 2", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 0, spots: 40, taken: 18, wait: 0, vibe: { score: 4.8, count: 21 }, host: "Anastasia Volkova",
    contact: { name: "Anastasia Volkova", role: "Host", email: "kino@uniteuow.com" },
    desc: "A cosy screening of a Soviet comedy classic with English subtitles, followed by tea, pryaniki and a relaxed chat. Native speakers and learners are equally welcome.",
    perks: ["English subtitles", "Tea & pryaniki", "Post-film chat"] },
  { id: 9, lang: "Arabic", title: "Arabic Coffee & Conversation", emoji: "🫖", category: "Social", date: "2026-10-13", time: "4:30 PM", where: "Majlis Lounge, Block 2", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 0, spots: 25, taken: 19, wait: 0, vibe: { score: 4.9, count: 33 }, host: "Mariam Al Suwaidi",
    contact: { name: "Mariam Al Suwaidi", role: "Host", email: "majlis@uniteuow.com" },
    desc: "Gahwa, dates and easy conversation in a traditional majlis setting. Practise your Arabic with native speakers from across the Gulf and the Levant, at any level.",
    perks: ["Gahwa & dates", "All levels", "Native speakers"] },
  { id: 10, lang: "Japanese", title: "Anime & Matcha Night", emoji: "🍵", category: "Social", date: "2026-10-20", time: "7:00 PM", where: "Student Lounge, Block 5", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 20, spots: 30, taken: 12, wait: 0, vibe: null, host: "Yuki Tanaka",
    contact: { name: "Yuki Tanaka", role: "Host", email: "anime@uniteuow.com" },
    desc: "Back-to-back episodes on the big screen, freshly whisked matcha and mochi, and a short Japanese phrase corner between episodes. Your ticket covers drinks and snacks.",
    perks: ["Big screen", "Matcha & mochi", "Phrase corner"] },
  { id: 11, lang: "French", title: "Café Français Language Exchange", emoji: "🥐", category: "Social", date: "2026-10-19", time: "5:00 PM", where: "Courtyard Café", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 0, spots: 30, taken: 9, wait: 0, vibe: { score: 4.6, count: 14 }, host: "Camille Laurent",
    contact: { name: "Camille Laurent", role: "Host", email: "francais@uniteuow.com" },
    desc: "Half the hour in French, half in English. Rotate tables every 15 minutes and leave with a few new friends and much better pronunciation. Croissants on us.",
    perks: ["Table rotations", "All levels", "Croissants"] },
  { id: 12, lang: "Chinese", title: "Chinese Calligraphy Workshop", emoji: "🖌️", category: "Social", date: "2026-10-21", time: "6:00 PM", where: "Room 1.04, Block 1", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 10, spots: 20, taken: 11, wait: 0, vibe: { score: 4.9, count: 18 }, host: "Li Wei",
    contact: { name: "Li Wei", role: "Workshop lead", email: "calligraphy@uniteuow.com" },
    desc: "Learn brush basics and write your name in Chinese characters. Brushes, ink and rice paper are provided, and you take your finished piece home.",
    perks: ["Materials included", "Take-home piece", "Beginners welcome"] },
];

const CLUB_FILTERS = ["All", "Sports", "Tech", "Business", "Arts"];
const PARTY_FILTERS = ["All", "Social", "Music", "Sports", "Gaming", "Career"];
const EVENT_TYPES = ["Party", "Social", "Academic Study", "Networking", "Sports", "Gaming", "Music", "Arts & Culture"];
const DRESS_CODES = ["Casual", "Smart casual", "Business formal", "Sportswear", "Costume / themed", "Traditional wear"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LANGUAGES = ["English", "Arabic", "Russian", "Chinese", "Japanese", "French", "Hindi", "Urdu", "Spanish", "Persian", "Mixed / Multilingual"];

const FEED = [
  ["Sarah J.", "just registered for", "UOWD Futsal Tournament", "2 mins ago"],
  ["Omar K.", "just bought a ticket for", "Rooftop Sunset Mixer", "just now"],
  ["Maryam A.", "just joined", "Tech & E-sports Club", "5 mins ago"],
  ["Ali H.", "just joined the waitlist for", "Halloween Costume Party", "1 min ago"],
  ["Noor S.", "just bought a ticket for", "Post-Midterm Yacht Party", "3 mins ago"],
  ["Daniel P.", "just reserved a spot at", "Finance Society Networking Night", "4 mins ago"],
  ["Rashid T.", "just entered the", "PS5 Tournament", "6 mins ago"],
  ["Fatima R.", "registered for tryouts with the", "Basketball Team", "7 mins ago"],
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const fmtDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const fmtTime = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
const fmtRange = (a, b) => `${fmtTime(a)} – ${fmtTime(b)}`;
/* "7:00 PM" -> "19:00" */
const to24 = (t) => { const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return "00:00"; let h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return `${String(h).padStart(2, "0")}:${m[2]}`; };
const weekdayIdx = (d) => (d.getDay() + 6) % 7; // Monday = 0
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const clubDays = (c) => [...new Set(c.slots.map((s) => s.day))].sort().map((d) => DAYS[d].slice(0, 3)).join(" · ");
const slotHours = (s) => (toMin(s.end) - toMin(s.start)) / 60;
const initials = (email) => (email || "??").slice(0, 2).toUpperCase();
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const makeId = (prefix, n = 6) =>
  prefix + "-" + Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const maskEmail = (e) => {
  const [l, d] = e.split("@");
  return l.slice(0, 2) + "•".repeat(Math.max(2, l.length - 2)) + "@" + d;
};

/* Minimal QR encoder: version 1 (21x21), error correction L, byte mode, up to 17 characters.
   Verified against an independent decoder; booking IDs (e.g. UNT-2026-K7M2Q) fit comfortably. */
function qrMatrix(text) {
  const N = 21;
  const bytes = Array.from(new TextEncoder().encode(text)).slice(0, 17);
  const bits = [];
  const put = (v, len) => { for (let i = len - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  put(4, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8));
  const cap = 19 * 8;
  put(0, Math.min(4, cap - bits.length));
  while (bits.length % 8) bits.push(0);
  for (let pad = 0xec; bits.length < cap; pad = pad === 0xec ? 0x11 : 0xec) put(pad, 8);
  const data = [];
  for (let i = 0; i < 19; i++) { let v = 0; for (let j = 0; j < 8; j++) v = (v << 1) | bits[i * 8 + j]; data.push(v); }

  const exp = new Array(512), log = new Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) { exp[i] = x; log[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
  const mul = (a, b) => (a && b ? exp[log[a] + log[b]] : 0);
  let gen = [1];
  for (let i = 0; i < 7; i++) {
    const next = new Array(gen.length + 1).fill(0);
    gen.forEach((c, j) => { next[j] ^= c; next[j + 1] ^= mul(c, exp[i]); });
    gen = next;
  }
  const ec = new Array(7).fill(0);
  for (const d of data) {
    const f = d ^ ec[0];
    ec.shift(); ec.push(0);
    for (let i = 0; i < 7; i++) ec[i] ^= mul(gen[i + 1], f);
  }
  const words = data.concat(ec);

  const m = Array.from({ length: N }, () => new Array(N).fill(false));
  const fn = Array.from({ length: N }, () => new Array(N).fill(false));
  const setXY = (px, py, v) => { if (px >= 0 && px < N && py >= 0 && py < N) { m[py][px] = v; fn[py][px] = true; } };
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      setXY(cx + dx, cy + dy, d !== 2 && d !== 4);
    }
  };
  finder(3, 3); finder(N - 4, 3); finder(3, N - 4);
  for (let i = 8; i < N - 8; i++) { setXY(6, i, i % 2 === 0); setXY(i, 6, i % 2 === 0); }
  const drawFormat = (mask) => {
    const d5 = (1 << 3) | mask;
    let rem = d5;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const f = ((d5 << 10) | rem) ^ 0x5412;
    const b = (i) => ((f >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) setXY(8, i, b(i));
    setXY(8, 7, b(6)); setXY(8, 8, b(7)); setXY(7, 8, b(8));
    for (let i = 9; i < 15; i++) setXY(14 - i, 8, b(i));
    for (let i = 0; i < 8; i++) setXY(N - 1 - i, 8, b(i));
    for (let i = 8; i < 15; i++) setXY(8, N - 15 + i, b(i));
    setXY(8, N - 8, true);
  };
  drawFormat(0);
  let k = 0;
  for (let right = N - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < N; vert++) for (let j = 0; j < 2; j++) {
      const px = right - j;
      const y = ((right + 1) & 2) === 0 ? N - 1 - vert : vert;
      if (!fn[y][px] && k < words.length * 8) { m[y][px] = ((words[k >>> 3] >>> (7 - (k & 7))) & 1) === 1; k++; }
    }
  }
  for (let y = 0; y < N; y++) for (let px = 0; px < N; px++) if (!fn[y][px] && (px + y) % 2 === 0) m[y][px] = !m[y][px];
  drawFormat(0);
  return m;
}

/* Renders the ticket as a PNG and triggers a browser download. */
function downloadTicket(b) {
  const W = 720, H = 1120;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const font = (w, px) => { g.font = `${w} ${px}px system-ui, -apple-system, "Segoe UI", sans-serif`; };
  const clip = (t, n) => (t.length > n ? t.slice(0, n - 1) + "…" : t);
  g.fillStyle = "#f1f5f9"; g.fillRect(0, 0, W, H);
  const grad = g.createLinearGradient(0, 0, W, 320);
  grad.addColorStop(0, "#4f46e5"); grad.addColorStop(1, "#7c3aed");
  g.fillStyle = grad; g.fillRect(0, 0, W, 300);
  g.fillStyle = "#fff"; font(800, 46); g.fillText("Unite", 48, 92);
  font(500, 22); g.fillStyle = "#c7d2fe"; g.fillText("uniteuow.com · UOWD", 48, 126);
  g.fillStyle = "#fff"; font(700, 40); g.fillText(clip(b.title, 26), 48, 206);
  font(500, 26); g.fillStyle = "#e0e7ff"; g.fillText(`${fmtDate(b.date)} · ${b.time}`, 48, 250);
  g.fillStyle = "#fff"; rr(36, 320, W - 72, 740, 36); g.fill();
  const m = qrMatrix(b.id), S = 14, qx = (W - 21 * S) / 2, qy = 360;
  g.fillStyle = "#0f172a";
  m.forEach((row, y) => row.forEach((d, x) => { if (d) g.fillRect(qx + x * S, qy + y * S, S, S); }));
  g.textAlign = "center";
  font(600, 20); g.fillStyle = "#64748b"; g.fillText("BOOKING ID", W / 2, 700);
  font(800, 44); g.fillStyle = "#0f172a"; g.fillText(b.id, W / 2, 752);
  g.textAlign = "left";
  const rows = [["Venue", clip(b.where, 30)], ["Attendee", clip(b.email, 30)], ["Amount", b.paid ? `${b.price} AED` : "Free"],
    b.studentId ? ["Student ID", clip(b.studentId, 30)] : ["Status", "Confirmed"]];
  rows.forEach(([k, v], i) => { const y = 820 + i * 56; font(500, 24); g.fillStyle = "#64748b"; g.fillText(k, 80, y); g.textAlign = "right"; font(600, 26); g.fillStyle = "#0f172a"; g.fillText(v, W - 80, y); g.textAlign = "left"; });
  g.textAlign = "center"; font(500, 20); g.fillStyle = "#94a3b8"; g.fillText("Scan this code at the entrance", W / 2, 1040);
  c.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${b.id}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, "image/png");
}

async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch (e) { /* fall through to legacy copy */ }
  try {
    const t = document.createElement("textarea");
    t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(t);
    return ok;
  } catch (e) { return false; }
}

const glassDark = { background: "rgba(15,23,42,0.78)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" };
const overlayStyle = { background: "rgba(15,23,42,0.55)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" };
const glassChip = { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" };

const CSS = `
@keyframes uFade{from{opacity:0}to{opacity:1}}
@keyframes uUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes uPop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes uSpin{to{transform:rotate(360deg)}}
@keyframes uPing{0%{box-shadow:0 0 0 0 rgba(245,158,11,.6)}100%{box-shadow:0 0 0 8px rgba(245,158,11,0)}}
.u-fade{animation:uFade .2s ease-out both}
.u-up{animation:uUp .28s cubic-bezier(.2,.8,.2,1) both}
.u-pop{animation:uPop .45s cubic-bezier(.2,.8,.2,1) both}
.u-spin{animation:uSpin .8s linear infinite}
.u-ping{animation:uPing 1.4s ease-out infinite}
.u-card{transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease}
.u-card:hover{transform:translateY(-2px);box-shadow:0 1px 2px rgba(15,23,42,.04),0 12px 28px -12px rgba(15,23,42,.18);border-color:#cbd5e1}
.u-btn{transition:all .2s cubic-bezier(.2,.8,.2,1)}
.u-btn:not(:disabled):active{transform:scale(.95)}
@keyframes uSlide{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
@keyframes uDraw{to{stroke-dashoffset:0}}
.u-slide{animation:uSlide .3s ease-out both}
.u-ring{stroke-dasharray:151;stroke-dashoffset:151;animation:uDraw .6s ease-out forwards}
.u-tick{stroke-dasharray:40;stroke-dashoffset:40;animation:uDraw .4s .5s ease-out forwards}
.u-rise{animation:uUp .45s cubic-bezier(.2,.8,.2,1) backwards}
.u-tab{animation:uUp .35s cubic-bezier(.2,.8,.2,1) backwards}
`;

/* ------------------------------------------------------------------ */
/*  Small UI pieces                                                    */
/* ------------------------------------------------------------------ */
const Check = ({ className = "h-3.5 w-3.5" }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
  </svg>
);

const ICONS = {
  calendar: "M8 2.5v3M16 2.5v3M3.5 9.5h17M5 4.5h14A1.5 1.5 0 0120.5 6v13a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 19V6A1.5 1.5 0 015 4.5z",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  users: "M16 20v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 18.5V20M10 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM20 20v-1.5a3.5 3.5 0 00-2.5-3.35M15.5 4.15a3.5 3.5 0 010 6.7",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  user: "M20 21v-1.5a4 4 0 00-4-4H8a4 4 0 00-4 4V21M12 11.5a4 4 0 100-8 4 4 0 000 8z",
  lock: "M6.5 11h11a1.5 1.5 0 011.5 1.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 19.5v-7A1.5 1.5 0 016.5 11zM8 11V7.5a4 4 0 018 0V11",
  shield: "M12 3l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V6L12 3zM9 12l2 2 4-4",
  card: "M4.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-11A1.5 1.5 0 014.5 5zM3 10h18M7 15h3",
  phone: "M8 2.5h8A1.5 1.5 0 0117.5 4v16a1.5 1.5 0 01-1.5 1.5H8A1.5 1.5 0 016.5 20V4A1.5 1.5 0 018 2.5zM11 18.5h2",
  mail: "M4.5 5h15A1.5 1.5 0 0121 6.5v11a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5v-11A1.5 1.5 0 014.5 5zM3.5 6.5l8.5 6.5 8.5-6.5",
  sun: "M12 16a4 4 0 100-8 4 4 0 000 8zM12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
  moon: "M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3.5 9h17M3.5 15h17M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9s1.2-6.4 3.6-9z",
  chevron: "M6 9l6 6 6-6",
};
const Icon = ({ name, className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
);
const InfoIcon = ({ name }) => (
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200/70"><Icon name={name} /></span>
);
const shortVenue = (where) => where.split(",")[0].replace(/^UOWD /, "");
const VenueChip = ({ where }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200/70">
    <Icon name="pin" className="h-3 w-3 text-slate-500" />{shortVenue(where)}
  </span>
);

const LangBadge = ({ lang }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
    <Icon name="globe" className="h-3 w-3" />{lang}
  </span>
);

function ThemeToggle({ dark, onToggle }) {
  return (
    <button onClick={onToggle} role="switch" aria-checked={dark} aria-label="Dark mode" title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`u-keep u-btn relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${dark ? "text-slate-200 hover:text-white" : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900"}`}
      style={dark ? glassChip : undefined}>
      <span className="absolute inset-0 flex items-center justify-center" style={{ transition: "transform .35s cubic-bezier(.2,.8,.2,1), opacity .25s", transform: dark ? "rotate(90deg) scale(.5)" : "none", opacity: dark ? 0 : 1 }}>
        <Icon name="moon" className="h-[18px] w-[18px]" />
      </span>
      <span className={`absolute inset-0 flex items-center justify-center ${dark ? "text-amber-300" : "text-amber-500"}`} style={{ transition: "transform .35s cubic-bezier(.2,.8,.2,1), opacity .25s", transform: dark ? "none" : "rotate(-90deg) scale(.5)", opacity: dark ? 1 : 0 }}>
        <Icon name="sun" className="h-[18px] w-[18px]" />
      </span>
    </button>
  );
}

const Badge = ({ kind, team }) =>
  kind === "official" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
      <Check /> Official UOWD {team ? "Team" : "Club"}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <Check /> Verified Student Event
    </span>
  );

function Vibe({ v }) {
  if (!v)
    return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">✨ New event · be the first to rate</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
      ⭐ {v.score}/5 <span className="font-normal text-amber-600">Vibe Score by {v.count} students</span>
    </span>
  );
}

const ShareBtn = ({ onClick }) => (
  <button onClick={onClick} aria-label="Share event" title="Share event"
    className="u-keep flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white hover:bg-white hover:bg-opacity-30"
    style={{ background: "rgba(255,255,255,0.22)" }}>
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13" />
    </svg>
  </button>
);

function Spots({ left, total, unit = "spots", wait = 0, long = false }) {
  const pct = Math.min(100, ((total - left) / total) * 100);
  const urgent = left > 0 && left <= 5;
  const noun = left > 1 ? unit : unit.replace(/s$/, "");
  return (
    <div>
      <div className={`overflow-hidden rounded-full bg-slate-100 ${long ? "h-2.5" : "h-1.5"}`}>
        <div
          className={`h-full rounded-full ${left <= 0 ? "bg-slate-400" : urgent ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-indigo-500"}`}
          style={{ width: pct + "%", transition: "width .6s ease" }}
        />
      </div>
      <div className={`mt-1.5 flex items-center gap-2 ${long ? "text-sm" : "text-xs"}`}>
        {left <= 0 ? (
          <span className="font-semibold text-slate-500">Fully booked{wait > 0 ? ` · ${wait} on the waitlist` : ""}</span>
        ) : urgent ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600">
            <span className="u-ping h-2 w-2 rounded-full bg-amber-500" /> 🔥 Only {left} {noun} {long ? "remaining" : "left"}!
          </span>
        ) : (
          <span className="text-slate-500">{left} of {total} {unit} {long ? "remaining" : "left"}</span>
        )}
      </div>
    </div>
  );
}

function Modal({ children, onClose, locked, size = "md" }) {
  useEffect(() => {
    if (locked) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [locked, onClose]);

  return (
    <div
      className="u-fade fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      style={overlayStyle}
      onMouseDown={(e) => e.target === e.currentTarget && !locked && onClose()}
    >
      <div className={`u-up relative w-full ${size === "lg" ? "max-w-lg" : size === "sm" ? "max-w-sm" : "max-w-md"} overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl`} style={{ maxHeight: "92vh" }}>
        {!locked && (
          <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
            ✕
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

function QRCode({ value, className = "h-40 w-40" }) {
  const m = qrMatrix(value);
  const rects = [];
  m.forEach((row, y) => row.forEach((d, x) => { if (d) rects.push(<rect key={x + "-" + y} x={x} y={y} width="1" height="1" />); }));
  return (
    <svg viewBox="-3 -3 27 27" className={className} shapeRendering="crispEdges" role="img" aria-label={"Ticket QR code " + value} data-qr={value}>
      <rect x="-3" y="-3" width="27" height="27" fill="#ffffff" />
      <g fill="#0f172a">{rects}</g>
    </svg>
  );
}

const AnimatedCheck = ({ className = "h-16 w-16" }) => (
  <svg viewBox="0 0 52 52" className={className} aria-hidden="true">
    <circle className="u-ring" cx="26" cy="26" r="24" fill="none" stroke="#10b981" strokeWidth="3" />
    <path className="u-tick" d="M15 27l8 8 14-16" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Ticket({ booking: b, justPaid, onClose, onDownload }) {
  const rows = [["Date", fmtDate(b.date)], ["Time", b.time], ["Venue", shortVenue(b.where)], ["Admission", "General · 1 guest"]];
  return (
    <div className="bg-slate-100">
      <div className="u-keep relative overflow-hidden bg-slate-900 px-6 pb-16 pt-8 text-center text-white">
        <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-indigo-600" style={{ filter: "blur(70px)", opacity: 0.55 }} />
        <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-emerald-500" style={{ filter: "blur(80px)", opacity: 0.22 }} />
        <div className="relative">
          <div className="u-pop mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-200">{justPaid ? (b.paid ? "Payment Successful" : "You're in!") : "Your ticket"}</h2>
          {b.paid && <p className="mt-0.5 text-3xl font-bold tabular-nums tracking-tight">{b.price.toFixed(2)} <span className="text-base font-semibold text-slate-400">AED</span></p>}
          <p className="mt-1 text-sm text-slate-400">{b.paid ? `Paid via Ziina · ${b.method}` : "Free spot reserved"}</p>
        </div>
      </div>

      <div className="-mt-10 px-5 pb-5">
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/80">
          <div className="u-keep flex items-center justify-between bg-slate-900 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">U</span>
              <span className="text-sm font-bold text-white">Unite</span>
              <span className="text-xs font-medium uppercase tracking-widest text-slate-400">· Admit one</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white"><Check className="h-3 w-3" /> Confirmed</span>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl ring-1 ring-inset ring-slate-200/70">{b.emoji}</div>
              <p className="min-w-0 font-semibold leading-snug text-slate-900">{b.title}</p>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">{k}</dt>
                  <dd className="truncate font-semibold text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="relative my-5 border-t-2 border-dashed border-slate-200">
              <span className="absolute h-7 w-7 rounded-full bg-slate-100" style={{ left: -34, top: -15 }} />
              <span className="absolute h-7 w-7 rounded-full bg-slate-100" style={{ right: -34, top: -15 }} />
            </div>

            <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80"><QRCode value={b.id} className="h-36 w-36" /></div>
            <p className="mt-3 text-center text-xs font-medium uppercase tracking-widest text-slate-400">Booking ID</p>
            <p className="text-center font-mono text-lg font-bold tracking-wider text-slate-900">{b.id}</p>

            <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              {[["Attendee", b.email], ...(b.studentId ? [["Student ID", b.studentId]] : []), ...(b.txn ? [["Ziina reference", b.txn]] : [])].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="truncate text-right font-medium text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <button onClick={() => onDownload(b)} className="u-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 20h16" /></svg>
          Download ticket
        </button>
        <button onClick={onClose} className="u-btn mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-slate-600 hover:bg-white">Done</button>
        <p className="mt-1 text-center text-xs text-slate-400">Show the QR code at the entrance. Screenshots work too.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Modals                                                             */
/* ------------------------------------------------------------------ */
function AuthModal({ reason, onClose, onSignIn }) {
  const [step, setStep] = useState("email"); // email | otp | success
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const [resent, setResent] = useState(false);
  const refs = useRef([]);
  const timers = useRef([]);
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (step !== "otp" || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, seconds]);
  useEffect(() => { if (step === "otp" && refs.current[0]) refs.current[0].focus(); }, [step]);

  const sendCode = (override) => {
    const v = (typeof override === "string" ? override : email).trim().toLowerCase();
    if (!validEmail(v)) return setError("Enter a valid email address, like name@gmail.com.");
    setEmail(v); setError(""); setSending(true);
    later(() => { setSending(false); setDigits(["", "", "", ""]); setSeconds(45); setStep("otp"); }, 800);
  };

  // Demo mode: any complete 4-digit code verifies.
  const verify = () => {
    setVerifying(true);
    later(() => {
      setVerifying(false);
      setStep("success");
      later(() => onSignIn(email, studentId.trim()), 1300);
    }, 700);
  };

  const setDigit = (i, raw) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = d;
    setDigits(next);
    if (d && i < 3 && refs.current[i + 1]) refs.current[i + 1].focus();
    if (next.every(Boolean)) verify();
  };
  const onKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const next = [...digits]; next[i - 1] = ""; setDigits(next); refs.current[i - 1].focus();
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1].focus();
    if (e.key === "ArrowRight" && i < 3) refs.current[i + 1].focus();
  };
  const onPaste = (e) => {
    const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 4);
    if (!t) return;
    e.preventDefault();
    const next = ["", "", "", ""];
    t.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    refs.current[Math.min(t.length, 3)].focus();
    if (t.length === 4) verify();
  };
  const resend = () => {
    setSeconds(45); setResent(true); setDigits(["", "", "", ""]);
    later(() => setResent(false), 3000);
    if (refs.current[0]) refs.current[0].focus();
  };

  return (
    <Modal onClose={onClose}>
      <div key={step} className="u-slide p-6 pt-8">
        {step === "email" && (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-lg font-bold text-white shadow-lg">U</div>
            <h2 className="mt-4 text-center text-xl font-bold text-slate-900">Campus Login</h2>
            <p className="mt-1 text-center text-sm text-slate-500">{reason || "Sign in with your email to join clubs and get tickets."}</p>

            <label htmlFor="auth-email" className="mt-5 block text-sm font-medium text-slate-700">Email address</label>
            <input
              id="auth-email" type="email" value={email} autoFocus autoComplete="email"
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              placeholder="you@example.com"
              className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 ${error ? "border-rose-400" : "border-slate-300 focus:border-indigo-500"}`}
            />
            {error ? <p className="mt-1.5 text-sm text-rose-600">{error}</p> : <p className="mt-1.5 text-xs text-slate-500">Any email works: university, Gmail, iCloud, Outlook…</p>}

            <label htmlFor="auth-sid" className="mt-4 block text-sm font-medium text-slate-700">Student ID <span className="font-normal text-slate-400">(Optional)</span></label>
            <input
              id="auth-sid" value={studentId} inputMode="numeric" autoComplete="off"
              onChange={(e) => setStudentId(e.target.value.replace(/\s/g, "").slice(0, 12))}
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              placeholder="e.g., 7654321"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <p className="mt-1.5 text-xs text-slate-500">Up to you. Add it to show your ID on tickets, or leave it blank.</p>

            <button onClick={() => sendCode()} disabled={sending} className="u-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-80">
              {sending ? (<><span className="u-spin inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent" /> Sending code…</>) : "Send verification code"}
            </button>
            <button onClick={() => sendCode("demo@uniteuow.com")} disabled={sending} className="mt-2 w-full rounded-xl py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50">
              Continue with a demo account
            </button>

            <ul className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              {["Join clubs in one tap", "Reserve and buy tickets securely", "Host your own student events"].map((t) => (
                <li key={t} className="flex items-center gap-2"><span className="text-emerald-500"><Check /></span>{t}</li>
              ))}
            </ul>
          </>
        )}

        {step === "otp" && (
          <>
            <button onClick={() => setStep("email")} className="-ml-1 rounded-lg px-1.5 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100">← Change email</button>
            <h2 className="mt-3 text-center text-xl font-bold text-slate-900">Enter your code</h2>
            <p className="mt-1 text-center text-sm text-slate-500">We sent a 4-digit code to <span className="font-semibold text-slate-800">{maskEmail(email)}</span></p>
            {studentId.trim() && <p className="mt-2 text-center"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200/70">Student ID {studentId.trim()}</span></p>}

            <div className="mt-6 flex justify-center gap-3" onPaste={onPaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { refs.current[i] = el; }}
                  value={d}
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${i + 1}`}
                  readOnly={verifying}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                  onFocus={(e) => e.target.select()}
                  className={`h-16 w-14 rounded-xl border-2 text-center text-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${d ? "border-indigo-500 bg-indigo-50" : "border-slate-200/80 bg-white shadow-sm focus:border-indigo-500"}`}
                />
              ))}
            </div>

            <div className="mt-4 flex h-6 items-center justify-center text-sm">
              {verifying ? (
                <span className="inline-flex items-center gap-2 text-slate-500"><span className="u-spin inline-block h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent" /> Verifying…</span>
              ) : resent ? (
                <span className="font-medium text-emerald-600">New code sent ✓</span>
              ) : null}
            </div>

            <div className="mt-2 text-center text-sm text-slate-500">
              {seconds > 0 ? (
                <span>Resend code in <span className="font-mono font-semibold text-slate-700">0:{String(seconds).padStart(2, "0")}</span></span>
              ) : (
                <button onClick={resend} className="font-semibold text-indigo-600 hover:underline">Resend code</button>
              )}
            </div>

            <p className="mt-5 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">Demo mode: any 4-digit code works, for example <span className="font-mono font-bold text-slate-700">1234</span>.</p>
          </>
        )}

        {step === "success" && (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center"><AnimatedCheck /></div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">You're verified</h2>
            <p className="mt-1 text-sm text-slate-500">Signing you in as {email}…</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

const CREATE_TABS = [
  ["basics", "Basics", ["title", "desc"]],
  ["when", "Time & place", ["date", "end", "venue", "spots", "price"]],
  ["details", "Details", ["dress", "reqs", "email"]],
];
const VENUE_SUGGESTIONS = ["Room 2.11, Block 2", "Lab B2.14, Block 2", "Lecture Theatre 2, Block 2", "Student Lounge, Block 5", "Rooftop Terrace, Block 5", "Sports Hall, Court 1", "Pitch 2", "Innovation Studio", "Courtyard Café", "Auditorium, Block 3"];
const REQ_CHIPS = ["Bring your own laptop", "Bring your own racket", "Sportswear & trainers", "Student ID at the door", "No experience needed"];

function CreateModal({ email: defaultEmail, onClose, onSubmitted }) {
  const [f, setF] = useState({ title: "", category: "Party", lang: "English", desc: "", date: "", time: "20:00", end: "22:00", venue: "", spots: 30, price: 0, dress: "", reqs: "", email: defaultEmail });
  const [errors, setErrors] = useState({});
  const [tab, setTab] = useState("basics");
  const [step, setStep] = useState("form");
  const [ref, setRef] = useState("");
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); };

  const validate = () => {
    const e = {};
    if (f.title.trim().length < 3) e.title = "Give your event a title (3+ characters).";
    if (!f.date || f.date < TODAY) e.date = "Pick a date from today onwards.";
    if (f.time && f.end && toMin(f.end) <= toMin(f.time)) e.end = "End after the start time.";
    if (f.venue.trim().length < 3) e.venue = "Add the exact venue or room number.";
    if (!(Number(f.spots) >= 1)) e.spots = "At least 1 spot.";
    if (Number(f.price) < 0 || f.price === "") e.price = "Enter 0 for free events.";
    if (!validEmail(f.email.trim())) e.email = "Enter a valid contact email.";
    return e;
  };
  const tabErrors = (k) => CREATE_TABS.find((t) => t[0] === k)[2].some((field) => errors[field]);
  const idx = CREATE_TABS.findIndex((t) => t[0] === tab);

  const next = () => {
    const e = validate();
    const fields = CREATE_TABS[idx][2];
    const here = Object.fromEntries(Object.entries(e).filter(([k]) => fields.includes(k)));
    setErrors({ ...errors, ...here });
    if (!Object.keys(here).length) setTab(CREATE_TABS[idx + 1][0]);
  };
  const submit = () => {
    const e = validate();
    setErrors(e);
    const bad = CREATE_TABS.find((t) => t[2].some((k) => e[k]));
    if (bad) return setTab(bad[0]);
    setStep("submitting");
    setRef(makeId("REQ", 6));
  };
  const addReq = (r) => {
    if (f.reqs.includes(r)) return;
    setF({ ...f, reqs: f.reqs.trim() ? `${f.reqs.trim().replace(/[.,;]$/, "")}; ${r}` : r });
  };

  useEffect(() => {
    if (step !== "submitting") return;
    const t = setTimeout(() => {
      onSubmitted({ ref, title: f.title.trim(), category: f.category, lang: f.lang, date: f.date, start: f.time, end: f.end, venue: f.venue.trim(), dress: f.dress.trim(), reqs: f.reqs.trim(), email: f.email.trim() });
      setStep("done");
    }, 1400);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [step]);

  if (step === "done") {
    const rows = [
      ["Reference", <span className="font-mono font-semibold">{ref}</span>],
      ["Event", f.title.trim()],
      ["Type", f.category],
      ["When", `${fmtDate(f.date)} · ${fmtRange(f.time, f.end)}`],
      ["Venue", f.venue.trim()],
      ["Language", <LangBadge lang={f.lang} />],
      ...(f.dress.trim() ? [["Dress code", f.dress.trim()]] : []),
      ...(f.reqs.trim() ? [["Bring / requirements", f.reqs.trim()]] : []),
      ["Status", <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Pending review</span>],
    ];
    return (
      <Modal onClose={onClose}>
        <div className="p-7 pt-9 text-center">
          <div className="u-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-8 w-8" /></div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Application Submitted!</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Our campus admin team will review your event. An approval notification and management link will be sent to <span className="font-semibold text-slate-900">{f.email.trim()}</span>.
          </p>
          <dl className="mt-5 space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-left text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4">
                <dt className="shrink-0 text-slate-500">{k}</dt><dd className="min-w-0 text-right font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-400">Reviews usually take 1 to 2 working days.</p>
          <button onClick={onClose} className="u-btn mt-5 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800">Back to campus</button>
        </div>
      </Modal>
    );
  }

  const input = (k) => `mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 ${errors[k] ? "border-rose-400" : "border-slate-300 focus:border-indigo-500"}`;
  const Err = ({ k }) => (errors[k] ? <p className="mt-1 text-xs text-rose-600">{errors[k]}</p> : null);
  const Hint = ({ children }) => <p className="mt-1 text-xs text-slate-400">{children}</p>;
  const lab = "text-sm font-medium text-slate-700";
  const opt = <span className="font-normal text-slate-400">(if any)</span>;

  return (
    <Modal onClose={onClose} locked={step === "submitting"} size="lg">
      <div className="p-6 pt-7">
        <h2 className="text-xl font-bold text-slate-900">Host a student event</h2>
        <p className="mt-1 text-sm text-slate-500">Every event is reviewed by the campus team before it goes live.</p>

        <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Event form sections">
          {CREATE_TABS.map(([k, label], i) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`relative flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold sm:text-sm ${tab === k ? "u-seg-on bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${tab === k ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"}`}>{i + 1}</span>
              {label}
              {tabErrors(k) && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" aria-label="has errors" />}
            </button>
          ))}
        </div>

        <div key={tab} className="u-fade mt-5 space-y-4">
          {tab === "basics" && (
            <>
              <div>
                <label className={lab} htmlFor="c-title">Event title</label>
                <input id="c-title" className={input("title")} value={f.title} onChange={set("title")} placeholder="e.g. Midterm Study Jam" />
                <Err k="title" />
              </div>
              <div>
                <span className={lab}>Event type</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {EVENT_TYPES.map((c) => (
                    <button key={c} type="button" onClick={() => setF({ ...f, category: c })} aria-pressed={f.category === c}
                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs font-semibold ${f.category === c ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200/80 bg-white text-slate-600 shadow-sm hover:border-slate-300"}`}>
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br ${GRADIENTS[c]}`} />{c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lab} htmlFor="c-lang">Event Language</label>
                <div className="relative">
                  <select id="c-lang" className={`${input("lang")} appearance-none pr-10`} value={f.lang} onChange={set("lang")}>
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-3 mt-1 flex items-center text-slate-400"><Icon name="chevron" className="h-4 w-4" /></span>
                </div>
                <Hint>The main language spoken. It shows as a badge and a filter on the feed.</Hint>
              </div>
              <div>
                <label className={lab} htmlFor="c-desc">Short description <span className="font-normal text-slate-400">(optional)</span></label>
                <textarea id="c-desc" rows={3} className={`${input("desc")} resize-none`} value={f.desc} onChange={set("desc")} maxLength={280} placeholder="What will people do, and who is it for?" />
                <Hint>{280 - f.desc.length} characters left</Hint>
              </div>
            </>
          )}

          {tab === "when" && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <label className={lab} htmlFor="c-date">Date</label>
                  <input id="c-date" type="date" min={TODAY} className={input("date")} value={f.date} onChange={set("date")} />
                  <Err k="date" />
                </div>
                <div>
                  <label className={lab} htmlFor="c-time">Starts</label>
                  <input id="c-time" type="time" className={input("time")} value={f.time} onChange={set("time")} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className={lab} htmlFor="c-end">Ends</label>
                  <input id="c-end" type="time" className={input("end")} value={f.end} onChange={set("end")} />
                  <Err k="end" />
                </div>
              </div>
              <div>
                <label className={lab} htmlFor="c-venue">Exact Venue / Room Number</label>
                <input id="c-venue" list="c-venues" className={input("venue")} value={f.venue} onChange={set("venue")} placeholder="e.g. Room 2.11, Block 2" />
                <datalist id="c-venues">{VENUE_SUGGESTIONS.map((v) => <option key={v} value={v} />)}</datalist>
                <Err k="venue" />
                {!errors.venue && <Hint>Building and room, or a precise meeting point, so guests don't get lost.</Hint>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lab} htmlFor="c-spots">Max spots</label>
                  <input id="c-spots" type="number" min="1" className={input("spots")} value={f.spots} onChange={set("spots")} />
                  <Err k="spots" />
                </div>
                <div>
                  <label className={lab} htmlFor="c-price">Ticket price (AED)</label>
                  <input id="c-price" type="number" min="0" className={input("price")} value={f.price} onChange={set("price")} />
                  <Err k="price" />
                  {!errors.price && <Hint>{Number(f.price) > 0 ? "Paid securely via Ziina." : "0 = free entry."}</Hint>}
                </div>
              </div>
            </>
          )}

          {tab === "details" && (
            <>
              <div>
                <label className={lab} htmlFor="c-dress">Dress Code {opt}</label>
                <input id="c-dress" list="c-dresses" className={input("dress")} value={f.dress} onChange={set("dress")} placeholder="e.g. Smart casual" />
                <datalist id="c-dresses">{DRESS_CODES.map((v) => <option key={v} value={v} />)}</datalist>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DRESS_CODES.map((d) => (
                    <button key={d} type="button" onClick={() => setF({ ...f, dress: f.dress === d ? "" : d })}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${f.dress === d ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200/80 hover:bg-slate-50"}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lab} htmlFor="c-reqs">Requirements {opt}</label>
                <textarea id="c-reqs" rows={2} className={`${input("reqs")} resize-none`} value={f.reqs} onChange={set("reqs")} placeholder="e.g. Bring your own laptop / racket" />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {REQ_CHIPS.map((r) => (
                    <button key={r} type="button" onClick={() => addReq(r)} disabled={f.reqs.includes(r)}
                      className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200/80 hover:bg-slate-50 disabled:opacity-40">+ {r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lab} htmlFor="c-email">Organizer contact email</label>
                <input id="c-email" type="email" className={input("email")} value={f.email} onChange={set("email")} />
                <Err k="email" />
                {!errors.email && <Hint>Your approval notification and management link will be sent here.</Hint>}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex gap-2">
          {idx > 0 && <button onClick={() => setTab(CREATE_TABS[idx - 1][0])} className="u-btn rounded-xl px-5 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Back</button>}
          {idx < CREATE_TABS.length - 1 ? (
            <button onClick={next} className="u-btn flex-1 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800">Next: {CREATE_TABS[idx + 1][1]} →</button>
          ) : (
            <button onClick={submit} disabled={step === "submitting"} className="u-btn flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-80">
              {step === "submitting" ? (<><span className="u-spin inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent" /> Submitting…</>) : "Submit Event"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

const cardBrand = (digits) => (/^4/.test(digits) ? "VISA" : /^(5[1-5]|2[2-7])/.test(digits) ? "Mastercard" : /^3[47]/.test(digits) ? "AMEX" : "");

function PayCard({ number = "", name, exp, wallet }) {
  const digits = number.replace(/\D/g, "");
  const shown = wallet ? "•••• •••• •••• 4242" : (digits + "•".repeat(Math.max(0, 16 - digits.length))).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const brand = wallet ? "VISA" : cardBrand(digits);
  return (
    <div className="u-keep relative mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl p-5 text-white shadow-lg"
      style={{ aspectRatio: "1.586", background: "linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #0f172a 100%)" }}>
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-400" style={{ filter: "blur(50px)", opacity: 0.35 }} />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-200">{wallet ? "Wallet" : "Debit / Credit"}</span>
          <span className="text-lg font-extrabold italic leading-none tracking-tight">{brand}</span>
        </div>
        <div>
          <div className="h-7 w-10 rounded-md" style={{ background: "linear-gradient(135deg, #fde68a, #d97706)" }} />
          <p className="mt-3 font-mono text-base tracking-widest tabular-nums">{shown}</p>
          <div className="mt-1.5 flex justify-between gap-3 text-xs uppercase tracking-wider text-indigo-200">
            <span className="truncate">{name || "Card holder"}</span><span className="tabular-nums">{exp || "MM/YY"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Checkout({ party, email, onPaid, onDownload, onClose }) {
  const [step, setStep] = useState("review");
  const [method, setMethod] = useState("Apple Pay");
  const [stage, setStage] = useState(0);
  const [booking, setBooking] = useState(null);
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", name: "" });
  const [errors, setErrors] = useState({});
  const amount = party.price.toFixed(2);
  const stages = [method === "Apple Pay" ? "Confirming with Face ID" : "Securing your card details", "Authorizing with your bank", "Issuing your ticket"];
  const label = method === "Apple Pay" ? "Apple Pay · Visa •••• 4242" : `Card •••• ${card.number.replace(/\D/g, "").slice(-4)}`;

  useEffect(() => {
    if (step !== "processing") return;
    const timers = [
      setTimeout(() => setStage(1), 900),
      setTimeout(() => setStage(2), 1800),
      setTimeout(() => { setBooking(onPaid(party, email, label)); setStep("done"); }, 2700),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line
  }, [step]);

  const confirm = () => {
    if (method === "Card") {
      const e = {};
      if (card.number.replace(/\s/g, "").length < 15) e.number = "Enter a valid card number.";
      const mm = card.exp.match(/^(\d{2})\/(\d{2})$/);
      if (!mm || +mm[1] < 1 || +mm[1] > 12 || new Date(2000 + +mm[2], +mm[1], 1) <= new Date()) e.exp = "Use a future date (MM/YY).";
      if (card.cvc.length < 3) e.cvc = "3 or 4 digits.";
      if (card.name.trim().length < 2) e.name = "Enter the name on the card.";
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    setStage(0); setStep("processing");
  };

  const upd = (k, fmt) => (e) => { setCard({ ...card, [k]: fmt(e.target.value) }); setErrors({ ...errors, [k]: undefined }); };
  const fmtNum = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };
  const fmtCvc = (v) => v.replace(/\D/g, "").slice(0, 4);
  const fmtName = (v) => v.slice(0, 40);

  if (step === "done" && booking) return <Modal onClose={onClose}><Ticket booking={booking} justPaid onClose={onClose} onDownload={onDownload} /></Modal>;

  if (step === "processing")
    return (
      <Modal locked onClose={onClose}>
        <div className="px-8 py-12 text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div className="u-spin absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600" />
            <span className="absolute inset-0 flex items-center justify-center text-indigo-600"><Icon name={method === "Apple Pay" ? "phone" : "card"} className="h-6 w-6" /></span>
          </div>
          <p className="mt-6 text-3xl font-bold tabular-nums tracking-tight text-slate-900">{amount} <span className="text-base font-semibold text-slate-400">AED</span></p>
          <p className="mt-1 text-sm text-slate-500">Processing securely with Ziina · {label}</p>
          <ul className="mx-auto mt-7 max-w-xs space-y-3 text-left text-sm">
            {stages.map((t, i) => (
              <li key={t} className={`flex items-center gap-3 ${i <= stage ? "text-slate-800" : "text-slate-400"}`}>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${i < stage ? "bg-emerald-500" : i === stage ? "bg-indigo-500" : "bg-slate-200"}`}>
                  {i < stage ? <Check className="h-3 w-3" /> : i === stage ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                </span>
                {t}{i === stage && "…"}
              </li>
            ))}
          </ul>
          <p className="mt-7 text-xs text-slate-400">Please keep this window open.</p>
        </div>
      </Modal>
    );

  const inp = (k) => `mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 ${errors[k] ? "border-rose-400" : "border-slate-300 focus:border-indigo-500"}`;
  const Err = ({ k }) => (errors[k] ? <p className="mt-1 text-xs text-rose-600">{errors[k]}</p> : null);

  return (
    <Modal onClose={onClose}>
      <div className="px-5 pb-6 pt-3">
        <div className="mx-auto h-1 w-10 rounded-full bg-slate-200" />
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-slate-900">ziina</span>
            <span className="text-xs font-medium text-slate-400">Secure checkout</span>
          </div>
          <span className="mr-9 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"><Icon name="lock" className="h-3 w-3" /> pay.ziina.com</span>
        </div>

        <div className="mt-5 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400">Paying Unite Events</p>
          <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-slate-900">{amount}<span className="ml-1.5 text-lg font-semibold text-slate-400">AED</span></p>
          <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 py-1 pl-1 pr-3 text-sm text-slate-600">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm ${GRADIENTS[party.category]}`}>{party.emoji}</span>
            <span className="truncate">{party.title} · {fmtDate(party.date)}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1" role="radiogroup" aria-label="Payment method">
          {[["Apple Pay", "phone"], ["Card", "card"]].map(([m, icon]) => (
            <button key={m} role="radio" aria-checked={method === m} onClick={() => { setMethod(m); setErrors({}); }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold ${method === m ? "u-seg-on bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              <Icon name={icon} className="h-4 w-4" /> {m}
            </button>
          ))}
        </div>

        <div key={method} className="u-fade mt-4">
          {method === "Apple Pay" ? (
            <>
              <PayCard wallet name={email.split("@")[0].replace(/[._]/g, " ")} exp="09/29" />
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500"><Icon name="phone" className="h-3.5 w-3.5" /> Double-click the side button to confirm with Face ID</p>
            </>
          ) : (
            <>
              <PayCard number={card.number} name={card.name} exp={card.exp} />
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="cc-number" className="text-sm font-medium text-slate-700">Card number</label>
                  <input id="cc-number" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" className={inp("number")} value={card.number} onChange={upd("number", fmtNum)} />
                  <Err k="number" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cc-exp" className="text-sm font-medium text-slate-700">Expiry</label>
                    <input id="cc-exp" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" className={inp("exp")} value={card.exp} onChange={upd("exp", fmtExp)} />
                    <Err k="exp" />
                  </div>
                  <div>
                    <label htmlFor="cc-cvc" className="text-sm font-medium text-slate-700">CVC</label>
                    <input id="cc-cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" className={inp("cvc")} value={card.cvc} onChange={upd("cvc", fmtCvc)} />
                    <Err k="cvc" />
                  </div>
                </div>
                <div>
                  <label htmlFor="cc-name" className="text-sm font-medium text-slate-700">Name on card</label>
                  <input id="cc-name" autoComplete="cc-name" placeholder="Full name" className={inp("name")} value={card.name} onChange={upd("name", fmtName)} />
                  <Err k="name" />
                </div>
              </div>
            </>
          )}
        </div>

        <dl className="mt-5 space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">General admission × 1</dt><dd className="tabular-nums text-slate-800">{amount} AED</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Service fee</dt><dd className="tabular-nums text-slate-800">0.00 AED</dd></div>
          <div className="flex justify-between border-t border-slate-200/80 pt-2 font-semibold"><dt className="text-slate-900">Total</dt><dd className="tabular-nums text-slate-900">{amount} AED</dd></div>
        </dl>

        <button onClick={confirm} className={`u-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-white shadow-sm ${method === "Apple Pay" ? "u-keep bg-black hover:bg-slate-800" : "bg-indigo-600 hover:bg-indigo-700"}`}>
          <Icon name="lock" className="h-4 w-4" /> Confirm Payment · {amount} AED
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500"><Icon name="shield" className="h-3.5 w-3.5 text-emerald-600" /> Secured by Ziina · PCI DSS · 256-bit TLS</p>
        <p className="mt-1 text-center text-xs text-slate-400">Demo mode: no real charge. For card, try 4242 4242 4242 4242.</p>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Event details                                                      */
/* ------------------------------------------------------------------ */
function EventDetail({ party: p, action, onShare, onClose }) {
  const left = p.spots - p.taken;
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.maps);
  return (
    <Modal onClose={onClose} size="lg">
      <div className={`bg-gradient-to-br px-6 pb-6 pt-7 text-white ${GRADIENTS[p.category]}`}>
        <div className="flex items-start justify-between pr-10">
          <span className="text-5xl">{p.emoji}</span>
          <ShareBtn onClick={() => onShare(p)} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.22)" }}>{p.category}</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-900">{p.price > 0 ? `${p.price} AED` : "Free"}</span>
        </div>
        <h2 className="mt-2 text-2xl font-bold leading-tight">{p.title}</h2>
        <p className="mt-0.5 text-sm" style={{ opacity: 0.9 }}>Hosted by {p.host}</p>
      </div>

      <div className="space-y-5 p-5">
        <div className="flex flex-wrap items-center gap-2"><Badge kind="verified" /><LangBadge lang={p.lang} /><Vibe v={p.vibe} /></div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-800">Availability</span>
            <span className="text-slate-500">{p.taken} / {p.spots} booked</span>
          </div>
          <Spots left={left} total={p.spots} unit="seats" wait={p.wait} long />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">About this event</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{p.desc}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.perks.map((t) => <span key={t} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{t}</span>)}
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex gap-3">
            <InfoIcon name="calendar" />
            <div><p className="font-semibold text-slate-900">{fmtDate(p.date)} · {p.time}</p><p className="text-slate-500">Doors open 30 minutes before</p></div>
          </div>
          <div className="flex gap-3">
            <InfoIcon name="pin" />
            <div>
              <p className="font-semibold text-slate-900">{p.where}</p>
              <p className="text-slate-500">{p.address}</p>
              <p className="mt-1 flex flex-wrap gap-x-4">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">Open in Google Maps ↗</a>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <InfoIcon name="user" />
            <div>
              <p className="font-semibold text-slate-900">{p.contact.name} <span className="font-normal text-slate-500">· {p.contact.role}</span></p>
              <a href={`mailto:${p.contact.email}?subject=${encodeURIComponent(p.title)}`} className="font-semibold text-indigo-600 hover:underline">{p.contact.email}</a>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-slate-200/80 bg-white shadow-sm p-4">{action}</div>
    </Modal>
  );
}

function ClubDetail({ club: c, joined, action, onClose }) {
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(UOWD_MAPS);
  return (
    <Modal onClose={onClose} size="lg">
      <div className={`bg-gradient-to-br px-6 pb-6 pt-7 text-white ${GRADIENTS[c.category]}`}>
        <span className="text-5xl">{c.emoji}</span>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.22)" }}>{c.category}</span>
          {joined && <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.22)" }}>✓ You're a member</span>}
        </div>
        <h2 className="mt-2 text-2xl font-bold leading-tight">{c.name}</h2>
        <p className="mt-0.5 text-sm" style={{ opacity: 0.9 }}>{c.members + (joined ? 1 : 0)} members · Free to join</p>
      </div>

      <div className="space-y-5 p-5">
        <Badge kind="official" team={c.category === "Sports"} />
        <div>
          <h3 className="text-sm font-semibold text-slate-900">About the club</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{c.desc}</p>
        </div>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Official weekly schedule</h3>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80">
              {c.slots.map((sl) => (
                <li key={sl.id} className="flex items-center gap-3 px-3.5 py-2.5">
                  <span className="w-10 shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-400">{DAYS[sl.day].slice(0, 3)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-slate-900">{fmtRange(sl.start, sl.end)}</span>
                    <span className="block truncate text-xs text-slate-500">{sl.title} · {sl.where} · {sl.level}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">{c.note}</p>
          </div>
          <div className="flex gap-3">
            <InfoIcon name="pin" />
            <div>
              <p className="font-semibold text-slate-900">{c.where}</p>
              <p className="text-slate-500">{UOWD_ADDRESS}</p>
              <p className="mt-1 flex flex-wrap gap-x-4">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">Open in Google Maps ↗</a>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <InfoIcon name="user" />
            <div>
              <p className="font-semibold text-slate-900">{c.lead.name} <span className="font-normal text-slate-500">· {c.lead.role}</span></p>
              <a href={`mailto:${c.lead.email}?subject=${encodeURIComponent(c.name)}`} className="font-semibold text-indigo-600 hover:underline">{c.lead.email}</a>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-slate-200/80 bg-white shadow-sm p-4">{action}</div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Waitlist modal, live ticker                                        */
/* ------------------------------------------------------------------ */
function WaitlistModal({ party, pos, email, fresh, onLeave, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="p-7 pt-9 text-center">
        <div className="u-pop mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl font-extrabold text-white shadow-lg">#{pos}</div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">{fresh ? "You're on the waitlist" : "Your waitlist spot"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          You are <span className="font-semibold text-slate-900">#{pos}</span> on the waitlist. If a spot opens up, an automated confirmation code will be sent to your email.
        </p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">{party.emoji}</div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{party.title}</p>
              <p className="text-sm text-slate-500">{fmtDate(party.date)} · {party.time}</p>
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm">
            <span className="text-slate-500">Code sent to</span>
            <span className="truncate pl-4 font-medium text-slate-800">{email}</span>
          </div>
        </div>

        <ol className="mt-4 space-y-2 text-left text-sm text-slate-600">
          {["A spot opens up", "You receive a confirmation code by email", "Enter the code to claim your ticket"].map((t, i) => (
            <li key={t} className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">{i + 1}</span>{t}
            </li>
          ))}
        </ol>

        <button onClick={onClose} className="u-btn mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800">Got it</button>
        <button onClick={onLeave} className="mt-2 w-full rounded-xl py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-rose-600">Leave waitlist</button>
      </div>
    </Modal>
  );
}

function Ticker({ onClose }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % FEED.length), 4500);
    return () => clearInterval(t);
  }, []);
  const [name, verb, what, when] = FEED[i];
  return (
    <div className="fixed bottom-4 left-4 z-40 w-72" style={{ maxWidth: "calc(100vw - 2rem)" }}>
      <div key={i} className="u-up flex items-center gap-3 rounded-2xl py-2.5 pl-3 pr-2 text-white shadow-xl" style={{ ...glassDark, border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold">{name[0]}</div>
        <div className="min-w-0 flex-1 text-xs leading-snug">
          <p><span className="font-semibold">{name}</span> {verb} <span className="font-semibold">{what}</span></p>
          <p className="mt-0.5 flex items-center gap-1.5 text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {when}</p>
        </div>
        <button onClick={onClose} aria-label="Hide live activity" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-white">✕</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Club sessions, schedule and calendar export                        */
/* ------------------------------------------------------------------ */
const overlaps = (a, b) => a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

/* Builds an .ics file: weekly club sessions (12 weeks) plus booked one-off events. */
function downloadCalendar(sessions, events) {
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = (d, hhmm) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${hhmm.replace(":", "")}00`;
  const esc = (t) => String(t).replace(/[,;\\]/g, (m) => "\\" + m);
  const now = new Date();
  const out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Unite//UOWD//EN", "CALSCALE:GREGORIAN"];
  const ev = (uid, start, end, title, where, rrule) => {
    out.push("BEGIN:VEVENT", `UID:${uid}@uniteuow.com`, `DTSTAMP:${stamp(now, "00:00")}`, `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${esc(title)}`, `LOCATION:${esc(where)}`);
    if (rrule) out.push(rrule);
    out.push("END:VEVENT");
  };
  sessions.forEach(({ club, slot }) => {
    const d = new Date(now); d.setDate(d.getDate() + ((slot.day - weekdayIdx(d) + 7) % 7));
    ev(slot.id, stamp(d, slot.start), stamp(d, slot.end), `${club.name}: ${slot.title}`, slot.where, "RRULE:FREQ=WEEKLY;COUNT=12");
  });
  events.forEach((b) => {
    const d = new Date(b.date + "T00:00:00"), st = to24(b.time);
    const endMin = toMin(st) + 120, et = `${pad(Math.min(23, Math.floor(endMin / 60)))}:${pad(endMin % 60)}`;
    ev(b.id, stamp(d, st), stamp(d, et), b.title, b.where);
  });
  out.push("END:VCALENDAR");
  const url = URL.createObjectURL(new Blob([out.join("\r\n")], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url; a.download = "unite-schedule.ics";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const CAT_TINT = {
  Sports: "border-emerald-500 bg-emerald-50", Tech: "border-sky-500 bg-sky-50", Business: "border-violet-500 bg-violet-50",
  Arts: "border-pink-500 bg-pink-50", Culture: "border-amber-500 bg-amber-50",
};
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const HOUR_PX = 56;
const mondayOf = (d) => { const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - weekdayIdx(m)); return m; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const isoWeek = (d) => { const t = addDays(mondayOf(d), 3); const jan4 = new Date(t.getFullYear(), 0, 4); return 1 + Math.round((t - mondayOf(jan4)) / 6048e5); };
const shortTime = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""}`; };
const shortRange = (a, b) => `${shortTime(a)}–${shortTime(b)} ${+b.split(":")[0] < 12 ? "AM" : "PM"}`;
/* "Mondays & Wednesdays · 5–7 PM", or per session when the times differ. */
const scheduleLabel = (c, short = false) => {
  const same = c.slots.every((x) => x.start === c.slots[0].start && x.end === c.slots[0].end);
  const day = (d) => (short ? DAYS[d].slice(0, 3) : DAYS[d] + "s");
  return same
    ? `${c.slots.map((x) => day(x.day)).join(" & ")} · ${shortRange(c.slots[0].start, c.slots[0].end)}`
    : c.slots.map((x) => `${DAYS[x.day].slice(0, 3)} ${shortRange(x.start, x.end)}`).join(" & ");
};
const hourLabel = (h) => `${((h + 11) % 12) + 1} ${h < 12 || h === 24 ? "AM" : "PM"}`;

/* Side-by-side lanes for overlapping blocks within one day. */
function layoutDay(items) {
  const sorted = [...items].sort((a, b) => a.s - b.s || b.e - a.e);
  const lanes = [];
  sorted.forEach((it) => {
    let l = lanes.findIndex((end) => end <= it.s);
    if (l < 0) { l = lanes.length; lanes.push(0); }
    lanes[l] = it.e; it.lane = l;
  });
  sorted.forEach((it) => { it.lanes = Math.max(...sorted.filter((o) => o.s < it.e && it.s < o.e).map((o) => o.lane)) + 1; });
  return sorted;
}

function MySchedule({ sessions, events, onOpenClub, onOpenTicket, onBrowse, onExport }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [anchor, setAnchor] = useState(() => mondayOf(today));
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  const days = DAYS.map((_, i) => addDays(anchor, i));
  const mid = days[3]; // the week belongs to the month its Thursday falls in
  const thisYear = today.getFullYear();
  const years = [thisYear, thisYear + 1];
  const minAnchor = mondayOf(new Date(thisYear, 0, 4));
  const maxAnchor = mondayOf(new Date(thisYear + 1, 11, 28));
  const go = (d) => setAnchor(d < minAnchor ? minAnchor : d > maxAnchor ? maxAnchor : d);
  const jumpMonth = (y, m) => go(mondayOf(new Date(y, m, 4)));
  const isCurrent = +anchor === +mondayOf(today);
  const fmt = (d, o) => d.toLocaleDateString("en-GB", o);
  const range = `${fmt(days[0], { day: "numeric", month: "short" })} – ${fmt(days[6], { day: "numeric", month: "short", year: "numeric" })}`;

  // Everything on the grid this week.
  const dayItems = days.map((d, i) => {
    const iso = isoDay(d);
    return layoutDay([
      ...sessions.filter((x) => x.slot.day === i).map((x) => ({ kind: "session", key: x.slot.id, s: toMin(x.slot.start), e: toMin(x.slot.end), x })),
      ...events.filter((b) => b.date === iso).map((b) => { const s = toMin(to24(b.time)); return { kind: "event", key: b.id, s, e: Math.min(s + 120, 24 * 60), b }; }),
    ]);
  });
  const all = dayItems.flat();
  // Days with overlapping sessions get proportionally wider columns.
  const cols = `60px ${dayItems.map((its) => `minmax(0, ${Math.max(1, ...its.map((it) => Math.min(it.lanes, 3)))}fr)`).join(" ")}`;
  // Fit the grid to this week's items, with an hour of breathing room either side.
  const startH = all.length ? Math.max(6, Math.min(...all.map((it) => Math.floor(it.s / 60))) - 1) : 9;
  const endH = all.length ? Math.min(24, Math.max(startH + 6, ...all.map((it) => Math.ceil(it.e / 60) + 1))) : 18;
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const gridH = (endH - startH) * HOUR_PX;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const weekHours = all.reduce((h, it) => h + (it.e - it.s) / 60, 0);
  const weekly = sessions.reduce((h, x) => h + slotHours(x.slot), 0);
  const upcoming = events.filter((b) => b.date >= isoDay(today)).sort((a, b) => (a.date + to24(a.time)).localeCompare(b.date + to24(b.time)));

  const nextSession = sessions
    .map((x) => { const ahead = (x.slot.day - weekdayIdx(today) + 7) % 7; return { ...x, days: ahead === 0 && toMin(x.slot.start) <= nowMin ? 7 : ahead }; })
    .sort((a, b) => a.days - b.days || toMin(a.slot.start) - toMin(b.slot.start))[0];
  const whenLabel = (n) => (n === 0 ? "Today" : n === 1 ? "Tomorrow" : DAYS[(weekdayIdx(today) + n) % 7]);

  if (!sessions.length && !events.length)
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200/70"><Icon name="calendar" className="h-7 w-7" /></span>
        <h3 className="mt-4 text-lg font-bold text-slate-900">Your week is wide open</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Register for a team or club and its official weekly schedule appears here, along with any event tickets. Everything you sign up for lands here automatically.</p>
        <div className="mt-5 flex justify-center gap-2">
          <button onClick={() => onBrowse("clubs")} className="u-btn rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Browse teams & clubs</button>
          <button onClick={() => onBrowse("parties")} className="u-btn rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Find events</button>
        </div>
      </div>
    );

  const selectCls = "u-btn appearance-none rounded-xl border border-slate-200/80 bg-white py-2 pl-3 pr-8 text-sm font-semibold text-slate-900 shadow-sm hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";
  const Chevron = () => <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400"><Icon name="chevron" className="h-4 w-4" /></span>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Next up</p>
          {nextSession ? (
            <button onClick={() => onOpenClub(nextSession.club)} className="mt-2 flex w-full items-center gap-3 text-left">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl ${GRADIENTS[nextSession.club.category]}`}>{nextSession.club.emoji}</span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-slate-900">{nextSession.club.name} · {nextSession.slot.title}</span>
                <span className="block truncate text-sm text-slate-500">{whenLabel(nextSession.days)}, {fmtRange(nextSession.slot.start, nextSession.slot.end)} · {nextSession.slot.where}</span>
              </span>
            </button>
          ) : upcoming[0] ? (
            <button onClick={() => onOpenTicket(upcoming[0])} className="mt-2 flex w-full items-center gap-3 text-left">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">{upcoming[0].emoji}</span>
              <span className="min-w-0"><span className="block truncate font-semibold text-slate-900">{upcoming[0].title}</span><span className="block text-sm text-slate-500">{fmtDate(upcoming[0].date)} · {upcoming[0].time}</span></span>
            </button>
          ) : <p className="mt-2 text-sm text-slate-500">Nothing coming up.</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"><p className="text-2xl font-bold tabular-nums text-slate-900">{sessions.length}</p><p className="text-xs text-slate-500">weekly sessions</p></div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"><p className="text-2xl font-bold tabular-nums text-slate-900">{weekly % 1 ? weekly.toFixed(1) : weekly}</p><p className="text-xs text-slate-500">hours a week</p></div>
        </div>
      </div>

      {/* Calendar */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200/80 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select aria-label="Month" value={mid.getMonth()} onChange={(e) => jumpMonth(mid.getFullYear(), +e.target.value)} className={selectCls}>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <Chevron />
            </div>
            <div className="relative">
              <select aria-label="Year" value={mid.getFullYear()} onChange={(e) => jumpMonth(+e.target.value, mid.getMonth())} className={selectCls}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <Chevron />
            </div>
            <div className="ml-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">Week {isoWeek(anchor)}{isCurrent && <span className="ml-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">This week</span>}</p>
              <p className="text-xs text-slate-500">{range}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
            <div className="inline-flex overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
              <button onClick={() => go(addDays(anchor, -7))} disabled={+anchor <= +minAnchor} aria-label="Previous week"
                className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                <Icon name="chevron" className="h-4 w-4 rotate-90" /><span className="hidden sm:inline">Previous week</span>
              </button>
              <button onClick={() => go(mondayOf(today))} disabled={isCurrent} className="border-x border-slate-200/80 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 disabled:text-slate-400 disabled:hover:bg-transparent">Today</button>
              <button onClick={() => go(addDays(anchor, 7))} disabled={+anchor >= +maxAnchor} aria-label="Next week"
                className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                <span className="hidden sm:inline">Next week</span><Icon name="chevron" className="h-4 w-4 -rotate-90" />
              </button>
            </div>
            <button onClick={onExport} className="u-btn inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              <Icon name="calendar" className="h-4 w-4" /> Add to my calendar
            </button>
          </div>
        </div>

        {/* Week grid */}
        <div className="overflow-x-auto">
          <div key={+anchor} className="u-fade min-w-[860px]">
            <div className="grid border-b border-slate-200/80" style={{ gridTemplateColumns: cols }}>
              <div className="px-2 py-3 text-right text-xs font-medium text-slate-400">{weekHours ? `${weekHours % 1 ? weekHours.toFixed(1) : weekHours} h` : ""}</div>
              {days.map((d, i) => {
                const isToday = +d === +today;
                return (
                  <div key={i} className={`border-l border-slate-200/80 px-2 py-2.5 text-center ${i >= 5 ? "bg-slate-50" : ""}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${isToday ? "text-indigo-600" : "text-slate-400"}`}>{DAYS[i].slice(0, 3)}</p>
                    <p className={`mx-auto mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-base font-bold ${isToday ? "bg-indigo-600 text-white" : d < today ? "text-slate-400" : "text-slate-900"}`}>{d.getDate()}</p>
                  </div>
                );
              })}
            </div>
            <div className="relative grid" style={{ gridTemplateColumns: cols, height: gridH, transition: "grid-template-columns .3s ease" }}>
              {/* Hour labels + lines */}
              <div className="relative">
                {hours.map((h, i) => (
                  <span key={h} className="absolute right-2 -translate-y-1/2 text-xs tabular-nums text-slate-400" style={{ top: i * HOUR_PX }}>{i === 0 ? "" : hourLabel(h)}</span>
                ))}
              </div>
              {days.map((d, i) => {
                const isToday = +d === +today;
                return (
                  <div key={i} className={`relative border-l border-slate-200/80 ${i >= 5 ? "bg-slate-50" : ""} ${d < today ? "opacity-70" : ""}`}>
                    {hours.map((h, j) => <div key={h} className="absolute inset-x-0 border-t border-slate-100" style={{ top: j * HOUR_PX }} />)}
                    {dayItems[i].map((it) => {
                      const top = ((it.s - startH * 60) / 60) * HOUR_PX;
                      const height = Math.max(26, ((it.e - it.s) / 60) * HOUR_PX - 3);
                      const style = { top: top + 1, height, left: `calc(${(it.lane / it.lanes) * 100}% + 3px)`, width: `calc(${100 / it.lanes}% - 6px)` };
                      const tall = height > 70;
                      const narrow = it.lanes > 1;
                      return it.kind === "session" ? (
                        <button key={it.key} onClick={() => onOpenClub(it.x.club)} title={`${it.x.club.name} · ${it.x.slot.title} · ${fmtRange(it.x.slot.start, it.x.slot.end)}`}
                          className={`absolute overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left shadow-sm hover:z-10 hover:shadow-md ${CAT_TINT[it.x.club.category]}`} style={style}>
                          <span className="block truncate text-xs font-semibold tabular-nums text-slate-500">{shortRange(it.x.slot.start, it.x.slot.end)}</span>
                          <span className="block truncate text-xs font-bold text-slate-900">{it.x.club.emoji} {it.x.club.name}</span>
                          {tall && !narrow && <span className="block truncate text-xs text-slate-500">{it.x.slot.title}</span>}
                          {tall && <span className="mt-0.5 block truncate text-xs text-slate-400">{narrow ? it.x.slot.title : it.x.slot.where}</span>}
                        </button>
                      ) : (
                        <button key={it.key} onClick={() => onOpenTicket(it.b)} title={`${it.b.title} · ${it.b.time}`}
                          className="absolute overflow-hidden rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-2 py-1 text-left hover:z-10 hover:shadow-md" style={style}>
                          <span className="block truncate text-xs font-semibold text-indigo-600">{it.b.time} · Event</span>
                          <span className="block truncate text-xs font-bold text-slate-900">{it.b.emoji} {it.b.title}</span>
                          {tall && <span className="block truncate text-xs text-slate-500">{shortVenue(it.b.where)}</span>}
                        </button>
                      );
                    })}
                    {isToday && nowMin >= startH * 60 && nowMin <= endH * 60 && (
                      <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: ((nowMin - startH * 60) / 60) * HOUR_PX }}>
                        <div className="relative h-0.5 bg-rose-500"><span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" /></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 px-4 py-3 text-xs text-slate-500">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[["Sports", "bg-emerald-500"], ["Tech", "bg-sky-500"], ["Business", "bg-violet-500"], ["Arts", "bg-pink-500"]].map(([k, c]) => (
              <span key={k} className="inline-flex items-center gap-1.5"><span className={`h-3 w-1 rounded-full ${c}`} /> {k}</span>
            ))}
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed border-indigo-400 bg-indigo-50" /> Ticketed event</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3 bg-rose-500" /> Now</span>
          </div>
          <span className="sm:hidden">Swipe sideways to see the whole week →</span>
        </div>
      </section>

      {/* Upcoming events list */}
      {upcoming.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming events</h3>
          <div className="space-y-2">
            {upcoming.map((b) => {
              const d = new Date(b.date + "T00:00:00");
              return (
                <button key={b.id} onClick={() => onOpenTicket(b)} className="u-card flex w-full items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 text-left shadow-sm">
                  <span className="u-keep flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-900 text-white">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">{fmt(d, { month: "short" })}</span>
                    <span className="text-xl font-bold leading-none">{d.getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{b.title}</span>
                    <span className="block text-sm text-slate-500">{DAYS[weekdayIdx(d)]} · {b.time} · {shortVenue(b.where)}</span>
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Ticket</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/* Official UOWD Sports tryouts registration (Jotform), embedded full-height.
   The sports checkbox is pre-filled through Jotform's URL parameters: ?<field unique name>=Option1,Option2.
   JOTFORM_SPORT_FIELD must match the checkbox's "Unique Name" in the Jotform builder
   (field settings > Advanced > Field Details). Unknown parameters are ignored by Jotform. */
const UOWD_TRYOUTS_URL = "https://uowd.jotform.com/251912229886062";
const JOTFORM_SPORT_FIELD = "sport";
const JOTFORM_SPORTS = ["Badminton", "Basketball", "Cricket", "Football", "Volleyball", "Table Tennis", "Track", "Padel", "Tennis", "Swimming", "Chess"];
const isSports = (c) => c.category === "Sports";
const tryoutUrl = (c) => {
  const picks = (c.form || []).filter((o) => JOTFORM_SPORTS.includes(o));
  return picks.length ? `${UOWD_TRYOUTS_URL}?${JOTFORM_SPORT_FIELD}=${picks.map(encodeURIComponent).join(",")}` : UOWD_TRYOUTS_URL;
};

/* Always dark, whatever the site theme: only fixed dark colours are used here, none that the
   .u-dark palette remap touches, and every surface carries u-keep. */
function TryoutModal({ club: c, onSent, onClose }) {
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const src = tryoutUrl(c);
  const picks = (c.form || []).filter((o) => JOTFORM_SPORTS.includes(o));
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000);
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => { clearTimeout(t); window.removeEventListener("keydown", h); };
  }, [onClose]);

  return (
    <div className="u-keep u-fade fixed inset-0 z-50 flex items-stretch justify-center bg-black/75 backdrop-blur-md sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={`UOWD Sports tryouts registration for ${c.name}`}
        className="u-keep u-up flex h-[100dvh] w-full flex-col overflow-hidden bg-gray-950 text-white shadow-2xl ring-1 ring-white/10 sm:h-[92vh] sm:max-w-3xl sm:rounded-3xl"
        style={{ colorScheme: "dark" }}>

        {/* Header: solid, locked dark */}
        <div className="u-keep shrink-0 border-b border-white/10 bg-gray-900 px-4 pb-4 text-white sm:px-6" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
          <div className="flex items-center justify-between gap-2">
            <button onClick={onClose} className="u-keep inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/20">
              <Icon name="chevron" className="h-4 w-4 rotate-90" /> Back to Feed
            </button>
            <div className="flex items-center gap-2">
              <a href={src} target="_blank" rel="noopener noreferrer" className="u-keep inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-white/20">
                Open in new tab ↗
              </a>
              <button onClick={onClose} aria-label="Close" className="u-keep flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/10 hover:bg-white/20">✕</button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg ${GRADIENTS[c.category]}`}>{c.emoji}</span>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-emerald-400 ring-1 ring-inset ring-emerald-400/30">
                <Icon name="shield" className="h-3.5 w-3.5" /> Official UOWD Form
              </p>
              <h2 className="mt-1 truncate text-lg font-bold leading-tight text-white sm:text-xl">Sports Tryouts Registration</h2>
              <p className="truncate text-sm text-gray-400">For {c.name} · run by UOWD Sports</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-300">
            {picks.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                Sport{picks.length > 1 ? "s" : ""}:
                {picks.map((o) => <span key={o} className="rounded-md bg-emerald-500 px-2 py-0.5 font-semibold text-gray-950">{o}</span>)}
                <span className="text-gray-400">· pre-selected, please check it's ticked</span>
              </span>
            )}
            <span className="hidden text-gray-400 sm:inline">Answers go straight to UOWD Sports, not to Unite.</span>
          </div>
        </div>

        {/* Form: the white Jotform sits on the dark frame */}
        <div className="u-keep relative min-h-0 flex-1 bg-gray-950 sm:p-3">
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="u-spin h-9 w-9 rounded-full border-4 border-white/10 border-t-emerald-400" />
              <p className="text-sm font-medium text-gray-300">Loading the official UOWD form…</p>
              {slow && <p className="text-xs text-gray-400">Taking a while? <a href={src} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-400 hover:underline">Open it in a new tab ↗</a></p>}
            </div>
          )}
          <iframe
            key={src}
            title={`UOWD Sports Tryouts Registration form for ${c.name}`}
            src={src}
            onLoad={() => setLoaded(true)}
            allow="fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            className="u-keep h-full w-full border-0 bg-white sm:rounded-2xl"
            style={{ opacity: loaded ? 1 : 0, transition: "opacity .3s ease", colorScheme: "light" }}
          />
        </div>

        {/* Footer: locked dark */}
        <div className="u-keep flex shrink-0 flex-col gap-2 border-t border-white/10 bg-gray-900 p-3 sm:flex-row sm:items-center sm:px-6" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <button onClick={onSent} className="u-keep u-btn flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-gray-950 hover:bg-emerald-400">
            I've submitted the form
            <span className="ml-1.5 font-normal text-gray-900/70">· adds {scheduleLabel(c, true)} to My Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main app                                                           */
/* ------------------------------------------------------------------ */
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("clubs");
  const [filter, setFilter] = useState("All");
  const [langFilter, setLangFilter] = useState("All");
  const clubs = CLUBS;
  const [joinedClubs, setJoinedClubs] = useState({}); // clubId -> true; each club's fixed official schedule is added in full
  const [parties, setParties] = useState(PARTIES);
  const [bookings, setBookings] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [waitlist, setWaitlist] = useState({});
  const [tickerOn, setTickerOn] = useState(true);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("unite-theme") === "dark"; } catch (e) { return false; }
  });
  const toastTimer = useRef(null);
  const studentIdRef = useRef("");

  useEffect(() => {
    document.title = "Unite · UOWD clubs & events";
    try {
      const m = window.location.pathname.match(/\/events\/(\d+)/);
      if (m) { setTab("parties"); setModal({ type: "detail", id: Number(m[1]) }); }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem("unite-theme", dark ? "dark" : "light"); } catch (e) { /* ignore */ }
    document.documentElement.style.backgroundColor = dark ? "#070c18" : "#f8fafc";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => { document.body.style.overflow = modal ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [modal]);

  const notify = (m, ms = 2400) => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), ms); };
  const closeModal = () => setModal(null);
  const requireAuth = (reason, action) => (user ? action(user) : setModal({ type: "auth", reason, action }));

  const signIn = (email, sid) => {
    const action = modal && modal.action;
    studentIdRef.current = sid || "";
    setUser(email);
    setModal(null);
    notify("Signed in as " + email);
    if (action) setTimeout(() => action(email), 250);
  };

  const changeTab = (t) => { setTab(t); setFilter("All"); setLangFilter("All"); };
  const jumpTo = (t) => {
    changeTab(t);
    const el = document.getElementById("tabs");
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: "smooth" });
  };
  const goHome = () => { changeTab("clubs"); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const isJoined = (c) => !!(user && joinedClubs[c.id]);
  const memberCount = (c) => c.members + (isJoined(c) ? 1 : 0);
  const sessions = clubs.filter(isJoined).flatMap((c) => c.slots.map((slot) => ({ club: c, slot })));

  // Each team/club has one fixed official schedule; registering adds all of its sessions.
  const registerClub = (c) => {
    const clash = c.slots.map((sl) => sessions.find((o) => o.club.id !== c.id && overlaps(o.slot, sl))).find(Boolean);
    setJoinedClubs((x) => ({ ...x, [c.id]: true }));
    notify(`Registered for ${c.name}! ${scheduleLabel(c)} added to My Schedule.${clash ? ` Heads up: it overlaps with ${clash.club.name}.` : ""}`, 4200);
  };
  // Sports sections register through UOWD's official tryouts form; clubs join in one tap.
  const openJoin = (c) => {
    if (isJoined(c)) return setModal({ type: "club", id: c.id });
    if (isSports(c)) return requireAuth(`Sign in to register for ${c.name} tryouts`, () => setModal({ type: "tryout", id: c.id }));
    requireAuth(`Sign in to join ${c.name}`, () => registerClub(c));
  };
  const leaveClub = (c) => {
    setJoinedClubs((x) => { const n = { ...x }; delete n[c.id]; return n; });
    setModal(null);
    notify(`You left ${c.name}`);
  };

  const bookingFor = (id) => (user ? bookings.find((b) => b.partyId === id) : undefined);

  const createBooking = (p, email, method) => {
    const b = { id: makeId("UNT-2026", 5), partyId: p.id, title: p.title, emoji: p.emoji, date: p.date, time: p.time, where: p.where, price: p.price, paid: p.price > 0, method, email, studentId: studentIdRef.current, txn: p.price > 0 ? makeId("ZN", 8) : null };
    setBookings((bs) => [b, ...bs]);
    setParties((ps) => ps.map((x) => (x.id === p.id ? { ...x, taken: x.taken + 1 } : x)));
    return b;
  };

  const joinWaitlist = (p, email) => {
    const pos = p.wait + 1;
    setParties((ps) => ps.map((x) => (x.id === p.id ? { ...x, wait: x.wait + 1 } : x)));
    setWaitlist((w) => ({ ...w, [p.id]: pos }));
    setModal({ type: "waitlist", party: p, pos, email, fresh: true });
  };

  const leaveWaitlist = (p) => {
    setParties((ps) => ps.map((x) => (x.id === p.id ? { ...x, wait: Math.max(0, x.wait - 1) } : x)));
    setWaitlist((w) => { const n = { ...w }; delete n[p.id]; return n; });
    setModal(null);
    notify("You left the waitlist");
  };

  const onParty = (p) => {
    const existing = bookingFor(p.id);
    if (existing) return setModal({ type: "ticket", booking: existing });
    if (p.spots - p.taken <= 0) {
      if (user && waitlist[p.id]) return setModal({ type: "waitlist", party: p, pos: waitlist[p.id], email: user });
      return requireAuth(`Sign in to join the waitlist for ${p.title}`, (email) => joinWaitlist(p, email));
    }
    requireAuth(p.price > 0 ? `Sign in to buy a ticket for ${p.title}` : `Sign in to reserve your spot at ${p.title}`, (email) => {
      if (p.price > 0) setModal({ type: "checkout", party: p, email });
      else setModal({ type: "ticket", booking: createBooking(p, email, "Free"), justPaid: true });
    });
  };

  const shareEvent = async (p) => {
    const ok = await copyText(`https://uniteuow.com/events/${p.id}`);
    notify(
      ok ? "Link copied to clipboard! Share it with your squad via WhatsApp." : "Couldn't copy automatically. Copy the page link from your address bar instead.",
      3600
    );
  };


  const handleDownload = (b) => {
    try { downloadTicket(b); notify(`Ticket saved as ${b.id}.png`, 3000); }
    catch (e) { notify("Couldn't create the download. Take a screenshot of your ticket instead.", 3600); }
  };

  const openDetail = (e, p) => {
    if (e.target.closest("button, a")) return;
    setModal({ type: "detail", id: p.id });
  };

  const openClub = (e, c) => {
    if (e.target.closest("button, a")) return;
    setModal({ type: "club", id: c.id });
  };

  const clubBtn = (c, extra = "shrink-0 px-4 py-2") => (
    <button onClick={() => openJoin(c)} className={`u-btn ${extra} rounded-xl text-sm font-semibold ${isJoined(c) ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100" : "bg-slate-900 text-white hover:bg-slate-800"}`}>
      {isJoined(c) ? "Registered ✓" : isSports(c) ? "Register · tryouts" : "Join club"}
    </button>
  );

  const partyBtn = (p, extra = "w-full") => {
    const mine = bookingFor(p.id);
    const wl = user ? waitlist[p.id] : undefined;
    let label, cls;
    if (mine) { label = "View ticket"; cls = "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"; }
    else if (p.spots - p.taken <= 0) {
      label = wl ? `On waitlist · #${wl}` : "Join Waitlist";
      cls = wl ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100" : "bg-slate-900 text-white hover:bg-slate-800";
    } else { label = p.price > 0 ? `Buy ticket · ${p.price} AED` : "Reserve free spot"; cls = "bg-indigo-600 text-white hover:bg-indigo-700"; }
    return <button onClick={() => onParty(p)} className={`u-btn ${extra} rounded-xl py-2.5 text-sm font-semibold ${cls}`}>{label}</button>;
  };

  const hostEvent = () => requireAuth("Sign in to host a student event", (email) => setModal({ type: "create", email }));

  const filteredClubs = clubs.filter((c) => filter === "All" || c.category === filter);
  const filteredParties = parties.filter((p) => (filter === "All" || p.category === filter) && (langFilter === "All" || p.lang === langFilter));
  const feedLangs = LANGUAGES.filter((l) => parties.some((p) => p.lang === l));
  const myClubs = clubs.filter(isJoined).length;
  const hot = parties
    .filter((p) => p.spots - p.taken > 0 && p.spots - p.taken <= 5 && !bookingFor(p.id))
    .sort((a, b) => a.spots - a.taken - (b.spots - b.taken))[0];
  const totalMembers = clubs.reduce((s, c) => s + memberCount(c), 0);

  const tabs = [["clubs", "Official Clubs", "Clubs"], ["parties", "Student Parties", "Events"], ["schedule", "My Schedule", "Schedule"], ["tickets", "My Tickets", "Tickets"]];

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${dark ? "u-dark" : ""}`}>
      <style>{CSS}</style>

      {/* Nav */}
      <header className={`u-keep sticky top-0 z-30 border-b ${dark ? "border-slate-700" : "border-slate-200/80 bg-white/80"}`} style={dark ? glassDark : { backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button onClick={goHome} aria-label="Unite home" className="u-keep flex items-center gap-2.5 rounded-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">U</div>
            <span className={`text-lg font-bold tracking-tight ${dark ? "text-white" : "text-gray-900"}`}>Unite</span>
            <span className={`hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline ${dark ? "text-indigo-200" : "bg-indigo-100/70 text-indigo-700"}`} style={dark ? glassChip : undefined}>for UOWD students</span>
          </button>
          <div className="flex items-center gap-2">
          <ThemeToggle dark={dark} onToggle={() => setDark((d) => !d)} />
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white" title={studentIdRef.current ? `${user} · ID ${studentIdRef.current}` : user}>{initials(user)}</div>
              <button onClick={() => { setUser(null); setTab("clubs"); notify("Signed out"); }}
                className={`u-keep rounded-lg px-2.5 py-1.5 text-sm ${dark ? "text-slate-300 hover:bg-white/10 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>Sign out</button>
            </div>
          ) : (
            <button onClick={() => setModal({ type: "auth", reason: "Sign in with your email to join clubs and get tickets." })}
              className={`u-keep u-btn rounded-lg px-3.5 py-1.5 text-sm font-semibold ${dark ? "bg-white text-gray-900 hover:bg-gray-100" : "bg-gray-900 text-white shadow-sm hover:bg-gray-800"}`}>Sign in</button>
          )}
          </div>
        </div>
      </header>

      {/* Hero: explicit light and dark palettes (u-keep opts out of the dark remap) */}
      <section className={`u-keep relative overflow-hidden ${dark ? "bg-slate-900" : "border-b border-slate-200/70 bg-gradient-to-b from-white to-slate-50"}`}>
        <div className={`absolute -left-24 -top-24 h-72 w-72 rounded-full ${dark ? "bg-indigo-600" : "bg-indigo-300"}`} style={{ filter: "blur(90px)", opacity: dark ? 0.45 : 0.35 }} />
        <div className={`absolute -bottom-24 right-0 h-72 w-72 rounded-full ${dark ? "bg-fuchsia-600" : "bg-fuchsia-300"}`} style={{ filter: "blur(100px)", opacity: dark ? 0.3 : 0.25 }} />
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-10 sm:pt-14">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${dark ? "text-indigo-100" : "bg-white text-gray-600 shadow-sm ring-1 ring-gray-200"}`} style={dark ? glassChip : undefined}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> University of Wollongong in Dubai
          </span>
          <h1 className={`mt-4 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl ${dark ? "text-white" : "text-gray-900"}`}>
            Where UOWD comes <span className={`bg-gradient-to-r bg-clip-text text-transparent ${dark ? "from-indigo-300 to-fuchsia-300" : "from-indigo-600 to-fuchsia-600"}`}>together.</span>
          </h1>
          <p className={`mt-3 max-w-lg ${dark ? "text-slate-300" : "text-gray-600"}`}>Join official clubs, discover verified student events and host your own. One quick sign-in, tickets in seconds.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={hostEvent} className={`u-keep u-btn rounded-xl px-5 py-2.5 text-sm font-semibold ${dark ? "bg-white text-gray-900 hover:bg-gray-100" : "bg-gray-900 text-white shadow-sm hover:bg-gray-800"}`}>Host an event</button>
            <button onClick={() => jumpTo("clubs")} className={`u-keep u-btn rounded-xl px-5 py-2.5 text-sm font-semibold ${dark ? "text-white" : "bg-white text-gray-800 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"}`} style={dark ? glassChip : undefined}>Explore clubs</button>
          </div>
          <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
            {[[clubs.length, "Teams & clubs", "clubs"], [parties.length, "Upcoming events", "parties"], [totalMembers + "+", "Members", "clubs"]].map(([n, l, t]) => (
              <button key={l} onClick={() => jumpTo(t)}
                className={`u-keep u-btn rounded-2xl p-3 text-left ${dark ? "hover:border-white" : "bg-white/80 shadow-sm ring-1 ring-gray-200/80 hover:ring-indigo-200"}`} style={dark ? glassChip : undefined}>
                <p className={`text-xl font-bold tabular-nums ${dark ? "text-white" : "text-gray-900"}`}>{n}</p>
                <p className={`text-xs ${dark ? "text-slate-300" : "text-gray-500"}`}>{l}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="relative mx-auto -mt-7 max-w-5xl px-4 pb-28">
        <div id="tabs" className="relative mb-5 grid grid-cols-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm p-1.5 shadow-sm" role="tablist">
          <div className="absolute rounded-xl bg-slate-900 shadow" style={{ top: 6, bottom: 6, left: 6, width: `calc((100% - 12px) / ${tabs.length})`, transform: `translateX(${tabs.findIndex((t) => t[0] === tab) * 100}%)`, transition: "transform .3s cubic-bezier(.2,.8,.2,1)" }} />
          {tabs.map(([k, l, short]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => changeTab(k)}
              className={`relative z-10 whitespace-nowrap rounded-xl px-1 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${tab === k ? "text-white" : "text-slate-500 hover:text-slate-800"}`}>
              <span className="sm:hidden">{short}</span><span className="hidden sm:inline">{l}</span>
              {k === "tickets" && user && bookings.length > 0 && <span className="ml-1 rounded-full bg-indigo-500 px-1.5 py-0.5 text-xs text-white">{bookings.length}</span>}
              {k === "schedule" && sessions.length > 0 && <span className="ml-1 hidden rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs text-white sm:inline">{sessions.length}</span>}
            </button>
          ))}
        </div>

        <div key={tab} className="u-tab">
        {(tab === "clubs" || tab === "parties") && (
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(tab === "clubs" ? CLUB_FILTERS : PARTY_FILTERS).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${filter === f ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200/80 bg-white shadow-sm text-slate-600 hover:border-slate-300"}`}>{f}</button>
              ))}
            </div>
            {tab === "parties" && (
              <button onClick={hostEvent} className="u-btn hidden shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 sm:block">+ Host event</button>
            )}
          </div>
        )}
        {tab === "parties" && (
          <div className="-mt-2 mb-5 flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by event language">
            <span className="inline-flex shrink-0 items-center gap-1 pr-1 text-xs font-semibold uppercase tracking-wider text-slate-400"><Icon name="globe" className="h-3.5 w-3.5" /> Language</span>
            {["All", ...feedLangs].map((l) => {
              const n = l === "All" ? parties.length : parties.filter((p) => p.lang === l).length;
              const on = langFilter === l;
              return (
                <button key={l} onClick={() => setLangFilter(l)} aria-pressed={on}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${on ? "bg-sky-600 text-white ring-sky-600" : "bg-white text-slate-600 shadow-sm ring-slate-200/80 hover:bg-slate-50"}`}>
                  {l === "All" ? "All languages" : l}<span className={on ? "text-sky-100" : "text-slate-400"}>{n}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Clubs */}
        {tab === "clubs" && (
          <>
            {user && <p className="mb-4 text-sm text-slate-500">{myClubs === 0 ? "You haven't joined any clubs yet." : `You're in ${myClubs} club${myClubs > 1 ? "s" : ""}.`}</p>}
            <div className="grid gap-4 md:grid-cols-2">
              {filteredClubs.map((c, i) => (
                <article key={c.id} tabIndex={0} onClick={(e) => openClub(e, c)} onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) setModal({ type: "club", id: c.id }); }}
                  className="u-card u-rise cursor-pointer rounded-2xl border border-slate-200/80 bg-white shadow-sm p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-start gap-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl ${GRADIENTS[c.category]}`}>{c.emoji}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{c.name}</h3>
                        <Badge kind="official" team={c.category === "Sports"} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 space-y-1.5 text-xs text-slate-500">
                      <div className="flex flex-wrap items-center gap-1.5"><VenueChip where={c.where} /><span className="inline-flex items-center gap-1"><Icon name="users" className="h-3.5 w-3.5" />{memberCount(c)} members</span></div>
                      <p className="flex items-center gap-1.5"><Icon name="calendar" className="h-3.5 w-3.5" />{c.slots.length} weekly session{c.slots.length > 1 ? "s" : ""} · {clubDays(c)}</p>
                    </div>
                    {clubBtn(c)}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {/* Parties */}
        {tab === "parties" && (
          <>
            {hot && (
              <div className="u-fade mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="u-ping flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl">🔥</span>
                  <div>
                    <p className="font-semibold text-amber-950">Only {hot.spots - hot.taken} {hot.price > 0 ? "ticket" : "spot"}{hot.spots - hot.taken > 1 ? "s" : ""} left for the {hot.title}!</p>
                    <p className="text-sm text-amber-800">Selling fast · {hot.taken} of {hot.spots} already booked</p>
                  </div>
                </div>
                <button onClick={() => onParty(hot)} className="u-btn shrink-0 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600">
                  {hot.price > 0 ? `Get a ticket · ${hot.price} AED` : "Reserve my spot"}
                </button>
              </div>
            )}

            {filteredParties.length === 0 && (
              <div className="u-fade rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon name="globe" className="h-6 w-6" /></span>
                <p className="mt-3 font-semibold text-slate-900">No {langFilter !== "All" ? langFilter + " " : ""}{filter !== "All" ? filter.toLowerCase() + " " : ""}events yet</p>
                <p className="mt-1 text-sm text-slate-500">Try another filter, or host one yourself.</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button onClick={() => { setFilter("All"); setLangFilter("All"); }} className="u-btn rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Clear filters</button>
                  <button onClick={hostEvent} className="u-btn rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Host an event</button>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {filteredParties.map((p, i) => {
                const left = p.spots - p.taken;
                return (
                  <article key={p.id} id={"event-" + p.id} tabIndex={0} onClick={(e) => openDetail(e, p)} onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) setModal({ type: "detail", id: p.id }); }}
                    className="u-card u-rise cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className={`flex items-center justify-between gap-2 bg-gradient-to-r px-4 py-4 ${GRADIENTS[p.category]}`}>
                      <span className="text-3xl">{p.emoji}</span>
                      <div className="flex items-center gap-2">
                        <ShareBtn onClick={() => shareEvent(p)} />
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white" style={{ background: "rgba(255,255,255,0.22)" }}>{p.category}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-900">{p.price > 0 ? `${p.price} AED` : "Free"}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{p.title}</h3>
                        <Badge kind="verified" />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">Hosted by {p.host}</p>
                      <div className="mt-2.5"><Vibe v={p.vibe} /></div>
                      <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                        <p className="flex items-center gap-1.5"><Icon name="calendar" className="h-4 w-4 text-slate-400" />{fmtDate(p.date)} · {p.time}</p>
                        <p className="flex flex-wrap items-center gap-2"><VenueChip where={p.where} /><LangBadge lang={p.lang} /></p>
                      </div>
                      <div className="mt-4"><Spots left={left} total={p.spots} unit={p.price > 0 ? "tickets" : "spots"} wait={p.wait} /></div>
                      <div className="mt-4 flex gap-2">{partyBtn(p, "flex-1")}<button onClick={() => setModal({ type: "detail", id: p.id })} className="u-btn rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Details</button></div>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-center sm:flex-row sm:text-left">
              <div>
                <p className="font-semibold text-indigo-950">Got an idea for an event?</p>
                <p className="text-sm text-indigo-800">Submit it for review and sell tickets securely with Ziina.</p>
              </div>
              <button onClick={hostEvent} className="u-btn shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Host an event</button>
            </div>
          </>
        )}

        {/* My schedule */}
        {tab === "schedule" &&
          (!user ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white px-6 py-14 text-center shadow-sm">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200/70"><Icon name="calendar" className="h-7 w-7" /></span>
              <h3 className="mt-4 text-lg font-bold">Your campus week, in one place</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Sign in, pick club sessions and book events. They show up here as a weekly calendar you can export.</p>
              <button onClick={() => setModal({ type: "auth", reason: "Sign in to see your schedule." })} className="u-btn mt-5 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Sign in with your email</button>
            </div>
          ) : (
            <MySchedule
              sessions={sessions}
              events={bookings}
              onOpenClub={(c) => setModal({ type: "club", id: c.id })}
              onOpenTicket={(b) => setModal({ type: "ticket", booking: b })}
              onBrowse={changeTab}
              onExport={() => { downloadCalendar(sessions, bookings); notify("Calendar file saved. Open it to add your schedule to Google, Apple or Outlook Calendar.", 3600); }}
            />
          ))}

        {/* My tickets */}
        {tab === "tickets" &&
          (!user ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200/70"><Icon name="lock" className="h-7 w-7" /></div>
              <h3 className="mt-4 text-lg font-bold">Sign in to see your tickets</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">Your tickets, bookings and event applications live here once you sign in with your email.</p>
              <button onClick={() => setModal({ type: "auth", reason: "Sign in to view your tickets." })} className="u-btn mt-5 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Sign in with your email</button>
            </div>
          ) : (
            <div className="space-y-8">
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Tickets</h3>
                {bookings.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                    <div className="text-4xl">🎟️</div>
                    <p className="mt-3 font-semibold">No tickets yet</p>
                    <p className="text-sm text-slate-500">Grab a spot at an upcoming student event.</p>
                    <button onClick={() => changeTab("parties")} className="u-btn mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Browse events</button>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {bookings.map((b) => (
                      <button key={b.id} onClick={() => setModal({ type: "ticket", booking: b })} className="u-card flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm p-4 text-left">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">{b.emoji}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{b.title}</p>
                          <p className="text-sm text-slate-500">{fmtDate(b.date)} · {b.time}</p>
                          <p className="font-mono text-xs text-slate-400">{b.id}</p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{b.paid ? "Paid" : "Free"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
              {Object.keys(waitlist).length > 0 && (
                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Waitlists</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(waitlist).map(([id, pos]) => {
                      const p = parties.find((x) => x.id === Number(id));
                      return p ? (
                        <button key={id} onClick={() => setModal({ type: "waitlist", party: p, pos, email: user })} className="u-card flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm p-4 text-left">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">{p.emoji}</div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{p.title}</p>
                            <p className="text-sm text-slate-500">{fmtDate(p.date)} · {p.time}</p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">#{pos} waitlist</span>
                        </button>
                      ) : null;
                    })}
                  </div>
                </section>
              )}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Event applications</h3>
                {submissions.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-5 text-sm text-slate-500">
                    Events you submit for review will appear here with their status.
                    <button onClick={hostEvent} className="ml-1 font-semibold text-indigo-600 hover:underline">Host an event</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((s) => (
                      <div key={s.ref} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white shadow-sm p-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{s.title}</p>
                          <p className="text-sm text-slate-500">{s.category} · {fmtDate(s.date)} · {fmtRange(s.start, s.end)} · <span className="font-mono">{s.ref}</span></p>
                          <p className="mt-1 flex flex-wrap items-center gap-1.5"><VenueChip where={s.venue} /><LangBadge lang={s.lang} />{s.dress && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200/70">Dress: {s.dress}</span>}</p>
                          {s.reqs && <p className="mt-1 truncate text-xs text-slate-500">Bring: {s.reqs}</p>}
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending review</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ))}

        </div>

        <footer className="mt-12 text-center text-xs text-slate-400">
          Unite · uniteuow.com · A student-built platform for UOWD · Payments via Ziina (demo mode)
        </footer>
      </main>

      {/* Modals */}
      {modal && modal.type === "auth" && <AuthModal reason={modal.reason} onClose={closeModal} onSignIn={signIn} />}
      {modal && modal.type === "create" && (
        <CreateModal email={modal.email} onClose={closeModal} onSubmitted={(s) => setSubmissions((x) => [s, ...x])} />
      )}
      {modal && modal.type === "checkout" && <Checkout party={modal.party} email={modal.email} onPaid={createBooking} onDownload={handleDownload} onClose={closeModal} />}
      {modal && modal.type === "detail" && parties.find((x) => x.id === modal.id) && (
        <EventDetail
          party={parties.find((x) => x.id === modal.id)}
          action={partyBtn(parties.find((x) => x.id === modal.id), "w-full")}
          onShare={shareEvent}
          onClose={closeModal}
        />
      )}
      {modal && modal.type === "club" && clubs.find((x) => x.id === modal.id) && (
        <ClubDetail
          club={clubs.find((x) => x.id === modal.id)}
          joined={isJoined(clubs.find((x) => x.id === modal.id))}
          action={isJoined(clubs.find((x) => x.id === modal.id)) ? (
            <div className="flex gap-2">
              <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200"><Check className="h-4 w-4" /> Registered · in My Schedule</span>
              <button onClick={() => leaveClub(clubs.find((x) => x.id === modal.id))} className="u-btn rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-rose-600">Leave</button>
            </div>
          ) : clubBtn(clubs.find((x) => x.id === modal.id), "w-full py-3")}
          onClose={closeModal}
        />
      )}
      {modal && modal.type === "tryout" && clubs.find((x) => x.id === modal.id) && (() => {
        const c = clubs.find((x) => x.id === modal.id);
        return (
          <TryoutModal
            club={c}
            onSent={() => { closeModal(); registerClub(c); }}
            onClose={closeModal}
          />
        );
      })()}
      {modal && modal.type === "ticket" && <Modal onClose={closeModal}><Ticket booking={modal.booking} justPaid={modal.justPaid} onClose={closeModal} onDownload={handleDownload} /></Modal>}
      {modal && modal.type === "waitlist" && (
        <WaitlistModal party={modal.party} pos={modal.pos} email={modal.email} fresh={modal.fresh} onClose={closeModal} onLeave={() => leaveWaitlist(modal.party)} />
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
          <div key={toast} role="status" className="u-up flex max-w-sm items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-xl" style={glassDark}>
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500"><Check className="h-3 w-3" /></span>
            <span>{toast}</span>
          </div>
        </div>
      )}

      {tickerOn && <Ticker onClose={() => setTickerOn(false)} />}
    </div>
  );
}
