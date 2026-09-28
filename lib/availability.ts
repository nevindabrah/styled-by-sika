import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
export type Busy = { start: string; end: string };
// One entry per weekday, Sunday first. Times are local 'HH:MM'; both null means closed.
export type DayHours = { open: string | null; close: string | null };
export type WeekHours = DayHours[];
export type TimeOff = { id: string; start_at: string; end_at: string; reason: string };
// Hours she planned for specific dates ('YYYY-MM-DD'); null times mean closed that day.
export type DayPlans = Record<string, DayHours>;
export type DayPlan = DayHours & { date: string };
export function hoursForDate(date: string, week: WeekHours, plans: DayPlans): DayHours & { planned: boolean } {
  const planned = plans[date];
  if (planned) return { ...planned, planned: true };
  const usual = week[weekdayOf(date)] ?? { open: null, close: null };
  return { open: usual.open, close: usual.close, planned: false };
}
export const weekdayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const weekdayOf = (date: string) => Number(formatInTimeZone(new Date(`${date}T12:00:00Z`), 'UTC', 'i')) % 7;
export function dayBounds(date:string,open:string,close:string,timezone:string) { return {start:fromZonedTime(`${date}T${open}`,timezone),end:fromZonedTime(`${date}T${close}`,timezone)}; }
export function slotsForDay(input:{date:string;open:string|null;close:string|null;timezone:string;duration:number;buffer:number;busy:Busy[];now:Date;noticeHours:number;windowDays:number}){
 const {date,open,close,timezone,duration,buffer,busy,now,noticeHours,windowDays}=input;
 if(!open||!close||duration<=0) return [];
 const {start,end}=dayBounds(date,open,close,timezone);
 const min=now.getTime()+noticeHours*3600000,max=now.getTime()+windowDays*86400000;
 const slots:string[]=[];
 // Her hours are the window she's happy to START in (end time included); a long style may run past it.
 // Walk real instants through timezone transitions; only local half-hours are offered.
 for(let t=start.getTime();t<=end.getTime();t+=60000){
 const minute=Number(formatInTimeZone(t,timezone,'mm'));
 if(minute%30 || t<min || t>max) continue;
 const blockedEnd=t+(duration+buffer)*60000;
 // Extend existing busy intervals too: preserve cleanup time after earlier appointments.
 if(!busy.some(b=>t < new Date(b.end).getTime()+buffer*60000 && blockedEnd>new Date(b.start).getTime())) slots.push(new Date(t).toISOString());
 }
 return slots;
}
