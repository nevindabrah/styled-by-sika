# Going live

Two services are required: **Supabase** (database, sign-in, photo storage) and **Resend** (emails). Hosting is **Vercel**. Google Calendar and Upstash are optional and can be added later without code changes.

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
6. **Authentication → URL Configuration**: set *Site URL* to the public address (step 3 below) and add `https://<your-domain>/auth/callback` to *Redirect URLs*, so "Email me a sign-in link" works.

After this, `npm run dev` runs against the real database. Sign in at `/login`; everything in Website and Availability is now saved to Supabase.

## 2. Resend (5 minutes)

1. resend.com → add and verify the domain the emails will come from (or use the Resend test domain to try it first).
2. **API Keys → Create** → `RESEND_API_KEY`. Set `FROM_EMAIL` (an address on the verified domain) and `BRAIDER_EMAIL` (where Sika receives booking notices).

## 3. Vercel (10 minutes)

1. Push this repo to GitHub, then vercel.com → **Add New Project** → import it. Framework is detected automatically.
2. **Environment Variables**: run `npm run env:vercel -- https://<your-address>` to write `.env.vercel` (everything the site needs from `.env.local`, without `DATABASE_URL`, values never printed). Open it, copy all, paste into the first *Key* box in Vercel, save, then delete the file. `NEXT_PUBLIC_*` values are built into the site, so redeploy after changing them. Keep `BOOKING_ENABLED=false` for the first deploy.
3. Deploy. Check the site, sign in at `/admin`, upload a photo, change a price.

## 4. Switch on online booking

1. Sika saves her weekly hours once in **Availability** (this records her approval of them).
2. Run `npm run check:launch` locally with `BOOKING_ENABLED=true` and `NEXT_PUBLIC_SITE_URL` set to the https address. Fix anything it lists.
3. In Vercel set `BOOKING_ENABLED=true` and redeploy. Make a test booking with a real email, confirm the emails arrive, mark the deposit paid in the dashboard, and cancel it.

Until step 4, `/book` still shows prices and sends requests to Sika by Instagram DM or email.

## Optional extras

- **Google Calendar**: create a service account, share her calendar with it (manage events), set the three `GOOGLE_*` values, redeploy. Bookings then appear on her calendar and her calendar's busy times block the site.
- **Upstash**: create a Redis database and set the two `UPSTASH_*` values for rate limiting across servers.
- **Retries**: set `CRON_SECRET` and schedule `GET /api/jobs` every few minutes with `Authorization: Bearer <secret>` (Vercel Cron works) so a failed email or calendar update is retried.

## Payments

Clients pay the deposit by cash or e-transfer; Sika marks it paid in the dashboard. No card processing is built in.

## Security notes

- `.env.local` is git-ignored. The service-role key and `DATABASE_URL` must never be exposed to the browser or committed.
- Only `ADMIN_EMAIL` can open `/admin` or call the admin APIs; browser roles cannot read bookings, settings or content tables.
- Photos she uploads go to the public `photos` bucket through the server; nothing else is publicly writable.
