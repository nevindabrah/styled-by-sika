# Decisions

- Use Vaughan, Ontario and America/Toronto following the client's location clarification. Display sample prices in CAD pending confirmation.
- Keep unconfirmed business information as placeholders and disable live booking until services and policies are configured.
- Enforce overlapping booking prevention in Postgres and record calendar/email jobs transactionally for retry.
- Use direct, descriptive copy following the owner's feedback; avoid slogan-heavy language.
- Keep navigation as accessible links styled as bordered buttons, with a filled current-page state, because they navigate to pages.
- Set button foreground colours explicitly so prose link styling cannot override contrast.

- Make Amewusika the hero headline and Vaughan, Ontario a large location line immediately below it; essential business details must be obvious on the first screen.
- Use real photos only per owner instruction. Keep verified local Pexels references; leave goddess and stitch images pending instead of mislabeling another braid style. Source records are in PHOTO-CREDITS.md.
- Rename the brand to Styled by Sika following the owner's correction, including metadata, wordmark, favicon, emails, and calendar files.
- Use “extensions” throughout customer-facing copy, retaining the database field name for compatibility.
- Make the gallery modal state-driven after rendering, with explicit open/closed CSS and keyboard controls, verified in a real browser.
- Isolate `.next-demo` from the development cache; two dev instances sharing `.next` were found during investigation.
- Host fonts locally through next/font/local for repeatable offline builds.
- Provide clearly marked sample booking/contact/dashboard interactions for demos; preserve authentication on real admin routes and never call live services from simulated actions.

- Replace the large stock hero photograph with a compact personal introduction: 160×190 portrait on desktop, 120×145 on mobile. Use a clear placeholder until Amewusika supplies her real photo; bio uses the owner-provided self-taught/student-in-Canada details.

- Consolidate About into the landing-page introduction. Navigation goes to /#meet-sika; old /about links redirect there, and /about is removed from the sitemap.

- Bind the hero, introduction, footer, and dashboard/login greetings to the editable braider profile, so changing the name updates the visible headings.
- Use the owner's two supplied photos for the Knotless Braids deck. Keep controls separate from navigation links, support keyboard and swipe, avoid autoplay, and contain full images on detail pages. One editable array supplies all views and future photos.

- Display slider photos uncropped at their natural proportions, with controls below the image. Serve original image files without Next.js recompression to preserve the supplied resolution; detail view contains the full image within 85vh.

- Make the public site a single page (welcome, menu, policies, contact) plus `/book`, following the owner's request for scheduling-app simplicity and a low bounce rate. Old routes redirect to sections. Header links are section anchors; the service menu has sticky category chips and a Book button per service; phones get a floating Book bar only while no other Book button is visible.
- Replace the style × length × size price grid with the owner's flat menu of 23 services and 6 add-ons, stored in `lib/menu.ts` and seeded into the existing `styles`/`addons` tables through migration 003. Booking is service + extras. Ranged and open-ended add-on prices (CA$30–CA$50, CA$30+) are stored as `price_max_cents` and `price_plus` and quoted as an estimate range.
- Keep the owner's copy verbatim in `lib/business.ts` (welcome, deposit, payment options, cancellation, hair prep, hair requirements, contact, thank-you), including her emoji. Show prices as `CA$` to match her menu.
- Show the menu as collapsible categories (closed by default, one open at a time) after the owner asked for options to "pop up" when a category is tapped, so a phone screen shows seven headings instead of 27 cards. Options stay in the DOM while hidden so shared links, search engines and the Book bar still see them. Ranged appointment lengths (miracle knots, 5–6 hours) display as a range and book the longest.
- Make the whole public site editable from the dashboard (text, categories, services, prices, add-ons, photos) because the owner will run it without a developer. One content model, one pure `applyContentOp` shared by the live API and the demo, so the demo shows exactly what the live editor will do. Deleting a booked service hides it instead so booking history stays intact; empty categories are kept but not shown.
- Availability is planned week by week (owner: set December in July). Planned dates override her usual week; the booking window allows up to 366 days (default 365). Start times are every 30 minutes and must finish by her end time; a booking blocks its full length plus her break.
- One-time sign-in/reset links open a page with a **Continue** button that POSTs the token (`/api/auth/confirm`); the first real link failed because iMessage/Instagram link previews opened the GET and used it up.
- Booking is always a real Calendly-style booking (owner direction: no request form, no morning/afternoon); the on/off switch was removed and `booking_open` is unused. Clients pick a 30-minute start time from her hours; with no hours set there are no times and they're asked to message her.
- (Superseded) Let online booking work without any email or text service, and let the braider switch it on and off herself (`business_settings.booking_open`, migration 008) instead of a hosting variable. Owner feedback: the Instagram flow only copied a half-filled message and never said the booking went through. Requests are now saved and held, the client gets a clear *Booking request received* screen with a reference, and can message her in one tap (prefilled text when she adds her number, Instagram with an explicit paste step, or email). While booking is off, the request form fills in name and preferred day.
- Replace the ✳ character with a drawn SVG star (`components/spark.tsx`): iOS renders ✳ as a green emoji.
- Send reminders 24 hours and 2 hours before every pending or confirmed appointment, by email and (when Twilio is configured) text. Schedule them from Supabase pg_cron every 10 minutes because Vercel's Hobby cron only runs daily. Claim each reminder in the database before sending so overlapping runs can't double-send; skip the 24-hour one for bookings made less than a day ahead. Texts are optional so the site works without a Twilio account.
- Give the braider control of availability from her dashboard (weekly hours + blocked dates/times) rather than through Supabase Studio; `time_off` is server-only and saving hours counts as her approval (`hours_confirmed`). The demo dashboard exposes the same editor with browser-tab storage.
- Reuse `slotsForDay` for the demo so booked appointments (full length + buffer) disappear from the calendar exactly as they will live.
- Replace the native service `<select>` with a category → option chooser matching the menu; native dropdowns clip long names on phones and cannot show price and time per option.
- Until online booking is enabled, `/book` still quotes the price and sends the request by Instagram DM or pre-filled email instead of showing "booking unavailable".
- Remove the gallery, FAQ, contact form, Pexels reference photos and unconfirmed goddess/stitch/cornrow services, since the owner asked for her menu "and only" that. Her knotless photos stay beside the knotless category.
