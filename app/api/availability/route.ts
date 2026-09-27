import { NextResponse } from 'next/server';
import { z } from 'zod';
import { availableSlots } from '@/lib/live-availability';
import { bookingReady, getSettings } from '@/lib/db';
export async function GET(request:Request){
 const p=new URL(request.url).searchParams;const result=z.object({date:z.iso.date(),duration:z.coerce.number().int().min(30).max(900)}).safeParse(Object.fromEntries(p));
 if(!result.success)return NextResponse.json({error:'Choose a valid date and service duration.'},{status:400});
 try{if(!await bookingReady())return NextResponse.json({error:'Online booking is currently unavailable. Please contact Sika.'},{status:503});
 const settings=await getSettings();const date=new Date(result.data.date+'T12:00:00Z');if(date.getTime()<Date.now()-86400000||date.getTime()>Date.now()+(settings.window_days+1)*86400000)return NextResponse.json({error:'This date is outside the booking window.'},{status:400});
 return NextResponse.json({slots:await availableSlots(result.data.date,result.data.duration),timezone:settings.timezone},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'We could not check the calendar. Please try again shortly.'},{status:503});}
}
