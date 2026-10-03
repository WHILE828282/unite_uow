# Unite — working rules
- Stack: React 18 + Vite + Tailwind 3, Vercel functions in /api, live site uniteuow.com.
- Do only what the task asks. Don't refactor, rename or "improve" anything else.
- Before finishing, run only `npm run build`. Do NOT run Playwright, browser tests, screenshots or device checks unless I explicitly ask.
- Don't re-read files you have already read in this session unless they changed.
- Reply briefly: what you changed (files) and anything I must do. No long reports.
- Commit and push to main when the build passes.

## File map
- `main.jsx`, `install.js`, `updates.js`, `index.css` (root): entry point, install prompt, service worker updates, global CSS.
- `src/App.jsx`: app shell: state, effects, actions, hero, tab routing and modal routing.
- `src/components/`: header, tabs, cards, ticket, shared UI bits, GetApp badges; `modals/` holds every sheet/dialog.
- `src/pages/`: one file per tab or page: TeamsClubs, Events, MySchedule, MyTickets, MyEvents, HostEvent (create form), Install (/install).
- `src/data/`: demo clubs (with hero art), demo events, filter/option lists.
- `src/lib/`: helpers: formatting, maps links, events/moderation, schedule, QR, downloads, clipboard, styles, version.
