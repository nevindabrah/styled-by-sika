# Working on Styled by Sika

## Setup

```bash
nvm use            # Node 22 (see .nvmrc)
npm install
cp .env.example .env.local
npm run dev        # development server; open the port it prints
```

`npm run demo:build && npm run demo` runs the production demo on http://localhost:3002. Demo bookings live only in the browser tab and never touch real services.

## Where things live

| Change | File |
| --- | --- |
| Services, prices, durations, hair needed, add-ons | `lib/menu.ts` |
| Welcome, deposit, payment, cancellation, hair prep, contact | `lib/business.ts` |
| Photos shown beside each menu category | `lib/work-photos.ts` + `public/images/styles/<category>/` |
| Landing page sections | `app/(site)/page.tsx` |
| Booking flow | `components/booking-flow.tsx`, `components/service-picker.tsx` |
| Availability rules (hours, buffer, conflicts) | `lib/availability.ts`, `lib/live-availability.ts` |
| Braider dashboard | `app/admin/`, `components/availability-editor.tsx` |
| Database | `supabase/schema.sql` then `supabase/migrations/` in order |

Content that Sika supplies is used exactly as sent. Do not invent prices, times or policy wording; if something is missing, leave it out and ask.

## Before you push

```bash
npm run typecheck
npm run test:unit
npm run demo:build && npm run test:e2e
```

CI runs the same checks on every push and pull request. Browser tests use the Chrome at `CHROME_PATH` or, on macOS, the installed Google Chrome; elsewhere they fall back to Playwright's bundled Chromium.

## Commits and branches

- Work on a branch and open a pull request into `main`; the PR template lists what to check.
- Write commit messages in the imperative ("Add miracle knots to the menu"), with a short body explaining why when it is not obvious.
- Record design decisions in `docs/DECISIONS.md` and keep `docs/CONTEXT.md` current so the next person (or agent) starts from the right picture.

## Going live

See `docs/GOING-LIVE.md`. Never commit real credentials; `.env.local` is ignored and only `.env.example` is tracked.
