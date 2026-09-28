import { describe, expect, it } from 'vitest';
import { applyContentOp, defaultContent, opSchema, publicContent, slugify } from '../../lib/content';
let n = 0; const newId = () => `id-${++n}`;
describe('website content editing', () => {
 it('starts from the owner-supplied menu, policies and photos', () => {
  const c = defaultContent();
  expect(c.categories.map(x => x.slug)).toEqual(['knotless', 'boho', 'miracle-knots', 'twists', 'invisible-locs', 'soft-locs']);
  expect(c.services).toHaveLength(27);
  expect(c.text.instagramHandle).toBe('@styledby.sika');
  expect(c.text.location).toBe('Vaughan, Ontario');
  expect(c.text.paymentMethods).toBe('Cash or e-transfer');
  expect(c.text.contactTitleAccent).toBe('Message me.');
  expect(c.photos.filter(p => p.category === 'knotless')).toHaveLength(3);
 });
 it('adds a service with a readable, unique slug and keeps it in its category', () => {
  const c = defaultContent();
  const base = { id: '', slug: '', category: 'twists', name: 'Passion Twists — Mid-Back Length', description: '', hair: '2 packs', price_cents: 14000, duration_min: 240, duration_max_min: null, active: true, sort_order: 0 };
  const one = applyContentOp(c, { type: 'service', service: base }, newId);
  const two = applyContentOp(one.content, { type: 'service', service: base }, newId);
  const added = two.content.services.filter(s => s.name === base.name);
  expect(added.map(s => s.slug)).toEqual(['passion-twists-mid-back-length', 'passion-twists-mid-back-length-2']);
  expect(one.message).toContain('added to the menu');
  // Editing keeps the id and slug so existing /book?service= links still work.
  const edited = applyContentOp(two.content, { type: 'service', service: { ...added[0], price_cents: 15000 } }, newId).content.services.find(s => s.id === added[0].id)!;
  expect(edited.slug).toBe('passion-twists-mid-back-length');
  expect(edited.price_cents).toBe(15000);
 });
 it('refuses to delete a category that still has services, and hides inactive items from the public site', () => {
  const c = defaultContent();
  expect(applyContentOp(c, { type: 'deleteCategory', slug: 'twists' }, newId).content.categories).toHaveLength(6);
  const hidden = applyContentOp(c, { type: 'category', category: { ...c.categories[3], active: false } }, newId).content;
  const pub = publicContent(hidden);
  expect(pub.categories.some(x => x.slug === 'twists')).toBe(false);
  expect(pub.services.some(s => s.category === 'twists')).toBe(false);
  expect(hidden.services.some(s => s.category === 'twists')).toBe(true);
 });
 it('stores uploaded photos and edits text without touching the rest', () => {
  const c = defaultContent();
  const up = applyContentOp(c, { type: 'uploadPhoto', upload: { category: 'boho', alt: 'Boho braids', own: true, dataUrl: 'data:image/jpeg;base64,AAAA', width: 800, height: 1000 } }, newId).content;
  expect(up.photos.filter(p => p.category === 'boho')).toHaveLength(2);
  const text = applyContentOp(up, { type: 'text', text: { heroServices: 'Braids and locs.', depositCents: 3000 } }, newId).content.text;
  expect(text.heroServices).toBe('Braids and locs.');
  expect(text.depositCents).toBe(3000);
  expect(text.welcomeTitle).toBe(c.text.welcomeTitle);
 });
 it('validates what the dashboard sends', () => {
  expect(opSchema.safeParse({ type: 'text', text: { instagramHandle: 'styledby.sika' } }).data).toMatchObject({ text: { instagramHandle: '@styledby.sika' } });
  expect(opSchema.safeParse({ type: 'text', text: { email: 'not-an-email' } }).success).toBe(false);
  expect(opSchema.safeParse({ type: 'service', service: { id: '', slug: '', category: 'twists', name: 'X', description: '', hair: '', price_cents: 100, duration_min: 120, duration_max_min: 60, active: true, sort_order: 0 } }).success).toBe(false);
  expect(slugify('S-Medium Boho Knotless Braids — Shoulder Length')).toBe('s-medium-boho-knotless-braids-shoulder-length');
 });
});
