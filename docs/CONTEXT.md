# Current state

Business name: **Styled by Sika**, confirmed by owner. Braider: Amewusika Amedeker. Location: Vaughan, Ontario. Timezone: America/Toronto. Use “extensions” in customer copy, not “bundles” (legacy database column `bundles_needed` retained).

## Demo status

Production demo build passes and runs with `npm run demo` on port 3002 after `npm run demo:build`. `.next-demo` is separate from `.next`. Local fonts remove Google Fonts network dependency. An extra agent-started development server was stopped to prevent shared-cache contention.

## Site structure (September 2026)

One public page (`/`) with sections `#meet-sika`, `#services` (collapsible categories `#menu-knotless`, `#menu-boho`, `#menu-miracle-knots`, `#menu-twists`, `#menu-invisible-locs`, `#menu-soft-locs`, `#menu-extras`; a hash for a category or service slug opens it), `#before-you-book` and `#contact`, plus `/book`. Content sources: `lib/menu.ts` (27 services, 6 add-ons, owner's prices and durations; miracle knots have hour ranges and the calendar blocks the longer figure), `lib/business.ts` (owner's welcome, policies, contact), `lib/work-photos.ts` (her photos per category). The database keeps table names `styles`/`addons`; migration 003 adds category, description, price range and bookable columns and retires the starter catalog.

Header shows three section links plus Book now (chips row on phones). Categories start closed and open on tap (one at a time); each service card has a Book button linking to `/book?service=<slug>`. On screens up to 1000px a floating Book bar shows only while no Book button is on screen. When live booking is off, `/book` quotes the price and offers "Book on Instagram" (copies the request to the clipboard, opens the DM) and "Book by email" (pre-filled mailto).

Demo mode is explicit in production (`NEXT_PUBLIC_DEMO_MODE=true`) and automatic in development when no Supabase URL is configured. Sample appointments persist in sessionStorage. The dedicated `/demo/admin` screen never exposes real bookings. Real `/admin` retains middleware/session protections. Demo booking/contact actions never call live services.

## Editable website (September 2026)

Everything public is rendered from `SiteContent` (`lib/content.ts`): categories, services, add-ons, photos and text. Defaults come from `lib/menu.ts`, `lib/business.ts`, `lib/work-photos.ts`; live data from Supabase tables `categories`, `styles`, `addons`, `style_photos`, `site_content` (migration 006) and the `photos` storage bucket. `getContent()` in `lib/db.ts` is the single read; `/api/admin/content` (PATCH, admin only) applies `ContentOp`s via `applyContentOp`, the same pure function the demo uses with sessionStorage (`readDemoContent`). Public pages are client components (`LandingPage`, `Header`, `Footer`, `BookingFlow`) that layer demo edits via `useSiteContent`. The editor is `components/content-editor.tsx` (tabs Text · Menu · Add-ons · Photos) at `/admin/content` and in the demo dashboard's Website tab. Photos are resized in the browser (`lib/resize-image.ts`) before upload. The owner's guide is `docs/OWNER-GUIDE.md`.

## Availability and the dashboard

Available start times = her weekly hours (`working_hours`) minus Google Calendar busy time, existing bookings (each blocks its full length plus the 30-minute buffer) and one-off `time_off` blocks. `lib/availability.ts#slotsForDay` is the single rule set; the demo uses it too with hours/blocks kept in sessionStorage, so a 3.5-hour demo booking at 9:00 removes every start before 1:00 PM. Sika edits hours and blocked times in `/admin/settings` (`components/availability-editor.tsx`, `/api/admin/availability`); the demo dashboard's Settings tab shows the same editor. Access is by login: only `ADMIN_EMAIL` passes `requireAdmin`/middleware.

The booking page's service chooser (`components/service-picker.tsx`) is a category-then-option list in the site's own style, not a native `<select>`.

## Owner preferences

Plain, direct copy. Keep the existing dark editorial layout. Obvious navigation buttons and strong contrast. Amewusika and Vaughan must be large and prominent above the fold. Real photographs only; never AI-generated. Correct hairstyle matches, not generic photos labeled as a different service.

No stock photos remain on the site; only the owner's own images are shown.

## Outstanding live launch work

Business hours and own photographs for boho, twists, invisible locs and soft locs. Prices, durations, hair requirements, deposit, payment options, cancellation policy and contact details are confirmed by the owner and live in `lib/menu.ts` and `lib/business.ts`. External account setup, database concurrency tests, email/calendar synchronization testing, retry scheduling, and dependency security review are not complete. Do not represent the demo as production-ready or enable live booking yet.

Knotless photos (owner's IMG_0618.jpeg/IMG_0617.jpeg) are in public/images/styles/knotless and listed in lib/work-photos.ts; they appear beside the Knotless heading in the menu. Pexels reference photos, the gallery, FAQ, contact form and the goddess/stitch/cornrow starter services were removed at the owner's request. Adding photos: docs/ADDING-PHOTOS.md.
