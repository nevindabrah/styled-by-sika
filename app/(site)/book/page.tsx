import { bookingReady, getContent } from '@/lib/db';
import { BookingFlow } from '@/components/booking-flow';
import { isDemo } from '@/lib/demo';
export const metadata={title:'Book an appointment'};export const dynamic='force-dynamic';
// Links use readable slugs: /book?service=large-knotless-shoulder&extras=blow-dry (ids are also accepted).
export default async function Book({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const p=await searchParams;return <section className="section-wrap page-section narrow"><div className="book-heading"><div className="eyebrow">APPOINTMENTS</div><h1 className="page-title">Book your <em>appointment.</em></h1><p className="page-intro">Choose your service and any extras. Prices are in Canadian dollars.</p></div><BookingFlow content={await getContent()} initialService={typeof p.service==='string'?p.service:''} initialExtras={typeof p.extras==='string'?p.extras.split(','):[]} ready={await bookingReady()} smsEnabled={isDemo||Boolean(process.env.TWILIO_ACCOUNT_SID&&process.env.TWILIO_AUTH_TOKEN&&process.env.TWILIO_FROM)}/></section>;}
