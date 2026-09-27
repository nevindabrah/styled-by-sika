'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Clock3 } from 'lucide-react';
import { extraGroups } from '@/lib/menu';
import { durationRange, extraLine, money, priceLabel, splitName } from '@/lib/pricing';
import type { Extra, Service } from '@/lib/types';
import type { Photo } from '@/lib/content';

export type MenuGroup = { slug: string; label: string; services: Service[]; photos: Photo[] };

// Categories start closed; tapping one reveals its options. Every option stays in the page (hidden, not removed)
// so links, search engines and the floating Book bar can still find them.
export function MenuAccordion({ groups, extras, showPrices }: { groups: MenuGroup[]; extras: Extra[]; showPrices: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    // /#menu-boho or /#large-boho-standard opens the matching category, on load and on later hash jumps.
    function openFromHash() {
      const hash = decodeURIComponent(location.hash.slice(1));
      if (!hash) return;
      const target = groups.find(g => `menu-${g.slug}` === hash || g.services.some(s => s.slug === hash))?.slug ?? (hash === 'menu-extras' ? 'extras' : null);
      if (target) { setOpen(target); requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: 'start' })); }
    }
    openFromHash();
    addEventListener('hashchange', openFromHash);
    return () => removeEventListener('hashchange', openFromHash);
  }, [groups]);
  function toggle(slug: string) {
    const next = open === slug ? null : slug;
    setOpen(next);
    if (next) requestAnimationFrame(() => { const el = document.getElementById(`menu-${slug}`); if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' }); });
  }
  return <div className="menu-accordion">
    {groups.map(g => {
      const from = Math.min(...g.services.map(s => s.price_cents)), expanded = open === g.slug;
      return <section key={g.slug} id={`menu-${g.slug}`} className={`menu-row ${expanded ? 'is-open' : ''}`}>
        <h3 className="menu-row-heading">
          <button type="button" className="menu-row-head" aria-expanded={expanded} aria-controls={`panel-${g.slug}`} onClick={() => toggle(g.slug)}>
            <span className="menu-row-title">{g.label}</span>
            <span className="menu-row-meta">{g.services.length} {g.services.length === 1 ? 'option' : 'options'}{showPrices && <> · from {money(from)}</>}</span>
            <ChevronDown className="menu-row-chevron" size={22} aria-hidden="true" />
          </button>
        </h3>
        <div id={`panel-${g.slug}`} className="menu-row-body" hidden={!expanded}>
          {g.photos.length > 0 && <div className="work-photos">{g.photos.map(p => <Image key={p.id} src={p.url} alt={p.alt} width={p.width} height={p.height} sizes="(max-width:700px) 40vw, 150px" unoptimized />)}{g.photos.every(p => p.own) && <small>Braided by Sika</small>}</div>}
          <div className="menu-list">{g.services.map(s => <ServiceItem key={s.id} service={s} showPrices={showPrices} />)}</div>
        </div>
      </section>;
    })}
    <section id="menu-extras" className={`menu-row ${open === 'extras' ? 'is-open' : ''}`}>
      <h3 className="menu-row-heading">
        <button type="button" className="menu-row-head" aria-expanded={open === 'extras'} aria-controls="panel-extras" onClick={() => toggle('extras')}>
          <span className="menu-row-title">Add-ons & extras</span>
          <span className="menu-row-meta">Choose these when you book</span>
          <ChevronDown className="menu-row-chevron" size={22} aria-hidden="true" />
        </button>
      </h3>
      <div id="panel-extras" className="menu-row-body" hidden={open !== 'extras'}>
        <div className="extras">{extraGroups.map(group => <div key={group.slug} className="extras-group"><h4>{group.label}</h4><ul>{extras.filter(e => e.group === group.slug).map(e => <li key={e.id}><div className="extra-row"><span>{e.name}</span>{showPrices && <strong>{e.price_cents === 0 && !e.price_max_cents ? 'You provide' : `${group.slug === 'additional' && e.price_max_cents ? 'Add ' : ''}${priceLabel(extraLine(e))}`}</strong>}</div>{e.description && <p>{e.description}</p>}</li>)}</ul></div>)}</div>
      </div>
    </section>
  </div>;
}

function ServiceItem({ service: s, showPrices }: { service: Service; showPrices: boolean }) {
  const { title, variant } = splitName(s.name);
  return <article className="service" id={s.slug}>
    <div className="service-main">
      <h4 className="service-name">{title}{variant && <span>{variant}</span>}</h4>
      <p className="service-meta">{showPrices && <strong>{money(s.price_cents)}</strong>}<span><Clock3 size={14} aria-hidden="true" /> {durationRange(s)}</span></p>
      <p className="service-desc">{s.description}</p>
      <p className="service-hair"><b>Hair:</b> {s.hair}</p>
    </div>
    <Link className="button button-small service-book" href={`/book?service=${s.slug}`} aria-label={`Book ${s.name}`} data-book-cta>Book</Link>
  </article>;
}
