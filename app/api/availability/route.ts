import { NextResponse } from 'next/server';
import { z } from 'zod';
import { formatInTimeZone } from 'date-fns-tz';
import { availableSlotsForRange } from '@/lib/live-availability';
import { bookingReady, getSettings } from '@/lib/db';
const day=(iso:string,add=0)=>{const d=new Date(`${iso}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+add);return d.toISOString().slice(0,10);};
// ?month=YYYY-MM returns every day of that month at once; ?date=YYYY-MM-DD returns one day.
export async function GET(request:Request){
 const p=new URL(request.url).searchParams;
 const q=z.object({date:z.iso.date().optional(),month:z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),duration:z.coerce.number().int().min(30).max(1440)}).refine(v=>v.date||v.month).safeParse(Object.fromEntries(p));
 if(!q.success)return NextResponse.json({error:'Choose a valid date and service duration.'},{status:400});
 try{
 if(!await bookingReady())return NextResponse.json({error:'Online booking is currently unavailable.'},{status:503});
 const settings=await getSettings(),today=formatInTimeZone(new Date(),settings.timezone,'yyyy-MM-dd'),last=day(today,settings.window_days);
 const dates:string[]=[];
 if(q.data.month){for(let d=`${q.data.month}-01`;d.startsWith(q.data.month);d=day(d,1))if(d>=today&&d<=last)dates.push(d);}
 else if(q.data.date!>=today&&q.data.date!<=last)dates.push(q.data.date!);
 const slots=await availableSlotsForRange(dates,q.data.duration);
 return NextResponse.json(q.data.month?{slots,timezone:settings.timezone}:{slots:slots[q.data.date!]??[],timezone:settings.timezone},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'We could not check the calendar. Please try again shortly.'},{status:503});}
}
