import 'server-only';
import { db, getSettings } from './db';
import { getBusy } from './calendar';
import { dayBounds, hoursForDate, slotsForDay, type DayPlans, type TimeOff, type WeekHours } from './availability';
export async function getWeekHours():Promise<WeekHours>{
 const {data,error}=await db().from('working_hours').select('*').order('weekday');if(error)throw error;
 return Array.from({length:7},(_,i)=>{const row=data?.find(h=>h.weekday===i);return {open:row?.open_time?.slice(0,5)??null,close:row?.close_time?.slice(0,5)??null};});
}
export async function getDayPlans(from:string,to:string):Promise<DayPlans>{
 const {data,error}=await db().from('availability_days').select('*').gte('date',from).lte('date',to);if(error)throw error;
 return Object.fromEntries((data??[]).map(r=>[r.date,{open:r.open_time?.slice(0,5)??null,close:r.close_time?.slice(0,5)??null}]));
}
export async function getTimeOff(from?:Date):Promise<TimeOff[]>{
 let query=db().from('time_off').select('id,start_at,end_at,reason').order('start_at');
 if(from)query=query.gte('end_at',from.toISOString());
 const {data,error}=await query;if(error)throw error;return data??[];
}
// Start times for several days at once (a month view is one request): her hours for each date, minus
// existing bookings plus her break, blocked time and busy calendar time.
export async function availableSlotsForRange(dates:string[],duration:number,fresh=false):Promise<Record<string,string[]>>{
 const empty=Object.fromEntries(dates.map(d=>[d,[] as string[]]));
 if(!dates.length)return empty;
 const settings=await getSettings(),timezone=settings.timezone,sorted=[...dates].sort();
 const [week,plans]=await Promise.all([getWeekHours(),getDayPlans(sorted[0],sorted.at(-1)!)]);
 const open=sorted.map(date=>({date,...hoursForDate(date,week,plans)})).filter(d=>d.open&&d.close);
 if(!open.length)return empty;
 const bounds=open.map(d=>dayBounds(d.date,d.open!,d.close!,timezone));
 const pad=settings.buffer_min*60000,from=new Date(Math.min(...bounds.map(b=>b.start.getTime()))-pad),to=new Date(Math.max(...bounds.map(b=>b.end.getTime()))+pad);
 const [busy,rows,timeOff]=await Promise.all([
  getBusy(from,to,fresh),
  db().from('bookings').select('start_at,end_at').neq('status','cancelled').lt('start_at',to.toISOString()).gt('blocked_until',from.toISOString()),
  db().from('time_off').select('start_at,end_at').lt('start_at',to.toISOString()).gt('end_at',from.toISOString()),
 ]);
 if(rows.error)throw rows.error;if(timeOff.error)throw timeOff.error;
 const taken=[...busy,...(rows.data??[]).map(r=>({start:r.start_at,end:r.end_at})),...(timeOff.data??[]).map(r=>({start:r.start_at,end:r.end_at}))],now=new Date();
 for(const d of open)empty[d.date]=slotsForDay({date:d.date,open:d.open,close:d.close,timezone,duration,buffer:settings.buffer_min,busy:taken,now,noticeHours:settings.minimum_notice_hours,windowDays:settings.window_days});
 return empty;
}
export async function availableSlots(date:string,duration:number,fresh=false){return (await availableSlotsForRange([date],duration,fresh))[date]??[];}
