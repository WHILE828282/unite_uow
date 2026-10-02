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
"Submit Party Application" POSTs the pitch to `/api/pitch` (a Vercel serverless function in `api/pitch.js`), which formats it and sends it with the Telegram Bot API to the admin chat (`TELEGRAM_CHAT_ID`, default `8951261399`), followed by the cover and logo as photos. Delivery is fail-safe: the student always sees "Application Submitted!". If Telegram rejects a photo, the text pitch still goes through with a note; if the text itself is rejected, Telegram's exact error and the full pitch are written to the Vercel function logs.

Setup (one time):
1. In Vercel → Project → Settings → Environment Variables, add `TELEGRAM_BOT_TOKEN` (the token from @BotFather) for Production and Preview, then redeploy.
2. From the admin Telegram account (the chat id in `TELEGRAM_CHAT_ID`), open the bot and press **Start** once; bots can't message a user who hasn't started them.

**Check the setup:** open `https://<your-site>/api/pitch` in a browser. It reports whether the token is set and valid, the bot's username, and whether it can reach the admin chat (it never shows the token). `"help": "All set: party pitches will be delivered."` means it's working.

The token is read only on the server. Never put it in `App.jsx` or any frontend file: everything shipped to the browser is public.

## Before going live
- Real OTP email delivery and server-side code check (e.g. Supabase Auth, Auth0, or your own API).
- Real Ziina payment links created server-side, confirmed by webhook.
- A database for events, bookings, waitlists and admin approval of submitted events.
- Replace demo clubs/events/floor plan with real UOWD data.

## Email sign-in (Resend)

Campus Login offers two paths:

- **Send verification code** (live): `/api/otp` (`api/otp.js`) emails a real 6-digit code with Resend and checks it. Codes expire after 10 minutes and the form allows 5 tries per code. No database is needed: the server returns a signed challenge (HMAC) that only matches the right code for that email.
- **Continue with a demo account**: the one-tap walkthrough for judges and quick reviews; any 4-digit code (e.g. 1234) works.

Setup in Vercel → Settings → Environment Variables, then redeploy:

- `RESEND_API_KEY` (required).
- `RESEND_FROM` (optional), e.g. `Unite <login@yourdomain.com>`. Until a domain is verified in Resend, the default sender `onboarding@resend.dev` can only deliver to the email address that owns the Resend account; other addresses get a clear message pointing to the demo account.
- `OTP_SECRET` (optional): signing key for the challenge; defaults to one derived from the Resend key.

Party pitches sent to Telegram say whether the organizer verified their email or used the demo login.

## Moderation buttons and My Events

Each party application arrives in the admin Telegram chat with three buttons under the photo: **✅ Approve**, **🔍 Additional Check** and **❌ Reject**. A click calls the webhook `/api/telegram`, which saves the status (`approved`, `under_review` or `rejected`) in the database and marks the chosen button with who decided and when. Decisions can be changed by tapping another button.

- Approved events appear on Student Parties for everyone (`GET /api/events`; no email or Student ID is ever exposed).
- The organizer's **My Events** tab (shown once they've applied) splits their events into **Pending Moderation** and **Live Events** and updates every 15 seconds.

**One-time setup — connect a database:** Vercel → your project → **Storage** → **Create Database** → **Upstash for Redis** (free) → **Connect** to the project, then redeploy. It adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`). Then open `https://<your-site>/api/pitch`: it registers the Telegram webhook and should say "Moderation buttons are on."

Without a database, pitches still reach Telegram (without buttons) and the app keeps its 2-hour demo review.

## Installable app (PWA)

Built with `vite-plugin-pwa` (`vite.config.js`): manifest "Unite · UOWD", standalone, portrait, navy `#0a192f`; icons in `public/icons/`.

- **Updates:** `registerType: "autoUpdate"`. Each Vercel deploy ships a new `sw.js` (served with no-cache headers from `vercel.json`) that activates on its own.
- **Caching:** the app shell, JS/CSS, icons and photos are precached. `/api/*` is always network-only (OTP, pitches, moderation, events). Navigations fall back to `index.html`, so `/events/7` and `/sports/basketball` open from the home screen.
- **Install prompt:** Chrome/Android shows an "Install Unite" banner; iPhone Safari shows "tap Share, then Add to Home Screen". Neither appears inside the installed app, and dismissing hides it for 30 days.
- **Safe areas:** header, bottom sheets, full-screen forms and toasts respect the notch and home bar (`--sat`/`--sab` in `index.css`).
