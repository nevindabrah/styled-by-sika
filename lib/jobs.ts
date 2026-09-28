import 'server-only';
import { Resend } from 'resend';
import { db, getContent } from './db';
import { bookingSms, toE164 } from './reminder-rules';
import { emailConfigured, sendSms, smsConfigured } from './notify';
import { syncCalendar } from './calendar';
import { makeICS } from './ics';
import { durationLabel } from './pricing';
import { depositSummary } from './business';
import { formatInTimeZone } from 'date-fns-tz';
import type { Booking } from './types';
const prep='Please arrive with your hair freshly washed, fully dried (blow dried), properly detangled, and free from excessive oils, grease, and product buildup. If your hair requires extensive detangling, washing, or additional preparation, an extra fee and/or additional time may apply.\n\nA minimum of 48 hours’ notice is required for cancellations or rescheduling.\n\nQuestions? Instagram @styledby.sika or styledbysika@gmail.com';
export async function processJob(target?:string){
 const client=db(),{data:jobs,error}=await client.rpc('claim_booking_job',{target:target??null});if(error)throw error;
 const job=jobs?.[0];if(!job)return false;
 try{
 const {data,error:readError}=await client.from('bookings').select('*').eq('id',job.booking_id).single();if(readError)throw readError;
 const b=data as Booking;
 const event=await syncCalendar(b);
 const {error:saveError}=await client.from('bookings').update({google_event_id:event.id,calendar_url:event.url,sync_state:'calendar_saved'}).eq('id',b.id);if(saveError)throw saveError;
 const resend=new Resend(process.env.RESEND_API_KEY);
 const when=formatInTimeZone(b.start_at,b.snapshot.timezone,'EEEE, MMMM d, yyyy · h:mm a zzz');
 const summary=`${b.reference}\n${when}\n${b.snapshot.style}${b.snapshot.addons.length?`\nExtras: ${b.snapshot.addons.join(', ')}`:''}\n${b.snapshot.estimate}\n${durationLabel(b.duration_min)}`;
 const subject=job.kind==='created'?'Your Styled by Sika booking request':job.kind==='confirmed'?'Your Styled by Sika slot is confirmed':'Your Styled by Sika booking is cancelled';
 const text=job.kind==='created'?`Hi ${b.client_name},\n\n${summary}\n\n${b.snapshot.deposit||depositSummary}\n\n${prep}`:job.kind==='confirmed'?`Hi ${b.client_name},\nYour deposit is marked paid and your slot is confirmed.\n\n${summary}\n\n${prep}`:`Hi ${b.client_name},\nYour booking has been cancelled.\n\n${summary}\n${job.reason??''}`;
 // If cancellation won the race, do not send an obsolete booking/deposit message.
 if(emailConfigured()&&(b.status!=='cancelled'||job.kind==='cancelled')){
 const sent=await resend.emails.send({from:process.env.FROM_EMAIL!,to:b.client_email,subject,text,...(job.kind==='created'?{attachments:[{filename:'styled-by-sika.ics',content:Buffer.from(makeICS(b)).toString('base64')}]}:{})},{idempotencyKey:`${job.id}-client`});if(sent.error)throw new Error(sent.error.message);
 if(job.kind==='created') {const sent=await resend.emails.send({from:process.env.FROM_EMAIL!,to:process.env.BRAIDER_EMAIL!,subject:`New booking · ${b.reference}`,text:`${summary}\n${b.client_name}\n${b.client_phone}\n${b.client_email}\n${b.client_instagram??''}\nRequests: ${b.client_notes||'None'}\n${process.env.NEXT_PUBLIC_SITE_URL}/admin/bookings/${b.id}${event.url?`\n${event.url}`:''}`},{idempotencyKey:`${job.id}-braider`});if(sent.error)throw new Error(sent.error.message);}
 }
 // Texts have no idempotency key at Twilio, so record the send on the job and skip it on retries.
 if(smsConfigured()&&!job.sms_sent_at&&(b.status!=='cancelled'||job.kind==='cancelled')){const to=toE164(b.client_phone);if(to){await sendSms(to,bookingSms(job.kind,b,(await getContent()).text));await client.from('booking_jobs').update({sms_sent_at:new Date().toISOString()}).eq('id',job.id);}}
 const {error:doneError}=await client.from('booking_jobs').update({completed_at:new Date().toISOString(),lease_until:null,last_error:null}).eq('id',job.id);if(doneError)throw doneError;
 const {error:syncError}=await client.from('bookings').update({sync_state:'synced'}).eq('id',b.id);if(syncError)throw syncError;
 return true;
 }catch(error){
 console.error('Booking synchronization failed',{job:job.id,message:error instanceof Error?error.message:'Unknown error'});
 await client.from('booking_jobs').update({lease_until:null,available_at:new Date(Date.now()+Math.min(job.attempts*60000,3600000)).toISOString(),last_error:error instanceof Error?error.message:'Sync failure'}).eq('id',job.id);
 if(process.env.RESEND_API_KEY&&process.env.MAINTAINER_EMAIL)await new Resend(process.env.RESEND_API_KEY).emails.send({from:process.env.FROM_EMAIL!,to:process.env.MAINTAINER_EMAIL,subject:'Styled by Sika: booking needs attention',text:`Booking ${job.booking_id} has a synchronization failure. Check the dashboard and booking_jobs before retrying. Job ${job.id}.`},{idempotencyKey:`${job.id}-alert-${job.attempts}`}).catch(()=>{});
 return false;
 }
}
