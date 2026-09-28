# Current state

**Live:** https://styled-by-sika.vercel.app. Braider: Amewusika (Sika) Amedeker, Vaughan, Ontario (America/Toronto). Business name: Styled by Sika. Instagram @styledby.sika, styledbysika@gmail.com. In customer copy, say "extensions", not "bundles" (the legacy database column `bundles_needed` is kept).

## Services in use

- **Vercel** hosts the site and deploys `main` automatically; GitHub Actions runs checks on every push.
- **Supabase** (project `ioczatwmjnkwaxshycid`, Canada Central): Postgres, Auth (only `ADMIN_EMAIL` = styledbysika@gmail.com may use `/admin`), Storage bucket `photos`, and pg_cron + pg_net calling `GET /api/jobs` every 10 minutes (`styled-by-sika-jobs`). Migrations 002–009 are applied.
- Not connected yet (built in, optional): Resend email, Twilio texts, Google Calendar, Upstash. Without email/texts, clients confirm on screen and message her; reminders stay off.

## Public site

One page (`/`) plus `/book`. Sections: `#meet-sika` (welcome card, her photo on the right at every size), `#services` (collapsible categories, one open at a time, with the tapped row kept still; photos open full screen), `#before-you-book`, `#contact`. Old routes redirect to sections. Everything public renders from `SiteContent` (`lib/content.ts`) via `getContent()`; client components apply demo edits through `useSiteContent`.

Booking is always real (Calendly-style): service + extras → a day → a start time → details → **Booking confirmed** with two steps (send the pre-written booking to Styled by Sika; send the deposit). The calendar loads one month per request (`/api/availability?month=`), opens on the first month with times, and shows a playful loading animation (`components/calendar-loading.tsx`).

## Availability rules

Her hours for a date come from the week planner (`availability_days`) or else her usual week (`working_hours`). They are a **start window**: start times every 30 minutes from open through close, whatever the style's length. A booking blocks `[start, end + break)`, so no other appointment can overlap it; blocked time and busy calendar time also exclude starts. Booking rules live in `business_settings` (break, notice ≥ 24 h, window up to 366 days). Single source: `lib/availability.ts` (`hoursForDate`, `slotsForDay`), shared by the demo.

## Dashboard

`/admin`: Today, Bookings, Clients, **Website** (text, her photo, categories, services, add-ons, category photos), **Availability** (week planner, usual week, rules, blocked time, password). Unsaved text/hours show a sticky Save bar and a leave warning. One-time sign-in and reset links open `/auth/confirm`, where a **Continue** button POSTs the token, so link previews can't use it up. `npm run admin:create -- <email>` prints a new link.

## Owner preferences

Plain, direct copy in her own voice. Keep the dark editorial look (lavender accent, italic serif highlights, pill buttons, drawn purple stars). Real photos only, never AI-generated. Mobile first; smooth but calm motion, off for reduced motion. Nothing should require contacting a developer.

## Open items

- Supabase auth settings so "Forgot your password?" emails reach her: invite her to the organisation, set the Site URL and Redirect URLs, and paste the reset template (see GOING-LIVE).
- She hasn't added her phone number or e-transfer details yet (Website → Text).
- At handoff: reset the database password and roll the secret key, then update `.env.local` and Vercel.
