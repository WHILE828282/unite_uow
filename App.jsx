import { useState, useEffect, useRef } from "react";
import { GetAppBadges, InstallBanner, AppleLogo, AndroidLogo } from "./GetApp.jsx";
import { isStandalone, platform, installPath } from "./install.js";
import { applyUpdate } from "./updates.js";

/* global __APP_VERSION__ */
// Injected at build time (vite.config.js): short commit + build date, shown in the footer.
const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : { commit: "dev", built: "" };
const versionLabel = () => {
  const d = APP_VERSION.built ? new Date(APP_VERSION.built) : null;
  const when = d ? d.toLocaleString("en-GB", { timeZone: "Asia/Dubai", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
  return `Version ${APP_VERSION.commit}${when ? ` · ${when}` : ""}`;
};

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
  { id: 1, backgroundImage: "/teams/football-card.webp", form: ["Football"], name: "Football Team", emoji: "⚽", category: "Sports", desc: "UOWD's football squad: weekly training, friendlies and inter-university fixtures across Dubai.", members: 64, slots: [{ id: "fb-mon", day: 0, start: "17:00", end: "19:00", title: "Team training", level: "Squad & trialists", where: "Outdoor Pitch" }, { id: "fb-wed", day: 2, start: "17:00", end: "19:00", title: "Match practice", level: "Squad & trialists", where: "Outdoor Pitch" }], where: "Outdoor Pitch", lead: { name: "UOWD Sports & Recreation", role: "Football coordinator", email: "football@uniteuow.com" }, note: "Boots or turf shoes and shin pads. New players register through the tryouts form." },
  { id: 2, backgroundImage: "/teams/basketball-card.webp", form: ["Basketball"], name: "Basketball Team", emoji: "🏀", category: "Sports", desc: "Men's and women's squads training for the inter-university basketball league.", members: 48, slots: [{ id: "bb-tue", day: 1, start: "16:30", end: "18:30", title: "Team training", level: "Squad & trialists", where: "Sports Hall" }, { id: "bb-thu", day: 3, start: "16:30", end: "18:30", title: "Scrimmage & drills", level: "Squad & trialists", where: "Sports Hall" }], where: "Sports Hall", lead: { name: "UOWD Sports & Recreation", role: "Basketball coordinator", email: "basketball@uniteuow.com" }, note: "Court shoes required; balls and bibs provided." },
  { id: 3, backgroundImage: "/teams/volleyball-card.webp", form: ["Volleyball"], name: "Volleyball Team", emoji: "🏐", category: "Sports", desc: "Indoor volleyball for every level, with a competitive squad for university tournaments.", members: 36, slots: [{ id: "vb-mon", day: 0, start: "18:00", end: "20:00", title: "Team training", level: "Squad & trialists", where: "Sports Hall" }, { id: "vb-thu", day: 3, start: "18:00", end: "20:00", title: "Match practice", level: "Squad & trialists", where: "Sports Hall" }], where: "Sports Hall", lead: { name: "UOWD Sports & Recreation", role: "Volleyball coordinator", email: "volleyball@uniteuow.com" }, note: "Knee pads recommended. Mixed sessions." },
  { id: 4, backgroundImage: "/teams/cricket-card.webp", form: ["Cricket"], name: "Cricket Team", emoji: "🏏", category: "Sports", desc: "Nets, fielding drills and T20 fixtures against other Dubai universities.", members: 42, slots: [{ id: "cr-fri", day: 4, start: "16:00", end: "19:00", title: "Nets & match practice", level: "Squad & trialists", where: "Cricket Nets" }], where: "Cricket Nets", lead: { name: "UOWD Sports & Recreation", role: "Cricket coordinator", email: "cricket@uniteuow.com" }, note: "Whites not required for training. Helmets and pads available to borrow." },
  { id: 5, backgroundImage: "/teams/table-tennis-card.webp", form: ["Table Tennis", "Badminton"], name: "Table Tennis & Badminton", emoji: "🏓", category: "Sports", desc: "Racket sports for beginners and competitive players, with a weekly ladder.", members: 40, slots: [{ id: "tt-tue", day: 1, start: "15:00", end: "17:00", title: "Table tennis & badminton", level: "All levels", where: "Multi-purpose Hall" }, { id: "tt-sat", day: 5, start: "11:00", end: "13:00", title: "Open play & ladder", level: "All levels", where: "Multi-purpose Hall" }], where: "Multi-purpose Hall", lead: { name: "UOWD Sports & Recreation", role: "Racket sports coordinator", email: "rackets@uniteuow.com" }, note: "Bring your own racket if you have one; spares available." },
  { id: 6, backgroundImage: "/teams/padel-tennis-card.webp", form: ["Padel", "Tennis"], name: "Padel & Tennis", emoji: "🎾", category: "Sports", desc: "Coached padel and tennis sessions, plus friendly doubles.", members: 28, slots: [{ id: "pt-wed", day: 2, start: "16:00", end: "18:00", title: "Coached session", level: "All levels", where: "Padel & Tennis Courts" }], where: "Padel & Tennis Courts", lead: { name: "UOWD Sports & Recreation", role: "Padel & tennis coordinator", email: "padel@uniteuow.com" }, note: "Rackets and balls provided. Non-marking court shoes please." },
  { id: 7, backgroundImage: "/teams/chess-card.webp", form: ["Chess"], name: "Chess Team", emoji: "♟️", category: "Sports", desc: "Rated training games, opening prep and inter-university chess tournaments.", members: 30, slots: [{ id: "ch-wed", day: 2, start: "14:00", end: "16:00", title: "Training & rated games", level: "All levels", where: "Student Lounge" }], where: "Student Lounge", lead: { name: "UOWD Sports & Recreation", role: "Chess coordinator", email: "chess@uniteuow.com" }, note: "Boards and clocks provided. All ratings welcome." },
  { id: 11, backgroundImage: "/teams/track-swimming-card.webp", form: ["Track", "Swimming"], name: "Track & Swimming", emoji: "🏃", category: "Sports", desc: "Sprint, distance and pool sessions for athletics and swimming meets between Dubai universities.", members: 34, slots: [{ id: "ts-fri", day: 4, start: "15:00", end: "17:00", title: "Track & pool training", level: "Squad & trialists", where: "Running Track & Pool" }], where: "Running Track & Pool", lead: { name: "UOWD Sports & Recreation", role: "Track & swimming coordinator", email: "athletics@uniteuow.com" }, note: "Bring running shoes, swimwear and a towel. Times are recorded at the first session." },
  { id: 8, backgroundImage: "/teams/tech-esports-card.webp", name: "Tech & E-sports Club", emoji: "🎮", category: "Tech", desc: "Build projects, run hackathons and compete in campus e-sports leagues.", members: 72, slots: [{ id: "te-tue", day: 1, start: "16:00", end: "18:00", title: "Build night & e-sports scrims", level: "All levels", where: "Computer Lab" }], where: "Computer Lab", lead: { name: "Tech & E-sports committee", role: "Club committee", email: "tech@uniteuow.com" }, note: "Bring a laptop for build nights; consoles and PCs provided for scrims." },
  { id: 9, backgroundImage: "/teams/finance-entrepreneurship-card.webp", name: "Finance & Entrepreneurship Society", emoji: "💼", category: "Business", desc: "Market simulations, pitch practice and networking with founders and finance professionals.", members: 85, slots: [{ id: "fe-thu", day: 3, start: "15:00", end: "17:00", title: "Workshop & pitch session", level: "All levels", where: "Innovation Studio" }], where: "Innovation Studio", lead: { name: "Finance & Entrepreneurship committee", role: "Society committee", email: "finance@uniteuow.com" }, note: "Smart casual for networking events." },
  { id: 10, backgroundImage: "/teams/music-dance-card.webp", name: "Music & Dance Club", emoji: "🎵", category: "Arts", desc: "Jam sessions, choreography and performances at campus events.", members: 58, slots: [{ id: "md-mon", day: 0, start: "16:00", end: "18:00", title: "Rehearsal & jam", level: "All levels", where: "Multi-purpose Room" }], where: "Multi-purpose Room", lead: { name: "Music & Dance committee", role: "Club committee", email: "music@uniteuow.com" }, note: "Comfortable clothes for dance; instruments welcome." },
];

/* Shareable links: /sports/<slug> for teams, /clubs/<slug> for clubs (either prefix works). */
const CLUB_SLUGS = { 1: "football", 2: "basketball", 3: "volleyball", 4: "cricket", 5: "table-tennis", 6: "padel-tennis", 7: "chess", 11: "track-swimming", 8: "tech-esports", 9: "finance-entrepreneurship", 10: "music-dance" };
const clubPath = (c) => `/${c.category === "Sports" ? "sports" : "clubs"}/${CLUB_SLUGS[c.id]}`;
const clubFromPath = (path) => {
  const m = /^\/(?:sports|clubs)\/([a-z-]+)\/?$/.exec(path || "");
  const id = m && Object.keys(CLUB_SLUGS).find((k) => CLUB_SLUGS[k] === m[1]);
  return id ? Number(id) : null;
};
/* Team detail headers: the team's action photo (public/teams/<slug>.webp, served from this site) over
   hand-drawn field markings (inline SVG) on a themed gradient. The drawn artwork stays underneath
   as the fallback if a photo can't load. */
const svgLines = (body, opacity = 0.24) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 320' preserveAspectRatio='xMidYMid slice'><g fill='none' stroke='#fff' stroke-opacity='${opacity}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'>${body}</g></svg>`)}")`;
const STRIPES = (w, a = 0.05) => `repeating-linear-gradient(90deg, rgba(255,255,255,${a}) 0 ${w}px, transparent ${w}px ${w * 2}px)`;
const GRID = (size, a = 0.06) => `linear-gradient(rgba(255,255,255,${a}) 1px, transparent 1px) 0 0/${size}px ${size}px, linear-gradient(90deg, rgba(255,255,255,${a}) 1px, transparent 1px) 0 0/${size}px ${size}px`;
const HERO_PHOTOS = {
  // Football: striped pitch, halfway line, centre circle, both penalty areas
  1: { photo: "/teams/football.webp", lines: svgLines("<rect x='40' y='30' width='720' height='260' rx='4'/><line x1='400' y1='30' x2='400' y2='290'/><circle cx='400' cy='160' r='55'/><circle cx='400' cy='160' r='3' fill='#fff'/><rect x='40' y='85' width='115' height='150'/><rect x='40' y='125' width='42' height='70'/><path d='M155 125 A58 58 0 0 1 155 195'/><rect x='645' y='85' width='115' height='150'/><rect x='718' y='125' width='42' height='70'/><path d='M645 125 A58 58 0 0 0 645 195'/>"),
    texture: STRIPES(80, 0.045), bg: "linear-gradient(135deg, #15803d 0%, #14532d 50%, #052e16 100%)" },
  // Basketball: hardwood boards, centre circle, keys and three-point arcs
  2: { photo: "/teams/basketball.webp", lines: svgLines("<rect x='40' y='30' width='720' height='260' rx='4'/><line x1='400' y1='30' x2='400' y2='290'/><circle cx='400' cy='160' r='50'/><circle cx='400' cy='160' r='16'/><rect x='40' y='112' width='150' height='96'/><circle cx='190' cy='160' r='48'/><path d='M40 48 H110 A150 150 0 0 1 110 272 H40'/><rect x='610' y='112' width='150' height='96'/><circle cx='610' cy='160' r='48'/><path d='M760 48 H690 A150 150 0 0 0 690 272 H760'/>"),
    texture: "repeating-linear-gradient(90deg, rgba(0,0,0,.10) 0 2px, transparent 2px 44px), repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 22px)", bg: "linear-gradient(135deg, #c2410c 0%, #9a3412 45%, #431407 100%)" },
  // Volleyball: indoor court, net with mesh, attack lines
  3: { photo: "/teams/volleyball.webp", lines: svgLines("<rect x='90' y='40' width='620' height='240' rx='4'/><line x1='296' y1='40' x2='296' y2='280' stroke-dasharray='10 10'/><line x1='504' y1='40' x2='504' y2='280' stroke-dasharray='10 10'/><line x1='400' y1='18' x2='400' y2='302' stroke-width='7'/><path d='M392 30 V290 M408 30 V290' stroke-width='1.5'/><path d='M392 50 H408 M392 80 H408 M392 110 H408 M392 140 H408 M392 170 H408 M392 200 H408 M392 230 H408 M392 260 H408' stroke-width='1.5'/>"),
    texture: "radial-gradient(ellipse at 50% 120%, rgba(251,146,60,.35), transparent 60%)", bg: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 50%, #0b1d4f 100%)" },
  // Cricket: oval boundary, 30-yard circle, pitch strip with creases and stumps
  4: { photo: "/teams/cricket.webp", lines: svgLines("<ellipse cx='400' cy='160' rx='372' ry='148'/><ellipse cx='400' cy='160' rx='210' ry='100' stroke-dasharray='6 12'/><rect x='320' y='142' width='160' height='36' fill='#f5e6b8' fill-opacity='.22'/><line x1='340' y1='132' x2='340' y2='188'/><line x1='460' y1='132' x2='460' y2='188'/><path d='M328 152 V168 M332 152 V168 M472 152 V168 M468 152 V168' stroke-width='2'/>"),
    texture: "repeating-radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.035) 0 14px, transparent 14px 28px)", bg: "radial-gradient(ellipse at 50% 50%, #3f8f3a 0%, #166534 45%, #052e16 100%)" },
  // Table tennis: table edges, centre line, net
  5: { photo: "/teams/table-tennis.webp", lines: svgLines("<rect x='120' y='50' width='560' height='220' rx='3' stroke-width='5'/><line x1='120' y1='160' x2='680' y2='160' stroke-width='2'/><line x1='400' y1='34' x2='400' y2='286' stroke-width='8'/><path d='M400 34 V286' stroke='#0b1d2a' stroke-opacity='.5' stroke-width='2' stroke-dasharray='4 6'/><circle cx='560' cy='110' r='8' fill='#fff' fill-opacity='.5'/>"),
    texture: "radial-gradient(ellipse at 30% 0%, rgba(255,255,255,.12), transparent 55%)", bg: "linear-gradient(135deg, #0e7490 0%, #155e75 45%, #083344 100%)" },
  // Padel & tennis: doubles court, service boxes, net
  6: { photo: "/teams/padel-tennis.webp", lines: svgLines("<rect x='60' y='40' width='680' height='240' rx='3'/><line x1='60' y1='70' x2='740' y2='70'/><line x1='60' y1='250' x2='740' y2='250'/><line x1='235' y1='70' x2='235' y2='250'/><line x1='565' y1='70' x2='565' y2='250'/><line x1='235' y1='160' x2='565' y2='160'/><line x1='400' y1='24' x2='400' y2='296' stroke-width='6' stroke-dasharray='2 6'/>"),
    texture: "radial-gradient(ellipse at 80% -10%, rgba(253,224,71,.28), transparent 50%)", bg: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 40%, #172554 100%)" },
  // Chess: board squares and rank/file grid
  7: { photo: "/teams/chess.webp", lines: svgLines("<rect x='240' y='-80' width='480' height='480' transform='rotate(12 480 160)'/><path d='M300 -80 V400 M360 -80 V400 M420 -80 V400 M480 -80 V400 M540 -80 V400 M600 -80 V400 M660 -80 V400' transform='rotate(12 480 160)' stroke-width='1.5'/>", 0.14),
    texture: "repeating-conic-gradient(rgba(255,255,255,.07) 0 25%, transparent 0 50%) 0 0/56px 56px", bg: "linear-gradient(135deg, #334155 0%, #1e293b 45%, #020617 100%)" },
  // Track & swimming: running lanes around the bend
  11: { photo: "/teams/track-swimming.webp", lines: svgLines("<rect x='60' y='40' width='680' height='240' rx='120'/><rect x='92' y='68' width='616' height='184' rx='92'/><rect x='124' y='96' width='552' height='128' rx='64'/><rect x='156' y='124' width='488' height='72' rx='36'/><line x1='400' y1='40' x2='400' y2='124' stroke-width='5'/>"),
    texture: STRIPES(6, 0.03), bg: "linear-gradient(135deg, #dc2626 0%, #991b1b 45%, #2a0a0a 100%)" },
  // Tech & e-sports: circuit traces on a grid
  8: { photo: "/teams/tech-esports.webp", lines: svgLines("<path d='M40 260 H200 L240 220 H380 L420 180 H560 L600 140 H760'/><path d='M80 60 H220 L260 100 H420 L460 60 H700'/><path d='M300 300 V240 M520 300 V200 M640 20 V120'/><circle cx='200' cy='260' r='6'/><circle cx='420' cy='180' r='6'/><circle cx='600' cy='140' r='6'/><circle cx='260' cy='100' r='6'/><circle cx='460' cy='60' r='6'/>", 0.3),
    texture: GRID(32), bg: "linear-gradient(135deg, #0284c7 0%, #1e3a8a 50%, #020617 100%)" },
  // Finance & entrepreneurship: candlesticks and a rising trend
  9: { photo: "/teams/finance-entrepreneurship.webp", lines: svgLines("<path d='M40 270 L150 230 L240 245 L340 180 L430 195 L530 120 L620 135 L760 50'/><path d='M120 200 V250 M220 210 V270 M320 150 V215 M420 165 V230 M520 90 V160 M620 100 V170 M710 50 V110' stroke-width='2'/><rect x='112' y='212' width='16' height='26'/><rect x='212' y='222' width='16' height='34'/><rect x='312' y='160' width='16' height='40'/><rect x='412' y='178' width='16' height='34'/><rect x='512' y='100' width='16' height='44'/><rect x='612' y='112' width='16' height='40'/><rect x='702' y='60' width='16' height='36'/>", 0.26),
    texture: GRID(40, 0.05), bg: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 50%, #1e1033 100%)" },
  // Music & dance: staff lines and a sound wave
  10: { photo: "/teams/music-dance.webp", lines: svgLines("<path d='M0 90 H800 M0 110 H800 M0 130 H800 M0 150 H800 M0 170 H800' stroke-width='1.5'/><path d='M0 240 C60 180 120 300 180 240 S300 180 360 240 S480 300 540 240 S660 180 720 240 S780 300 800 260'/><path d='M200 170 V105 L240 95 V160' stroke-width='3'/><ellipse cx='191' cy='172' rx='12' ry='8' fill='#fff' fill-opacity='.3'/><ellipse cx='231' cy='162' rx='12' ry='8' fill='#fff' fill-opacity='.3'/>", 0.26),
    texture: "radial-gradient(ellipse at 20% 0%, rgba(251,191,36,.25), transparent 55%)", bg: "linear-gradient(135deg, #e11d48 0%, #9f1239 50%, #3f0a1c 100%)" },
};
const heroBackground = (art) => `${art.lines} center/cover no-repeat, ${art.texture}, ${art.bg}`;

const UOWD_ADDRESS = "University of Wollongong in Dubai, Dubai Knowledge Park, Dubai, UAE";
const UOWD_MAPS = "University of Wollongong in Dubai";
/* Google Maps link that always opens in English (hl=en) with UAE results (gl=ae); otherwise Google
   localises the place name to the visitor's browser language. */
const mapsLink = (query) => `https://maps.google.com/maps?${new URLSearchParams({ q: query, hl: "en", gl: "ae" })}`;

const PARTIES = [
  { id: 1, lang: "English", title: "Rooftop Sunset Mixer", emoji: "🌇", category: "Social", date: "2026-10-09", time: "7:00 PM", where: "Rooftop Terrace, Block 5", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 40, spots: 60, taken: 52, wait: 0, vibe: { score: 4.9, count: 42 }, host: "Layla Al Mansoori",
    contact: { name: "Layla Al Mansoori", role: "Event lead", email: "sunset@uniteuow.com", whatsapp: "+971 50 000 1001", telegram: "unite_sunset" },
    desc: "A golden-hour mixer on the Block 5 rooftop with a live DJ, a mocktail bar and skyline views. The easiest way to meet students from every faculty after a busy week.",
    perks: ["Live DJ", "Mocktail bar", "Skyline views"] },
  { id: 2, lang: "English", title: "UOWD Futsal Tournament", emoji: "⚽", category: "Sports", date: "2026-10-15", time: "7:30 PM", where: "UOWD Sports Hall", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 25, spots: 40, taken: 35, wait: 0, vibe: { score: 4.7, count: 58 }, host: "Omar Khalid",
    contact: { name: "Omar Khalid", role: "Tournament organizer", email: "futsal@uniteuow.com", whatsapp: "+971 50 000 1002", telegram: "unite_futsal" },
    desc: "Five-a-side knockout across eight teams, with referees, a trophy and pizza after the final. Register as a player and we balance the squads on the night, so you don't need a full team.",
    perks: ["Referees", "Trophy", "Pizza after"] },
  { id: 3, lang: "Arabic", title: "PS5 Tournament", emoji: "🎮", category: "Gaming", date: "2026-10-12", time: "6:00 PM", where: "Student Lounge, Block 5", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 15, spots: 32, taken: 20, wait: 0, vibe: { score: 4.8, count: 37 }, host: "Karim Haddad",
    contact: { name: "Karim Haddad", role: "Gaming lead", email: "ps5@uniteuow.com", whatsapp: "+971 50 000 1003", telegram: "unite_ps5" },
    desc: "1v1 football and fighting-game brackets on big screens in the Student Lounge. Controllers are provided, the final is shoutcasted live, and the winner takes home the prize pot.",
    perks: ["Big screens", "Live shoutcast", "Prize pot"] },
  { id: 4, lang: "Hindi", title: "Open Mic & Chai", emoji: "☕", category: "Music", date: "2026-10-17", time: "8:00 PM", where: "Courtyard Café", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 0, spots: 50, taken: 22, wait: 0, vibe: null, host: "Yusuf Ibrahim",
    contact: { name: "Yusuf Ibrahim", role: "Host", email: "openmic@uniteuow.com", whatsapp: "+971 50 000 1004", telegram: "unite_openmic" },
    desc: "Sing, play, recite or just listen. Sign up for a five-minute slot on the night or come for the karak and the atmosphere. All talent levels welcome.",
    perks: ["5-min slots", "Free karak", "Acoustic setup"] },
  { id: 5, lang: "English", title: "Finance Society Networking Night", emoji: "💼", category: "Career", date: "2026-10-22", time: "6:00 PM", where: "Auditorium Foyer, Block 3", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 0, spots: 100, taken: 64, wait: 0, vibe: { score: 4.6, count: 73 }, host: "Finance & Entrepreneurship Society",
    contact: { name: "Finance & Entrepreneurship Society", role: "Organizers", email: "finance@uniteuow.com", whatsapp: "+971 50 000 1005", telegram: "unite_finance" },
    desc: "Meet finance professionals, alumni and recruiters over canapés. A short panel on breaking into banking and fintech in the UAE is followed by open networking. Smart casual.",
    perks: ["Industry panel", "Alumni mentors", "Canapés"] },
  { id: 6, lang: "English", title: "Halloween Costume Party", emoji: "🎃", category: "Social", date: "2026-10-30", time: "8:30 PM", where: "Grand Ballroom, Dubai Knowledge Park", address: "Dubai Knowledge Park, Dubai, UAE", maps: "Dubai Knowledge Park", price: 75, spots: 120, taken: 120, wait: 4, vibe: { score: 4.9, count: 156 }, host: "Student Council",
    contact: { name: "Student Council", role: "Organizers", email: "council@uniteuow.com", whatsapp: "+971 50 000 1006", telegram: "unite_council" },
    desc: "The biggest night of the semester: costume contest, two dance floors and a haunted photo booth. It sold out fast, so join the waitlist in case a spot opens up.",
    perks: ["Costume contest", "2 dance floors", "Photo booth"] },
  { id: 7, lang: "English", title: "Post-Midterm Yacht Party", emoji: "🛥️", category: "Social", date: "2026-10-24", time: "5:00 PM", where: "Dubai Marina, Pier 7", address: "Dubai Marina, Dubai, UAE", maps: "Dubai Marina", price: 120, spots: 80, taken: 76, wait: 0, vibe: { score: 4.8, count: 31 }, host: "Class of 2027 Committee",
    contact: { name: "Class of 2027 Committee", role: "Organizers", email: "yacht@uniteuow.com", whatsapp: "+971 50 000 1007", telegram: "unite_yacht" },
    desc: "Three hours cruising the Marina skyline with a DJ, a buffet and a sunset deck. The boat leaves on time: arrive 20 minutes early with your ticket QR.",
    perks: ["Buffet", "DJ", "Sunset deck"] },
  { id: 8, lang: "Russian", title: "Russian Movie Night", emoji: "🎬", category: "Social", date: "2026-10-14", time: "7:00 PM", where: "Lecture Theatre 2, Block 2", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 0, spots: 40, taken: 18, wait: 0, vibe: { score: 4.8, count: 21 }, host: "Anastasia Volkova",
    contact: { name: "Anastasia Volkova", role: "Host", email: "kino@uniteuow.com", whatsapp: "+971 50 000 1008", telegram: "unite_kino" },
    desc: "A cosy screening of a Soviet comedy classic with English subtitles, followed by tea, pryaniki and a relaxed chat. Native speakers and learners are equally welcome.",
    perks: ["English subtitles", "Tea & pryaniki", "Post-film chat"] },
  { id: 9, lang: "Arabic", title: "Arabic Coffee & Conversation", emoji: "🫖", category: "Social", date: "2026-10-13", time: "4:30 PM", where: "Majlis Lounge, Block 2", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 0, spots: 25, taken: 19, wait: 0, vibe: { score: 4.9, count: 33 }, host: "Mariam Al Suwaidi",
    contact: { name: "Mariam Al Suwaidi", role: "Host", email: "majlis@uniteuow.com", whatsapp: "+971 50 000 1009", telegram: "unite_majlis" },
    desc: "Gahwa, dates and easy conversation in a traditional majlis setting. Practise your Arabic with native speakers from across the Gulf and the Levant, at any level.",
    perks: ["Gahwa & dates", "All levels", "Native speakers"] },
  { id: 10, lang: "Japanese", title: "Anime & Matcha Night", emoji: "🍵", category: "Social", date: "2026-10-20", time: "7:00 PM", where: "Student Lounge, Block 5", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 20, spots: 30, taken: 12, wait: 0, vibe: null, host: "Yuki Tanaka",
    contact: { name: "Yuki Tanaka", role: "Host", email: "anime@uniteuow.com", whatsapp: "+971 50 000 1010", telegram: "unite_anime" },
    desc: "Back-to-back episodes on the big screen, freshly whisked matcha and mochi, and a short Japanese phrase corner between episodes. Your ticket covers drinks and snacks.",
    perks: ["Big screen", "Matcha & mochi", "Phrase corner"] },
  { id: 11, lang: "French", title: "Café Français Language Exchange", emoji: "🥐", category: "Social", date: "2026-10-19", time: "5:00 PM", where: "Courtyard Café", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 0, spots: 30, taken: 9, wait: 0, vibe: { score: 4.6, count: 14 }, host: "Camille Laurent",
    contact: { name: "Camille Laurent", role: "Host", email: "francais@uniteuow.com", whatsapp: "+971 50 000 1011", telegram: "unite_francais" },
    desc: "Half the hour in French, half in English. Rotate tables every 15 minutes and leave with a few new friends and much better pronunciation. Croissants on us.",
    perks: ["Table rotations", "All levels", "Croissants"] },
  { id: 12, lang: "Chinese", title: "Chinese Calligraphy Workshop", emoji: "🖌️", category: "Social", date: "2026-10-21", time: "6:00 PM", where: "Room 1.04, Block 1", address: UOWD_ADDRESS, maps: UOWD_MAPS, price: 10, spots: 20, taken: 11, wait: 0, vibe: { score: 4.9, count: 18 }, host: "Li Wei",
    contact: { name: "Li Wei", role: "Workshop lead", email: "calligraphy@uniteuow.com", whatsapp: "+971 50 000 1012", telegram: "unite_calligraphy" },
    desc: "Learn brush basics and write your name in Chinese characters. Brushes, ink and rice paper are provided, and you take your finished piece home.",
    perks: ["Materials included", "Take-home piece", "Beginners welcome"] },
];

const CLUB_FILTERS = ["All", "Sports", "Tech", "Business", "Arts"];
const PARTY_FILTERS = ["All", "Social", "Music", "Sports", "Gaming", "Career"];
const EVENT_TYPES = ["Party", "Social", "Academic Study", "Networking", "Sports", "Gaming", "Music", "Arts & Culture"];
const DRESS_CODES = ["Casual", "Smart casual", "Business formal", "Sportswear", "Costume / themed", "Traditional wear"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LANGUAGES = ["English", "Arabic", "Russian", "Chinese", "Japanese", "French", "Hindi", "Urdu", "Spanish", "Persian", "Mixed / Multilingual"];

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

/* Installed iPhone app uses the black-translucent status bar (white text over the page): a navy strip the height of
   the status bar keeps it readable over the light header. Zero height everywhere else. */
const STATUS_BAR_STRIP = { backgroundImage: "linear-gradient(#0f172a 0 var(--sat), transparent var(--sat))" };

/* Unite brand mark (logo pack): app icon with ~22% rounded corners. Empty alt when the word "unite" sits next to it. */
// Small sizes use a crisp variant (same figures and colours, without the soft fade, glow and shadow that blur at
// ~36px) plus a hairline edge so the tile stays defined on the dark header. `full` keeps the original artwork.
const UniteIcon = ({ className = "h-9 w-9", alt = "", full = false }) => (
  <img src={full ? "/icons/unite-icon.svg" : "/icons/unite-icon-small.svg"} alt={alt} width="36" height="36" draggable="false"
    className={`${className} shrink-0 rounded-[22%] ${full ? "" : "ring-1 ring-white/15"}`} />
);
// Preloaded so the downloadable ticket can draw the icon synchronously.
const TICKET_ICON = typeof Image !== "undefined" ? Object.assign(new Image(), { src: "/icons/icon-192.png" }) : null;

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
  if (TICKET_ICON && TICKET_ICON.complete && TICKET_ICON.naturalWidth) {
    g.save(); rr(48, 46, 60, 60, 13); g.clip(); g.drawImage(TICKET_ICON, 48, 46, 60, 60); g.restore();
    g.fillStyle = "#fff"; font(800, 46); g.fillText("unite", 124, 92);
  } else { g.fillStyle = "#fff"; font(800, 46); g.fillText("unite", 48, 92); }
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

const glassDark = { background: "rgba(10,25,47,0.82)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" };
const overlayStyle = { background: "rgba(6,16,31,0.6)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" };
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
@media (hover:hover) and (pointer:fine){.u-card:hover{transform:translateY(-2px);box-shadow:0 1px 2px rgba(15,23,42,.04),0 12px 28px -12px rgba(15,23,42,.18);border-color:#cbd5e1}}
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
const VenueChip = ({ where, href }) =>
  href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" title={`Open ${shortVenue(where)} in Google Maps`}
      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200/70 hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-200">
      <Icon name="pin" className="h-3 w-3 text-slate-500" />{shortVenue(where)}<span aria-hidden="true" className="text-slate-400">↗</span>
    </a>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200/70">
      <Icon name="pin" className="h-3 w-3 text-slate-500" />{shortVenue(where)}
    </span>
  );

/* Organizer contact buttons: WhatsApp, Telegram, Email (whichever are provided). */
function ContactButtons({ contact: c, subject }) {
  const btn = "u-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold ring-1 ring-inset";
  return (
    <div className="flex flex-wrap gap-2">
      {c.whatsapp && (
        <a href={`https://wa.me/${waDigits(c.whatsapp)}?text=${encodeURIComponent(`Hi! I'm interested in ${subject} (via Unite).`)}`} target="_blank" rel="noopener noreferrer"
          className={`${btn} bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100`} aria-label={`WhatsApp ${c.whatsapp}`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.1.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.5-.3z" /></svg>
          WhatsApp
        </a>
      )}
      {c.telegram && (
        <a href={`https://t.me/${tgHandle(c.telegram)}`} target="_blank" rel="noopener noreferrer"
          className={`${btn} bg-sky-50 text-sky-700 ring-sky-200 hover:bg-sky-100`} aria-label={`Telegram @${tgHandle(c.telegram)}`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M21.9 4.3l-3.2 15.2c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9.2-8.3c.4-.4-.1-.6-.6-.2L6.1 13.2l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6L20.5 2.8c.9-.3 1.7.2 1.4 1.5z" /></svg>
          @{tgHandle(c.telegram)}
        </a>
      )}
      {c.email && (
        <a href={`mailto:${c.email}?subject=${encodeURIComponent(subject)}`}
          className={`${btn} bg-white text-slate-700 ring-slate-200 hover:bg-slate-50`}>
          <Icon name="mail" className="h-4 w-4" /> Email
        </a>
      )}
    </div>
  );
}

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
      <span className={`absolute inset-0 flex items-center justify-center ${dark ? "text-slate-200" : "text-crimson-600"}`} style={{ transition: "transform .35s cubic-bezier(.2,.8,.2,1), opacity .25s", transform: dark ? "none" : "rotate(-90deg) scale(.5)", opacity: dark ? 1 : 0 }}>
        <Icon name="sun" className="h-[18px] w-[18px]" />
      </span>
    </button>
  );
}

const Badge = ({ kind, team }) =>
  kind === "official" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-crimson-50 px-2 py-0.5 text-xs font-semibold text-crimson-700 ring-1 ring-crimson-200">
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
      className="u-fade u-vv fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      style={overlayStyle}
      onMouseDown={(e) => e.target === e.currentTarget && !locked && onClose()}
    >
      <div className={`u-up relative w-full ${size === "lg" ? "max-w-lg" : size === "sm" ? "max-w-sm" : "max-w-md"} u-safe-sheet u-sheet-h overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl`}>
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
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200/60">
          <div className="u-keep flex items-center justify-between bg-slate-900 px-5 py-3">
            <div className="flex items-center gap-2">
              <UniteIcon className="h-6 w-6" />
              <span className="text-sm font-extrabold tracking-tight text-white">unite</span>
              <span className="text-xs font-medium uppercase tracking-widest text-slate-400">· Admit one</span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white"><Check className="h-3 w-3" /> Confirmed</span>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-3">
              {b.logo ? <EventLogo p={b} className="h-12 w-12 ring-1 ring-slate-200/70" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl ring-1 ring-inset ring-slate-200/70">{b.emoji}</div>}
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

            <div className="mx-auto w-fit rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/60"><QRCode value={b.id} className="h-36 w-36" /></div>
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
  // "demo": the original walkthrough (any 4-digit code). "live": a real 6-digit code emailed via Resend (/api/otp).
  const [mode, setMode] = useState("demo");
  const [challenge, setChallenge] = useState("");
  const [otpError, setOtpError] = useState("");
  const [attempts, setAttempts] = useState(0);
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

  const blank = (n) => Array(n).fill("");
  const otpApi = async (body) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch("/api/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctrl.signal });
      const data = await r.json().catch(() => ({}));
      return r.ok && data.ok ? data : { ok: false, error: data.error || "We couldn't send the code. Try again, or use the demo account." };
    } catch (e) {
      return { ok: false, error: "Couldn't reach the server. Check your connection, or use the demo account." };
    } finally { clearTimeout(t); }
  };
  // Live: email a real 6-digit code through Resend.
  const sendLive = async (v) => {
    setSending(true);
    const r = await otpApi({ action: "send", email: v });
    setSending(false);
    if (!r.ok) return r.error;
    setChallenge(r.challenge); setMode("live"); setAttempts(0); setOtpError("");
    setDigits(blank(6)); setSeconds(45); setStep("otp");
    return "";
  };
  const sendCode = async (override) => {
    const v = (typeof override === "string" ? override : email).trim().toLowerCase();
    if (!validEmail(v)) return setError("Enter a valid email address, like name@gmail.com.");
    setEmail(v); setError("");
    if (typeof override !== "string") { const err = await sendLive(v); if (err) setError(err); return; }
    // Demo account: unchanged walkthrough, any 4-digit code works.
    setMode("demo"); setOtpError(""); setSending(true);
    later(() => { setSending(false); setDigits(["", "", "", ""]); setSeconds(45); setStep("otp"); }, 800);
  };

  const finish = (verified) => {
    setVerifying(false);
    setStep("success");
    later(() => onSignIn(email, studentId.trim(), verified), 1300);
  };
  const verify = async (code) => {
    setVerifying(true); setOtpError("");
    // Demo mode: any complete 4-digit code verifies.
    if (mode === "demo") return later(() => finish(false), 700);
    const r = await otpApi({ action: "verify", email, code, challenge });
    if (r.ok) return finish(true);
    const n = attempts + 1;
    setVerifying(false); setAttempts(n);
    setOtpError(n >= 5 ? "Too many tries. Tap Resend code for a new one." : r.error);
    setDigits(blank(6));
    if (n < 5 && refs.current[0]) setTimeout(() => refs.current[0] && refs.current[0].focus(), 0);
  };

  const N = digits.length;
  const locked = verifying || (mode === "live" && attempts >= 5);
  const setDigit = (i, raw) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = d;
    setDigits(next); setOtpError("");
    if (d && i < N - 1 && refs.current[i + 1]) refs.current[i + 1].focus();
    if (next.every(Boolean)) verify(next.join(""));
  };
  const onKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const next = [...digits]; next[i - 1] = ""; setDigits(next); refs.current[i - 1].focus();
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1].focus();
    if (e.key === "ArrowRight" && i < N - 1) refs.current[i + 1].focus();
  };
  const onPaste = (e) => {
    const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, N);
    if (!t || locked) return;
    e.preventDefault();
    const next = blank(N);
    t.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next); setOtpError("");
    refs.current[Math.min(t.length, N - 1)].focus();
    if (t.length === N) verify(t);
  };
  const resend = async () => {
    if (mode === "live") {
      setSeconds(45);
      const err = await sendLive(email);
      if (err) { setOtpError(err); setSeconds(0); return; }
    } else { setSeconds(45); setDigits(["", "", "", ""]); }
    setResent(true);
    later(() => setResent(false), 3000);
    if (refs.current[0]) refs.current[0].focus();
  };

  return (
    <Modal onClose={onClose}>
      <div key={step} className="u-slide p-6 pt-8">
        {step === "email" && (
          <>
            <div className="flex flex-col items-center">
              <UniteIcon className="h-24 w-24 shadow-lg" />
              <span className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">unite</span>
            </div>
            <h2 className="mt-3 text-center text-xl font-bold text-slate-900">Campus Login</h2>
            <p className="mt-1 text-center text-sm text-slate-500">{reason || "Sign in with your email to join clubs and get tickets."}</p>

            <label htmlFor="auth-email" className="mt-5 block text-sm font-medium text-slate-700">Email address</label>
            <input
              id="auth-email" type="email" inputMode="email" value={email} autoFocus autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck="false" enterKeyHint="go"
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              placeholder="you@example.com"
              className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 ${error ? "border-rose-400" : "border-slate-300 focus:border-indigo-500"}`}
            />
            {error ? <p className="mt-1.5 text-sm text-rose-600">{error}</p> : <p className="mt-1.5 text-xs text-slate-500">Any email works: university, Gmail, iCloud, Outlook…</p>}

            <label htmlFor="auth-sid" className="mt-4 block text-sm font-medium text-slate-700">Student ID <span className="font-normal text-slate-400">(Optional)</span></label>
            <input
              id="auth-sid" value={studentId} inputMode="numeric" pattern="[0-9]*" autoComplete="off" enterKeyHint="go"
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
            {!isStandalone() && <div className="mt-5 border-t border-slate-100 pt-5"><GetAppBadges heading="Get the app" /></div>}
          </>
        )}

        {step === "otp" && (
          <>
            <button onClick={() => setStep("email")} className="-ml-1 rounded-lg px-1.5 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100">← Change email</button>
            <h2 className="mt-3 text-center text-xl font-bold text-slate-900">Enter your code</h2>
            <p className="mt-1 text-center text-sm text-slate-500">We sent a {N}-digit code to <span className="font-semibold text-slate-800">{maskEmail(email)}</span></p>
            {studentId.trim() && <p className="mt-2 text-center"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200/70">Student ID {studentId.trim()}</span></p>}

            <div className={mode === "live" ? "mx-auto mt-6 grid max-w-[22rem] grid-cols-6 gap-2" : "mt-6 flex justify-center gap-3"} onPaste={onPaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { refs.current[i] = el; }}
                  value={d}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  enterKeyHint="done"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${i + 1}`}
                  readOnly={locked}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                  onFocus={(e) => e.target.select()}
                  className={`${mode === "live" ? "h-14 w-full min-w-0" : "h-16 w-14"} rounded-xl border-2 text-center text-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${d ? "border-indigo-500 bg-indigo-50" : "border-slate-200/50 bg-white shadow-sm focus:border-indigo-500"}`}
                />
              ))}
            </div>

            <div className="mt-4 flex h-6 items-center justify-center text-sm">
              {verifying ? (
                <span className="inline-flex items-center gap-2 text-slate-500"><span className="u-spin inline-block h-4 w-4 rounded-full border-2 border-indigo-500 border-t-transparent" /> Verifying…</span>
              ) : otpError ? (
                <span role="alert" className="font-medium text-rose-600">{otpError}</span>
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

            {mode === "demo" ? (
              <p className="mt-5 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">Demo mode: any 4-digit code works, for example <span className="font-mono font-bold text-slate-700">1234</span>.</p>
            ) : (
              <p className="mt-5 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">Check your inbox for an email from Unite. Not there? Look in spam or promotions. The code expires in 10 minutes.</p>
            )}
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

/* ------------------------------------------------------------------ */
/*  Event artwork: a square logo and a 16:9 cover, uploaded separately */
/* ------------------------------------------------------------------ */
/* Uploads must be JPEG/PNG/WebP, at most 10 MB and at least the minimum size. They are centre-cropped to the
   right shape in the browser and re-encoded as WebP (JPEG where WebP encoding is unavailable):
   logo → 512×512, cover → 1600×900. */
const IMAGE_SPECS = {
  logo: { w: 512, h: 512, minW: 512, minH: 512 },
  cover: { w: 1600, h: 900, minW: 1376, minH: 768 }, // 1376×768 (≈16:9, common AI/phone export) is accepted
};
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const PHOTO_COPY = {
  logo: { title: "Event logo", where: "Shown on event cards", ratio: "1 / 1", empty: "Add a square logo",
    specs: ["Square 1:1", "Recommended 1080 × 1080 px", "Minimum 512 × 512 px", "JPG, PNG or WebP · max 10 MB"] },
  cover: { title: "Event cover", where: "Shown at the top of the event page", ratio: "16 / 9", empty: "Add a widescreen cover",
    specs: ["Widescreen 16:9", "Recommended 1920 × 1080 px", "Also fits: 1600 × 900 or 1376 × 768 px", "Minimum 1376 × 768 px", "JPG, PNG or WebP · max 10 MB"] },
};

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.decoding = "async";
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("load"));
  img.src = src;
});

const encodeCrop = (img, spec) => {
  const target = spec.w / spec.h, ratio = img.naturalWidth / img.naturalHeight;
  const sw = ratio > target ? img.naturalHeight * target : img.naturalWidth;
  const sh = ratio > target ? img.naturalHeight : img.naturalWidth / target;
  const c = document.createElement("canvas");
  c.width = spec.w; c.height = spec.h;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
  g.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, spec.w, spec.h);
  const out = c.toDataURL("image/webp", 0.85);
  return out.startsWith("data:image/webp") ? out : c.toDataURL("image/jpeg", 0.88);
};

// Returns { src, cropped }: cropped is true when the photo wasn't already the right shape (±1%).
async function readImageFile(file, kind) {
  const spec = IMAGE_SPECS[kind];
  if (!file || !IMAGE_TYPES.includes(file.type)) throw new Error("That file type isn't supported. Use a JPG, PNG or WebP photo.");
  if (file.size > IMAGE_MAX_BYTES) throw new Error(`That photo is ${(file.size / 1048576).toFixed(1)} MB. The maximum is 10 MB.`);
  const url = URL.createObjectURL(file);
  try {
    let img;
    try { img = await loadImage(url); } catch (e) { throw new Error("We couldn't open that photo. Try another file."); }
    if (img.naturalWidth < spec.minW || img.naturalHeight < spec.minH)
      throw new Error(`Too small: ${img.naturalWidth} × ${img.naturalHeight} px. It needs to be at least ${spec.minW} × ${spec.minH} px.`);
    const cropped = Math.abs(img.naturalWidth / img.naturalHeight - spec.w / spec.h) > 0.01 * (spec.w / spec.h);
    return { src: encodeCrop(img, spec), cropped };
  } finally { URL.revokeObjectURL(url); }
}

const PhotoIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" /><circle cx="8.5" cy="10" r="1.6" /><path d="M21 15.5l-4.6-4.6a1.5 1.5 0 00-2.1 0L5 20" />
  </svg>
);

/* One photo upload (locked dark styling): a frame in the photo's shape, live preview, Replace / Remove,
   the requirements underneath and its own inline error. value = null | { src, cropped } */
function PhotoDrop({ kind, value, onChange, error }) {
  const copy = PHOTO_COPY[kind];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const browse = () => inputRef.current && inputRef.current.click();
  const take = async (file) => {
    if (!file) return;
    setBusy(true); setErr("");
    try { onChange(await readImageFile(file, kind)); }
    catch (e) { setErr(e.message || "Couldn't use that photo."); }
    finally { setBusy(false); }
  };
  const msg = err || error;
  return (
    <div id={`c-${kind}`} tabIndex={-1} className="min-w-0 focus:outline-none">
      <p className={DK.label}>{copy.title} <span className="font-normal text-slate-500">· {copy.where}</span></p>
      <div
        role="button" tabIndex={0} aria-label={value ? `Replace ${copy.title.toLowerCase()}` : `Upload ${copy.title.toLowerCase()}`}
        onClick={browse}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); browse(); } }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files && e.dataTransfer.files[0]); }}
        className={`u-keep group relative mt-3 w-full cursor-pointer overflow-hidden rounded-2xl transition-all duration-200 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-400/60 ${value ? "ring-1 ring-white/10" : `border border-dashed ${drag ? "border-crimson-400 bg-crimson-400/[0.06]" : msg ? "border-rose-400/70 bg-white/[0.02]" : "border-white/20 bg-white/[0.02] hover:border-crimson-400/60 hover:bg-white/[0.04]"}`}`}
        style={{ aspectRatio: copy.ratio }}>
        {value ? (
          <>
            <img src={value.src} alt={`${copy.title} preview`} draggable={false} className="absolute inset-0 h-full w-full object-cover" />
            {value.cropped && <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">✂ We'll crop it to fit</span>}
          </>
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-3 text-center">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 transition-colors ${drag ? "text-crimson-300 ring-crimson-400/50" : "text-slate-400 ring-white/10 group-hover:text-crimson-300 group-hover:ring-crimson-400/40"}`}><PhotoIcon className="h-6 w-6" /></span>
            <span>
              <span className="block text-sm font-semibold text-white">{drag ? "Drop to upload" : copy.empty}</span>
              <span className="mt-0.5 block text-xs text-slate-400">Drag a photo here, or click to browse</span>
            </span>
          </span>
        )}
        {busy && <span className="absolute inset-0 flex items-center justify-center bg-[#0a192f]/70"><span className="u-spin h-7 w-7 rounded-full border-2 border-crimson-400 border-t-transparent" /></span>}
      </div>
      <input ref={inputRef} type="file" accept={IMAGE_TYPES.join(",")} className="hidden" aria-hidden="true" tabIndex={-1}
        onChange={(e) => { take(e.target.files && e.target.files[0]); e.target.value = ""; }} />
      {value && (
        <div className="mt-2.5 flex gap-2">
          <button type="button" onClick={browse} className="u-keep rounded-lg px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/10 active:scale-95">Replace</button>
          <button type="button" onClick={() => { setErr(""); onChange(null); }} className="u-keep rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 ring-1 ring-white/10 transition-colors hover:bg-rose-500/10 hover:text-rose-200 active:scale-95">Remove</button>
        </div>
      )}
      {msg && <p role="alert" className={DK.err}>{msg}</p>}
      <ul className="mt-2.5 space-y-0.5 text-xs leading-relaxed text-slate-500">{copy.specs.map((t) => <li key={t}>{t}</li>)}</ul>
    </div>
  );
}

/* Event artwork for headers/thumbnails: logo image or emoji fallback. */
const EventLogo = ({ p, className = "h-12 w-12 text-2xl" }) =>
  p.logo ? <img src={p.logo} alt="" loading="lazy" decoding="async" draggable={false} className={`${className} shrink-0 rounded-xl object-cover`} style={{ aspectRatio: "1 / 1" }} />
    : <span className={`${className} flex shrink-0 items-center justify-center`}>{p.emoji}</span>;

/* Contact helpers shared by the form and the event details. */
const waDigits = (v) => (v || "").replace(/\D/g, "");
const tgHandle = (v) => (v || "").trim().replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "");
/* Google Maps links only: google.<tld>/maps, maps.google.<tld>, maps.app.goo.gl, goo.gl/maps.
   Pasted links are tidied first: scheme added if missing, http upgraded to https. */
const normalizeMapsUrl = (u) => {
  const t = (u || "").trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t.replace(/^http:\/\//i, "https://") : `https://${t}`;
};
const isGoogleMapsUrl = (u) => {
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
const englishMapsUrl = (u) => {
  try {
    const x = new URL(u);
    if (/(^|\.)google\.[a-z.]+$/i.test(x.hostname)) { x.searchParams.set("hl", "en"); x.searchParams.set("gl", "ae"); }
    return x.toString();
  } catch (e) { return u; }
};
const fmtLeft = (ms) => { const m = Math.max(1, Math.ceil(ms / 6e4)); return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m` : `${m}m`; };
const TYPE_EMOJI = { Party: "🎉", Social: "🥂", "Academic Study": "📚", Networking: "🤝", Sports: "🏅", Gaming: "🎮", Music: "🎶", "Arts & Culture": "🎨" };
/* An approved application becomes a regular feed event, with the organizer's contacts and map link. */
const submissionToParty = (sub) => ({
  id: sub.at, lang: sub.lang, title: sub.title, emoji: TYPE_EMOJI[sub.category] || "🎉", category: sub.category,
  date: sub.date, time: fmtTime(sub.start), where: sub.room ? `${sub.venueName}, ${sub.room}` : sub.venueName,
  address: sub.venueName, maps: sub.venueName, mapsUrl: sub.mapsUrl, price: sub.price, spots: sub.spots, taken: 0, wait: 0, vibe: null,
  host: "you", own: true, dyn: true, ref: sub.ref, cover: sub.cover, logo: sub.logo,
  contact: { name: "You", role: "Organizer", email: sub.email, whatsapp: sub.whatsapp, telegram: sub.telegram },
  desc: sub.pitch || `A student-hosted ${sub.category.toLowerCase()} at ${sub.venueName}.`,
  perks: [sub.dress && `Dress code: ${sub.dress}`, sub.reqs && `Bring: ${sub.reqs}`].filter(Boolean),
});
/* An approved event from another student, loaded from the moderation database (no email exposed). */
const eventImg = (ref, kind, key) => `/api/events?img=${ref}&kind=${kind}${key ? `&k=${key}` : ""}`;
const campusToParty = (e) => ({
  ...submissionToParty({ ...e, email: "", cover: e.hasCover ? eventImg(e.ref, "cover") : null, logo: e.hasLogo ? eventImg(e.ref, "logo") : null }),
  host: "student", own: false, contact: { name: "Organizer", role: "Student host", whatsapp: e.whatsapp, telegram: e.telegram },
});
const MOD_STATUSES = ["pending", "under_review", "approved", "rejected"];
const partyMapsUrl = (p) => (p.mapsUrl ? englishMapsUrl(p.mapsUrl) : mapsLink(p.maps));

const REQ_CHIPS = ["Bring your own laptop", "Bring your own racket", "Sportswear & trainers", "Student ID at the door", "No experience needed"];
const REVIEW_MS = 2 * 36e5; // admin safety review for student parties
const PITCH_MIN_CHARS = 50;
/* Field order on the page, used to bring the first problem into view on submit. */
const FIELD_ORDER = ["logo", "cover", "title", "pitch", "date", "time", "end", "venueName", "mapsUrl", "spots", "price", "whatsapp", "telegram", "email"];

/* Event times are entered and checked in Dubai time (UTC+4, no daylight saving), whatever the device's zone.
   Applications must arrive at least 24 hours before the event starts. */
const DUBAI_OFFSET_MS = 4 * 36e5;
const LEAD_MS = 24 * 36e5;
const dubaiStartMs = (date, time) => {
  const [y, mo, d] = date.split("-").map(Number), [h, mi] = time.split(":").map(Number);
  return Date.UTC(y, mo - 1, d, h, mi) - DUBAI_OFFSET_MS;
};
// Earliest allowed start, as Dubai date + time (rounded up to the next 5 minutes).
const earliestStart = (now = Date.now()) => {
  const step = 5 * 6e4;
  const x = new Date(Math.ceil((now + LEAD_MS) / step) * step + DUBAI_OFFSET_MS).toISOString();
  return { date: x.slice(0, 10), time: x.slice(11, 16) };
};

/* Locked-dark form primitives (fixed colours; u-keep opts out of the theme remap). */
const DK = {
  label: "block text-[13px] font-medium tracking-wide text-slate-300",
  input: (bad) => `u-keep mt-2 w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-[15px] text-white placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 ${bad ? "border-rose-400/70 focus:ring-rose-400/20" : "border-white/10 hover:border-white/20 focus:border-crimson-400/70 focus:ring-crimson-400/15"}`,
  chip: (on) => `u-keep rounded-full border px-4 py-2 text-sm transition-all duration-200 active:scale-95 ${on ? "border-crimson-500 bg-crimson-700 font-semibold text-white shadow-[0_0_0_3px_rgba(196,90,104,0.18)]" : "border-white/15 text-slate-300 hover:border-white/35 hover:text-white"}`,
  err: "mt-2 text-sm text-rose-300",
  hint: "mt-2 text-xs text-slate-400",
};
const DkSection = ({ n, title, children }) => (
  <section className="space-y-6 border-t border-white/[0.06] pt-10 first:border-0 first:pt-0">
    <h3 className="flex items-baseline gap-3 text-lg font-semibold tracking-tight text-white">
      <span className="text-xs font-semibold tabular-nums text-crimson-400">{String(n).padStart(2, "0")}</span>{title}
    </h3>
    {children}
  </section>
);

/* Host preview: frames for the event card and the event page. */
const PreviewBlock = ({ title, note, onEdit, children }) => (
  <section className="min-w-0">
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h4 className="text-sm font-semibold text-white">{title}{note && <span className="font-normal text-slate-400"> · {note}</span>}</h4>
      {onEdit && <button type="button" onClick={onEdit} className="u-keep shrink-0 rounded-md text-xs font-semibold text-crimson-300 underline-offset-4 hover:text-crimson-200 hover:underline">Edit</button>}
    </div>
    {children}
  </section>
);

/* Phone-shaped frame on desktop, a plain full-width panel on mobile. */
const PhoneFrame = ({ children }) => (
  <div className="lg:mx-auto lg:w-[360px] lg:rounded-[2.75rem] lg:bg-[#020617] lg:p-2.5 lg:shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] lg:ring-1 lg:ring-white/10">
    <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-white/10 lg:rounded-[2.2rem] lg:ring-0">
      <span className="pointer-events-none absolute left-1/2 top-2 z-20 hidden h-6 w-24 -translate-x-1/2 rounded-full bg-[#020617] lg:block" aria-hidden="true" />
      <div className="max-h-[560px] overflow-y-auto overscroll-contain lg:h-[640px] lg:max-h-none">{children}</div>
    </div>
  </div>
);

function HostPreview({ sub, onEdit }) {
  const p = { ...submissionToParty(sub), host: "you" };
  const fake = (label, primary) => (
    <span className={`u-btn inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold ${primary ? "flex-1 bg-slate-900 text-white" : "text-slate-700 ring-1 ring-slate-200"}`}>{label}</span>
  );
  const buy = p.price > 0 ? `Buy ticket · ${p.price} AED` : "Reserve free spot";
  const rows = [
    ["When", `${fmtDate(sub.date)} · ${fmtRange(sub.start, sub.end)} (Dubai time)`, "date"],
    ["Venue", sub.room ? `${sub.venueName}, ${sub.room}` : sub.venueName, "venueName"],
    ["Capacity · price", `${sub.spots} spots · ${sub.price > 0 ? `${sub.price} AED` : "Free"}`, "spots"],
    ["Type · language", `${sub.category} · ${sub.lang}`, "title"],
    ...(sub.dress || sub.reqs ? [["Dress code · bring", [sub.dress, sub.reqs].filter(Boolean).join(" · "), "reqs"]] : []),
    ["Contacts", [sub.whatsapp && `WhatsApp ${sub.whatsapp}`, sub.telegram && `@${sub.telegram}`, sub.email].filter(Boolean).join(" · "), "whatsapp"],
  ];
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-crimson-300">Preview</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">Here's how your event will look</h3>
        <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-slate-400">This is what students will see once the Unite team approves it. Spotted something? Tap Edit and you'll go straight back to that part of the form.</p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-10">
          <PreviewBlock title="Event card" note="Student Parties" onEdit={() => onEdit("logo")}>
            <div className="pointer-events-none select-none" aria-hidden="true">
              <PartyCard p={p} onShare={() => {}} actions={<>{fake(buy, true)}{fake("Details")}</>} />
            </div>
          </PreviewBlock>
          <PreviewBlock title="Application details" onEdit={() => onEdit("title")}>
            <dl className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
              {rows.map(([k, v, field]) => (
                <div key={k} className="flex items-start gap-3 px-4 py-3 text-sm">
                  <dt className="w-32 shrink-0 text-slate-400">{k}</dt>
                  <dd className="min-w-0 flex-1 break-words text-slate-100">{v}</dd>
                  <button type="button" onClick={() => onEdit(field)} className="u-keep shrink-0 text-xs font-semibold text-crimson-300 hover:text-crimson-200 hover:underline">Edit</button>
                </div>
              ))}
            </dl>
          </PreviewBlock>
        </div>
        <PreviewBlock title="Event page" note="when a student opens it" onEdit={() => onEdit("cover")}>
          <PhoneFrame>
            <div className="pointer-events-none select-none" aria-hidden="true">
              <EventDetailBody p={p} onShare={() => {}} />
              <div className="border-t border-slate-200/50 bg-white p-4">{fake(buy, true)}</div>
            </div>
          </PhoneFrame>
        </PreviewBlock>
      </div>
    </div>
  );
}

function CreateModal({ email: defaultEmail, onClose, onSubmitted }) {
  const [f, setF] = useState({
    title: "", category: "Party", lang: "English", pitch: "", date: "", time: "20:00", end: "22:00", venueName: "", room: "", mapsUrl: "",
    spots: 30, price: 0, dress: "", reqs: "", whatsapp: "", telegram: "", email: defaultEmail, logo: null, cover: null, website: "",
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("form"); // form | preview
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendError, setSendError] = useState("");
  const [focusField, setFocusField] = useState(null);
  const bodyRef = useRef(null);
  const yesRef = useRef(null);
  const earliest = earliestStart();
  const clearErr = (...ks) => setErrors((x) => { const n = { ...x }; ks.forEach((k) => { n[k] = undefined; }); return n; });
  const set = (k) => (e) => {
    const v = e.target.value;
    setF((x) => ({ ...x, [k]: v }));
    clearErr(k, ...(k === "whatsapp" || k === "telegram" ? ["whatsapp", "telegram"] : []), ...(k === "date" || k === "time" || k === "end" ? ["date", "time", "end"] : []));
  };

  // Escape steps back: closes the confirmation, then leaves the preview, then closes the form.
  useEffect(() => {
    const h = (e) => {
      if (e.key !== "Escape" || submitting) return;
      if (confirm) setConfirm(false);
      else if (step === "preview") setStep("form");
      else onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [submitting, confirm, step, onClose]);
  // Phone back gesture / browser back (see App): same steps as Escape, but never closes while sending.
  useEffect(() => {
    const h = (e) => {
      if (submitting) { e.preventDefault(); return; }
      if (confirm) { setConfirm(false); e.preventDefault(); }
      else if (step === "preview") { setStep("form"); e.preventDefault(); }
    };
    window.addEventListener("unite:back", h);
    return () => window.removeEventListener("unite:back", h);
  }, [submitting, confirm, step]);
  // Keyboard: "Next" on every single-line field, "Done" on the last; Enter moves on instead of doing nothing.
  // Fields you type into. Enter skips dropdowns and date/time pickers: focusing one opens its popup, which then swallows the next keystrokes.
  const formFields = () => (bodyRef.current ? [...bodyRef.current.querySelectorAll("input:not([type=file]):not([type=date]):not([type=time]):not([type=checkbox]):not([type=radio]):not([name=website]), textarea")].filter((el) => el.offsetParent) : []);
  useEffect(() => {
    const list = formFields();
    list.forEach((el, i) => { if (el.tagName === "INPUT") el.setAttribute("enterkeyhint", i === list.length - 1 ? "done" : "next"); });
  });
  const onFieldEnter = (e) => {
    if (e.key !== "Enter" || e.target.tagName !== "INPUT" || e.target.type === "file") return;
    e.preventDefault();
    const list = formFields(), next = list[list.indexOf(e.target) + 1];
    if (next) next.focus(); else e.target.blur();
  };
  useEffect(() => { if (confirm && yesRef.current) yesRef.current.focus(); }, [confirm]);
  // After switching steps: top of the preview, or straight to the field the host wants to edit.
  useEffect(() => {
    if (step === "preview") { if (bodyRef.current) bodyRef.current.scrollTop = 0; return; }
    if (!focusField) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`c-${focusField}`);
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); if (el.focus) el.focus({ preventScroll: true }); }
      setFocusField(null);
    }, 60);
    return () => clearTimeout(t);
  }, [step, focusField]);

  const validate = () => {
    const e = {};
    if (!f.logo) e.logo = "Add a square logo for your event card.";
    if (!f.cover) e.cover = "Add a 16:9 cover for your event page.";
    if (f.title.trim().length < 3) e.title = "Give your event a title (3+ characters).";
    const chars = f.pitch.trim().length;
    if (chars < PITCH_MIN_CHARS) e.pitch = `Please describe your event in more detail: at least ${PITCH_MIN_CHARS} characters (you have ${chars}).`;
    if (!f.date) e.date = "Pick the date of your event.";
    else if (f.date < new Date(Date.now() + DUBAI_OFFSET_MS).toISOString().slice(0, 10)) e.date = "That date has already passed. Pick an upcoming date.";
    else if (f.date < earliest.date) e.date = "Events must be submitted at least 24 hours before they start.";
    if (!f.time) e.time = "Add a start time.";
    if (f.date && f.time && !e.date && dubaiStartMs(f.date, f.time) < Date.now() + LEAD_MS) e.date = "Events must be submitted at least 24 hours before they start.";
    if (!f.end) e.end = "Add an end time.";
    else if (f.time && toMin(f.end) <= toMin(f.time)) e.end = "The end time must be after the start time.";
    if (f.venueName.trim().length < 3) e.venueName = "Add the venue name, e.g. Marina Rooftop Lounge.";
    if (!f.mapsUrl.trim() || !isGoogleMapsUrl(f.mapsUrl)) e.mapsUrl = "Please paste a Google Maps link to the venue";
    if (!(Number(f.spots) >= 1)) e.spots = "At least 1 spot.";
    if (Number(f.price) < 0 || f.price === "") e.price = "Enter 0 for free events.";
    const wa = waDigits(f.whatsapp), tg = tgHandle(f.telegram);
    if (f.whatsapp.trim() && (wa.length < 8 || wa.length > 15)) e.whatsapp = "Use the full number with country code, e.g. +971 50 123 4567.";
    if (f.telegram.trim() && !/^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(tg)) e.telegram = "Telegram usernames are 5–32 letters, numbers or underscores.";
    if (!wa && !tg && !e.whatsapp && !e.telegram) e.whatsapp = "Add a WhatsApp number or a Telegram username so guests can reach you.";
    if (!validEmail(f.email.trim())) e.email = "Enter a valid contact email.";
    return e;
  };

  const buildSub = () => ({
    ref: makeId("REQ", 6), at: Date.now(), title: f.title.trim(), category: f.category, lang: f.lang, pitch: f.pitch.trim(),
    date: f.date, start: f.time, end: f.end, venueName: f.venueName.trim(), room: f.room.trim(), mapsUrl: normalizeMapsUrl(f.mapsUrl),
    spots: Number(f.spots), price: Number(f.price), dress: f.dress.trim(), reqs: f.reqs.trim(),
    whatsapp: f.whatsapp.trim(), telegram: tgHandle(f.telegram), email: f.email.trim(),
    cover: f.cover ? f.cover.src : "", logo: f.logo ? f.logo.src : "",
  });

  // Step 1: check everything, then show the preview instead of sending.
  const review = () => {
    const e = validate();
    setErrors(e);
    const first = FIELD_ORDER.find((k) => e[k]);
    if (first) { setFocusField(first); return; }
    setSendError("");
    setStep("preview");
  };
  // Step 3: only after "Yes, submit".
  const send = async () => {
    const e = validate();
    if (FIELD_ORDER.some((k) => e[k])) { setErrors(e); setConfirm(false); setStep("form"); setFocusField(FIELD_ORDER.find((k) => e[k])); return; }
    setSubmitting(true); setSendError("");
    try {
      await onSubmitted(buildSub(), f.website); // delivers the pitch to the moderation chat, then queues it for review
    } catch (err) {
      setSubmitting(false);
      setSendError(err.message || "The review team couldn't be reached. Please try again.");
    }
  };
  const edit = (field) => { setConfirm(false); setStep("form"); setFocusField(field); };
  const addReq = (r) => { if (!f.reqs.includes(r)) setF({ ...f, reqs: f.reqs.trim() ? `${f.reqs.trim().replace(/[.,;]$/, "")}; ${r}` : r }); };
  const E = ({ k }) => (errors[k] ? <p className={DK.err}>{errors[k]}</p> : null);
  const chars = f.pitch.trim().length;
  const preview = step === "preview";
  const dubai = <span className="ml-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-slate-300">Dubai time</span>;

  return (
    <div className="u-keep u-fade u-vv u-full-pad fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-6">
      <div role="dialog" aria-modal="true" aria-labelledby="host-title"
        className={`u-keep u-up u-full-h relative flex w-full flex-col overflow-hidden bg-[#0a192f] text-white shadow-2xl ring-1 ring-white/10 transition-[max-width] duration-300 sm:rounded-3xl ${preview ? "sm:max-w-2xl lg:max-w-5xl" : "sm:max-w-2xl"}`}
        style={{ colorScheme: "dark" }}>
        {/* Header */}
        <div className="u-keep u-short-tight shrink-0 border-b border-white/[0.06] px-6 pb-6 sm:px-10" style={{ paddingTop: "max(2rem, var(--sat))", paddingLeft: "max(1.5rem, var(--sal))", paddingRight: "max(1.5rem, var(--sar))" }}>
          <button onClick={onClose} disabled={submitting} aria-label="Close"
            className="u-keep absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-slate-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white active:scale-95 disabled:opacity-40">✕</button>
          <p className="u-short-hide pr-12 text-xs font-semibold uppercase tracking-[0.2em] text-crimson-300">Unite · Student events{preview ? " · Step 2 of 2" : ""}</p>
          <h2 id="host-title" className="mt-3 pr-12 text-3xl font-semibold tracking-tight text-white sm:text-4xl [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:text-2xl">{preview ? "Preview your event" : "Host an event"}</h2>
          <p className="u-short-hide mt-2 max-w-md text-[15px] leading-relaxed text-slate-400">{preview ? "Check everything looks right before it goes to the Unite team." : "Pitch your party or event. The admin team reviews every submission for safety, usually within 2 hours."}</p>
        </div>

        {/* Body */}
        <div ref={bodyRef} onKeyDown={onFieldEnter} className="u-scroll min-h-0 flex-1 overflow-y-auto px-6 py-10 sm:px-10" style={{ paddingLeft: "max(1.5rem, var(--sal))", paddingRight: "max(1.5rem, var(--sar))" }}>
          {preview ? (
            <div key="preview" className="u-slide"><HostPreview sub={buildSub()} onEdit={edit} /></div>
          ) : (
          <div key="form" className="u-slide space-y-12">
            <DkSection n={1} title="Photos">
              <p className="-mt-2 text-sm text-slate-400">Two photos: a square logo for the event card and a widescreen cover for the event page. Both are required.</p>
              <div className="grid gap-8 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-6">
                <div className="w-full max-w-[13rem]">
                  <PhotoDrop kind="logo" value={f.logo} error={errors.logo} onChange={(v) => { setF((x) => ({ ...x, logo: v })); clearErr("logo"); }} />
                </div>
                <PhotoDrop kind="cover" value={f.cover} error={errors.cover} onChange={(v) => { setF((x) => ({ ...x, cover: v })); clearErr("cover"); }} />
              </div>
            </DkSection>

            <DkSection n={2} title="The event">
              <div>
                <label className={DK.label} htmlFor="c-title">Event name</label>
                <input id="c-title" value={f.title} onChange={set("title")} placeholder="Sunset Beach Social"
                  className={`u-keep mt-1 w-full border-0 border-b bg-transparent px-0 py-2 text-2xl font-semibold tracking-tight text-white placeholder:text-slate-600 focus:outline-none focus:ring-0 ${errors.title ? "border-rose-400/70" : "border-white/10 focus:border-crimson-400"}`} />
                <E k="title" />
              </div>
              <div>
                <span className={DK.label}>Type</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {EVENT_TYPES.map((c) => <button key={c} type="button" aria-pressed={f.category === c} onClick={() => setF({ ...f, category: c })} className={DK.chip(f.category === c)}>{c}</button>)}
                </div>
              </div>
              <div>
                <label className={DK.label} htmlFor="c-lang">Language spoken</label>
                <div className="relative">
                  <select id="c-lang" value={f.lang} onChange={set("lang")} className={`${DK.input(false)} appearance-none pr-10`}>
                    {LANGUAGES.map((l) => <option key={l} value={l} className="bg-[#0a192f]">{l}</option>)}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 mt-2 flex items-center text-slate-400"><Icon name="chevron" className="h-4 w-4" /></span>
                </div>
              </div>
              <div>
                <label className={DK.label} htmlFor="c-pitch">Tell us more details (What exactly do you want to host? Explain your setup, requirements, and full plan).</label>
                <textarea id="c-pitch" rows={7} value={f.pitch} onChange={set("pitch")} maxLength={2500}
                  placeholder="The concept and who it's for, the run of show from doors to close, your setup (music, food and drinks, decorations, equipment), safety and supervision, how guests get there, and anything you need from the venue or from us."
                  className={`${DK.input(!!errors.pitch)} resize-y leading-relaxed`} />
                <div className="mt-2 flex items-start justify-between gap-4 text-xs">
                  {errors.pitch ? <span className="text-sm text-rose-300">{errors.pitch}</span> : <span className="text-slate-400">A thorough plan gets approved faster.</span>}
                  <span aria-live="polite" className={`shrink-0 tabular-nums font-medium transition-colors ${chars >= PITCH_MIN_CHARS ? "text-emerald-400" : "text-slate-400"}`}>
                    {chars >= PITCH_MIN_CHARS && "✓ "}{chars} / {PITCH_MIN_CHARS} characters minimum
                  </span>
                </div>
              </div>
            </DkSection>

            <DkSection n={3} title="When & where">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className={DK.label} htmlFor="c-date">Date</label>
                  <input id="c-date" type="date" min={earliest.date} value={f.date} onChange={set("date")} className={DK.input(!!errors.date)} />
                </div>
                <div>
                  <label className={DK.label} htmlFor="c-time">Starts {dubai}</label>
                  <input id="c-time" type="time" min={f.date === earliest.date ? earliest.time : undefined} value={f.time} onChange={set("time")} className={DK.input(!!errors.time || !!errors.date)} />
                </div>
                <div>
                  <label className={DK.label} htmlFor="c-end">Ends {dubai}</label>
                  <input id="c-end" type="time" value={f.end} onChange={set("end")} className={DK.input(!!errors.end)} />
                </div>
              </div>
              {errors.date || errors.time || errors.end
                ? <div className="-mt-3 space-y-1">{["date", "time", "end"].map((k) => <E key={k} k={k} />)}</div>
                : <p className="-mt-3 text-xs text-slate-400">Applications close 24 hours before the start. Earliest start right now: {fmtDate(earliest.date)}, {fmtTime(earliest.time)} (Dubai time).</p>}
              <div>
                <label className={DK.label} htmlFor="c-venueName">Venue name</label>
                <input id="c-venueName" value={f.venueName} onChange={set("venueName")} autoComplete="off" placeholder="e.g. Marina Rooftop Lounge" className={DK.input(!!errors.venueName)} />
                <E k="venueName" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={DK.label} htmlFor="c-room">Room or meeting point <span className="text-slate-500">· optional</span></label>
                  <input id="c-room" value={f.room} onChange={set("room")} autoComplete="off" placeholder="Level 3 terrace" className={DK.input(false)} />
                </div>
                <div>
                  <label className={DK.label} htmlFor="c-mapsUrl">Google Maps link</label>
                  <input id="c-mapsUrl" type="url" inputMode="url" autoComplete="off" value={f.mapsUrl} onChange={set("mapsUrl")} placeholder="https://maps.app.goo.gl/…" className={DK.input(!!errors.mapsUrl)} />
                  {errors.mapsUrl ? <E k="mapsUrl" /> : <p className={DK.hint}>In Google Maps: open the venue → Share → Copy link.</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={DK.label} htmlFor="c-spots">Capacity</label>
                  <input id="c-spots" type="number" inputMode="numeric" min="1" value={f.spots} onChange={set("spots")} className={DK.input(!!errors.spots)} />
                  <E k="spots" />
                </div>
                <div>
                  <label className={DK.label} htmlFor="c-price">Ticket price (AED)</label>
                  <input id="c-price" type="number" inputMode="decimal" min="0" value={f.price} onChange={set("price")} className={DK.input(!!errors.price)} />
                  {errors.price ? <E k="price" /> : <p className={DK.hint}>{Number(f.price) > 0 ? "Paid securely via Ziina." : "0 means free entry."}</p>}
                </div>
              </div>
            </DkSection>

            <DkSection n={4} title="Details">
              <div>
                <span className={DK.label}>Dress code</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {DRESS_CODES.map((d) => <button key={d} type="button" aria-pressed={f.dress === d} onClick={() => setF({ ...f, dress: f.dress === d ? "" : d })} className={DK.chip(f.dress === d)}>{d}</button>)}
                </div>
              </div>
              <div>
                <label className={DK.label} htmlFor="c-reqs">What guests should bring or know <span className="text-slate-500">· optional</span></label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {REQ_CHIPS.map((r) => <button key={r} type="button" aria-pressed={f.reqs.includes(r)} onClick={() => addReq(r)} className={DK.chip(f.reqs.includes(r))}>{r}</button>)}
                </div>
                <textarea id="c-reqs" rows={2} value={f.reqs} onChange={set("reqs")} placeholder="Anything else guests need to know" className={`${DK.input(false)} mt-3 resize-none`} />
              </div>
            </DkSection>

            <DkSection n={5} title="Organizer contacts">
              <p className="-mt-2 text-sm text-slate-400">Shown on your event once it's approved. Add WhatsApp, Telegram or both.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={DK.label} htmlFor="c-whatsapp">WhatsApp number</label>
                  <input id="c-whatsapp" type="tel" inputMode="tel" autoComplete="tel" value={f.whatsapp} onChange={set("whatsapp")} placeholder="+971 50 123 4567" className={DK.input(!!errors.whatsapp)} />
                  <E k="whatsapp" />
                </div>
                <div>
                  <label className={DK.label} htmlFor="c-telegram">Telegram username</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 mt-2 flex items-center text-[15px] text-slate-500">@</span>
                    <input id="c-telegram" value={f.telegram} onChange={(e) => set("telegram")({ target: { value: e.target.value.replace(/^@+/, "") } })} placeholder="username"
                      autoCapitalize="off" autoCorrect="off" spellCheck="false" className={`${DK.input(!!errors.telegram)} pl-8`} />
                  </div>
                  <E k="telegram" />
                </div>
              </div>
              <div>
                <label className={DK.label} htmlFor="c-email">Contact email</label>
                <input id="c-email" type="email" value={f.email} onChange={set("email")} className={DK.input(!!errors.email)} />
                {errors.email ? <E k="email" /> : <p className={DK.hint}>Your approval notification is sent here too.</p>}
              </div>
            </DkSection>
          </div>
          )}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set("website")}
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
        </div>

        {/* Footer */}
        <div className="u-keep shrink-0 border-t border-white/[0.06] bg-[#0a192f] px-6 py-4 sm:px-10" style={{ paddingBottom: "max(1rem, var(--sab))", paddingLeft: "max(1.5rem, var(--sal))", paddingRight: "max(1.5rem, var(--sar))" }}>
          {sendError && !confirm && <p role="alert" className="mb-3 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200 ring-1 ring-inset ring-rose-400/30">{sendError}</p>}
          {!preview && Object.values(errors).some(Boolean) && <p className="mb-3 text-sm text-rose-300">A few details need your attention above.</p>}
          {preview ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button onClick={() => setStep("form")} disabled={submitting}
                className="u-keep rounded-xl px-6 py-3.5 text-[15px] font-semibold text-white ring-1 ring-white/15 transition-all hover:bg-white/10 active:scale-[0.98] disabled:opacity-50 sm:w-auto">← Back to editing</button>
              <button onClick={() => setConfirm(true)} disabled={submitting}
                className="u-keep flex flex-1 items-center justify-center gap-2 rounded-xl bg-crimson-700 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-crimson-600 active:scale-[0.98] disabled:opacity-80">Submit application</button>
            </div>
          ) : (
            <button onClick={review}
              className="u-keep flex w-full items-center justify-center gap-2 rounded-xl bg-crimson-700 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-crimson-600 active:scale-[0.98]">Preview my event →</button>
          )}
        </div>

        {/* Confirmation */}
        {confirm && (
          <div className="u-keep u-fade absolute inset-0 z-20 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
            onMouseDown={(e) => e.target === e.currentTarget && !submitting && setConfirm(false)}>
            <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-text"
              className="u-up u-sheet-h w-full max-w-sm overflow-y-auto rounded-3xl bg-[#0d1f3a] p-6 text-center shadow-2xl ring-1 ring-white/10" style={{ marginBottom: "var(--sab)" }}>
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-crimson-700/25 text-xl ring-1 ring-inset ring-crimson-400/30" aria-hidden="true">📨</span>
              <h3 id="confirm-title" className="mt-4 text-lg font-semibold text-white">Submit your application?</h3>
              <p id="confirm-text" className="mt-2 text-sm leading-relaxed text-slate-300">Your event will be sent to the Unite team for review. You can still edit it while it's pending.</p>
              {sendError && <p role="alert" className="mt-3 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200 ring-1 ring-inset ring-rose-400/30">{sendError}</p>}
              <div className="mt-6 flex gap-3">
                <button onClick={() => setConfirm(false)} disabled={submitting}
                  className="u-keep flex-1 rounded-xl py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition-all hover:bg-white/10 active:scale-[0.98] disabled:opacity-50">Cancel</button>
                <button ref={yesRef} onClick={send} disabled={submitting}
                  className="u-keep flex flex-1 items-center justify-center gap-2 rounded-xl bg-crimson-700 py-3 text-sm font-semibold text-white transition-all hover:bg-crimson-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-300 active:scale-[0.98] disabled:opacity-80">
                  {submitting ? (<><span className="u-spin inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent" /> Sending…</>) : "Yes, submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
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
    if (step !== "review") return; // a second fast tap must not pay twice
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

        <dl className="mt-5 space-y-1.5 rounded-2xl border border-slate-200/50 bg-slate-50 p-4 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">General admission × 1</dt><dd className="tabular-nums text-slate-800">{amount} AED</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Service fee</dt><dd className="tabular-nums text-slate-800">0.00 AED</dd></div>
          <div className="flex justify-between border-t border-slate-200/50 pt-2 font-semibold"><dt className="text-slate-900">Total</dt><dd className="tabular-nums text-slate-900">{amount} AED</dd></div>
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
/* An event card as shown in Student Parties (also used in the host's preview). */
function PartyCard({ p, i = 0, open = {}, onShare, actions }) {
  const left = p.spots - p.taken;
  return (
    <article id={"event-" + p.id} {...open}
      className="group u-card u-rise cursor-pointer overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" style={{ animationDelay: `${i * 60}ms` }}>
      <div className={`relative flex justify-between gap-2 overflow-hidden px-4 ${p.cover ? "h-40 items-end bg-slate-900 pb-3" : `items-center bg-gradient-to-r py-4 ${GRADIENTS[p.category]}`}`}>
        {p.cover && (
          <>
            <img src={p.cover} alt="" loading="lazy" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ aspectRatio: "16 / 9" }} />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" aria-hidden="true" />
          </>
        )}
        <span className="relative">{p.logo ? <EventLogo p={p} className="h-12 w-12 ring-2 ring-white/80 shadow-lg" /> : <span className="text-3xl">{p.emoji}</span>}</span>
        <div className="relative flex items-center gap-2">
          <ShareBtn onClick={onShare} />
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
          <p className="flex flex-wrap items-center gap-2"><VenueChip where={p.where} href={partyMapsUrl(p)} /><LangBadge lang={p.lang} /></p>
        </div>
        <div className="mt-4"><Spots left={left} total={p.spots} unit={p.price > 0 ? "tickets" : "spots"} wait={p.wait} /></div>
        <div className="mt-4 flex gap-2">{actions}</div>
      </div>
    </article>
  );
}

/* The event page content: shared by the event details modal and the host's preview. */
function EventDetailBody({ p, onShare }) {
  const left = p.spots - p.taken;
  const mapsUrl = partyMapsUrl(p);
  return (
    <>
      <div className={`relative overflow-hidden px-6 pb-6 pt-7 text-white ${p.cover ? "bg-slate-900" : `bg-gradient-to-br ${GRADIENTS[p.category]}`}`}>
        {p.cover && (
          <>
            <img src={p.cover} alt="" decoding="async" draggable={false} className="absolute inset-0 h-full w-full object-cover" style={{ aspectRatio: "16 / 9" }} />
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" aria-hidden="true" />
          </>
        )}
        <div className={`relative flex items-start justify-between pr-10 ${p.cover ? "pt-16" : ""}`}>
          {p.logo ? <EventLogo p={p} className="h-16 w-16 ring-2 ring-white/80 shadow-xl" /> : <span className="text-5xl">{p.emoji}</span>}
          <ShareBtn onClick={() => onShare(p)} />
        </div>
        <div className="relative mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.22)" }}>{p.category}</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-900">{p.price > 0 ? `${p.price} AED` : "Free"}</span>
        </div>
        <h2 className="relative mt-2 text-2xl font-bold leading-tight">{p.title}</h2>
        <p className="relative mt-0.5 text-sm" style={{ opacity: 0.9 }}>Hosted by {p.host}</p>
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
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:text-indigo-600 hover:decoration-indigo-400">{p.where} ↗</a>
              {p.address !== p.where && p.address !== shortVenue(p.where) && <p className="text-slate-500">{p.address}</p>}
              <p className="mt-1 flex flex-wrap gap-x-4">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">Open in Google Maps ↗</a>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <InfoIcon name="user" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{p.contact.name} <span className="font-normal text-slate-500">· {p.contact.role}</span></p>
              <p className="mb-2 mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Check className="h-3 w-3" /> Verified organizer contacts</p>
              <ContactButtons contact={p.contact} subject={p.title} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function EventDetail({ party: p, action, onShare, onClose }) {
  return (
    <Modal onClose={onClose} size="lg">
      <EventDetailBody p={p} onShare={onShare} />
      <div className="u-safe-bar sticky bottom-0 border-t border-slate-200/50 bg-white shadow-sm p-4">{action}</div>
    </Modal>
  );
}

function ClubDetail({ club: c, status, action, onClose, onShare }) {
  const joined = status === "joined";
  const mapsUrl = mapsLink(UOWD_MAPS);
  const art = HERO_PHOTOS[c.id];
  return (
    <Modal onClose={onClose} size="lg">
      <div className={`relative overflow-hidden px-6 pb-6 text-white ${art ? "u-keep flex min-h-[15rem] flex-col justify-end bg-slate-950 pt-24 sm:min-h-[17rem]" : `bg-gradient-to-br pt-7 ${GRADIENTS[c.category]}`}`}>
        {art && (<>
          <span className="u-fade absolute inset-0" style={{ background: heroBackground(art) }} aria-hidden="true" />
          {art.photo && <img src={art.photo} alt="" decoding="async" onError={(e) => { e.currentTarget.style.display = "none"; }} className="u-fade absolute inset-0 h-full w-full object-cover" />}
          <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" aria-hidden="true" />
        </>)}
        {onShare && (
          <button onClick={() => onShare(c)} aria-label={`Copy link to ${c.name}`} className="absolute right-14 top-3 z-10 inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-white backdrop-blur hover:bg-white/30" style={{ background: "rgba(255,255,255,0.18)" }}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1 1M14 10a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1-1" /></svg>
            Share
          </button>
        )}
        <span className="relative text-5xl">{c.emoji}</span>
        <div className="relative mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.22)" }}>{c.category}</span>
          {joined && <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.22)" }}>✓ You're a member</span>}
          {status === "pending" && <span className="u-keep rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-amber-950">⏳ Pending approval</span>}
        </div>
        <h2 className="relative mt-2 text-2xl font-bold leading-tight drop-shadow-sm">{c.name}</h2>
        <p className="relative mt-0.5 text-sm" style={{ opacity: 0.9 }}>{c.members + (joined ? 1 : 0)} members · Free to join</p>
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
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/50">
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

      <div className="u-safe-bar sticky bottom-0 border-t border-slate-200/50 bg-white shadow-sm p-4">{action}</div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Waitlist modal                                                     */
/* ------------------------------------------------------------------ */
/* A submitted party while it waits for the admin safety review. */
function ReviewModal({ sub: s, r, onClose }) {
  const rows = [
    ["Reference", <span className="font-mono font-semibold">{s.ref}</span>],
    ["Type", s.category],
    ["When", `${fmtDate(s.date)} · ${fmtRange(s.start, s.end)}`],
    ["Venue", <a href={s.mapsUrl ? englishMapsUrl(s.mapsUrl) : mapsLink(s.venueName)} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 hover:underline">{s.venueName}{s.room ? `, ${s.room}` : ""} ↗</a>],
    ["Language", <LangBadge lang={s.lang} />],
    ["Spots · price", `${s.spots} · ${s.price > 0 ? s.price + " AED" : "Free"}`],
    ...(s.dress ? [["Dress code", s.dress]] : []),
    ...(s.reqs ? [["Requirements", s.reqs]] : []),
  ];
  return (
    <Modal onClose={onClose}>
      <div className={`relative overflow-hidden px-6 pb-5 pt-7 text-white ${s.cover ? "bg-slate-900" : `bg-gradient-to-br ${GRADIENTS[s.category] || GRADIENTS.Party}`}`}>
        {s.cover && (<><img src={s.cover} alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover" style={{ aspectRatio: "16 / 9" }} /><span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" aria-hidden="true" /></>)}
        <span className={`relative block ${s.cover ? "pt-12" : ""}`}>{s.logo ? <EventLogo p={s} className="h-14 w-14 ring-2 ring-white/80 shadow-lg" /> : <span className="text-4xl">{TYPE_EMOJI[s.category] || "🎉"}</span>}</span>
        <h2 className="relative mt-2 pr-8 text-xl font-bold leading-tight">{s.title}</h2>
        {r.status === "rejected" ? (
          <span className="u-keep relative mt-2 inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white">✕ Not approved</span>
        ) : (
          <span className="u-keep relative mt-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-amber-950">{!s.moderated ? `⏳ Party Under Review · ~${r.left} left` : s.mod === "under_review" ? "🔍 Additional check in progress" : "⏳ Pending moderation"}</span>
        )}
      </div>
      <div className="space-y-4 p-5">
        {r.status === "rejected" ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm leading-relaxed text-rose-800 ring-1 ring-inset ring-rose-200">
            The admin team didn't approve this event, so it won't be published. You're welcome to adjust the plan and submit a new application.
          </p>
        ) : (
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-200">
            {s.mod === "under_review"
              ? <>The admin team is running an additional safety check and may contact you at <span className="font-semibold">{s.email}</span>. It goes live on Student Parties once approved.</>
              : <>Our admin team is verifying your event's safety. Once approved (usually within 2 hours) it goes live on Student Parties. This page updates automatically.</>}
          </p>
        )}
        <dl className="space-y-2 rounded-2xl border border-slate-200/50 bg-slate-50 p-4 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4"><dt className="shrink-0 text-slate-500">{k}</dt><dd className="min-w-0 text-right font-medium text-slate-800">{v}</dd></div>
          ))}
        </dl>
        {s.pitch && (
          <div>
            <p className="mb-1 text-sm font-semibold text-slate-900">Your pitch</p>
            <p className="max-h-40 overflow-y-auto whitespace-pre-line rounded-xl border border-slate-200/50 bg-white p-3 text-sm leading-relaxed text-slate-600">{s.pitch}</p>
          </div>
        )}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-900">Organizer contacts</p>
          <ContactButtons contact={{ whatsapp: s.whatsapp, telegram: s.telegram, email: s.email }} subject={s.title} />
        </div>
        <button onClick={onClose} className="u-btn w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800">Done</button>
      </div>
    </Modal>
  );
}

const PROCESSING_MS = 24 * 36e5; // Student Services turnaround for tryout forms

function LeaveConfirm({ club: c, pending, onConfirm, onCancel }) {
  const kind = c.category === "Sports" ? "team" : "club";
  return (
    <Modal onClose={onCancel} size="sm">
      <div className="p-6 pt-8 text-center">
        <span className="u-pop mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-2xl ring-1 ring-inset ring-rose-200">{c.emoji}</span>
        <h2 className="mt-4 text-lg font-bold text-slate-900">Are you sure you want to leave this {kind}?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {pending
            ? <>Your pending tryout registration for <span className="font-semibold text-slate-900">{c.name}</span> will be cancelled and its sessions removed from My Schedule. To rejoin, you'd submit the UOWD form again.</>
            : <>You'll leave <span className="font-semibold text-slate-900">{c.name}</span> and its weekly sessions ({scheduleLabel(c, true)}) will be removed from My Schedule.</>}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button onClick={onCancel} autoFocus className="u-btn rounded-xl py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="u-btn rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-700">Yes, Leave</button>
        </div>
      </div>
    </Modal>
  );
}

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
  sessions.forEach(({ club, slot, pending }) => {
    const d = new Date(now); d.setDate(d.getDate() + ((slot.day - weekdayIdx(d) + 7) % 7));
    ev(slot.id, stamp(d, slot.start), stamp(d, slot.end), `${club.name}: ${slot.title}${pending ? " (pending approval)" : ""}`, slot.where, "RRULE:FREQ=WEEKLY;COUNT=12");
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

const ReviewBadge = ({ r }) =>
  r.status === "approved" ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"><Check className="h-3 w-3" /> Approved · Live</span>
  ) : r.status === "rejected" ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">✕ Not approved</span>
  ) : r.moderated ? (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">{r.mod === "under_review" ? "🔍 Additional check" : "⏳ Pending moderation"}</span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">⏳ Party Under Review · ~{r.left}</span>
  );

/* My Events: the host's own applications, split into "Pending Moderation" and "Live Events". */
function MyEventCard({ s, r, onOpen }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <button onClick={() => onOpen(s)} className="u-card group flex flex-col overflow-hidden rounded-2xl border border-slate-200/50 bg-white text-left shadow-sm">
      <span className={`relative block aspect-[16/9] w-full bg-gradient-to-br ${GRADIENTS[s.category] || GRADIENTS.Party}`}>
        {s.cover && imgOk ? <img src={s.cover} alt="" loading="lazy" decoding="async" onError={() => setImgOk(false)} className="absolute inset-0 h-full w-full object-cover" />
          : <span className="absolute inset-0 flex items-center justify-center text-5xl" aria-hidden="true">{TYPE_EMOJI[s.category] || "🎉"}</span>}
        <span className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" aria-hidden="true" />
        <span className="absolute left-3 top-3"><ReviewBadge r={r} /></span>
      </span>
      <span className="block p-4">
        <span className="block truncate font-semibold text-slate-900">{s.title}</span>
        <span className="mt-0.5 block text-sm text-slate-500">{fmtDate(s.date)} · {fmtRange(s.start, s.end)}</span>
        <span className="mt-2 flex flex-wrap items-center gap-1.5"><VenueChip where={s.room ? `${s.venueName}, ${s.room}` : s.venueName} /><LangBadge lang={s.lang} /></span>
        <span className="mt-2 block font-mono text-[11px] text-slate-400">{s.ref}</span>
      </span>
    </button>
  );
}

function MyEvents({ items, onOpen, onHost }) {
  const pending = items.filter(({ r }) => r.status === "review");
  const live = items.filter(({ r }) => r.status === "approved");
  const declined = items.filter(({ r }) => r.status === "rejected");
  const Grid = ({ list }) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map(({ s, r }) => <MyEventCard key={s.ref} s={s} r={r} onOpen={onOpen} />)}</div>
  );
  const Empty = ({ children }) => <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">{children}</div>;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">My Events</h2>
          <p className="mt-0.5 text-sm text-slate-500">Everything you host on Unite. Decisions from the admin team appear here automatically.</p>
        </div>
        <button onClick={onHost} className="u-btn rounded-xl bg-crimson-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-crimson-600 active:scale-95">+ Host another event</button>
      </div>
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Pending Moderation <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{pending.length}</span></h3>
        {pending.length ? <Grid list={pending} /> : <Empty>Nothing waiting for review.</Empty>}
      </section>
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Live Events <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{live.length}</span></h3>
        {live.length ? <Grid list={live} /> : <Empty>Approved events show up here and on Student Parties for the whole campus.</Empty>}
      </section>
      {declined.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Not approved</h3>
          <Grid list={declined} />
        </section>
      )}
    </div>
  );
}

function MySchedule({ sessions, events, reviews = [], onOpenClub, onOpenTicket, onOpenReview, onBrowse, onExport }) {
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
      ...reviews.filter((r) => r.date === iso).map((r) => ({ kind: "review", key: r.ref, s: toMin(r.start), e: toMin(r.end), r })),
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

  if (!sessions.length && !events.length && !reviews.length)
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

  const selectCls = "u-btn appearance-none rounded-xl border border-slate-200/50 bg-white py-2 pl-3 pr-8 text-sm font-semibold text-slate-900 shadow-sm hover:border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";
  const Chevron = () => <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400"><Icon name="chevron" className="h-4 w-4" /></span>;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="min-w-0 rounded-2xl border border-slate-200/50 bg-white p-4 shadow-sm sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Next up</p>
          {nextSession ? (
            <button onClick={() => onOpenClub(nextSession.club)} className="mt-2 flex w-full items-center gap-3 text-left">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl ${GRADIENTS[nextSession.club.category]}`}>{nextSession.club.emoji}</span>
              <span className="min-w-0">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate font-semibold text-slate-900">{nextSession.club.name} · {nextSession.slot.title}</span>
                  {nextSession.pending && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">⏳ Pending</span>}
                </span>
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
          <div className="rounded-2xl border border-slate-200/50 bg-white p-4 shadow-sm"><p className="text-2xl font-bold tabular-nums text-slate-900">{sessions.length}</p><p className="text-xs text-slate-500">weekly sessions{sessions.some((x) => x.pending) ? <span className="text-amber-600"> · {sessions.filter((x) => x.pending).length} pending</span> : null}</p></div>
          <div className="rounded-2xl border border-slate-200/50 bg-white p-4 shadow-sm"><p className="text-2xl font-bold tabular-nums text-slate-900">{weekly % 1 ? weekly.toFixed(1) : weekly}</p><p className="text-xs text-slate-500">hours a week</p></div>
        </div>
      </div>

      {/* Calendar */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200/50 p-4 lg:flex-row lg:items-center lg:justify-between">
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
            <div className="inline-flex overflow-hidden rounded-xl border border-slate-200/50 bg-white shadow-sm">
              <button onClick={() => go(addDays(anchor, -7))} disabled={+anchor <= +minAnchor} aria-label="Previous week"
                className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                <Icon name="chevron" className="h-4 w-4 rotate-90" /><span className="hidden sm:inline">Previous week</span>
              </button>
              <button onClick={() => go(mondayOf(today))} disabled={isCurrent} className="border-x border-slate-200/50 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 disabled:text-slate-400 disabled:hover:bg-transparent">Today</button>
              <button onClick={() => go(addDays(anchor, 7))} disabled={+anchor >= +maxAnchor} aria-label="Next week"
                className="inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                <span className="hidden sm:inline">Next week</span><Icon name="chevron" className="h-4 w-4 -rotate-90" />
              </button>
            </div>
            <button onClick={onExport} className="u-btn inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200/50 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
              <Icon name="calendar" className="h-4 w-4" /> Add to my calendar
            </button>
          </div>
        </div>

        {/* Week grid */}
        <div className="overflow-x-auto">
          <div key={+anchor} className="u-fade min-w-[860px]">
            <div className="grid border-b border-slate-200/50" style={{ gridTemplateColumns: cols }}>
              <div className="px-2 py-3 text-right text-xs font-medium text-slate-400">{weekHours ? `${weekHours % 1 ? weekHours.toFixed(1) : weekHours} h` : ""}</div>
              {days.map((d, i) => {
                const isToday = +d === +today;
                return (
                  <div key={i} className={`border-l border-slate-200/50 px-2 py-2.5 text-center ${i >= 5 ? "bg-slate-50" : ""}`}>
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
                  <div key={i} className={`relative border-l border-slate-200/50 ${i >= 5 ? "bg-slate-50" : ""} ${d < today ? "opacity-70" : ""}`}>
                    {hours.map((h, j) => <div key={h} className="absolute inset-x-0 border-t border-slate-100" style={{ top: j * HOUR_PX }} />)}
                    {dayItems[i].map((it) => {
                      const top = ((it.s - startH * 60) / 60) * HOUR_PX;
                      const height = Math.max(26, ((it.e - it.s) / 60) * HOUR_PX - 3);
                      const style = { top: top + 1, height, left: `calc(${(it.lane / it.lanes) * 100}% + 3px)`, width: `calc(${100 / it.lanes}% - 6px)` };
                      const tall = height > 70;
                      const narrow = it.lanes > 1;
                      if (it.kind === "review")
                        return (
                          <button key={it.key} onClick={() => onOpenReview(it.r)} title={`${it.r.title} · ${fmtRange(it.r.start, it.r.end)} · ${it.r.status === "approved" ? "approved, live" : "party under review"}`}
                            className={`absolute overflow-hidden rounded-lg border-2 border-dashed px-2 py-1 text-left hover:z-10 hover:shadow-md ${it.r.status === "approved" ? "border-emerald-400 bg-emerald-50" : "u-review border-amber-400 bg-amber-50"}`} style={style}>
                            <span className={`block truncate text-xs font-bold ${it.r.status === "approved" ? "text-emerald-700" : "text-amber-700"}`}>{it.r.status === "approved" ? "✓ Live · Hosting" : "⏳ Party Under Review"}</span>
                            <span className="block truncate text-xs font-semibold tabular-nums text-slate-500">{shortRange(it.r.start, it.r.end)}</span>
                            <span className="block truncate text-xs font-bold text-slate-900">{TYPE_EMOJI[it.r.category] || "🎉"} {it.r.title}</span>
                            {tall && <span className="block truncate text-xs text-slate-500">{it.r.venueName}</span>}
                          </button>
                        );
                      return it.kind === "session" ? (
                        <button key={it.key} onClick={() => onOpenClub(it.x.club)} title={`${it.x.club.name} · ${it.x.slot.title} · ${fmtRange(it.x.slot.start, it.x.slot.end)}${it.x.pending ? " · pending approval" : ""}`}
                          className={`absolute overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left shadow-sm hover:z-10 hover:opacity-100 hover:shadow-md ${CAT_TINT[it.x.club.category]} ${it.x.pending ? "u-pending border-dashed opacity-60" : ""}`} style={style}>
                          {it.x.pending && <span className="block truncate text-xs font-bold text-amber-700">⏳ Pending</span>}
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/50 px-4 py-3 text-xs text-slate-500">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[["Sports", "bg-emerald-500"], ["Tech", "bg-sky-500"], ["Business", "bg-violet-500"], ["Arts", "bg-pink-500"]].map(([k, c]) => (
              <span key={k} className="inline-flex items-center gap-1.5"><span className={`h-3 w-1 rounded-full ${c}`} /> {k}</span>
            ))}
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed border-amber-400 bg-amber-50 opacity-70" /> ⏳ Pending approval</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed border-indigo-400 bg-indigo-50" /> Ticketed event</span>
            {reviews.length > 0 && <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-dashed border-amber-400 bg-amber-50" /> Party under review</span>}
            <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3 bg-rose-500" /> Now</span>
          </div>
          <span className="sm:hidden">Swipe sideways to see the whole week →</span>
        </div>
      </section>

      {/* Party applications */}
      {reviews.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Your party applications</h3>
          <div className="space-y-2">
            {reviews.map((r) => {
              const d = new Date(r.date + "T00:00:00");
              return (
                <button key={r.ref} onClick={() => onOpenReview(r)} className="u-card flex w-full items-center gap-4 rounded-2xl border border-slate-200/50 bg-white p-3 text-left shadow-sm">
                  {r.logo && <EventLogo p={r} className="h-14 w-14 ring-1 ring-slate-200/70" />}
                  <span className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br text-white ${GRADIENTS[r.category] || GRADIENTS.Party}`}>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ opacity: 0.85 }}>{d.toLocaleDateString("en-GB", { month: "short" })}</span>
                    <span className="text-xl font-bold leading-none">{d.getDate()}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-slate-900">{r.title}</span>
                    <span className="block truncate text-sm text-slate-500">{DAYS[weekdayIdx(d)]} · {fmtRange(r.start, r.end)} · {r.venueName}</span>
                  </span>
                  <ReviewBadge r={r} />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming events list */}
      {upcoming.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming events</h3>
          <div className="space-y-2">
            {upcoming.map((b) => {
              const d = new Date(b.date + "T00:00:00");
              return (
                <button key={b.id} onClick={() => onOpenTicket(b)} className="u-card flex w-full items-center gap-4 rounded-2xl border border-slate-200/50 bg-white p-3 text-left shadow-sm">
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
  const sentRef = useRef(false); // one registration per tap, even if double-tapped
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
    <div className="u-keep u-fade u-vv u-full-pad fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={`UOWD registration for ${c.name}`}
        className="u-keep u-up u-full-h flex w-full flex-col overflow-hidden bg-[#06101f] text-white shadow-2xl ring-1 ring-white/10 sm:max-w-3xl sm:rounded-3xl"
        style={{ colorScheme: "dark" }}>

        {/* Header: solid, locked dark */}
        <div className="u-keep shrink-0 border-b border-white/10 bg-[#0a192f] px-4 pb-4 text-white sm:px-6 [@media(max-height:500px)]:pb-2" style={{ paddingTop: "max(0.75rem, var(--sat))", paddingLeft: "max(1rem, var(--sal))", paddingRight: "max(1rem, var(--sar))" }}>
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
          <div className="u-short-hide mt-4 flex items-center gap-3">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-lg ${GRADIENTS[c.category]}`}>{c.emoji}</span>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-crimson-600/20 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-crimson-200 ring-1 ring-inset ring-crimson-400/40">
                <Icon name="shield" className="h-3.5 w-3.5" /> Official UOWD Form
              </p>
              <h2 className="mt-1 truncate text-lg font-bold leading-tight text-white sm:text-xl">{isSports(c) ? "Sports Tryouts Registration" : "Club Registration"}</h2>
              <p className="truncate text-sm text-slate-400">For {c.name} · processed by UOWD Student Services</p>
            </div>
          </div>
          <div className="u-short-hide mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            {picks.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                Sport{picks.length > 1 ? "s" : ""}:
                {picks.map((o) => <span key={o} className="rounded-md bg-crimson-700 px-2 py-0.5 font-semibold text-white ring-1 ring-inset ring-crimson-400/40">{o}</span>)}
                <span className="text-slate-400">· pre-selected, please check it's ticked</span>
              </span>
            )}
            <span className="hidden text-slate-400 sm:inline">Answers go straight to UOWD, not to Unite.</span>
          </div>
        </div>

        {/* Form: the white Jotform sits on the dark frame */}
        <div className="u-keep u-scroll relative min-h-0 flex-1 overflow-auto bg-[#06101f] sm:p-3 [@media(max-height:500px)]:p-0" style={{ paddingLeft: "var(--sal)", paddingRight: "var(--sar)" }}>
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="u-spin h-9 w-9 rounded-full border-4 border-white/10 border-t-crimson-400" />
              <p className="text-sm font-medium text-slate-300">Loading the official UOWD form…</p>
              {slow && <p className="text-xs text-slate-400">Taking a while? <a href={src} target="_blank" rel="noopener noreferrer" className="font-semibold text-crimson-400 hover:underline">Open it in a new tab ↗</a></p>}
            </div>
          )}
          <iframe
            key={src}
            title={`UOWD registration form for ${c.name}`}
            src={src}
            onLoad={() => setLoaded(true)}
            allow="fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            className="u-keep h-full w-full border-0 bg-white sm:rounded-2xl"
            style={{ opacity: loaded ? 1 : 0, transition: "opacity .3s ease", colorScheme: "light" }}
          />
        </div>

        {/* Footer: locked dark */}
        <div className="u-keep flex shrink-0 flex-col gap-2 border-t border-white/10 bg-[#0a192f] p-3 sm:flex-row sm:items-center sm:px-6 [@media(max-height:500px)]:py-2" style={{ paddingBottom: "max(0.75rem, var(--sab))", paddingLeft: "max(0.75rem, var(--sal))", paddingRight: "max(0.75rem, var(--sar))" }}>
          <button onClick={() => { if (sentRef.current) return; sentRef.current = true; onSent(); }} className="u-keep u-btn flex-1 rounded-xl bg-crimson-700 py-3 text-sm font-semibold text-white hover:bg-crimson-600">
            I've submitted the form
            <span className="ml-1.5 font-normal text-white/70">· adds {scheduleLabel(c, true)} to My Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* True once `src` has loaded as an image; cards only switch to the photo design then,
   so a missing or non-image link keeps the standard card instead of a blank one. */
function useImageReady(src) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    if (!src) return;
    let alive = true;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => alive && img.naturalWidth > 0 && setReady(true);
    img.onerror = () => {};
    img.src = src;
    return () => { alive = false; };
  }, [src]);
  return ready;
}

function ClubCard({ c, i, open, members, button }) {
  const photo = useImageReady(c.backgroundImage);
  const meta = (cls) => (
    <div className={`min-w-0 space-y-1.5 text-xs ${cls}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        {photo
          ? <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-sm"><Icon name="pin" className="h-3 w-3" />{shortVenue(c.where)}</span>
          : <VenueChip where={c.where} />}
        <span className="inline-flex items-center gap-1"><Icon name="users" className="h-3.5 w-3.5" />{members} members</span>
      </div>
      <p className="flex items-center gap-1.5"><Icon name="calendar" className="h-3.5 w-3.5" />{c.slots.length} weekly session{c.slots.length > 1 ? "s" : ""} · {clubDays(c)}</p>
    </div>
  );
  if (photo)
    return (
      <article {...open} className="u-keep u-card u-rise group relative isolate flex min-h-[15rem] cursor-pointer flex-col justify-end overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-crimson-400"
        style={{ animationDelay: `${i * 60}ms`, backgroundImage: `url("${c.backgroundImage}")`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <span className="absolute inset-0 -z-10 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/20 transition-opacity duration-300 group-hover:opacity-90" aria-hidden="true" />
        <div>
          <Badge kind="official" team={c.category === "Sports"} />
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">{c.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-200">{c.desc}</p>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          {meta("text-slate-200")}
          {button(true)}
        </div>
      </article>
    );
  return (
    <article {...open} className="u-card u-rise cursor-pointer rounded-2xl border border-slate-200/50 bg-white shadow-sm p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" style={{ animationDelay: `${i * 60}ms` }}>
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
        {meta("text-slate-500")}
        {button(false)}
      </div>
    </article>
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
  // clubId -> { status: "pending" | "joined", at }. Sports tryout forms start as pending and are processed by
  // Student Services within ~24h (never rejected); clubs without a form join straight away.
  const [joinedClubs, setJoinedClubs] = useState({});
  const [clock, setClock] = useState(Date.now());
  const [parties, setParties] = useState(PARTIES);
  const [bookings, setBookings] = useState([]);
  // Party applications. Moderated ones (database connected) carry { moderated, mod: status, key } and follow the
  // admin's Telegram decision; otherwise the 2-hour demo review applies. Saved per account in this browser.
  const [submissions, setSubmissions] = useState([]);
  const [campus, setCampus] = useState([]); // approved student events from the database, visible to everyone
  const seenRef = useRef({}); // last review status shown per application, to announce changes once
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [waitlist, setWaitlist] = useState({});
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("unite-theme") === "dark"; } catch (e) { return false; }
  });
  const toastTimer = useRef(null);
  const studentIdRef = useRef("");
  const verifiedRef = useRef(false); // true when the email was confirmed with a live code

  useEffect(() => {
    document.title = "Unite · UOWD clubs & events";
    try {
      const m = window.location.pathname.match(/\/events\/(\d+)/);
      if (m) { setTab("parties"); setModal({ type: "detail", id: Number(m[1]) }); }
      const clubId = clubFromPath(window.location.pathname);
      if (clubId) { setTab("clubs"); setModal({ type: "club", id: clubId }); }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem("unite-theme", dark ? "dark" : "light"); } catch (e) { /* ignore */ }
    document.documentElement.style.backgroundColor = dark ? "#070c18" : "#f8fafc";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  // Lock the page behind an open modal. iOS Safari ignores overflow:hidden on <body> for touch scrolling, so the
  // body is pinned in place (position: fixed at the current scroll offset) and restored on close.
  const modalOpen = !!modal;
  useEffect(() => {
    if (!modalOpen) return;
    const y = window.scrollY, b = document.body.style;
    const prev = { overflow: b.overflow, position: b.position, top: b.top, left: b.left, right: b.right, width: b.width };
    Object.assign(b, { overflow: "hidden", position: "fixed", top: `-${y}px`, left: "0", right: "0", width: "100%" });
    return () => { Object.assign(b, prev); window.scrollTo({ top: y, behavior: "instant" }); };
  }, [modalOpen]);

  // Phone back gesture / browser back: closes the open modal (or steps back inside it) instead of leaving the app,
  // and returns to the previous tab. Each open modal and each tab change gets a history entry.
  const modalRef = useRef(modal);
  modalRef.current = modal;
  const ownBack = useRef(false); // a history.back() we triggered ourselves
  useEffect(() => {
    const st = window.history.state || {};
    if (modalOpen && !st.uniteModal) window.history.pushState({ ...st, uniteModal: true }, "", window.location.href);
    else if (!modalOpen && st.uniteModal) { ownBack.current = true; window.history.back(); }
  }, [modalOpen]);
  useEffect(() => {
    if (!(window.history.state || {}).uniteTab) window.history.replaceState({ ...(window.history.state || {}), uniteTab: "clubs" }, "", window.location.href);
    const onPop = (e) => {
      if (ownBack.current) { ownBack.current = false; return; }
      if (modalRef.current) {
        const ev = new CustomEvent("unite:back", { cancelable: true });
        window.dispatchEvent(ev);
        if (ev.defaultPrevented) window.history.pushState({ ...(window.history.state || {}), uniteModal: true }, "", window.location.href);
        else setModal(null);
        return;
      }
      setTab((e.state && e.state.uniteTab) || "clubs");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // A new version took over while something was open: offer to reload (updates.js).
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => {
    const h = () => setUpdateReady(true);
    window.addEventListener("unite:update-ready", h);
    return () => window.removeEventListener("unite:update-ready", h);
  }, []);

  // Keep the address bar on the open team or club, so the link can be copied straight from the browser.
  useEffect(() => {
    try {
      const club = modal && modal.type === "club" && CLUBS.find((x) => x.id === modal.id);
      const path = window.location.pathname;
      if (club && path !== clubPath(club)) window.history.replaceState(window.history.state, "", clubPath(club));
      else if (!club && clubFromPath(path) && !(modal && ["tryout", "leave"].includes(modal.type))) window.history.replaceState(window.history.state, "", "/");
    } catch (e) { /* ignore */ }
  }, [modal]);

  useEffect(() => { const t = setInterval(() => setClock(Date.now()), 60000); return () => clearInterval(t); }, []);
  const reviewOf = (sub) => {
    if (sub.moderated) return sub.mod === "approved" ? "approved" : sub.mod === "rejected" ? "rejected" : "review";
    return clock - sub.at >= REVIEW_MS ? "approved" : "review";
  };
  // Announce review decisions once (approved / extra check / not approved).
  useEffect(() => {
    submissions.forEach((sub) => {
      const st = reviewOf(sub) + (sub.mod === "under_review" ? ":check" : "");
      const prev = seenRef.current[sub.ref];
      seenRef.current[sub.ref] = st;
      if (prev === undefined || prev === st) return;
      if (st === "approved") notify({ title: "Your party is approved 🎉", body: `"${sub.title}" passed the safety review and is now live on Student Parties.` }, 5000);
      else if (st === "rejected") notify({ title: "Application not approved", body: `The admin team didn't approve "${sub.title}". See My Events for details.` }, 5000);
      else if (st === "review:check") notify({ title: "Additional check 🔍", body: `The admin team is taking a closer look at "${sub.title}".` }, 4500);
    });
    // eslint-disable-next-line
  }, [clock, submissions]);

  // Live student events in the feed: your approved applications plus everyone else's from the database.
  const ownLive = submissions.filter((sub) => reviewOf(sub) === "approved");
  const liveKey = ownLive.map((x) => x.ref).join() + "|" + campus.map((e) => e.ref).join();
  useEffect(() => {
    const mine = new Set(submissions.map((x) => x.ref));
    const want = [...ownLive.map(submissionToParty), ...campus.filter((e) => !mine.has(e.ref)).map(campusToParty)];
    setParties((ps) => {
      const prev = new Map(ps.filter((x) => x.dyn).map((x) => [x.id, x]));
      if (want.length === prev.size && want.every((x) => prev.has(x.id))) return ps;
      // Keep ticket and waitlist counts for events that stay.
      return [...ps.filter((x) => !x.dyn), ...want.map((x) => (prev.has(x.id) ? { ...x, taken: prev.get(x.id).taken, wait: prev.get(x.id).wait } : x))];
    });
    // eslint-disable-next-line
  }, [liveKey]);

  // Campus feed of approved student events (refreshed every minute).
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const d = await (await fetch("/api/events")).json();
        if (!stop && d && Array.isArray(d.events)) setCampus((old) => (JSON.stringify(old) === JSON.stringify(d.events) ? old : d.events));
      } catch (e) { /* offline or no database: keep what we have */ }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  // Follow the admin's decisions on your own applications (every 15 s while signed in).
  const modKey = submissions.filter((x) => x.moderated && x.key).map((x) => `${x.ref}.${x.key}`).join(",");
  useEffect(() => {
    if (!user || !modKey) return;
    let stop = false;
    const poll = async () => {
      try {
        const d = await (await fetch(`/api/events?mine=${encodeURIComponent(modKey)}`, { cache: "no-store" })).json();
        if (stop || !d || !Array.isArray(d.mine)) return;
        setSubmissions((xs) => {
          let changed = false;
          const next = xs.map((x) => {
            const m = d.mine.find((y) => y.ref === x.ref);
            if (!m || !MOD_STATUSES.includes(m.status) || m.status === x.mod) return x;
            changed = true;
            return { ...x, mod: m.status };
          });
          return changed ? next : xs;
        });
      } catch (e) { /* try again next tick */ }
    };
    poll();
    const t = setInterval(poll, 15000);
    return () => { stop = true; clearInterval(t); };
  }, [user, modKey]);

  // Remember applications per account in this browser (artwork as server links, not raw uploads).
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(`unite-events:${user}`, JSON.stringify(submissions.map((x) => ({
        ...x,
        cover: x.moderated ? eventImg(x.ref, "cover", x.key) : null,
        logo: x.moderated && x.logo ? eventImg(x.ref, "logo", x.key) : null,
      }))));
    } catch (e) { /* storage full or blocked */ }
  }, [user, submissions]);

  const notify = (m, ms = 2400) => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), ms); };
  const closeModal = () => setModal(null);
  const requireAuth = (reason, action) => (user ? action(user) : setModal({ type: "auth", reason, action }));

  const signIn = (email, sid, verified) => {
    const action = modal && modal.action;
    studentIdRef.current = sid || "";
    verifiedRef.current = !!verified;
    try {
      const saved = JSON.parse(localStorage.getItem(`unite-events:${email}`) || "[]");
      setSubmissions(Array.isArray(saved) ? saved : []);
    } catch (e) { setSubmissions([]); }
    setUser(email);
    setModal(null);
    notify(verified ? { title: "Email verified", body: "Welcome to Unite! Signed in as " + email } : "Signed in as " + email, verified ? 3500 : 2400);
    if (action) setTimeout(() => action(email), 250);
  };

  const changeTab = (t) => {
    if (t !== tab) { try { window.history.pushState({ ...(window.history.state || {}), uniteTab: t, uniteModal: false }, "", window.location.href); } catch (e) { /* ignore */ } }
    setTab(t); setFilter("All"); setLangFilter("All");
  };
  const jumpTo = (t) => {
    changeTab(t);
    const el = document.getElementById("tabs");
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 76, behavior: "smooth" });
  };
  const goHome = () => { changeTab("clubs"); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const statusOf = (c) => {
    const r = user && joinedClubs[c.id];
    if (!r) return null;
    return r.status === "pending" && clock - r.at >= PROCESSING_MS ? "joined" : r.status;
  };
  // clock ticks once a minute, so it can trail a just-made submission: clamp to the 24h window.
  const pendingHours = (c) => Math.min(24, Math.max(1, Math.ceil((joinedClubs[c.id].at + PROCESSING_MS - clock) / 36e5)));
  const isJoined = (c) => !!statusOf(c); // pending or registered: either way the sessions are on the schedule
  const memberCount = (c) => c.members + (statusOf(c) === "joined" ? 1 : 0);
  const sessions = clubs.filter(isJoined).flatMap((c) => c.slots.map((slot) => ({ club: c, slot, pending: statusOf(c) === "pending" })));

  // Each team/club has one fixed official schedule; registering adds all of its sessions.
  const registerClub = (c, pending = false) => {
    const clash = c.slots.map((sl) => sessions.find((o) => o.club.id !== c.id && overlaps(o.slot, sl))).find(Boolean);
    setJoinedClubs((x) => ({ ...x, [c.id]: { status: pending ? "pending" : "joined", at: Date.now() } }));
    const heads = clash ? ` Heads up: it overlaps with ${clash.club.name}.` : "";
    if (pending) notify(`Registration form submitted for ${c.name}! ⏳ Student Services processes registrations within ~24 hours. ${scheduleLabel(c)} is in My Schedule as pending.${heads}`, 5200);
    else notify(`Registered for ${c.name}! ${scheduleLabel(c)} added to My Schedule.${heads}`, 4200);
  };
  const reviewLeft = (sub) => fmtLeft(Math.min(REVIEW_MS, sub.at + REVIEW_MS - clock));
  // Sends the pitch to the admin moderation chat (via /api/pitch, which holds the bot token), then
  // queues it for review locally. Throws with a readable message if it couldn't be delivered.
  const submitParty = async (sub, website) => {
    // Fail-safe: whatever happens on the way to Telegram, the student's submission completes.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    let saved = sub;
    try {
      const res = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sub, account: user, studentId: studentIdRef.current, verified: verifiedRef.current, website }),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.delivered) console.warn("Pitch forwarding issue", res.status, data);
      if (data.moderated && data.ref && data.key) saved = { ...sub, ref: data.ref, key: data.key, moderated: true, mod: "pending" };
    } catch (e) {
      console.warn("Pitch forwarding failed", e);
    } finally { clearTimeout(timer); }
    setSubmissions((x) => [saved, ...x]);
    setModal(null);
    notify({ title: "Application Submitted!", body: "Our admin team will verify your event safety and approve it within 2 hours." }, 6500);
  };
  const askLeave = (c) => setModal({ type: "leave", id: c.id });
  // Sports sections register through UOWD's official tryouts form; clubs join in one tap.
  // Every team and club registers through the official UOWD form; status changes only after
  // "I've submitted the form" (pending, then registered once Student Services processes it).
  const openJoin = (c) => {
    if (isJoined(c)) return setModal({ type: "club", id: c.id });
    requireAuth(`Sign in to register for ${c.name}`, () => setModal({ type: "tryout", id: c.id }));
  };
  const leaveClub = (c) => {
    const wasPending = statusOf(c) === "pending";
    setJoinedClubs((x) => { const n = { ...x }; delete n[c.id]; return n; });
    setModal(null);
    notify(wasPending ? `Tryout registration for ${c.name} cancelled` : `You left ${c.name}`);
  };

  const bookingFor = (id) => (user ? bookings.find((b) => b.partyId === id) : undefined);

  const createBooking = (p, email, method) => {
    const b = { id: makeId("UNT-2026", 5), partyId: p.id, title: p.title, emoji: p.emoji, logo: p.logo, date: p.date, time: p.time, where: p.where, price: p.price, paid: p.price > 0, method, email, studentId: studentIdRef.current, txn: p.price > 0 ? makeId("ZN", 8) : null };
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

  const shareClub = async (c) => {
    const url = `${window.location.origin}${clubPath(c)}`;
    const ok = await copyText(url);
    notify(ok ? `Link to ${c.name} copied! Share it with your squad.` : `Copy this link to share: ${url}`, ok ? 3000 : 6000);
  };
  const shareEvent = async (p) => {
    const url = `${window.location.origin}/events/${p.id}`;
    const ok = await copyText(url);
    notify(ok ? "Link copied to clipboard! Share it with your squad." : `Copy this link to share: ${url}`, ok ? 3000 : 6000);
  };


  const handleDownload = (b) => {
    try { downloadTicket(b); notify(`Ticket saved as ${b.id}.png`, 3000); }
    catch (e) { notify("Couldn't create the download. Take a screenshot of your ticket instead.", 3600); }
  };

  // Card click / Enter opens details, unless the event came from a control inside the card
  // (join, buy, share, venue link), which handle themselves.
  const cardOpen = (open) => ({
    tabIndex: 0,
    onClick: (e) => { if (!e.target.closest("button, a")) open(); },
    onKeyDown: (e) => { if (e.key === "Enter" && e.target === e.currentTarget) open(); },
  });

  const clubBtn = (c, extra = "shrink-0 px-4 py-2", onPhoto = false) => {
    const st = statusOf(c);
    const tone = onPhoto
      ? `u-keep ${st === "pending" ? "bg-amber-700 text-white hover:bg-amber-600" : st === "joined" ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-white text-slate-900 hover:bg-slate-100"}`
      : st === "pending" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100" : st === "joined" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100" : "bg-slate-900 text-white hover:bg-slate-800";
    return (
      <button onClick={() => openJoin(c)} className={`u-btn ${extra} rounded-xl text-sm font-semibold ${tone}`}>
        {st === "pending" ? `⏳ Pending · ~${pendingHours(c)}h` : st === "joined" ? "Registered ✓" : isSports(c) ? "Register · tryouts" : "Register · join club"}
      </button>
    );
  };

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
  const myPending = clubs.filter((c) => statusOf(c) === "pending").length;
  const hot = parties
    .filter((p) => p.spots - p.taken > 0 && p.spots - p.taken <= 5 && !bookingFor(p.id))
    .sort((a, b) => a.spots - a.taken - (b.spots - b.taken))[0];
  const totalMembers = clubs.reduce((s, c) => s + memberCount(c), 0);

  const showMyEvents = !!user && submissions.length > 0; // only for accounts that host or have applied
  const tabs = [["clubs", "Official Clubs", "Clubs"], ["parties", "Student Parties", "Events"], ["schedule", "My Schedule", "Schedule"], ["tickets", "My Tickets", "Tickets"],
    ...(showMyEvents ? [["events", "My Events", "Mine"]] : [])];
  const myEventItems = submissions.map((sub) => ({ s: sub, r: { ...sub, status: reviewOf(sub), left: reviewLeft(sub) } }));
  useEffect(() => { if (tab === "events" && !showMyEvents) setTab("clubs"); }, [tab, showMyEvents]);
  const openOwn = (sub) => (reviewOf(sub) === "approved" ? setModal({ type: "detail", id: sub.at }) : setModal({ type: "review", ref: sub.ref }));

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${dark ? "u-dark" : ""}`}>
      <style>{CSS}</style>

      {/* Nav */}
      <header className={`u-keep u-safe-top sticky top-0 z-30 border-b ${dark ? "border-white/10" : "border-slate-200/50 bg-white/80"}`} style={{ backgroundColor: dark ? glassDark.background : undefined, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", ...STATUS_BAR_STRIP }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button onClick={goHome} aria-label="Unite home" className="u-keep flex items-center gap-2.5 rounded-lg">
            <UniteIcon className="h-9 w-9" />
            <span className={`text-xl font-extrabold tracking-tight ${dark ? "text-white" : "text-[#0f172a]"}`}>unite</span>
            <span className={`hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline ${dark ? "text-crimson-200" : "bg-crimson-50 text-crimson-700 ring-1 ring-crimson-100"}`} style={dark ? glassChip : undefined}>for UOWD students</span>
          </button>
          <div className="flex items-center gap-2">
          {!isStandalone() && (
            <a href={installPath(platform())} aria-label="Get the app"
              className="u-keep group inline-flex h-9 items-center gap-2 rounded-full bg-black pl-2.5 pr-2.5 text-[13px] font-semibold text-white shadow-[0_6px_18px_-8px_rgba(0,0,0,0.55)] ring-1 ring-white/15 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_10px_24px_-10px_rgba(0,0,0,0.7)] active:scale-95 sm:pr-3.5">
              {/* iPhone: Apple only · Android: Android only · computer: both */}
              <span className="flex items-center gap-1.5" aria-hidden="true">
                {platform() !== "android" && <AppleLogo className="h-[15px] w-[15px] -mt-px" />}
                {platform() === "desktop" && <span className="h-3.5 w-px bg-white/25" />}
                {platform() !== "ios" && <AndroidLogo className="h-[15px] w-[15px] text-[#3DDC84]" />}
              </span>
              <span className="hidden sm:inline">Get the app</span>
            </a>
          )}
          <ThemeToggle dark={dark} onToggle={() => setDark((d) => !d)} />
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white" title={studentIdRef.current ? `${user} · ID ${studentIdRef.current}` : user}>{initials(user)}</div>
              <button onClick={() => { setUser(null); setSubmissions([]); seenRef.current = {}; setTab("clubs"); notify("Signed out"); }}
                className={`u-keep rounded-lg px-2.5 py-1.5 text-sm ${dark ? "text-slate-300 hover:bg-white/10 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>Sign out</button>
            </div>
          ) : (
            <button onClick={() => setModal({ type: "auth", reason: "Sign in with your email to join clubs and get tickets." })}
              className={`u-keep u-btn rounded-lg px-3.5 py-1.5 text-sm font-semibold ${dark ? "bg-white text-gray-900 hover:bg-gray-100" : "bg-gray-900 text-white shadow-sm hover:bg-gray-800"}`}>Sign in</button>
          )}
          </div>
        </div>
      </header>

      {/* Hero: explicit light and dark text/control palettes (u-keep opts out of the dark remap) */}
      {/* No background of its own: the hero shows the page background, so it is seamless in both themes. */}
      <section className="u-keep relative">
        <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-10 sm:pt-14">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${dark ? "text-indigo-100" : "bg-white text-gray-600 shadow-sm ring-1 ring-gray-200"}`} style={dark ? glassChip : undefined}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> University of Wollongong in Dubai
          </span>
          <h1 className={`mt-4 max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl ${dark ? "text-white" : "text-gray-900"}`}>
            Where UOWD comes <span className={`bg-gradient-to-r bg-clip-text text-transparent ${dark ? "from-crimson-200 to-crimson-400" : "from-indigo-800 via-indigo-700 to-crimson-600"}`}>together.</span>
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
        <div id="tabs" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} className="relative mb-5 grid rounded-2xl border border-slate-200/50 bg-white shadow-sm p-1.5 shadow-sm" role="tablist">
          <div className="u-keep absolute rounded-xl bg-crimson-700 shadow" style={{ top: 6, bottom: 6, left: 6, width: `calc((100% - 12px) / ${tabs.length})`, transform: `translateX(${tabs.findIndex((t) => t[0] === tab) * 100}%)`, transition: "transform .3s cubic-bezier(.2,.8,.2,1)" }} />
          {tabs.map(([k, l, short]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => changeTab(k)}
              className={`relative z-10 whitespace-nowrap rounded-xl px-1 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${tab === k ? "text-white" : "text-slate-500 hover:text-slate-800"}`}>
              <span className="sm:hidden">{short}</span><span className="hidden sm:inline">{l}</span>
              {k === "tickets" && user && bookings.length > 0 && <span className="ml-1 rounded-full bg-indigo-500 px-1.5 py-0.5 text-xs text-white">{bookings.length}</span>}
              {k === "events" && myEventItems.some(({ r }) => r.status === "review") && <span className="ml-1 hidden rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white sm:inline">{myEventItems.filter(({ r }) => r.status === "review").length}</span>}
              {k === "schedule" && sessions.length > 0 && <span className="ml-1 hidden rounded-full bg-emerald-500 px-1.5 py-0.5 text-xs text-white sm:inline">{sessions.length}</span>}
            </button>
          ))}
        </div>

        <div key={tab} className="u-tab">
        {(tab === "clubs" || tab === "parties") && (
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="u-chips flex min-w-0 flex-1 gap-2 pb-1 pr-4">
              {(tab === "clubs" ? CLUB_FILTERS : PARTY_FILTERS).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${filter === f ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200/50 bg-white shadow-sm text-slate-600 hover:border-slate-300"}`}>{f}</button>
              ))}
            </div>
            {tab === "parties" && (
              <button onClick={hostEvent} className="u-btn mb-1 shrink-0 whitespace-nowrap rounded-xl bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 sm:px-4">+ Host event</button>
            )}
          </div>
        )}
        {tab === "parties" && (
          <div className="u-chips -mt-2 mb-5 flex items-center gap-2 pb-1 pr-4" role="group" aria-label="Filter by event language">
            <span className="inline-flex shrink-0 items-center gap-1 pr-1 text-xs font-semibold uppercase tracking-wider text-slate-400"><Icon name="globe" className="h-3.5 w-3.5" /> Language</span>
            {["All", ...feedLangs].map((l) => {
              const n = l === "All" ? parties.length : parties.filter((p) => p.lang === l).length;
              const on = langFilter === l;
              return (
                <button key={l} onClick={() => setLangFilter(l)} aria-pressed={on}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${on ? "bg-sky-600 text-white ring-sky-600" : "bg-white text-slate-600 shadow-sm ring-slate-200/60 hover:bg-slate-50"}`}>
                  {l === "All" ? "All languages" : l}<span className={on ? "text-sky-100" : "text-slate-400"}>{n}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Clubs */}
        {tab === "clubs" && (
          <>
            {user && <p className="mb-4 text-sm text-slate-500">{myClubs === 0 ? "You haven't joined any teams or clubs yet." : `You're in ${myClubs} ${myClubs > 1 ? "teams & clubs" : "team or club"}${myPending ? ` · ${myPending} pending approval` : ""}.`}</p>}
            <div className="grid gap-4 md:grid-cols-2">
              {filteredClubs.map((c, i) => (
                <ClubCard key={c.id} c={c} i={i} members={memberCount(c)}
                  open={cardOpen(() => setModal({ type: "club", id: c.id }))}
                  button={(onPhoto) => clubBtn(c, "shrink-0 px-4 py-2", onPhoto)} />
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
                  <PartyCard key={p.id} p={p} i={i} open={cardOpen(() => setModal({ type: "detail", id: p.id }))} onShare={() => shareEvent(p)}
                    actions={<>{partyBtn(p, "flex-1")}<button onClick={() => setModal({ type: "detail", id: p.id })} className="u-btn rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Details</button></>} />
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
            <div className="rounded-3xl border border-slate-200/50 bg-white px-6 py-14 text-center shadow-sm">
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
              reviews={submissions.filter((sub) => reviewOf(sub) !== "rejected").map((sub) => ({ ...sub, status: reviewOf(sub), left: reviewLeft(sub) }))}
              onOpenReview={openOwn}
              onOpenTicket={(b) => setModal({ type: "ticket", booking: b })}
              onBrowse={changeTab}
              onExport={() => { downloadCalendar(sessions, bookings); notify("Calendar file saved. Open it to add your schedule to Google, Apple or Outlook Calendar.", 3600); }}
            />
          ))}

        {/* My events (hosts only) */}
        {tab === "events" && showMyEvents && <MyEvents items={myEventItems} onOpen={openOwn} onHost={hostEvent} />}

        {/* My tickets */}
        {tab === "tickets" &&
          (!user ? (
            <div className="rounded-3xl border border-slate-200/50 bg-white shadow-sm px-6 py-14 text-center">
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
                      <button key={b.id} onClick={() => setModal({ type: "ticket", booking: b })} className="u-card flex items-center gap-4 rounded-2xl border border-slate-200/50 bg-white shadow-sm p-4 text-left">
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
                        <button key={id} onClick={() => setModal({ type: "waitlist", party: p, pos, email: user })} className="u-card flex items-center gap-4 rounded-2xl border border-slate-200/50 bg-white shadow-sm p-4 text-left">
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
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Hosting</h3>
                {submissions.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200/50 bg-white shadow-sm p-5 text-sm text-slate-500">
                    Want to run your own party or meetup? The admin team reviews every application for safety.
                    <button onClick={hostEvent} className="ml-1 font-semibold text-indigo-600 hover:underline">Host an event</button>
                  </div>
                ) : (
                  <button onClick={() => changeTab("events")} className="u-card flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200/50 bg-white p-4 text-left text-sm shadow-sm">
                    <span><span className="font-semibold text-slate-900">Your events moved to My Events</span><span className="block text-slate-500">Pending moderation and live events, side by side.</span></span>
                    <span className="font-semibold text-indigo-600">Open →</span>
                  </button>
                )}
              </section>
            </div>
          ))}

        </div>

        <footer className="mt-12 text-center text-xs text-slate-400">
          {!isStandalone() && <div className="mb-6"><GetAppBadges heading="Get the Unite app" /></div>}
          Unite · uniteuow.com · A student-built platform for UOWD · Payments via Ziina (demo mode)
          <p className="mt-2 text-[11px] text-slate-400/80">{versionLabel()}</p>
        </footer>
      </main>

      <InstallBanner />

      {/* Modals */}
      {modal && modal.type === "auth" && <AuthModal reason={modal.reason} onClose={closeModal} onSignIn={signIn} />}
      {modal && modal.type === "create" && (
        <CreateModal email={modal.email} onClose={closeModal} onSubmitted={submitParty} />
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
          status={statusOf(clubs.find((x) => x.id === modal.id))}
          action={(() => {
            const c = clubs.find((x) => x.id === modal.id);
            const st = statusOf(c);
            if (st === "pending")
              return (
                <div className="space-y-2.5">
                  <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-200">
                    <span aria-hidden="true">⏳</span>
                    <span>Student Services is processing your tryout form. This usually takes about 24 hours (~{pendingHours(c)}h left). Your sessions already show in My Schedule as pending.</span>
                  </p>
                  <div className="flex gap-2">
                    <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-50 py-3 text-sm font-semibold text-amber-700 ring-1 ring-amber-200">⏳ Pending approval</span>
                    <button onClick={() => askLeave(c)} className="u-btn rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-rose-600">Cancel request</button>
                  </div>
                </div>
              );
            if (st === "joined")
              return (
                <div className="flex gap-2">
                  <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200"><Check className="h-4 w-4" /> Registered · in My Schedule</span>
                  <button onClick={() => askLeave(c)} className="u-btn rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-rose-600">Leave</button>
                </div>
              );
            return clubBtn(c, "w-full py-3");
          })()}
          onShare={shareClub}
          onClose={closeModal}
        />
      )}
      {modal && modal.type === "review" && submissions.find((x) => x.ref === modal.ref) && (() => {
        const sub = submissions.find((x) => x.ref === modal.ref);
        return <ReviewModal sub={sub} r={{ ...sub, status: reviewOf(sub), left: reviewLeft(sub) }} onClose={closeModal} />;
      })()}
      {modal && modal.type === "leave" && clubs.find((x) => x.id === modal.id) && (
        <LeaveConfirm
          club={clubs.find((x) => x.id === modal.id)}
          pending={statusOf(clubs.find((x) => x.id === modal.id)) === "pending"}
          onConfirm={() => leaveClub(clubs.find((x) => x.id === modal.id))}
          onCancel={() => setModal({ type: "club", id: modal.id })}
        />
      )}
      {modal && modal.type === "tryout" && clubs.find((x) => x.id === modal.id) && (() => {
        const c = clubs.find((x) => x.id === modal.id);
        return (
          <TryoutModal
            club={c}
            onSent={() => { closeModal(); registerClub(c, true); }}
            onClose={closeModal}
          />
        );
      })()}
      {modal && modal.type === "ticket" && <Modal onClose={closeModal}><Ticket booking={modal.booking} justPaid={modal.justPaid} onClose={closeModal} onDownload={handleDownload} /></Modal>}
      {modal && modal.type === "waitlist" && (
        <WaitlistModal party={modal.party} pos={modal.pos} email={modal.email} fresh={modal.fresh} onClose={closeModal} onLeave={() => leaveWaitlist(modal.party)} />
      )}

      {updateReady && (
        <div className="u-keep pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4" style={{ bottom: "calc(1rem + var(--sab))" }}>
          <div role="status" className="u-up pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl py-2.5 pl-4 pr-2 text-sm text-white shadow-2xl ring-1 ring-white/10" style={glassDark}>
            <span className="min-w-0 flex-1 font-semibold">New version available</span>
            <button onClick={applyUpdate} className="shrink-0 rounded-xl bg-crimson-700 px-4 py-2 font-semibold text-white active:scale-95">Update</button>
            <button onClick={() => setUpdateReady(false)} aria-label="Later" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400">✕</button>
          </div>
        </div>
      )}

      {toast && (
        <div className="u-safe-toast pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4">
          <div key={typeof toast === "string" ? toast : toast.title + toast.body} role="status" className="u-up flex max-w-sm items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-xl" style={glassDark}>
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500"><Check className="h-3 w-3" /></span>
            {typeof toast === "string" ? <span>{toast}</span> : <span><span className="block font-bold">{toast.title}</span><span className="block font-normal text-slate-200">{toast.body}</span></span>}
          </div>
        </div>
      )}

    </div>
  );
}
