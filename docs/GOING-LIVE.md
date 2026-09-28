# Going live

Only **Supabase** (database, sign-in, photo storage, scheduler) and **Vercel** (hosting) are required. Booking follows the braider's hours in her dashboard; without an email service, clients see their request on screen and she contacts them. **Resend** (emails), **Twilio** (texts), Google Calendar and Upstash are optional and can be added later without code changes.

## 1. Supabase (10 minutes)

1. Sign in at supabase.com → **New project**. Name it `styled-by-sika`, region *Canada (Central)*, and save the database password somewhere safe.
2. **Project Settings → API**: copy *Project URL*, *anon public* key and *service_role* key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. **Project Settings → Database → Connection string → URI**: copy it, replace `[YOUR-PASSWORD]` with the database password, and put it in `.env.local` as `DATABASE_URL`.
4. Set `ADMIN_EMAIL` in `.env.local` to the email Sika will sign in with.
5. Run, in order:
   ```bash
   npm run db:migrate                          # schema + all migrations, safe to rerun
   npm run db:seed                             # menu, text, photos, photo bucket; never overwrites her edits
   npm run admin:create -- sika@email.com "a strong password"
   ```
6. **Authentication → URL Configuration**: set *Site URL* to the public address (step 3 below) and add `https://<your-domain>/**` to *Redirect URLs*.
7. **Authentication → Emails → Reset Password**: replace the link in the template so it works on any device (the default link only works in the browser that asked for it):
   ```html
   <h2>Reset your Styled by Sika password</h2>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Sign in and choose a new password</a></p>
   <p>This link works once and expires in an hour. If you didn't ask for it, ignore this email.</p>
   ```
8. **Organization → Team → Invite** the braider's email. Supabase's built-in email only delivers to organisation members, so this is what lets "Forgot your password?" reach her (until custom SMTP, e.g. Resend, is configured under Authentication → Emails → SMTP).

After this, `npm run dev` runs against the real database. Sign in at `/login`; everything in Website and Availability is now saved to Supabase.

## 2. Resend (optional, 5 minutes — automatic emails)

1. resend.com → add and verify the domain the emails will come from (or use the Resend test domain to try it first).
2. **API Keys → Create** → `RESEND_API_KEY`. Set `FROM_EMAIL` (an address on the verified domain) and `BRAIDER_EMAIL` (where Sika receives booking notices).

## 3. Vercel (10 minutes)

1. Push this repo to GitHub, then vercel.com → **Add New Project** → import it. Framework is detected automatically.
2. **Environment Variables**: run `npm run env:vercel -- https://<your-address>` to write `.env.vercel` (everything the site needs from `.env.local`, without `DATABASE_URL`, values never printed). Open it, copy all, paste into the first *Key* box in Vercel, save, then delete the file. `NEXT_PUBLIC_*` values are built into the site, so redeploy after changing them. Online booking stays off until she turns it on under Availability.
3. Deploy. Check the site, sign in at `/admin`, upload a photo, change a price.

## 4. Reminders scheduler (2 minutes)

Clients get a confirmation when they book, a message when the deposit is marked paid, and reminders **24 hours** and **2 hours** before (by email, and by text once Twilio is set up). Supabase runs the check every 10 minutes:

1. Make sure `CRON_SECRET` is in `.env.local` (any long random string) and add the same value to Vercel: `npm run env:vercel -- https://<your-address> --only=CRON_SECRET` writes just that line to `.env.vercel` to paste.
2. `npm run cron:setup -- https://<your-address>` — enables `pg_cron`/`pg_net` and schedules `GET /api/jobs` every 10 minutes. Rerun it if the address changes.

The same run retries any confirmation email or text that failed.

## 5. Switch on online booking

1. Sika saves her weekly hours in **Availability**. Booking is always on; with no hours there are simply no times to pick.
2. Run `npm run check:launch` to confirm nothing is missing.
3. Make a test booking on the live site: it should show *Booking request received*, appear under **Bookings**, and hold the time. Cancel it from the dashboard.


## Text messages (Twilio)

1. twilio.com → create an account, upgrade from trial (trial accounts can only text verified numbers), and buy a Canadian phone number with SMS (about US$1.15/month; each text is about US$0.01).
2. Put `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_FROM` (the number as `+1…`, or a Messaging Service SID `MG…`) in `.env.local`, then `npm run env:vercel -- https://<your-address> --only=TWILIO_ACCOUNT_SID,TWILIO_AUTH_TOKEN,TWILIO_FROM`, paste into Vercel and redeploy.
3. Texts start immediately: confirmations, deposit received, cancellations and both reminders. Clients can reply STOP to opt out (Twilio handles it).

## Optional extras

- **Google Calendar**: create a service account, share her calendar with it (manage events), set the three `GOOGLE_*` values, redeploy. Bookings then appear on her calendar and her calendar's busy times block the site.
- **Upstash**: create a Redis database and set the two `UPSTASH_*` values for rate limiting across servers.

## Payments

Clients pay the deposit by cash or e-transfer; Sika marks it paid in the dashboard. No card processing is built in.

## Security notes

- `.env.local` is git-ignored. The service-role key and `DATABASE_URL` must never be exposed to the browser or committed.
- Only `ADMIN_EMAIL` can open `/admin` or call the admin APIs; browser roles cannot read bookings, settings or content tables.
- Photos she uploads go to the public `photos` bucket through the server; nothing else is publicly writable.
