import { bookingReady, getCatalog } from '@/lib/db';
import { BookingFlow } from '@/components/booking-flow';
import type { Selection } from '@/lib/types';
export const metadata={title:'Book an appointment'};export const dynamic='force-dynamic';
// Links use readable slugs (/book?service=large-knotless-shoulder&extras=blow-dry); ids are also accepted.
export default async function Book({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const p=await searchParams,c=await getCatalog(),initial:Selection={service:'',extras:[]};const service=c.services.find(s=>s.slug===p.service||s.id===p.service);if(service)initial.service=service.id;if(typeof p.extras==='string')initial.extras=[...new Set(p.extras.split(',').map(x=>c.extras.find(e=>(e.slug===x||e.id===x)&&e.bookable)?.id).filter((id):id is string=>!!id))];return <section className="section-wrap page-section narrow"><div className="eyebrow">APPOINTMENTS</div><h1 className="page-title">Book your <em>appointment.</em></h1><p className="page-intro">Choose your service and any extras. Prices are in Canadian dollars.</p><BookingFlow catalog={c} initial={initial} ready={await bookingReady()}/></section>;}
