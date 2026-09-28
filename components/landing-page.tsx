'use client';

import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Instagram, Mail, MapPin, MessageSquare } from 'lucide-react';
import { firstName, instagramLinks, portraitOf, type SiteContent } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';
import { money } from '@/lib/pricing';
import { BraiderIntro } from './braider-intro';
import { MenuAccordion } from './menu-accordion';
import { MobileBookBar } from './mobile-book-bar';
import { Spark } from './spark';

// The whole public page, rendered from the content Sika edits in her dashboard.
export function LandingPage({ content: initial }: { content: SiteContent }) {
  const content = useSiteContent(initial);
  const { text } = content, ig = instagramLinks(text.instagramHandle), showPrices = !content.placeholder;
  const groups = content.categories.map(c => ({ slug: c.slug, label: c.label, services: content.services.filter(s => s.category === c.slug), photos: content.photos.filter(p => p.category === c.slug) })).filter(g => g.services.length);
  const lowest = content.services.length ? Math.min(...content.services.map(s => s.price_cents)) : 0;
  const deposit = money(text.depositCents);
  return <>
    <section className="hero section-wrap"><div className="hero-copy"><div className="eyebrow hero-brand"><span className="tiny-dot" /> STYLED BY SIKA</div><h1>Braids by<br /><em>{firstName(text.name)}.</em><span className="headline-spark" aria-hidden="true"><Spark /></span></h1><p className="hero-address"><MapPin aria-hidden="true" /><strong>{text.location}</strong></p><p className="hero-services">{text.heroServices}</p>
      <ul className="hero-facts" aria-label="At a glance">{showPrices && lowest > 0 && <li><strong>From {money(lowest)}</strong></li>}<li>{deposit} deposit</li>{text.paymentMethods && <li>{text.paymentMethods}</li>}</ul>
      <div className="hero-actions"><Link className="button" href="/book" data-book-cta="main">Book now <ArrowUpRight size={19} /></Link><a className="text-link" href="#services">See services & prices <ArrowDown size={17} /></a></div><a className="hero-ig" href={ig.dm} target="_blank" rel="noreferrer"><Instagram size={18} aria-hidden="true" /> Questions? DM <strong>{text.instagramHandle}</strong></a></div><BraiderIntro title={text.welcomeTitle} body={text.welcomeBody} photo={portraitOf(content)} /></section>
    <div className="ticker" aria-hidden="true"><div className="ticker-track" style={{ animationDuration: `${Math.max(18, content.categories.length * 5)}s` }}>{[0, 1].map(copy => content.categories.map(c => <span key={`${copy}-${c.slug}`} className="ticker-item"><span>{c.short.toUpperCase()}</span><i><Spark /></i></span>))}</div></div>

    <section id="services" className="section-wrap section menu-section" aria-labelledby="services-heading">
      <div className="section-heading"><div><div className="eyebrow">THE MENU</div><h2 id="services-heading">Services & <em>prices.</em></h2></div><p className="muted menu-intro">Tap a category to see its options, then <strong>Book</strong>. Prices in Canadian dollars.</p></div>
      <MenuAccordion groups={groups} extras={content.extras} showPrices={showPrices} />
    </section>

    <section id="before-you-book" className="section-wrap section policies-section" aria-labelledby="policies-heading">
      <div className="policies-intro"><div className="eyebrow">BEFORE YOU BOOK</div><h2 id="policies-heading">Before you <em>book.</em></h2><p>{text.beforeYouBook}</p></div>
      <div className="policy-grid">{text.policies.map((p, i) => <article key={p.id} id={p.id} className="policy"><span className="policy-number">{String(i + 1).padStart(2, '0')}</span><h3>{p.title}</h3>{p.intro && <p>{p.intro}</p>}{p.items.length > 0 && <ul>{p.items.map(item => <li key={item}>{item}</li>)}</ul>}{p.outro && <p className="muted">{p.outro}</p>}{p.id === 'hair-requirements' && <a className="text-link policy-link" href={ig.dm} target="_blank" rel="noreferrer"><Instagram size={15} aria-hidden="true" /> Message {text.instagramHandle}</a>}</article>)}</div>
    </section>

    <section id="contact" className="closing-cta section-wrap" aria-labelledby="contact-heading"><span className="closing-star" aria-hidden="true"><Spark /></span><div className="eyebrow">CONTACT</div><h2 id="contact-heading">{text.contactTitle}{text.contactTitleAccent && <><br /><em>{text.contactTitleAccent}</em></>}</h2>{text.contactIntro && <p className="closing-copy">{text.contactIntro}</p>}
      <div className="contact-actions"><a className="button button-dark" href={ig.profile} target="_blank" rel="noreferrer"><Instagram size={18} aria-hidden="true" /> Instagram {text.instagramHandle}</a><a className="button button-dark" href={`mailto:${text.email}`}><Mail size={18} aria-hidden="true" /> {text.email}</a>{text.phone && <a className="button button-dark" href={`sms:${text.phone.replace(/[^\d+]/g, '')}`}><MessageSquare size={18} aria-hidden="true" /> Text {text.phone}</a>}</div>
      <p className="closing-thanks"><strong>{text.thankYouTitle}</strong><br />{text.thankYouBody}</p>
      <Link className="text-link closing-book" href="/book" data-book-cta="main">Book an appointment <ArrowUpRight size={17} /></Link></section>
    <MobileBookBar note={showPrices && lowest > 0 ? `From ${money(lowest)} · ${deposit} deposit` : `${deposit} deposit`} />
  </>;
}
