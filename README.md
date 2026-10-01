# Unite · uniteuow.com

Clubs, student events, tickets and a live campus map for UOWD students.
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
- Sports sections (Football, Basketball, Volleyball, Cricket, Table Tennis & Badminton, Padel & Tennis, Chess): 'Register · tryouts' opens UOWD's official Sports Tryouts Jotform (https://uowd.jotform.com/251912229886062) embedded in the app; answers go straight to UOWD.
- Other clubs: joining opens a weekly time-slot picker; chosen sessions and booked events appear in **My Schedule** (exportable as an .ics calendar file).
- Data (clubs, events, waitlists, tickets, schedules) lives in memory and resets on refresh.

## Before going live
- Real OTP email delivery and server-side code check (e.g. Supabase Auth, Auth0, or your own API).
- Real Ziina payment links created server-side, confirmed by webhook.
- A database for events, bookings, waitlists and admin approval of submitted events.
- Replace demo clubs/events/floor plan with real UOWD data.
