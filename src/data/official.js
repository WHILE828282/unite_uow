/* Official UOWD events (Student Life, Careers and the clubs), October 2026. All free with RSVP.
   This list seeds the database on deploy (source "official", refs OFF-<n>); the feed reads them from /api/events and
   falls back to this copy when the server can't be reached. Times are Dubai time (HH:MM, 24 h); no start = all day.
   endDate marks multi-day events (shown once, "All day · until …"). featured: in "Featured this week". */
import { CLUBS } from "./clubs.js";

export const OFFICIAL = [
  // Mon 5 Oct
  { n: 1, date: "2026-10-05", title: "UOWD x ProPath Program", host: "UOWD Careers", category: "Career", desc: "Kick-off of the UOWD x ProPath career programme: mentoring, skills sessions and industry connections." },
  { n: 2, date: "2026-10-05", title: "eSports Campus Masters MENA Season 2", club: 13, category: "Gaming", desc: "UOWD competes in the regional Campus Masters eSports league. Come watch and cheer for the campus teams." },
  { n: 3, date: "2026-10-05", start: "14:00", end: "16:00", title: "Mafia (Psychology Edition)", club: 29, where: "Function Room, 6th Floor", category: "Social", desc: "The classic game of bluffing and deduction, with a psychology twist: read the room and spot the liars." },
  { n: 4, date: "2026-10-05", start: "16:30", end: "18:30", title: "Everything About LLMs", club: 12, where: "Function Room", category: "Tech", desc: "How large language models work, what they're good at and where they fail, with live demos." },
  // Tue 6 Oct
  { n: 5, date: "2026-10-06", start: "10:00", end: "16:00", title: "Red Bull Wings Cup Qualifier (EA FC 27)", club: 13, where: "5th Floor Student Lounge", category: "Gaming", desc: "EA FC 27 qualifier for the Red Bull Wings Cup. Bring your best squad." },
  { n: 6, date: "2026-10-06", start: "10:00", end: "16:00", title: "VALORANT 1v1 & Aimlabs Challenge by LAMZU", club: 13, where: "XP Arena (5.07, 5th Floor Student Lounge)", category: "Gaming", desc: "1v1 VALORANT duels and an Aimlabs accuracy challenge, with prizes from LAMZU." },
  { n: 7, date: "2026-10-06", title: "Breast Cancer Awareness and Screening Event", host: "UOWD Student Life", category: "Wellbeing", desc: "Awareness talks and free screening with the Pink Caravan on campus." },
  { n: 8, date: "2026-10-06", start: "12:30", end: "15:00", title: "The Valuation Games – M&A Simulation", club: 17, where: "Function Room", category: "Business", desc: "Teams value companies and negotiate deals in a hands-on mergers & acquisitions simulation." },
  { n: 9, date: "2026-10-06", start: "14:30", end: "16:30", title: "Sink Or Pitch", club: 30, where: "Ground Floor Exhibition Hall", category: "Business", desc: "Pitch your idea, defend it under pressure and see if it sinks or swims." },
  { n: 10, date: "2026-10-06", start: "15:00", end: "18:00", title: "CV Building & ATS Formatting Workshop", club: 31, where: "Function Room", category: "Career", desc: "Build a CV that gets past applicant tracking systems and in front of recruiters." },
  { n: 11, date: "2026-10-06", start: "15:30", end: "16:30", title: "Case Closed: The HR Files", club: 20, where: "6.32 Classroom B", category: "Business", desc: "Solve real workplace HR cases in teams, from hiring dilemmas to conflict resolution." },
  { n: 12, date: "2026-10-06", start: "16:30", end: "18:30", title: "STEM Crafts", club: 33, where: "Old Student Lounge, First Floor", category: "Tech", desc: "Hands-on crafts with a science twist. All materials provided." },
  // Wed 7 Oct
  { n: 13, date: "2026-10-07", start: "10:00", end: "17:00", title: "UOWD Career Fair 2026", host: "UOWD Careers", where: "DKP Conference Centre", category: "Career", featured: true, desc: "Meet leading employers hiring for internships and graduate roles. Bring your CV and dress smart." },
  { n: 14, date: "2026-10-07", start: "16:30", end: "18:30", title: "Pick a Side", club: 25, where: "MPR, 5th Floor", category: "Arts", desc: "Anime debates where you pick a side and defend it. Hot takes encouraged." },
  { n: 15, date: "2026-10-07", start: "16:30", end: "18:30", title: "Oil Pastel Bouquets Workshop", club: 24, where: "5.18 Classroom A", category: "Arts", desc: "Draw vibrant flower bouquets with oil pastels. No experience needed, materials provided." },
  // Thu 8 – Sun 11 Oct
  { n: 16, date: "2026-10-08", endDate: "2026-10-11", title: "Asian Vanguard Art & Design Exhibition", host: "UOWD", category: "Arts", desc: "Contemporary art and design from emerging Asian artists, on show across four days." },
  // Thu 8 Oct
  { n: 17, date: "2026-10-08", start: "11:00", end: "13:00", title: "Marketing Mastery Series: Brand Like a Pro", club: 18, where: "Function Room", category: "Business", desc: "How strong brands are built, with practical exercises to sharpen your own." },
  { n: 18, date: "2026-10-08", start: "14:00", end: "16:00", title: "From Classroom to Career", club: 32, where: "Function Room, 6th Floor", category: "Career", desc: "Graduates and recruiters share how to turn your degree into your first job." },
  { n: 19, date: "2026-10-08", start: "14:00", end: "18:00", title: "Game Fest", club: 15, where: "Old Student Lounge, First Floor", category: "Gaming", featured: true, desc: "An afternoon of console, PC and board games, tournaments and prizes. Drop in any time." },
  { n: 20, date: "2026-10-08", start: "16:30", end: "18:30", title: "Murder Mystery", club: 28, where: "6.38 Classroom B", category: "Arts", desc: "Play a character, follow the clues and find the killer before the night is over." },
  { n: 21, date: "2026-10-08", start: "16:30", end: "18:30", title: "Vibe Coding & Prompting", club: 12, where: "4.50 Classroom B", category: "Tech", desc: "Build a small app with AI pair-programming and learn to write prompts that actually work." },
  { n: 22, date: "2026-10-08", start: "16:30", end: "18:30", title: "Open Mic", club: 21, where: "5th Floor MPR", category: "Music", featured: true, desc: "Sing, play, rap or read: the stage is open to everyone. Sign up on the night." },
  // Sat 10 Oct
  { n: 23, date: "2026-10-10", start: "10:00", end: "13:00", title: "UOWD Future of Finance and Business Forum", host: "UOWD", category: "Business", desc: "Industry leaders on where finance and business are heading, with Q&A." },
  { n: 24, date: "2026-10-10", start: "16:30", end: "19:30", title: "Semester-Opening Convoy Drive & Recruitment", club: 14, category: "Social", desc: "The Car Club's semester-opening convoy drive, plus recruitment for new members." },
  // Mon 12 Oct
  { n: 25, date: "2026-10-12", title: "World Mental Health Day Event", host: "UOWD Student Life", category: "Wellbeing", desc: "Activities, talks and support services for World Mental Health Day." },
  // Thu 15 Oct
  { n: 26, date: "2026-10-15", title: "UOWD XP eSports Photoshoot & Induction Day", club: 13, where: "5th Floor Student Lounge & XP Arena", category: "Gaming", desc: "Team photoshoot and induction for the UOWD XP eSports roster." },
  // Fri 16 – Sat 31 Oct
  { n: 27, date: "2026-10-16", endDate: "2026-10-31", title: "Young Entrepreneurship Competition (YEC), 4th Edition", host: "UOWD", category: "Business", desc: "UOWD's startup competition for young founders: pitch, get mentored and compete for prizes." },
  // Tue 20 – Thu 22 Oct
  { n: 28, date: "2026-10-20", endDate: "2026-10-22", title: "Graduation", host: "UOWD", category: "Social", desc: "Celebrating the UOWD graduating class." },
  // Sat 31 Oct
  { n: 29, date: "2026-10-31", title: "Open Day", host: "UOWD", category: "Social", desc: "Prospective students and families visit campus, meet faculty and tour the facilities." },
];

// Feed ids for official events never clash with built-in (small numbers) or student events (timestamps).
export const OFFICIAL_ID = (n) => 9000 + n;
export const officialRef = (n) => `OFF-${n}`;
export const clubOf = (o) => (o.club ? CLUBS.find((c) => c.id === o.club) : null);
