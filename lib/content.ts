import { z } from 'zod';
import type { Extra, Service } from './types';
import { categories as seedCategories } from './menu';
import { seedCatalog } from './seed';
import { workPhotos } from './work-photos';
import { beforeYouBook, contact, depositCents, depositSummary, policies as seedPolicies, thankYou, welcome } from './business';

// Everything Sika can change from her dashboard. lib/menu.ts, lib/business.ts and lib/work-photos.ts are the defaults.
export type Category = { slug: string; label: string; short: string; sort_order: number; active: boolean };
export type Photo = { id: string; category: string; url: string; alt: string; width: number; height: number; own: boolean; sort_order: number; storage_path: string | null };
export type Policy = { id: string; title: string; intro: string; items: string[]; outro: string };
export type SiteText = {
  heroServices: string; welcomeTitle: string; welcomeBody: string; beforeYouBook: string; policies: Policy[];
  thankYouTitle: string; thankYouBody: string; instagramHandle: string; email: string; phone: string; etransferTo: string; depositSummary: string; depositCents: number;
};
export type SiteContent = { categories: Category[]; services: Service[]; extras: Extra[]; photos: Photo[]; text: SiteText; placeholder: boolean };

export const defaultText = (): SiteText => ({
  heroServices: 'Knotless, boho knotless, miracle knots, twists, invisible locs and soft locs.',
  welcomeTitle: welcome.title, welcomeBody: welcome.body, beforeYouBook,
  policies: seedPolicies.map(p => ({ id: p.id, title: p.title, intro: p.intro ?? '', items: p.items ?? [], outro: p.outro ?? '' })),
  thankYouTitle: thankYou.title, thankYouBody: thankYou.body,
  instagramHandle: contact.instagramHandle, email: contact.email, phone: '', etransferTo: '', depositSummary, depositCents,
});
export const defaultContent = (): SiteContent => ({
  categories: seedCategories.map((c, i) => ({ slug: c.slug, label: c.label, short: c.short, sort_order: i, active: true })),
  services: seedCatalog.services.map(s => ({ ...s })),
  extras: seedCatalog.extras.map(e => ({ ...e })),
  photos: Object.entries(workPhotos).flatMap(([category, list]) => list.map((p, i) => ({ id: `seed-${category}-${i}`, category, url: p.url, alt: p.alt, width: p.width, height: p.height, own: !!p.own, sort_order: i, storage_path: null }))),
  text: defaultText(),
  placeholder: false,
});

export const instagramLinks = (handle: string) => { const user = handle.replace(/^@/, '').trim(); return { profile: `https://www.instagram.com/${user}/`, dm: `https://ig.me/m/${user}` }; };
export const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
export function uniqueSlug(base: string, taken: string[], keep?: string) { let slug = base, n = 2; while (taken.includes(slug) && slug !== keep) slug = `${base}-${n++}`; return slug; }
export const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

// Validation shared by the live API and the demo store.
const money = z.number().int().min(0).max(1_000_000);
const policySchema = z.object({ id: z.string().min(1).max(40), title: z.string().trim().min(1).max(80), intro: z.string().trim().max(600), items: z.array(z.string().trim().min(1).max(300)).max(12), outro: z.string().trim().max(600) });
export const textSchema = z.object({
  heroServices: z.string().trim().min(1).max(200), welcomeTitle: z.string().trim().min(1).max(120), welcomeBody: z.string().trim().min(1).max(1200), beforeYouBook: z.string().trim().max(800),
  policies: z.array(policySchema).max(12), thankYouTitle: z.string().trim().max(120), thankYouBody: z.string().trim().max(600),
  instagramHandle: z.string().trim().regex(/^@?[\w.]{1,30}$/, 'Use your Instagram username, like @styledby.sika.').transform(h => h.startsWith('@') ? h : `@${h}`), email: z.email().max(200), phone: z.string().trim().regex(/^(\+?[\d\s().-]{10,20})?$/, 'Use a phone number like 416-555-0101, or leave it empty.'), etransferTo: z.string().trim().max(120), depositSummary: z.string().trim().max(600), depositCents: money,
}).partial();
export const categorySchema = z.object({ slug: z.string().trim().max(60), label: z.string().trim().min(1).max(60), short: z.string().trim().max(30), sort_order: z.number().int().min(0), active: z.boolean() });
export const serviceSchema = z.object({ id: z.string().max(60), slug: z.string().max(80), category: z.string().min(1), name: z.string().trim().min(2).max(120), description: z.string().trim().max(400), hair: z.string().trim().max(400), price_cents: money, duration_min: z.number().int().min(15).max(1440), duration_max_min: z.number().int().min(15).max(1440).nullable(), active: z.boolean(), sort_order: z.number().int().min(0) }).refine(s => s.duration_max_min === null || s.duration_max_min >= s.duration_min, 'The longest time must be at least the shortest time.');
export const extraSchema = z.object({ id: z.string().max(60), slug: z.string().max(80), group: z.string().refine(g => ['boho', 'additional'].includes(g), 'Choose an add-on group.'), name: z.string().trim().min(2).max(80), description: z.string().trim().max(400), price_cents: money, price_max_cents: money.nullable(), price_plus: z.boolean(), duration_min: z.number().int().min(0).max(600), bookable: z.boolean(), active: z.boolean(), sort_order: z.number().int().min(0) }).refine(e => e.price_max_cents === null || e.price_max_cents >= e.price_cents, 'The top of the price range must be at least the bottom.');
export const photoSchema = z.object({ id: z.string().min(1).max(60), category: z.string().min(1), alt: z.string().trim().max(200), own: z.boolean(), sort_order: z.number().int().min(0) });
export const uploadSchema = z.object({ category: z.string().min(1), alt: z.string().trim().max(200), own: z.boolean(), dataUrl: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/).max(2_800_000, 'That photo is too large after resizing. Try a smaller one.'), width: z.number().int().min(1).max(4000), height: z.number().int().min(1).max(4000) });
export const opSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: textSchema }),
  z.object({ type: z.literal('category'), category: categorySchema }),
  z.object({ type: z.literal('deleteCategory'), slug: z.string() }),
  z.object({ type: z.literal('service'), service: serviceSchema }),
  z.object({ type: z.literal('deleteService'), id: z.string() }),
  z.object({ type: z.literal('extra'), extra: extraSchema }),
  z.object({ type: z.literal('deleteExtra'), id: z.string() }),
  z.object({ type: z.literal('photo'), photo: photoSchema }),
  z.object({ type: z.literal('uploadPhoto'), upload: uploadSchema }),
  z.object({ type: z.literal('deletePhoto'), id: z.string() }),
  z.object({ type: z.literal('reorder'), kind: z.enum(['categories', 'services', 'extras', 'photos']), ids: z.array(z.string()).max(200) }),
]);
export type ContentOp = z.infer<typeof opSchema>;

const byOrder = <T extends { sort_order: number }>(list: T[]) => [...list].sort((a, b) => a.sort_order - b.sort_order);
const reorder = <T extends { sort_order: number }>(list: T[], key: (item: T) => string, ids: string[]) => list.map(item => { const i = ids.indexOf(key(item)); return i === -1 ? item : { ...item, sort_order: i }; });

// Pure update used by the demo (browser storage) and to derive slugs/ids before the live database write.
export function applyContentOp(content: SiteContent, op: ContentOp, newId: () => string, photoUrl?: string): { content: SiteContent; message: string } {
  const c = content;
  switch (op.type) {
    case 'text': return { content: { ...c, text: { ...c.text, ...op.text } }, message: 'Text saved.' };
    case 'category': {
      const existing = c.categories.find(x => x.slug === op.category.slug);
      const slug = existing ? existing.slug : uniqueSlug(slugify(op.category.label), c.categories.map(x => x.slug));
      const category = { ...op.category, slug, short: op.category.short || op.category.label, sort_order: existing?.sort_order ?? c.categories.length };
      return { content: { ...c, categories: byOrder(existing ? c.categories.map(x => x.slug === slug ? category : x) : [...c.categories, category]) }, message: existing ? 'Category saved.' : `Category "${category.label}" added.` };
    }
    case 'deleteCategory': {
      if (c.services.some(s => s.category === op.slug)) return { content: c, message: 'Move or delete the services in this category first.' };
      return { content: { ...c, categories: c.categories.filter(x => x.slug !== op.slug), photos: c.photos.filter(p => p.category !== op.slug) }, message: 'Category removed.' };
    }
    case 'service': {
      const existing = c.services.find(s => s.id === op.service.id);
      const id = existing ? existing.id : newId();
      const slug = uniqueSlug(slugify(op.service.name), c.services.map(s => s.slug), existing?.slug);
      const service: Service = { ...op.service, id, slug: existing && slugify(existing.name) === slugify(op.service.name) ? existing.slug : slug, sort_order: existing?.sort_order ?? c.services.length };
      return { content: { ...c, services: byOrder(existing ? c.services.map(s => s.id === id ? service : s) : [...c.services, service]) }, message: existing ? 'Service saved.' : `"${service.name}" added to the menu.` };
    }
    case 'deleteService': return { content: { ...c, services: c.services.filter(s => s.id !== op.id) }, message: 'Service removed.' };
    case 'extra': {
      const existing = c.extras.find(e => e.id === op.extra.id);
      const id = existing ? existing.id : newId();
      const extra: Extra = { ...op.extra, id, slug: existing?.slug ?? uniqueSlug(slugify(op.extra.name), c.extras.map(e => e.slug)), sort_order: existing?.sort_order ?? c.extras.length };
      return { content: { ...c, extras: byOrder(existing ? c.extras.map(e => e.id === id ? extra : e) : [...c.extras, extra]) }, message: existing ? 'Add-on saved.' : `"${extra.name}" added.` };
    }
    case 'deleteExtra': return { content: { ...c, extras: c.extras.filter(e => e.id !== op.id) }, message: 'Add-on removed.' };
    case 'photo': return { content: { ...c, photos: byOrder(c.photos.map(p => p.id === op.photo.id ? { ...p, ...op.photo } : p)) }, message: 'Photo details saved.' };
    case 'uploadPhoto': {
      const photo: Photo = { id: newId(), category: op.upload.category, url: photoUrl ?? op.upload.dataUrl, alt: op.upload.alt, width: op.upload.width, height: op.upload.height, own: op.upload.own, sort_order: c.photos.filter(p => p.category === op.upload.category).length, storage_path: null };
      return { content: { ...c, photos: [...c.photos, photo] }, message: 'Photo added.' };
    }
    case 'deletePhoto': return { content: { ...c, photos: c.photos.filter(p => p.id !== op.id) }, message: 'Photo removed.' };
    case 'reorder': {
      const next = { ...c };
      if (op.kind === 'categories') next.categories = byOrder(reorder(c.categories, x => x.slug, op.ids));
      if (op.kind === 'services') next.services = byOrder(reorder(c.services, x => x.id, op.ids));
      if (op.kind === 'extras') next.extras = byOrder(reorder(c.extras, x => x.id, op.ids));
      if (op.kind === 'photos') next.photos = byOrder(reorder(c.photos, x => x.id, op.ids));
      return { content: next, message: 'Order saved.' };
    }
  }
}

// What the public site shows: hidden items removed, everything in order.
export function publicContent(c: SiteContent): SiteContent {
  const categories = byOrder(c.categories.filter(x => x.active));
  return { ...c, categories, services: byOrder(c.services.filter(s => s.active && categories.some(x => x.slug === s.category))), extras: byOrder(c.extras.filter(e => e.active)), photos: byOrder(c.photos) };
}
