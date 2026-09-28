# Styled by Sika

The booking website for **Styled by Sika**, a braider in Vaughan, Ontario. Clients browse the menu and prices, pick an open time and book; Sika runs everything else (prices, services, photos, wording and availability) from her own dashboard.

| | |
| --- | --- |
| **Live site** | https://styled-by-sika.vercel.app |
| **Book an appointment** | https://styled-by-sika.vercel.app/book |
| **Braider dashboard** | https://styled-by-sika.vercel.app/login (styledbysika@gmail.com only) |
| **Hosting** | [Vercel project](https://vercel.com/nevindabrahs-projects/styled-by-sika) · deploys automatically from `main` |
| **Database & sign-in** | [Supabase project](https://supabase.com/dashboard/project/ioczatwmjnkwaxshycid) (Canada Central) |
| **Owner's manual** | [docs/OWNER-GUIDE.md](docs/OWNER-GUIDE.md) |

## What it does

**For clients**
- One page: welcome, a collapsible service menu (price, time, hair needed, photos that enlarge), add-ons, booking policies and contact.
- Calendly-style booking: choose a service and extras, pick a day, then a start time. Times come from Sika's start windows, every 30 minutes, whatever the length of the style; appointments never overlap and each is followed by her break.
- A **Booking confirmed** screen with two steps: send the pre-written booking to Styled by Sika (text, Instagram or email) and send the deposit.

**For Sika** (`/admin`, see the [owner's guide](docs/OWNER-GUIDE.md))
- **Website:** every piece of text, her photo, categories, services and prices, add-ons and category photos.
- **Availability:** a week planner for any week up to a year ahead, her usual week, booking rules (break, notice, how far ahead) and blocked dates.
- **Bookings / Clients:** deposits, completions, no-shows, cancellations and private notes.
- Her password, with "Forgot your password?" by email.

Built-in, switched on later by adding keys: confirmation emails (Resend), texts (Twilio), reminders 24 hours and 2 hours before, and Google Calendar sync.

## Tech

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage, pg_cron) · Vercel · Vitest + PGlite · Playwright.

## Working on it

```bash
nvm use                 # Node 22
npm install
cp .env.example .env.local
```

| Command | What it does |
| --- | --- |
| `npm run demo:build && npm run demo` | Self-contained demo on http://localhost:3002 with sample bookings and a demo dashboard at `/demo/admin`. Nothing touches the real database. |
| `npm run dev` | Development server. **With Supabase keys in `.env.local` this uses the live database**, so use the demo for experiments. |
| `npm run typecheck` · `npm run test:unit` · `npm run test:e2e` | Checks. Browser tests need the demo build and run at phone, tablet and laptop sizes. |
| `npm run db:migrate` | Applies `supabase/schema.sql` and every migration in order; safe to rerun. |
| `npm run db:seed` | Loads the default menu, text and photos; never overwrites her edits. |
| `npm run admin:create -- <email>` | Creates or updates her sign-in and prints a one-time sign-in link (set `NEXT_PUBLIC_SITE_URL` to the live address first). |
| `npm run cron:setup -- <site>` | Schedules the 10-minute reminder/retry check in Supabase. |
| `npm run env:vercel -- <site>` | Writes `.env.vercel` (git-ignored) with the variables Vercel needs, without printing values. |
| `npm run check:launch` | Lists anything missing for live booking. |

## Deploying

Push to `main`. GitHub Actions runs the typecheck, unit tests, build and browser tests, and Vercel deploys the same commit to https://styled-by-sika.vercel.app. Environment variables live in Vercel (Settings → Environment Variables); `NEXT_PUBLIC_*` values need a redeploy after changing. Apply database migrations with `npm run db:migrate` **before** pushing code that needs them.

## Docs

- [OWNER-GUIDE.md](docs/OWNER-GUIDE.md): Sika's manual for the dashboard
- [GOING-LIVE.md](docs/GOING-LIVE.md): services, keys, and what's set up versus optional
- [CONTRIBUTING.md](CONTRIBUTING.md): where things live, conventions, before-you-push checks
- [CONTEXT.md](docs/CONTEXT.md): current state of the system
- [DECISIONS.md](docs/DECISIONS.md): why things are the way they are
- [ADDING-PHOTOS.md](docs/ADDING-PHOTOS.md) · [PHOTO-CREDITS.md](docs/PHOTO-CREDITS.md)

## License

All rights reserved. See [LICENSE](LICENSE).
