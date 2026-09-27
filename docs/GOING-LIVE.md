# Connect Styled by Sika to real services

## Supabase

1. Create Sika's Supabase project. The owner should retain access to the account.
2. In the project's SQL Editor, run `supabase/schema.sql` once on a fresh project. On an existing project, do not re-run the initial schema.
3. Apply `supabase/migrations/002_launch_settings.sql`, `003_service_menu.sql`, `004_duration_ranges.sql` and `005_time_off.sql` in order, to both new and existing projects. Migration 003 turns the old style/length/size grid into Sika's flat service menu (services stay in `styles`, add-ons in `addons`).
4. Add the project URL, anon/publishable key and server service-role/secret key to `.env.local` using the variable names in `.env.example`. Never put the server key in a `NEXT_PUBLIC_` variable.
5. Run `npm run db:seed`. This inserts Sika's menu from `lib/menu.ts`, the CA$20 deposit text, business settings and seven closed weekdays. It never overwrites existing rows or adds fake bookings.
6. Sika sets her weekly hours and blocked dates herself at `/admin/settings` once she can sign in (saving hours also marks `hours_confirmed`). In Supabase's Table Editor, review `styles`, `addons` and `business_settings`. Monetary values are integer Canadian cents. Prices already match the menu Sika supplied; the website reads them from `lib/menu.ts` until Supabase is connected, and from the database afterwards.
7. Enter `deposit_cents`, `deposit_instructions`, `cancellation_policy`, `lateness_policy` and `guest_policy`. Approve `prices_confirmed`, `hours_confirmed` and `policies_confirmed` only after Sika agrees to those values. All seven weekdays must exist; use null opening and closing times for closed days.
8. Create the braider's user in Supabase Auth and set `ADMIN_EMAIL` to that address. Only that email can open `/admin` (middleware and every admin API check it); clients never see the dashboard. Set and set the production site URL and `/auth/callback` redirect in Supabase Auth settings. Add the same credentials to the hosting environment.

The app reads the catalog, working hours, settings, bookings, jobs, FAQs and gallery records from Supabase when configured. Bookings use server routes with a service key; browser roles have no access to appointment records or operational settings. The authenticated admin dashboard manages bookings. Use Supabase Studio for catalog, hours and policies.

For gallery uploads, create a public Storage bucket named `gallery`, upload approved photos through Studio, then add their bucket-relative paths to `gallery_images.storage_path`. Public reading of these images is intentional. Do not allow anonymous uploads. Booking records and customer information must never go in this bucket. Until database gallery rows exist, the existing local photos are used.

## Calendar, email and request protection

- Share the booking Google Calendar with the configured service-account email, with permission to manage events. Set the service-account email, private key and calendar ID.
- Verify the sending domain in Resend and set `RESEND_API_KEY`, `FROM_EMAIL`, `BRAIDER_EMAIL`, and `MAINTAINER_EMAIL`.
- Configure Upstash REST credentials. The current rate limiter uses Vercel's trusted IP header; adapt it if using a different hosting provider.
- Set a strong random `CRON_SECRET`. Schedule an HTTPS GET to `/api/jobs` every minute with `Authorization: Bearer <CRON_SECRET>`. This retries calendar/email work after outages. Use a scheduler that supports your required frequency.
- Set `NEXT_PUBLIC_SITE_URL` to the real HTTPS domain and `NEXT_PUBLIC_DEMO_MODE=false`. Restart/rebuild after changing public environment variables.
- Instagram and email are set in `lib/business.ts`.

## Payments

Stripe Checkout is **not implemented in this version**. Existing live booking code saves an appointment request to Supabase and provides manual payment instructions; the braider marks the deposit paid after verifying receipt. That is not automatic online payment processing.

Before implementing Stripe, confirm whether clients pay a fixed deposit or the full appointment price, the approved amount, and cancellation/refund rules. Sika needs a verified Stripe account and test credentials. A production integration must create Checkout from the server-calculated quote, confirm payments using signed webhooks, prevent duplicate booking/payment creation, handle abandoned checkout holds, and test payment failures and refunds. Do not treat a browser redirect as proof of payment.

Stripe test/live keys must remain server-side. Do not post secret keys in chat. Start with Stripe test mode before enabling live charges.

## Verify and enable

- `npm run test:unit` checks database permissions, overlap protection, cancellation and configuration guards using a local PostgreSQL-compatible test database.
- `npm run check:launch` checks configuration and, when credentials are available, reads the real Supabase tables and verifies anonymous booking access is denied. It does not send email, charge cards or create appointments.
- Approve the business settings and set `BOOKING_ENABLED=true` only for the intended launch. Run the check again.
- Verify a real test appointment is persisted, shown in the protected dashboard, synchronized to Google Calendar, and emailed successfully. Verify competing requests cannot claim the same slot, retries do not duplicate bookings, cancellation updates the calendar, and the job scheduler retries failures.
- Verify the chosen payment flow separately. Passing configuration checks is not a payment certification or proof of external service delivery.

`npm run demo:build` / `npm run demo` intentionally keep the private demo separate on port 3002. Demo bookings remain labeled and simulated. `npm run dev` no longer silently enables demo mode when database credentials are missing. The client-facing site never pretends a simulated booking or email was real.
