import 'server-only';
import { db, getSettings } from './db';
import { getBusy } from './calendar';
import { dayBounds, slotsForDay, weekdayOf, type TimeOff, type WeekHours } from './availability';
export async function getWeekHours():Promise<WeekHours>{
 const {data,error}=await db().from('working_hours').select('*').order('weekday');if(error)throw error;
 return Array.from({length:7},(_,i)=>{const row=data?.find(h=>h.weekday===i);return {open:row?.open_time?.slice(0,5)??null,close:row?.close_time?.slice(0,5)??null};});
}
export async function getTimeOff(from?:Date):Promise<TimeOff[]>{
 let query=db().from('time_off').select('id,start_at,end_at,reason').order('start_at');
 if(from)query=query.gte('end_at',from.toISOString());
 const {data,error}=await query;if(error)throw error;return data??[];
}
export async function availableSlots(date:string,duration:number,fresh=false){
 const settings=await getSettings(),timezone=settings.timezone;
 const hours=(await getWeekHours())[weekdayOf(date)];
 if(!hours?.open||!hours?.close)return [];
 const {start,end}=dayBounds(date,hours.open,hours.close,timezone);
 // Include prior-day events and reservations whose cleanup reaches the working day.
 const queryStart=new Date(start.getTime()-settings.buffer_min*60000),queryEnd=new Date(end.getTime()+settings.buffer_min*60000);
 const [busy,rows,timeOff]=await Promise.all([
  getBusy(queryStart,queryEnd,fresh),
  db().from('bookings').select('start_at,end_at').neq('status','cancelled').lt('start_at',queryEnd.toISOString()).gt('blocked_until',start.toISOString()),
  db().from('time_off').select('start_at,end_at').lt('start_at',queryEnd.toISOString()).gt('end_at',queryStart.toISOString()),
 ]);
 if(rows.error)throw rows.error;if(timeOff.error)throw timeOff.error;
 return slotsForDay({date,open:hours.open,close:hours.close,timezone,duration,buffer:settings.buffer_min,busy:[...busy,...(rows.data??[]).map(r=>({start:r.start_at,end:r.end_at})),...(timeOff.data??[]).map(r=>({start:r.start_at,end:r.end_at}))],now:new Date(),noticeHours:settings.minimum_notice_hours,windowDays:settings.window_days});
}
