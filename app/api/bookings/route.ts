import { NextResponse } from 'next/server';
import { randomUUID, randomBytes } from 'node:crypto';
import { formatInTimeZone } from 'date-fns-tz';
import { bookingSchema } from '@/lib/schemas';
import { bookingReady, db, getCatalog, getSettings } from '@/lib/db';
import { quote } from '@/lib/pricing';
import { availableSlots } from '@/lib/live-availability';
import { rateLimit } from '@/lib/rate-limit';
import { processJob } from '@/lib/jobs';
export const maxDuration=60;
const receipt=(b:Record<string,unknown>)=>({id:b.id,reference:b.reference,start_at:b.start_at,end_at:b.end_at,price_cents:b.price_cents,duration_min:b.duration_min,snapshot:b.snapshot,calendarSaved:['calendar_saved','synced'].includes(String(b.sync_state)),emailSent:b.sync_state==='synced'});
export async function POST(request:Request){
 try{
 const parsed=bookingSchema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:'Please check your details and service choice.'},{status:400});
 if(!await bookingReady())return NextResponse.json({error:'Online booking is currently unavailable. No appointment has been created.'},{status:503});
 if(!await rateLimit(request,'bookings'))return NextResponse.json({error:'Too many requests. Please try again in an hour.'},{status:429});
 const input=parsed.data,client=db();
 const {data:existing,error:lookupError}=await client.from('bookings').select('*').eq('idempotency_key',input.idempotencyKey).maybeSingle();if(lookupError)throw lookupError;
 if(existing)return NextResponse.json(receipt(existing));
 const catalog=await getCatalog(),settings=await getSettings();let q;try{q=quote(catalog,input);}catch{return NextResponse.json({error:'This service is unavailable.'},{status:400});}
 const day=formatInTimeZone(input.start,settings.timezone,'yyyy-MM-dd');
 if(!(await availableSlots(day,q.duration,true)).includes(input.start))return NextResponse.json({error:'That time has just been taken. Please choose another.'},{status:409});
 const id=randomUUID(),end=new Date(new Date(input.start).getTime()+q.duration*60000);
 const {data:booking,error}=await client.from('bookings').insert({id,reference:`BR-${randomBytes(4).toString('hex').toUpperCase()}`,idempotency_key:input.idempotencyKey,style_id:q.service.id,addon_ids:input.extras,start_at:input.start,end_at:end.toISOString(),blocked_until:new Date(end.getTime()+settings.buffer_min*60000).toISOString(),price_cents:q.total,duration_min:q.duration,client_name:input.details.name,client_phone:input.details.phone.replace(/[^\d+]/g,''),client_email:input.details.email,client_instagram:input.details.instagram,client_notes:input.details.notes,snapshot:{style:q.service.name,addons:q.extras.map(e=>e.name),breakdown:q.breakdown,estimate:q.estimate,timezone:settings.timezone,deposit:settings.deposit_instructions}}).select('*').single();
 if(error){if(error.code==='23P01')return NextResponse.json({error:'That time has just been taken. Please choose another.'},{status:409});if(error.code==='23505'){const {data}=await client.from('bookings').select('*').eq('idempotency_key',input.idempotencyKey).maybeSingle();if(data)return NextResponse.json(receipt(data));}throw error;}
 await processJob(id);
 const {data:updated}=await client.from('bookings').select('*').eq('id',id).single();
 return NextResponse.json(receipt(updated??booking),{status:['calendar_saved','synced'].includes(updated?.sync_state)?201:202});
 }catch{return NextResponse.json({error:'We could not finish your request. Retry with the same details; your request will not be duplicated.'},{status:503});}
}
