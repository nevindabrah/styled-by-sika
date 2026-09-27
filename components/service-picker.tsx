'use client';

import { useState } from 'react';
import { Check, ChevronDown, Clock3 } from 'lucide-react';
import { categories, extraGroups } from '@/lib/menu';
import { durationLabel, durationRange, extraLine, money, priceLabel, quote, splitName } from '@/lib/pricing';
import type { Catalog, Selection, Service } from '@/lib/types';

// A menu-style chooser instead of a native dropdown: pick a category, then a service.
export function ServicePicker({ catalog: c, value: s, onChange }: { catalog: Catalog; value: Selection; onChange: (s: Selection) => void }) {
  const service = c.services.find(x => x.id === s.service);
  const [choosing, setChoosing] = useState(!service);
  const [openCategory, setOpenCategory] = useState<string | null>(service?.category ?? null);
  function pick(x: Service) { onChange({ ...s, service: x.id }); setChoosing(false); }
  return <div className="service-picker">
    <p className="field-label" id="service-label">1. Your service</p>
    {service && !choosing && <div className="picked-service" aria-labelledby="service-label">
      <PickedService service={service} />
      <button type="button" className="text-link picked-change" onClick={() => { setOpenCategory(service.category); setChoosing(true); }}>Change service</button>
    </div>}
    {(choosing || !service) && <div className="service-chooser" role="group" aria-labelledby="service-label">
      {categories.map(cat => {
        const options = c.services.filter(x => x.category === cat.slug);
        if (!options.length) return null;
        const open = openCategory === cat.slug, from = Math.min(...options.map(x => x.price_cents));
        return <div key={cat.slug} className={`chooser-category ${open ? 'is-open' : ''}`}>
          <button type="button" className="chooser-head" aria-expanded={open} aria-controls={`choose-${cat.slug}`} onClick={() => setOpenCategory(open ? null : cat.slug)}>
            <span className="chooser-title">{cat.label}</span>
            <span className="chooser-meta">{options.length} options · from {money(from)}</span>
            <ChevronDown size={20} className="chooser-chevron" aria-hidden="true" />
          </button>
          <div id={`choose-${cat.slug}`} className="chooser-options" role="radiogroup" aria-label={cat.label} hidden={!open}>
            {options.map(x => { const { title, variant } = splitName(x.name), selected = x.id === s.service; return <button key={x.id} type="button" role="radio" aria-checked={selected} className={`chooser-option ${selected ? 'is-selected' : ''}`} onClick={() => pick(x)}>
              <span className="chooser-option-name">{title}{variant && <small>{variant}</small>}</span>
              <span className="chooser-option-meta"><strong>{money(x.price_cents)}</strong><span><Clock3 size={13} aria-hidden="true" /> {durationRange(x)}</span></span>
              <span className="chooser-check" aria-hidden="true">{selected && <Check size={16} />}</span>
            </button>; })}
          </div>
        </div>;
      })}
      {service && <button type="button" className="text-link picked-change" onClick={() => setChoosing(false)}>Keep {splitName(service.name).title}</button>}
    </div>}
    <fieldset>
      <legend>2. Extras <span className="muted">(optional)</span></legend>
      {extraGroups.map(group => <div key={group.slug} className="addon-group">
        <p className="addon-group-label">{group.label}</p>
        <div className="addon-list">{c.extras.filter(e => e.group === group.slug && e.bookable).map(e => <label key={e.id} className={`addon ${s.extras.includes(e.id) ? 'selected' : ''}`}>
          <input type="checkbox" checked={s.extras.includes(e.id)} onChange={() => onChange({ ...s, extras: s.extras.includes(e.id) ? s.extras.filter(id => id !== e.id) : [...s.extras, e.id] })} />
          <span>{e.name}</span><span>+{priceLabel(extraLine(e))}</span>
        </label>)}</div>
      </div>)}
    </fieldset>
  </div>;
}

function PickedService({ service }: { service: Service }) {
  const { title, variant } = splitName(service.name);
  return <>
    <p className="service-name">{title}{variant && <span>{variant}</span>}</p>
    <p className="service-meta"><strong>{money(service.price_cents)}</strong><span><Clock3 size={15} aria-hidden="true" /> {durationRange(service)}</span></p>
    <p>{service.description}</p>
    <p><b>Hair:</b> {service.hair}</p>
  </>;
}

export function QuoteSummary({ catalog, selection }: { catalog: Catalog; selection: Selection }) {
  if (!selection.service) return <div className="quote-summary"><div className="eyebrow">YOUR APPOINTMENT</div><p className="muted">Choose a service to see the price and time.</p></div>;
  let q;
  try { q = quote(catalog, selection); } catch (error) { return <div className="notice" role="status">{(error as Error).message}</div>; }
  return <div className="quote-summary">
    <div className="eyebrow">YOUR APPOINTMENT</div>
    <div className="quote-lines">{q.breakdown.map((l, i) => <div key={i}><span>{l.label}</span><span>{priceLabel(l)}</span></div>)}</div>
    <div className="quote-total"><span>Estimated total</span><strong>{q.estimate}</strong></div>
    <p className="duration"><Clock3 size={17} aria-hidden="true" /> {q.service.duration_max_min ? `About ${durationRange(q.service)}` : `About ${durationLabel(q.duration)}`} in the chair{q.extras.length ? ', plus any extras' : ''}</p>
    <p className="quote-bottom">CA$20 non-refundable deposit to secure your appointment. It goes toward your balance. Pay by cash or e-transfer.</p>
  </div>;
}
