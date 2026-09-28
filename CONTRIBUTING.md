# Working on Styled by Sika

## Setup

```bash
nvm use            # Node 22 (see .nvmrc)
npm install
cp .env.example .env.local
```

`npm run demo:build && npm run demo` runs a self-contained demo on http://localhost:3002. Demo bookings, availability and website edits live only in the browser tab and never touch real services.

`npm run dev` runs against whatever `.env.local` points to. With the Supabase keys filled in, that is **the live database she uses**, so try changes in the demo first.

## Where things live

| Change | File |
| --- | --- |
| Content model, validation and the edit operations | `lib/content.ts` |
| Defaults that seed the database (menu, text, photos) | `lib/menu.ts`, `lib/business.ts`, `lib/work-photos.ts` |
| Landing page, header, footer | `components/landing-page.tsx`, `components/header.tsx`, `components/footer.tsx` |
| Service menu, photo viewer | `components/menu-accordion.tsx`, `components/photo-viewer.tsx` |
| Booking flow, service chooser, calendar loading | `components/booking-flow.tsx`, `components/service-picker.tsx`, `components/calendar-loading.tsx` |
| Start-time rules (start windows, 30-minute starts, no overlaps, break) | `lib/availability.ts` |
| Availability from the database, a month at a time | `lib/live-availability.ts`, `app/api/availability/route.ts` |
| Dashboard: website editor | `components/content-editor.tsx`, `app/api/admin/content/route.ts` |
| Dashboard: week planner, usual week, rules, blocked time | `components/availability-editor.tsx`, `app/api/admin/availability/route.ts` |
| Sign-in, one-time links, password | `app/api/auth/route.ts`, `app/auth/confirm/page.tsx`, `app/api/auth/confirm/route.ts`, `components/login-form.tsx` |
| Reminders and messages (email/text) | `lib/reminder-rules.ts`, `lib/reminders.ts`, `lib/notify.ts`, `lib/jobs.ts` |
| Motion (scroll reveal, press feedback) | `lib/use-reveal.ts`, end of `app/globals.css` |
| Database | `supabase/schema.sql`, then `supabase/migrations/` in order |

Content Sika supplies is used exactly as sent. Don't invent prices, times or policy wording; if something is missing, leave it out and ask. Anything she may want to change belongs in her dashboard, not in code.

## Database changes

Add a new numbered file in `supabase/migrations/` (never edit one that has been applied), add it to `tests/unit/database.test.ts`, and run `npm run db:migrate` against the live project **before** pushing code that depends on it.

## Before you push

```bash
npm run typecheck
npm run test:unit
npm run demo:build && npm run test:e2e
```

CI runs the same checks on every push and pull request, and Vercel deploys `main` automatically. Browser tests use the Chrome at `CHROME_PATH` or, on macOS, the installed Google Chrome; elsewhere they fall back to Playwright's bundled Chromium. They run with reduced motion so animations never make them flaky; one test runs with motion on.

## Commits and branches

- Work on a branch and open a pull request into `main`; the PR template lists what to check.
- Write commit messages in the imperative ("Add miracle knots to the menu"), with a short body explaining why when it isn't obvious.
- Record design decisions in `docs/DECISIONS.md` and keep `docs/CONTEXT.md` current.

## Secrets

Never commit real credentials. `.env.local` and `.env.vercel` are git-ignored and only `.env.example` is tracked. Use `npm run env:vercel` to move values into Vercel without displaying them.
