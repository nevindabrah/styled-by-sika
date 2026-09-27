# Styled by Sika

Braiding website for Amewusika Amedeker in Vaughan, Ontario. One page (menu, policies, contact) plus online booking, built with Next.js 15, React 19 and Supabase.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and [docs/](docs/) for context, decisions and the go-live checklist.

## Run the full demo

```bash
npm install
npm run demo:build
npm run demo
```

Open http://localhost:3002 (or http://127.0.0.1:3002).

The production demo uses its own `.next-demo` build folder, so it does not conflict with a development server. Fonts and reference photos are hosted locally.

For development, use `npm run dev` and open the port printed in the terminal. Development uses live-service code by default; simulated bookings require explicit demo mode. Run only one development server per workspace.

## How the site is organized

The public site is one page plus a booking page. Old links (`/pricing`, `/styles/...`, `/gallery`, `/policies`, `/faq`, `/contact`, `/about`) redirect to the matching section.

- `/` — welcome, the service menu (tap a category to open its options, each with price, time, hair needed and a Book button), add-ons, booking policies, and contact. Phones and tablets get a floating Book bar whenever no other Book button is on screen.
- `/book?service=<slug>&extras=<slug,slug>` — the booking page, pre-filled from the menu. When online booking is off, it shows the price and sends the request to Sika by Instagram DM or email with the details filled in.

Everything Sika wrote lives in two files: `lib/menu.ts` (services, durations, prices, hair, add-ons) and `lib/business.ts` (welcome, deposit, payment, cancellation, hair prep, contact). Edit those to change the website.

## Demo walkthrough

1. Scroll to the menu, tap a category to open it, then tap **Book** on a service.
2. Add an extra, then choose a sample day/time. Enter a sample name, phone, and an `example.com` email. Agree to the policies, review, and confirm.
3. Download the sample calendar file or open the demo dashboard from the confirmation screen.
4. In the dashboard, open Bookings and find the sample client. Mark a deposit paid, save a private note, or cancel with confirmation.
5. Open Settings to change the weekly hours or block a day, then start another booking: only the times she allows appear, and any booked appointment (plus her 30-minute break) is gone from the calendar.

Demo bookings are stored in browser session storage and last for that tab's session. They never create Google Calendar events, send emails, or collect deposits. Appointment times and sample clients are demonstration data; prices are Sika's real menu.

## Checks

- `npm run typecheck`
- `npm run demo:build`
- `npm run test:e2e` (build the demo first; uses installed Google Chrome on macOS, or set `CHROME_PATH`)

Browser tests cover every route at 390px, 768px, and 1440px, the complete menu and policies text, redirects from old pages, section navigation and collapsible categories, the phone Book bar, menu-to-booking handoff with extras and price ranges, booking validation and confirmation, calendar download, dashboard actions, admin protection, 404 pages, and theme persistence. Unit tests cover pricing (fixed, ranged and open-ended extras) and the database migration.

## Live launch still needs configuration

See `docs/GOING-LIVE.md`, `.env.example`, `supabase/schema.sql` and `supabase/migrations/`. Live booking stays off until credentials and working hours are configured. Until then the booking page sends requests to Sika by Instagram or email. Create the braider's Supabase account and configure `ADMIN_EMAIL`; real `/admin` routes remain protected. The public demo dashboard is separate at `/demo/admin` and is unavailable when demo mode is off.

Live Google Calendar, Supabase, Resend, and rate-limit integration have not been verified against real accounts. Database seeding and configuration checks are available through `npm run db:seed` and `npm run check:launch`; real account verification and retry scheduling remain launch work. This build is ready to publish as a menu-and-request site; calendar-based online booking is separate launch work.

Sika's portrait and knotless photographs are installed. The portrait has a separate shadow-retouched copy; the original is preserved. Photo provenance is documented in `docs/PHOTO-CREDITS.md`.
