import type { Catalog, Extra, PriceLine, Selection } from './types';
// en-US formatting labels Canadian dollars as CA$, matching the owner's menu.
export const money = (cents: number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'CAD',maximumFractionDigits:0}).format(cents/100);
export const durationLabel = (min: number) => { const h=Math.floor(min/60), m=min%60; return [h?`${h} hr`:'', m?`${m} min`:''].filter(Boolean).join(' '); };
// "5–6 hr" for ranged appointments, otherwise the plain length.
export const durationRange = (s: { duration_min: number; duration_max_min: number | null }) => s.duration_max_min ? (s.duration_min % 60 || s.duration_max_min % 60 ? `${durationLabel(s.duration_min)}–${durationLabel(s.duration_max_min)}` : `${s.duration_min / 60}–${s.duration_max_min / 60} hr`) : durationLabel(s.duration_min);
// The calendar blocks the longest possible appointment.
export const bookedDuration = (s: { duration_min: number; duration_max_min: number | null }) => s.duration_max_min ?? s.duration_min;
export const priceLabel = (line: { cents: number; max_cents?: number | null; plus?: boolean }) => line.max_cents ? `${money(line.cents)}–${money(line.max_cents)}` : `${money(line.cents)}${line.plus ? '+' : ''}`;
export const extraLine = (e: Extra): PriceLine => ({ label: e.name, cents: e.price_cents, max_cents: e.price_max_cents, plus: e.price_plus });
// "Large Knotless Braids — Shoulder Length" → title and length shown on separate lines.
export const splitName = (name: string) => { const [title, variant] = name.split(' — '); return { title, variant: variant ?? null }; };
export function quote(catalog: Catalog, selection: Selection) {
 const service=catalog.services.find(s=>s.id===selection.service && s.active);
 if(!service) throw new Error('Choose a service to continue.');
 if(new Set(selection.extras).size !== selection.extras.length) throw new Error('Choose each extra only once.');
 const extras=selection.extras.map(id=>{ const e=catalog.extras.find(e=>e.id===id && e.active && e.bookable); if(!e) throw new Error('An extra is no longer available.'); return e; });
 const breakdown:PriceLine[]=[{label:service.name,cents:service.price_cents},...extras.map(extraLine)];
 const total=breakdown.reduce((n,l)=>n+l.cents,0), max=breakdown.reduce((n,l)=>n+(l.max_cents??l.cents),0), plus=breakdown.some(l=>l.plus);
 const estimate=plus?`From ${money(total)}`:max>total?`${money(total)}–${money(max)}`:money(total);
 return {service,extras,breakdown,total,estimate,duration:bookedDuration(service)+extras.reduce((n,e)=>n+e.duration_min,0)};
}
export function selectionQuery(s:Selection,c:Catalog){const service=c.services.find(x=>x.id===s.service);return new URLSearchParams({service:service?.slug??'',...(s.extras.length?{extras:s.extras.map(id=>c.extras.find(e=>e.id===id)?.slug).filter(Boolean).join(',')}:{})}).toString();}
