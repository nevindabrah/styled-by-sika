-- Replace the style × length × size price grid with Sika's flat service menu.
-- Services stay in `styles` and extras in `addons`; run `npm run db:seed` afterwards to load lib/menu.ts.
begin;
alter table public.styles add column if not exists category text not null default '';
alter table public.addons
 add column if not exists extra_group text not null default 'additional',
 add column if not exists description text not null default '',
 add column if not exists price_max_cents int check(price_max_cents is null or price_max_cents>=price_cents),
 add column if not exists price_plus bool not null default false,
 add column if not exists bookable bool not null default true,
 add column if not exists sort_order int not null default 0;
alter table public.bookings alter column length_id drop not null, alter column size_id drop not null;
-- Retire the unconfirmed starter catalog. Slugs are freed because the new menu reuses blow-dry.
update public.styles set active=false, slug=slug||'-retired' where slug in ('knotless-goddess','knotless','stitch','cornrows');
update public.addons set active=false, slug=slug||'-retired' where slug in ('blow-dry','curled-ends','beads');
delete from public.style_pricing;
commit;
