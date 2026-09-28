'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useUnsavedWarning } from '@/lib/use-unsaved-warning';
import Image from 'next/image';
import { ArrowDown, ArrowUp, Plus, Trash2, Upload } from 'lucide-react';
import { portraitCategory, portraitOf, type Category, type ContentOp, type Photo, type Policy, type SiteContent, type SiteText } from '@/lib/content';
import type { Extra, Service } from '@/lib/types';
import { extraGroups } from '@/lib/menu';
import { durationRange, money, priceLabel, extraLine, splitName } from '@/lib/pricing';
import { resizeImage } from '@/lib/resize-image';

type Apply = (op: ContentOp) => Promise<string>;
const tabs = ['Text', 'Menu', 'Add-ons', 'Photos'] as const;

// The braider's website editor: every word, price, service and photo on the public site.
export function ContentEditor({ content, onApply }: { content: SiteContent; onApply: Apply }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Menu');
  const [message, setMessage] = useState('');
  const textDirty = useRef(false);
  function switchTab(next: (typeof tabs)[number]) {
    if (next !== tab && textDirty.current && !confirm('You have unsaved changes to your text. Leave without saving?')) return;
    textDirty.current = false; setTab(next); setMessage('');
  }
  const apply: Apply = async op => { setMessage(''); try { const m = await onApply(op); setMessage(m); return m; } catch (e) { const m = (e as Error).message || 'Could not save. Please try again.'; setMessage(m); throw e; } };
  return <section className="content-editor" aria-labelledby="editor-heading">
    <h2 id="editor-heading" className="small-heading">Your website</h2>
    <p className="muted">Changes go live on the website as soon as you save them.</p>
    <div className="chips editor-tabs" role="tablist" aria-label="What to edit">{tabs.map(t => <button key={t} role="tab" aria-selected={tab === t} className={`chip ${tab === t ? 'selected' : ''}`} onClick={() => switchTab(t)}>{t}</button>)}</div>
    {message && <p className="status-message" role="status">{message}</p>}
    {tab === 'Text' && <TextTab text={content.text} apply={apply} onDirty={d => { textDirty.current = d; }} />}
    {tab === 'Menu' && <MenuTab content={content} apply={apply} />}
    {tab === 'Add-ons' && <ExtrasTab extras={content.extras} apply={apply} />}
    {tab === 'Photos' && <PhotosTab content={content} apply={apply} />}
  </section>;
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="editor-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
const dollars = (cents: number) => String(Math.round(cents / 100));
const cents = (value: string) => Math.max(0, Math.round(Number(value || 0) * 100));

/* ---------- Text ---------- */
function TextTab({ text: saved, apply, onDirty }: { text: SiteText; apply: Apply; onDirty: (dirty: boolean) => void }) {
  const [t, setT] = useState<SiteText>(saved);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(t) !== JSON.stringify(saved);
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);
  useUnsavedWarning(dirty);
  const set = (patch: Partial<SiteText>) => setT({ ...t, ...patch });
  const setPolicy = (i: number, patch: Partial<Policy>) => set({ policies: t.policies.map((p, j) => j === i ? { ...p, ...patch } : p) });
  const movePolicy = (i: number, d: number) => { const list = [...t.policies]; const [p] = list.splice(i, 1); list.splice(i + d, 0, p); set({ policies: list }); };
  async function save() { setBusy(true); try { await apply({ type: 'text', text: t }); } catch { /* message shown by the editor */ } finally { setBusy(false); } }
  return <div className="editor-panel">
    <h3>About you</h3>
    <div className="editor-two">
      <Field label="Your name" hint="First name shows as “Braids by …”"><input value={t.name} maxLength={60} onChange={e => set({ name: e.target.value })} /></Field>
      <Field label="Location"><input value={t.location} maxLength={80} onChange={e => set({ location: e.target.value })} /></Field>
    </div>
    <h3>Top of the page</h3>
    <Field label="Services line under your name"><input value={t.heroServices} maxLength={200} onChange={e => set({ heroServices: e.target.value })} /></Field>
    <Field label="Welcome title"><input value={t.welcomeTitle} maxLength={120} onChange={e => set({ welcomeTitle: e.target.value })} /></Field>
    <Field label="Welcome message"><textarea value={t.welcomeBody} maxLength={1200} onChange={e => set({ welcomeBody: e.target.value })} /></Field>
    <h3>Before you book</h3>
    <Field label="Introduction"><textarea value={t.beforeYouBook} maxLength={800} onChange={e => set({ beforeYouBook: e.target.value })} /></Field>
    {t.policies.map((p, i) => <div key={p.id} className="editor-card">
      <div className="editor-card-head"><strong>Policy {i + 1}</strong><span className="editor-row-actions">
        <button type="button" className="icon-button" aria-label={`Move ${p.title || 'policy'} up`} disabled={i === 0} onClick={() => movePolicy(i, -1)}><ArrowUp size={16} /></button>
        <button type="button" className="icon-button" aria-label={`Move ${p.title || 'policy'} down`} disabled={i === t.policies.length - 1} onClick={() => movePolicy(i, 1)}><ArrowDown size={16} /></button>
        <button type="button" className="icon-button" aria-label={`Remove ${p.title || 'policy'}`} onClick={() => set({ policies: t.policies.filter((_, j) => j !== i) })}><Trash2 size={16} /></button></span></div>
      <Field label="Title"><input value={p.title} maxLength={80} onChange={e => setPolicy(i, { title: e.target.value })} /></Field>
      <Field label="First line"><textarea value={p.intro} maxLength={600} rows={2} onChange={e => setPolicy(i, { intro: e.target.value })} /></Field>
      <Field label="Bullet points" hint="One per line"><textarea value={p.items.join('\n')} rows={3} onChange={e => setPolicy(i, { items: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} /></Field>
      <Field label="Last line (optional)"><textarea value={p.outro} maxLength={600} rows={2} onChange={e => setPolicy(i, { outro: e.target.value })} /></Field>
    </div>)}
    <button type="button" className="button button-outline" onClick={() => set({ policies: [...t.policies, { id: `policy-${Date.now()}`, title: '', intro: '', items: [], outro: '' }] })}><Plus size={16} /> Add a policy</button>
    <h3>Deposit & payment</h3>
    <Field label="How clients can pay" hint="Shown at the top of the page, e.g. Cash or e-transfer"><input value={t.paymentMethods} maxLength={80} onChange={e => set({ paymentMethods: e.target.value })} /></Field>
    <Field label="Deposit amount (CA$)"><input type="number" min={0} step={1} value={dollars(t.depositCents)} onChange={e => set({ depositCents: cents(e.target.value) })} /></Field>
    <Field label="E-transfer to (optional)" hint="The email or phone number clients send their deposit to. Shown in step 2 after they book."><input value={t.etransferTo ?? ''} maxLength={120} placeholder="e.g. your e-transfer email" onChange={e => set({ etransferTo: e.target.value })} /></Field>
    <Field label="Deposit and payment note" hint="Shown on the booking page and in confirmation emails"><textarea value={t.depositSummary} maxLength={600} rows={3} onChange={e => set({ depositSummary: e.target.value })} /></Field>
    <h3>Contact</h3>
    <div className="editor-two">
      <Field label="Contact heading"><input value={t.contactTitle} maxLength={60} onChange={e => set({ contactTitle: e.target.value })} /></Field>
      <Field label="Heading, second line"><input value={t.contactTitleAccent} maxLength={60} onChange={e => set({ contactTitleAccent: e.target.value })} /></Field>
    </div>
    <Field label="Contact message"><textarea rows={2} value={t.contactIntro} maxLength={400} onChange={e => set({ contactIntro: e.target.value })} /></Field>
    <Field label="Instagram username"><input value={t.instagramHandle} maxLength={31} onChange={e => set({ instagramHandle: e.target.value })} /></Field>
    <Field label="Email address"><input type="email" value={t.email} maxLength={200} onChange={e => set({ email: e.target.value })} /></Field>
    <Field label="Phone number for texts (optional)" hint="Clients can text you their booking in one tap. Leave empty to keep your number off the site."><input type="tel" value={t.phone ?? ''} maxLength={20} placeholder="416-555-0101" onChange={e => set({ phone: e.target.value })} /></Field>
    <Field label="Thank-you title"><input value={t.thankYouTitle} maxLength={120} onChange={e => set({ thankYouTitle: e.target.value })} /></Field>
    <Field label="Thank-you line"><input value={t.thankYouBody} maxLength={600} onChange={e => set({ thankYouBody: e.target.value })} /></Field>
    <div className="admin-actions"><button type="button" className="button" disabled={!dirty || busy} onClick={save}>Save text</button>{dirty && <button type="button" className="button button-outline" disabled={busy} onClick={() => setT(saved)}>Undo changes</button>}</div>
    {dirty && <div className="unsaved-bar"><span>Unsaved changes</span><button type="button" className="button button-small" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save text'}</button></div>}
  </div>;
}

/* ---------- Menu: categories and services ---------- */
function MenuTab({ content, apply }: { content: SiteContent; apply: Apply }) {
  const [editing, setEditing] = useState<{ category: string; id: string | null } | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [open, setOpen] = useState<string | null>(content.categories[0]?.slug ?? null);
  const ordered = [...content.categories].sort((a, b) => a.sort_order - b.sort_order);
  return <div className="editor-panel">
    <h3>Categories</h3>
    <p className="muted">Each category is a row on the menu. Hidden categories stay saved but do not show on the website.</p>
    <ul className="editor-list">{ordered.map((c, i) => <li key={c.slug} className="editor-row">
      <div className="editor-row-main"><strong>{c.label}</strong><span className="muted">{content.services.filter(s => s.category === c.slug).length} services{c.active ? '' : ' · hidden'}</span></div>
      <span className="editor-row-actions">
        <button type="button" className="icon-button" aria-label={`Move ${c.label} up`} disabled={i === 0} onClick={() => apply({ type: 'reorder', kind: 'categories', ids: swap(ordered.map(x => x.slug), i, i - 1) })}><ArrowUp size={16} /></button>
        <button type="button" className="icon-button" aria-label={`Move ${c.label} down`} disabled={i === ordered.length - 1} onClick={() => apply({ type: 'reorder', kind: 'categories', ids: swap(ordered.map(x => x.slug), i, i + 1) })}><ArrowDown size={16} /></button>
        <button type="button" className="chip" aria-pressed={!c.active} onClick={() => apply({ type: 'category', category: { ...c, active: !c.active } })}>{c.active ? 'Hide' : 'Show'}</button>
        <button type="button" className="icon-button" aria-label={`Delete category ${c.label}`} disabled={content.services.some(s => s.category === c.slug)} title={content.services.some(s => s.category === c.slug) ? 'Move or delete its services first' : undefined} onClick={() => { if (confirm(`Delete the category "${c.label}"?`)) apply({ type: 'deleteCategory', slug: c.slug }); }}><Trash2 size={16} /></button>
      </span>
      <CategoryRename category={c} apply={apply} />
    </li>)}</ul>
    <form className="editor-inline-form" onSubmit={e => { e.preventDefault(); if (!newCategory.trim()) return; apply({ type: 'category', category: { slug: '', label: newCategory.trim(), short: newCategory.trim(), sort_order: ordered.length, active: true } }).then(() => setNewCategory('')); }}>
      <input value={newCategory} maxLength={60} placeholder="New category, e.g. Cornrows" aria-label="New category name" onChange={e => setNewCategory(e.target.value)} />
      <button className="button button-outline" disabled={!newCategory.trim()}><Plus size={16} /> Add category</button>
    </form>

    <h3>Services & prices</h3>
    {ordered.map(c => {
      const services = content.services.filter(s => s.category === c.slug).sort((a, b) => a.sort_order - b.sort_order);
      const expanded = open === c.slug;
      return <section key={c.slug} className={`editor-group ${expanded ? 'is-open' : ''}`}>
        <button type="button" className="editor-group-head" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : c.slug)}><span>{c.label}</span><span className="muted">{services.length} {services.length === 1 ? 'service' : 'services'}</span></button>
        {expanded && <div className="editor-group-body">
          <ul className="editor-list">{services.map((s, i) => <li key={s.id} className="editor-row">
            {editing?.id === s.id ? <ServiceForm key={s.id} service={s} categories={ordered} apply={apply} onDone={() => setEditing(null)} /> : <>
              <div className="editor-row-main"><strong>{s.name}</strong><span className="muted">{money(s.price_cents)} · {durationRange(s)}{s.active ? '' : ' · hidden'}</span></div>
              <span className="editor-row-actions">
                <button type="button" className="icon-button" aria-label={`Move ${s.name} up`} disabled={i === 0} onClick={() => apply({ type: 'reorder', kind: 'services', ids: swap(services.map(x => x.id), i, i - 1) })}><ArrowUp size={16} /></button>
                <button type="button" className="icon-button" aria-label={`Move ${s.name} down`} disabled={i === services.length - 1} onClick={() => apply({ type: 'reorder', kind: 'services', ids: swap(services.map(x => x.id), i, i + 1) })}><ArrowDown size={16} /></button>
                <button type="button" className="chip" onClick={() => setEditing({ category: c.slug, id: s.id })}>Edit</button>
              </span></>}
          </li>)}</ul>
          {editing?.category === c.slug && editing.id === null
            ? <ServiceForm service={{ id: '', slug: '', category: c.slug, name: '', description: '', hair: '', price_cents: 0, duration_min: 240, duration_max_min: null, active: true, sort_order: services.length }} categories={ordered} apply={apply} onDone={() => setEditing(null)} isNew />
            : <button type="button" className="button button-outline" onClick={() => setEditing({ category: c.slug, id: null })}><Plus size={16} /> Add a service to {c.label}</button>}
        </div>}
      </section>;
    })}
  </div>;
}

function CategoryRename({ category, apply }: { category: Category; apply: Apply }) {
  const [label, setLabel] = useState(category.label);
  const [short, setShort] = useState(category.short);
  const dirty = label.trim() !== category.label || short.trim() !== category.short;
  return <form className="editor-inline-form editor-rename" onSubmit={e => { e.preventDefault(); apply({ type: 'category', category: { ...category, label: label.trim(), short: short.trim() || label.trim() } }); }}>
    <input value={label} maxLength={60} aria-label={`Name of category ${category.label}`} onChange={e => setLabel(e.target.value)} />
    <input value={short} maxLength={30} aria-label={`Short name of category ${category.label}`} placeholder="Short name" onChange={e => setShort(e.target.value)} />
    {dirty && <button className="button button-small">Save name</button>}
  </form>;
}

function ServiceForm({ service, categories, apply, onDone, isNew = false }: { service: Service; categories: Category[]; apply: Apply; onDone: () => void; isNew?: boolean }) {
  const split = splitName(service.name);
  const [title, setTitle] = useState(split.title), [variant, setVariant] = useState(split.variant ?? '');
  const [s, setS] = useState(service);
  const [ranged, setRanged] = useState(service.duration_max_min !== null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Service>) => setS({ ...s, ...patch });
  const name = variant.trim() ? `${title.trim()} — ${variant.trim()}` : title.trim();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await apply({ type: 'service', service: { ...s, name, duration_max_min: ranged ? s.duration_max_min ?? s.duration_min : null } }); onDone(); } catch { /* message shown by the editor */ } finally { setBusy(false); }
  }
  return <form className="editor-card service-form" onSubmit={submit} aria-label={isNew ? 'New service' : `Edit ${service.name}`}>
    <div className="editor-two">
      <Field label="Service name"><input required value={title} maxLength={80} placeholder="e.g. Large Knotless Braids" onChange={e => setTitle(e.target.value)} /></Field>
      <Field label="Length or size (optional)" hint="Shown under the name, e.g. Shoulder Length"><input value={variant} maxLength={40} onChange={e => setVariant(e.target.value)} /></Field>
    </div>
    <div className="editor-two">
      <Field label="Category"><select value={s.category} onChange={e => set({ category: e.target.value })}>{categories.map(c => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></Field>
      <Field label="Price (CA$)"><input type="number" required min={0} step={1} value={dollars(s.price_cents)} onChange={e => set({ price_cents: cents(e.target.value) })} /></Field>
    </div>
    <div className="editor-two">
      <DurationField label={ranged ? 'Shortest time' : 'Time it takes'} minutes={s.duration_min} onChange={m => set({ duration_min: m })} />
      {ranged ? <DurationField label="Longest time" minutes={s.duration_max_min ?? s.duration_min} onChange={m => set({ duration_max_min: m })} /> : <span />}
    </div>
    <label className="check-label"><input type="checkbox" checked={ranged} onChange={e => setRanged(e.target.checked)} /><span>This takes a range of time (e.g. 5–6 hours)</span></label>
    <Field label="Description (optional)"><textarea rows={2} value={s.description} maxLength={400} onChange={e => set({ description: e.target.value })} /></Field>
    <Field label="Hair the client should bring"><textarea rows={2} value={s.hair} maxLength={400} placeholder="e.g. 3 packs of pre-stretched braiding hair." onChange={e => set({ hair: e.target.value })} /></Field>
    <label className="check-label"><input type="checkbox" checked={s.active} onChange={e => set({ active: e.target.checked })} /><span>Show on the website</span></label>
    <div className="admin-actions">
      <button className="button" disabled={busy || !title.trim()}>{isNew ? 'Add service' : 'Save service'}</button>
      <button type="button" className="button button-outline" disabled={busy} onClick={onDone}>Cancel</button>
      {!isNew && <button type="button" className="button button-outline editor-danger" disabled={busy} onClick={() => { if (confirm(`Delete "${service.name}" from the menu?`)) apply({ type: 'deleteService', id: service.id }).then(onDone); }}><Trash2 size={16} /> Delete</button>}
    </div>
  </form>;
}

function DurationField({ label, minutes, onChange }: { label: string; minutes: number; onChange: (m: number) => void }) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return <div className="editor-field"><span>{label}</span><div className="duration-inputs">
    <label><input type="number" min={0} max={24} value={h} aria-label={`${label}: hours`} onChange={e => onChange(Math.max(15, Number(e.target.value) * 60 + m))} /><small>hr</small></label>
    <label><select value={m} aria-label={`${label}: minutes`} onChange={e => onChange(Math.max(15, h * 60 + Number(e.target.value)))}>{[0, 15, 30, 45].map(v => <option key={v} value={v}>{v}</option>)}</select><small>min</small></label>
  </div></div>;
}

/* ---------- Add-ons ---------- */
function ExtrasTab({ extras, apply }: { extras: Extra[]; apply: Apply }) {
  const [editing, setEditing] = useState<string | null>(null);
  return <div className="editor-panel">
    <p className="muted">Add-ons appear under the menu and can be added when booking. Price ranges (CA$30–CA$50) and open prices (CA$30+) are supported.</p>
    {extraGroups.map(g => {
      const list = extras.filter(e => e.group === g.slug).sort((a, b) => a.sort_order - b.sort_order);
      return <section key={g.slug} className="editor-group is-open">
        <h3>{g.label}</h3>
        <ul className="editor-list">{list.map((e, i) => <li key={e.id} className="editor-row">
          {editing === e.id ? <ExtraForm extra={e} apply={apply} onDone={() => setEditing(null)} /> : <>
            <div className="editor-row-main"><strong>{e.name}</strong><span className="muted">{e.price_cents === 0 && !e.price_max_cents ? 'No charge' : priceLabel(extraLine(e))}{e.bookable ? '' : ' · info only'}{e.active ? '' : ' · hidden'}</span></div>
            <span className="editor-row-actions">
              <button type="button" className="icon-button" aria-label={`Move ${e.name} up`} disabled={i === 0} onClick={() => apply({ type: 'reorder', kind: 'extras', ids: swap(list.map(x => x.id), i, i - 1) })}><ArrowUp size={16} /></button>
              <button type="button" className="icon-button" aria-label={`Move ${e.name} down`} disabled={i === list.length - 1} onClick={() => apply({ type: 'reorder', kind: 'extras', ids: swap(list.map(x => x.id), i, i + 1) })}><ArrowDown size={16} /></button>
              <button type="button" className="chip" onClick={() => setEditing(e.id)}>Edit</button>
            </span></>}
        </li>)}</ul>
        {editing === `new-${g.slug}` ? <ExtraForm extra={{ id: '', slug: '', group: g.slug, name: '', description: '', price_cents: 0, price_max_cents: null, price_plus: false, duration_min: 0, bookable: true, active: true, sort_order: list.length }} apply={apply} onDone={() => setEditing(null)} isNew />
          : <button type="button" className="button button-outline" onClick={() => setEditing(`new-${g.slug}`)}><Plus size={16} /> Add to {g.label.toLowerCase()}</button>}
      </section>;
    })}
  </div>;
}

function ExtraForm({ extra, apply, onDone, isNew = false }: { extra: Extra; apply: Apply; onDone: () => void; isNew?: boolean }) {
  const [e, setE] = useState(extra);
  const [range, setRange] = useState(extra.price_max_cents !== null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Extra>) => setE({ ...e, ...patch });
  return <form className="editor-card" onSubmit={async ev => { ev.preventDefault(); setBusy(true); try { await apply({ type: 'extra', extra: { ...e, price_max_cents: range ? e.price_max_cents ?? e.price_cents : null } }); onDone(); } catch { /* shown by the editor */ } finally { setBusy(false); } }} aria-label={isNew ? 'New add-on' : `Edit ${extra.name}`}>
    <Field label="Add-on name"><input required value={e.name} maxLength={80} onChange={ev => set({ name: ev.target.value })} /></Field>
    <div className="editor-two">
      <Field label={range ? 'Price from (CA$)' : 'Price (CA$)'}><input type="number" min={0} step={1} value={dollars(e.price_cents)} onChange={ev => set({ price_cents: cents(ev.target.value) })} /></Field>
      {range ? <Field label="Price up to (CA$)"><input type="number" min={0} step={1} value={dollars(e.price_max_cents ?? e.price_cents)} onChange={ev => set({ price_max_cents: cents(ev.target.value) })} /></Field> : <span />}
    </div>
    <label className="check-label"><input type="checkbox" checked={range} onChange={ev => setRange(ev.target.checked)} /><span>Price is a range</span></label>
    <label className="check-label"><input type="checkbox" checked={e.price_plus} onChange={ev => set({ price_plus: ev.target.checked })} /><span>Show a “+” (price may be more)</span></label>
    <Field label="Details (optional)"><textarea rows={2} value={e.description} maxLength={400} onChange={ev => set({ description: ev.target.value })} /></Field>
    <label className="check-label"><input type="checkbox" checked={e.bookable} onChange={ev => set({ bookable: ev.target.checked })} /><span>Clients can add this when booking</span></label>
    <label className="check-label"><input type="checkbox" checked={e.active} onChange={ev => set({ active: ev.target.checked })} /><span>Show on the website</span></label>
    <div className="admin-actions">
      <button className="button" disabled={busy || !e.name.trim()}>{isNew ? 'Add add-on' : 'Save add-on'}</button>
      <button type="button" className="button button-outline" disabled={busy} onClick={onDone}>Cancel</button>
      {!isNew && <button type="button" className="button button-outline editor-danger" disabled={busy} onClick={() => { if (confirm(`Delete "${extra.name}"?`)) apply({ type: 'deleteExtra', id: extra.id }).then(onDone); }}><Trash2 size={16} /> Delete</button>}
    </div>
  </form>;
}

/* ---------- Photos ---------- */
function PhotosTab({ content, apply }: { content: SiteContent; apply: Apply }) {
  return <div className="editor-panel">
    <PortraitEditor content={content} apply={apply} />
    <p className="muted">Photos sit next to their category on the menu. Upload straight from your phone; they are resized automatically. Tick “my own work” to show the “Braided by Sika” caption.</p>
    {[...content.categories].sort((a, b) => a.sort_order - b.sort_order).map(c => <CategoryPhotos key={c.slug} category={c} photos={content.photos.filter(p => p.category === c.slug).sort((a, b) => a.sort_order - b.sort_order)} apply={apply} />)}
  </div>;
}

function CategoryPhotos({ category, photos, apply }: { category: Category; photos: Photo[]; apply: Apply }) {
  const input = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState(''), [own, setOwn] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function upload(file: File) {
    setBusy(true); setError('');
    try { const { dataUrl, width, height } = await resizeImage(file); await apply({ type: 'uploadPhoto', upload: { category: category.slug, alt: alt.trim() || `${category.label} by Styled by Sika`, own, dataUrl, width, height } }); setAlt(''); }
    catch (e) { setError((e as Error).message || 'That photo could not be added.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  }
  return <section className="editor-group is-open" aria-label={`${category.label} photos`}>
    <h3>{category.label} <span className="muted">· {photos.length} {photos.length === 1 ? 'photo' : 'photos'}</span></h3>
    {photos.length > 0 && <ul className="photo-list">{photos.map((p, i) => <li key={p.id} className="photo-item">
      <Image src={p.url} alt={p.alt} width={p.width} height={p.height} unoptimized sizes="120px" />
      <div className="photo-item-fields">
        <PhotoAlt photo={p} apply={apply} />
        <label className="check-label"><input type="checkbox" checked={p.own} onChange={e => apply({ type: 'photo', photo: { id: p.id, category: p.category, alt: p.alt, own: e.target.checked, sort_order: p.sort_order } })} /><span>My own work</span></label>
        <span className="editor-row-actions">
          <button type="button" className="icon-button" aria-label={`Move ${category.label} photo ${i + 1} left`} disabled={i === 0} onClick={() => apply({ type: 'reorder', kind: 'photos', ids: swap(photos.map(x => x.id), i, i - 1) })}><ArrowUp size={16} /></button>
          <button type="button" className="icon-button" aria-label={`Move ${category.label} photo ${i + 1} right`} disabled={i === photos.length - 1} onClick={() => apply({ type: 'reorder', kind: 'photos', ids: swap(photos.map(x => x.id), i, i + 1) })}><ArrowDown size={16} /></button>
          <button type="button" className="icon-button" aria-label={`Remove ${category.label} photo ${i + 1}`} onClick={() => { if (confirm('Remove this photo from the website?')) apply({ type: 'deletePhoto', id: p.id }); }}><Trash2 size={16} /></button>
        </span>
      </div>
    </li>)}</ul>}
    <div className="upload-box">
      <Field label="Describe the photo (for screen readers and search)"><input value={alt} maxLength={200} placeholder={`e.g. Medium ${category.label.toLowerCase()} from the back`} onChange={e => setAlt(e.target.value)} /></Field>
      <label className="check-label"><input type="checkbox" checked={own} onChange={e => setOwn(e.target.checked)} /><span>This is my own work</span></label>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label={`Add a photo to ${category.label}`} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      <button type="button" className="button button-outline" disabled={busy} onClick={() => input.current?.click()}><Upload size={16} /> {busy ? 'Adding photo…' : `Add a photo to ${category.label}`}</button>
      {error && <p className="field-error">{error}</p>}
    </div>
  </section>;
}

// Her own photo in the welcome card: upload a new one to replace it.
function PortraitEditor({ content, apply }: { content: SiteContent; apply: Apply }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const current = portraitOf(content);
  async function replace(file: File) {
    setBusy(true); setError('');
    try {
      const { dataUrl, width, height } = await resizeImage(file, 1200);
      const old = content.photos.filter(p => p.category === portraitCategory);
      await apply({ type: 'uploadPhoto', upload: { category: portraitCategory, alt: content.text.name, own: true, dataUrl, width, height } });
      for (const p of old) await apply({ type: 'deletePhoto', id: p.id });
    } catch (e) { setError((e as Error).message || 'That photo could not be added.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  }
  return <section className="editor-group is-open" aria-label="Your photo">
    <h3>Your photo <span className="muted">· welcome card</span></h3>
    <div className="portrait-editor">
      <Image src={current.url} alt={current.alt} width={current.width} height={current.height} unoptimized sizes="120px" />
      <div>
        <p className="muted">A clear photo of you, ideally taller than it is wide.</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label="Replace your photo" onChange={e => { const f = e.target.files?.[0]; if (f) replace(f); }} />
        <button type="button" className="button button-outline" disabled={busy} onClick={() => input.current?.click()}><Upload size={16} /> {busy ? 'Uploading…' : 'Replace your photo'}</button>
        {error && <p className="field-error">{error}</p>}
      </div>
    </div>
  </section>;
}

function PhotoAlt({ photo, apply }: { photo: Photo; apply: Apply }) {
  const [alt, setAlt] = useState(photo.alt);
  return <form className="editor-inline-form" onSubmit={e => { e.preventDefault(); apply({ type: 'photo', photo: { id: photo.id, category: photo.category, alt: alt.trim(), own: photo.own, sort_order: photo.sort_order } }); }}>
    <input value={alt} maxLength={200} aria-label="Photo description" onChange={e => setAlt(e.target.value)} />
    {alt.trim() !== photo.alt && <button className="button button-small">Save</button>}
  </form>;
}

function swap<T>(list: T[], a: number, b: number) { const next = [...list]; [next[a], next[b]] = [next[b], next[a]]; return next; }
