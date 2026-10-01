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
- Sign in: any `@uowdubai.ac.ae`, `@uowmail.edu.ae` or `@uowmail.edu.au` email, OTP code **1234**.
- Payments: simulated Ziina checkout, no real charge.
- Data (clubs, events, waitlists, tickets) lives in memory and resets on refresh.

## Before going live
- Real OTP email delivery and server-side domain check (e.g. Supabase Auth, Auth0, or your own API).
- Real Ziina payment links created server-side, confirmed by webhook.
- A database for events, bookings, waitlists and admin approval of submitted events.
- Replace demo clubs/events/floor plan with real UOWD data.
