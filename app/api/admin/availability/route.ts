import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const day=z.object({open:time.nullable(),close:time.nullable()}).refine(d=>(d.open===null)===(d.close===null)&&(!d.open||!d.close||d.open<d.close),'Closing time must be after opening time.');
const body=z.object({
 hours:z.array(day).length(7).optional(),
 addTimeOff:z.object({start_at:z.iso.datetime(),end_at:z.iso.datetime(),reason:z.string().trim().max(80)}).refine(t=>new Date(t.end_at)>new Date(t.start_at),'The end time must be after the start time.').optional(),
 removeTimeOff:z.uuid().optional(),
 // Limits match the database checks in schema.sql.
 bookingOpen:z.boolean().optional(),
 rules:z.object({buffer_min:z.number().int().min(0).max(240),minimum_notice_hours:z.number().int().min(24).max(720),window_days:z.number().int().min(1).max(366)}).optional(),
 // Week planner: set specific dates, or send them back to her usual week.
 setDays:z.array(z.object({date:z.iso.date(),open:time.nullable(),close:time.nullable()}).refine(d=>(d.open===null)===(d.close===null)&&(!d.open||!d.close||d.open<d.close),'Closing time must be after opening time.')).min(1).max(400).optional(),
 clearDays:z.object({from:z.iso.date(),to:z.iso.date()}).optional(),
}).refine(v=>v.hours||v.addTimeOff||v.removeTimeOff||v.rules||v.setDays||v.clearDays||v.bookingOpen!==undefined);
// Only the braider (ADMIN_EMAIL) can change availability; clients never reach this route.
export async function PATCH(request:Request){
 if(!await isAdmin())return NextResponse.json({error:'Please sign in.'},{status:401});
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Request not allowed.'},{status:403});
 const parsed=body.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||'Please check the times.'},{status:400});
 try{
 const client=db(),{hours,addTimeOff,removeTimeOff,rules,bookingOpen,setDays,clearDays}=parsed.data;
 if(setDays){const {error}=await client.from('availability_days').upsert(setDays.map(d=>({date:d.date,open_time:d.open,close_time:d.close})),{onConflict:'date'});if(error)throw error;const {error:e}=await client.from('business_settings').update({hours_confirmed:true}).eq('id',1);if(e)throw e;}
 if(clearDays){const {error}=await client.from('availability_days').delete().gte('date',clearDays.from).lte('date',clearDays.to);if(error)throw error;}
 if(rules){const {error}=await client.from('business_settings').update(rules).eq('id',1);if(error)throw error;}
 if(hours){
  const {error}=await client.from('working_hours').upsert(hours.map((d,weekday)=>({weekday,open_time:d.open,close_time:d.close})),{onConflict:'weekday'});if(error)throw error;
  // Saving her own hours is her approval of them.
  const {error:settingsError}=await client.from('business_settings').update({hours_confirmed:true}).eq('id',1);if(settingsError)throw settingsError;
 }
 if(bookingOpen!==undefined){
  if(bookingOpen){const {data:days,error:e}=await client.from('working_hours').select('open_time').not('open_time','is',null);if(e)throw e;if(!days?.length)return NextResponse.json({error:'Set and save at least one working day first.'},{status:400});}
  const {error}=await client.from('business_settings').update({booking_open:bookingOpen,...(bookingOpen?{hours_confirmed:true}:{})}).eq('id',1);if(error)throw error;
 }
 if(addTimeOff){const {error}=await client.from('time_off').insert(addTimeOff);if(error)throw error;}
 if(removeTimeOff){const {error}=await client.from('time_off').delete().eq('id',removeTimeOff);if(error)throw error;}
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Could not save this change. Please try again.'},{status:503});}
}
