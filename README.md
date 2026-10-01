# Unite · uniteuow.com

Official teams and clubs, student events, tickets and a personal weekly schedule for UOWD students.
React 18 + Vite + Tailwind CSS 3. Everything is client-side demo data for now.

## Run locally
```bash
npm install
npm run dev
```

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project → Import** the repo (framework preset: Vite, detected automatically).
3. Deploy. `vercel.json` rewrites every path to `index.html`, so shared links like `/events/7` open the event.
4. Add the domain: **Project → Settings → Domains → uniteuow.com**.

## Demo behaviour
- Sign in: any valid email address (university, Gmail, iCloud…), optional Student ID, then any 4-digit code (e.g. **1234**).
- Payments: simulated Ziina checkout, no real charge.
- Sports sections (Football, Basketball, Volleyball, Cricket, Table Tennis & Badminton, Padel & Tennis, Chess, Track & Swimming): 'Register · tryouts' opens UOWD's official Sports Tryouts Jotform (https://uowd.jotform.com/251912229886062) embedded in the app, with the matching sport(s) pre-selected via `?sport=Football` style URL parameters; answers go straight to UOWD.
  - **Pre-fill setup:** set `JOTFORM_SPORT_FIELD` in `App.jsx` to the sports checkbox's *Unique Name* (Jotform builder → click the field → gear icon → Advanced → Field Details). Option labels must match the form exactly: Badminton, Basketball, Cricket, Football, Volleyball, Table Tennis, Track, Padel, Tennis, Swimming, Chess.
- Each team/club has one fixed official weekly schedule. Sports: tapping "I've submitted the form" in the tryouts modal adds it to **My Schedule**; other clubs: "Join club" adds it in one tap. My Schedule is a weekly timeline with month/year pickers and previous/next week navigation (exportable as an .ics calendar file).
- Hosting: the 4-step form (Basics, Time & place, Details, Contacts) collects Venue Name, an optional Google Maps URL (opened in English), and WhatsApp / Telegram / email contacts. Submitted parties sit in a 2-hour admin safety review ("⏳ Party Under Review" in My Schedule and My Tickets), then go live on Student Parties with contact buttons.
- Data (clubs, events, waitlists, tickets, schedules, party applications) lives in memory and resets on refresh.

## Before going live
- Real OTP email delivery and server-side code check (e.g. Supabase Auth, Auth0, or your own API).
- Real Ziina payment links created server-side, confirmed by webhook.
- A database for events, bookings, waitlists and admin approval of submitted events.
- Replace demo clubs/events/floor plan with real UOWD data.
