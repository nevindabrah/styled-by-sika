import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Instagram, Mail, MapPin } from 'lucide-react';
import { braiderFirstName } from '@/lib/braider-profile';
import { BraiderIntro } from '@/components/braider-intro';
import { MenuAccordion } from '@/components/menu-accordion';
import { MobileBookBar } from '@/components/mobile-book-bar';
import { getCatalog } from '@/lib/db';
import { categories } from '@/lib/menu';
import { beforeYouBook, contact, policies, thankYou } from '@/lib/business';
import { workPhotos } from '@/lib/work-photos';
import { money } from '@/lib/pricing';
export const dynamic='force-dynamic';

export default async function Home(){
 const catalog=await getCatalog(),showPrices=!catalog.placeholder;
 const groups=categories.map(c=>({slug:c.slug,label:c.label,services:catalog.services.filter(s=>s.category===c.slug),photos:workPhotos[c.slug]??[]})).filter(c=>c.services.length);
 const lowest=Math.min(...catalog.services.map(s=>s.price_cents));
 return <>
 <section className="hero section-wrap"><div className="hero-copy"><div className="eyebrow hero-brand"><span className="tiny-dot"/> STYLED BY SIKA</div><h1>Braids by<br/><em>{braiderFirstName}.</em><span className="headline-spark" aria-hidden="true">✳</span></h1><p className="hero-address"><MapPin aria-hidden="true"/><strong>Vaughan, Ontario</strong></p><p className="hero-services">Knotless, boho knotless, miracle knots, twists, invisible locs and soft locs.</p>
  <ul className="hero-facts" aria-label="At a glance">{showPrices&&<li><strong>From {money(lowest)}</strong></li>}<li>CA$20 deposit</li><li>Cash or e-transfer</li></ul>
  <div className="hero-actions"><Link className="button" href="/book" data-book-cta>Book now <ArrowUpRight size={19}/></Link><a className="text-link" href="#services">See services & prices <ArrowDown size={17}/></a></div><a className="hero-ig" href={contact.instagramDmUrl} target="_blank" rel="noreferrer"><Instagram size={18} aria-hidden="true"/> Questions? DM <strong>{contact.instagramHandle}</strong></a></div><BraiderIntro/></section>
 <div className="ticker" aria-hidden="true"><span>KNOTLESS</span><i>✳</i><span>BOHO KNOTLESS</span><i>✳</i><span>MIRACLE KNOTS</span><i>✳</i><span>TWISTS</span><i>✳</i><span>INVISIBLE LOCS</span><i>✳</i><span>SOFT LOCS</span><i>✳</i></div>

 <section id="services" className="section-wrap section menu-section" aria-labelledby="services-heading">
  <div className="section-heading"><div><div className="eyebrow">THE MENU</div><h2 id="services-heading">Services & <em>prices.</em></h2></div><p className="muted menu-intro">Tap a category to see its options, then <strong>Book</strong>. Prices in Canadian dollars.</p></div>
  <MenuAccordion groups={groups} extras={catalog.extras} showPrices={showPrices}/>
 </section>

 <section id="before-you-book" className="section-wrap section policies-section" aria-labelledby="policies-heading">
  <div className="policies-intro"><div className="eyebrow">BEFORE YOU BOOK</div><h2 id="policies-heading">Before you <em>book.</em></h2><p>{beforeYouBook}</p></div>
  <div className="policy-grid">{policies.map((p,i)=><article key={p.id} id={p.id} className="policy"><span className="policy-number">0{i+1}</span><h3>{p.title}</h3>{p.intro&&<p>{p.intro}</p>}{p.items&&<ul>{p.items.map(item=><li key={item}>{item}</li>)}</ul>}{p.outro&&<p className="muted">{p.outro}</p>}{p.id==='hair-requirements'&&<a className="text-link policy-link" href={contact.instagramDmUrl} target="_blank" rel="noreferrer"><Instagram size={15} aria-hidden="true"/> Message {contact.instagramHandle}</a>}</article>)}</div>
 </section>

 <section id="contact" className="closing-cta section-wrap" aria-labelledby="contact-heading"><span className="closing-star" aria-hidden="true">✳</span><div className="eyebrow">CONTACT</div><h2 id="contact-heading">Questions?<br/><em>Message me.</em></h2><p className="closing-copy">For questions, booking assistance, or the fastest response, please feel free to contact me through:</p>
  <div className="contact-actions"><a className="button button-dark" href={contact.instagramUrl} target="_blank" rel="noreferrer"><Instagram size={18} aria-hidden="true"/> Instagram {contact.instagramHandle}</a><a className="button button-dark" href={`mailto:${contact.email}`}><Mail size={18} aria-hidden="true"/> {contact.email}</a></div>
  <p className="closing-thanks"><strong>{thankYou.title}</strong><br/>{thankYou.body}</p>
  <Link className="text-link closing-book" href="/book" data-book-cta>Book an appointment <ArrowUpRight size={17}/></Link></section>
 <MobileBookBar note={showPrices?`From ${money(lowest)} · CA$20 deposit`:'CA$20 deposit'}/>
 </>;
}
