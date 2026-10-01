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
- Each team/club has one fixed official weekly schedule. 'Register' on any team or club opens the official UOWD form in the dark modal; after "I've submitted the form" the registration is pending (~24h Student Services processing) and its sessions appear in **My Schedule**, a weekly timeline with month/year pickers and previous/next week navigation (exportable as an .ics calendar file).
- Hosting: a single-scroll form (Artwork, The event, When & where, Details, Organizer contacts) collects Venue Name, an optional Google Maps URL (opened in English), and WhatsApp / Telegram / email contacts. Submitted parties sit in a 2-hour admin safety review ("⏳ Party Under Review" in My Schedule and My Tickets), then go live on Student Parties with contact buttons.
- Event artwork: one photo dropzone in the host form (click or drag a JPG/PNG/WebP, max 10 MB, at least 800×450). It is centre-cropped in the browser to a 1600×900 WebP cover and a 512×512 logo; the logo can be swapped separately.
- Share buttons copy `<site>/events/<id>`, which opens that event directly.
- Data (clubs, events, waitlists, tickets, schedules, party applications) lives in memory and resets on refresh.

## Telegram moderation (party pitches)
"Submit Party Application" POSTs the pitch to `/api/pitch` (a Vercel serverless function in `api/pitch.js`), which formats it and sends it with the Telegram Bot API to the admin chat `8878768622`, followed by the cover and logo as photos. The form only closes once Telegram confirms delivery.

Setup (one time):
1. In Vercel → Project → Settings → Environment Variables, add `TELEGRAM_BOT_TOKEN` (the token from @BotFather) for Production and Preview, then redeploy.
2. From the admin Telegram account (chat id 8878768622), open the bot and press **Start** once; bots can't message a user who hasn't started them.

**Check the setup:** open `https://<your-site>/api/pitch` in a browser. It reports whether the token is set and valid, the bot's username, and whether it can reach chat 8878768622 (it never shows the token). `"help": "All set: party pitches will be delivered."` means it's working.

The token is read only on the server. Never put it in `App.jsx` or any frontend file: everything shipped to the browser is public.

## Before going live
- Real OTP email delivery and server-side code check (e.g. Supabase Auth, Auth0, or your own API).
- Real Ziina payment links created server-side, confirmed by webhook.
- A database for events, bookings, waitlists and admin approval of submitted events.
- Replace demo clubs/events/floor plan with real UOWD data.
