import { NextResponse } from 'next/server';
import { processJob } from '@/lib/jobs';
import { sendDueReminders } from '@/lib/reminders';
import { timingSafeEqual } from 'node:crypto';
export const maxDuration=60;
export async function GET(req:Request){const expected=`Bearer ${process.env.CRON_SECRET??''}`,actual=req.headers.get('authorization')??'';if(!process.env.CRON_SECRET||Buffer.byteLength(expected)!==Buffer.byteLength(actual)||!timingSafeEqual(Buffer.from(expected),Buffer.from(actual)))return NextResponse.json({error:'Unauthorized'},{status:401});let processed=0;while(processed<3 && await processJob())processed++;const reminders=await sendDueReminders();return NextResponse.json({processed,reminders});}
