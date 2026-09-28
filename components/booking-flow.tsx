'use client';
import { isDemo, demoSlots, addDemoBooking, readDemoAvailability } from '@/lib/demo';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, Check, Instagram, Mail, MessageSquare } from 'lucide-react';
import { bookingMessage, mailLink, smsLink } from '@/lib/booking-message';
import { addMonths, format, startOfMonth, getDaysInMonth } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { detailsSchema } from '@/lib/schemas';
import { quote, durationLabel, durationRange, money, priceLabel } from '@/lib/pricing';
import { instagramLinks, type SiteContent, type SiteText } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';
import { makeICS } from '@/lib/ics';
import type { Booking, Catalog, Selection } from '@/lib/types';
import { ServicePicker, QuoteSummary } from './service-picker';
import { CalendarLoading } from './calendar-loading';
import { firstName } from '@/lib/content';
type Details=z.infer<typeof detailsSchema>;
type Receipt={id:string;reference:string;start_at:string;end_at:string;price_cents:number;duration_min:number;snapshot:{style:string;addons:string[];estimate:string;deposit:string;timezone:string};calendarSaved:boolean;emailSent:boolean;emailed?:boolean};
const policyLink=<Link href="/#before-you-book" target="_blank">booking policies</Link>;
// Links use readable slugs; ids are accepted too. Resolved on the client so demo edits (new services) work as well.
function resolve(catalog:Catalog,service:string,extras:string[]):Selection{const s=catalog.services.find(x=>x.slug===service||x.id===service);return {service:s?.id??'',extras:[...new Set(extras.map(x=>catalog.extras.find(e=>(e.slug===x||e.id===x)&&e.bookable)?.id).filter((id):id is string=>!!id))]};}
export function BookingFlow({content,initialService,initialExtras,ready,smsEnabled=false,windowDays:serverWindow=365}:{content:SiteContent;initialService:string;initialExtras:string[];ready:boolean;smsEnabled?:boolean;windowDays?:number}){
 const site=useSiteContent(content);
 const catalog=useMemo<Catalog>(()=>({services:site.services,extras:site.extras,placeholder:site.placeholder}),[site]);
 const [selection,setSelection]=useState<Selection>(()=>resolve(catalog,initialService,initialExtras));
 const [touched,setTouched]=useState(false);
 useEffect(()=>{if(!touched)setSelection(resolve(catalog,initialService,initialExtras));},[catalog,initialService,initialExtras,touched]);
 const [step,setStep]=useState(0),[month,setMonth]=useState(startOfMonth(new Date())),[day,setDay]=useState(''),[start,setStart]=useState(''),[slots,setSlots]=useState<Record<string,string[]>>({}),[slotsFor,setSlotsFor]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState(''),[submitting,setSubmitting]=useState(false),[receipt,setReceipt]=useState<Receipt|null>(null),[key,setKey]=useState('');
 const form=useForm<Details>({resolver:zodResolver(detailsSchema),defaultValues:{name:'',phone:'',email:'',instagram:'',notes:'',website:''}});
 useEffect(()=>setKey(crypto.randomUUID()),[]);
 // Land on the confirmation, not the booking page's heading.
 useEffect(()=>{if(receipt)window.scrollTo({top:0,behavior:'instant' as ScrollBehavior});},[receipt]);
 const q=useMemo(()=>{try{return quote(catalog,selection);}catch{return null;}},[catalog,selection]);
 const online=ready||isDemo,ig=instagramLinks(site.text.instagramHandle),hairPrep=site.text.policies.find(p=>p.id==='hair-prep');
 const [windowDays,setWindowDays]=useState(serverWindow);
 useEffect(()=>{if(isDemo)setWindowDays(readDemoAvailability().rules.window_days);},[]);
 // One request per month; the server works out every day's start times from her plan.
 useEffect(()=>{if(step!==1||!online||!q)return;let active=true;const controller=new AbortController();setLoading(true);setError('');setSlots({});const key=format(month,'yyyy-MM');(async()=>{let result:Record<string,string[]>={};if(isDemo){const today=format(new Date(),'yyyy-MM-dd'),last=format(new Date(Date.now()+windowDays*86400000),'yyyy-MM-dd');for(let i=1;i<=getDaysInMonth(month);i++){const d=format(new Date(month.getFullYear(),month.getMonth(),i),'yyyy-MM-dd');if(d>=today&&d<=last)result[d]=demoSlots(d,q.duration);}}else{const res=await fetch(`/api/availability?month=${key}&duration=${q.duration}`,{signal:controller.signal});const data=await res.json();if(!res.ok)throw new Error(data.error);result=data.slots;}if(active){setSlots(result);setSlotsFor(key);}})().catch(e=>{if(active&&e.name!=='AbortError')setError(e.message||'Could not check availability.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;controller.abort();};},[month,q,step,online,windowDays]);
 // Like Calendly: open on the first month with free times (within the booking window).
 const [autoJump,setAutoJump]=useState(true);
 // Keep the loading animation up for about a second when the calendar opens, so it never just flashes.
 const [minShown,setMinShown]=useState(true);
 useEffect(()=>{if(step!==1)return;setMinShown(false);const t=setTimeout(()=>setMinShown(true),1100);return()=>clearTimeout(t);},[step]);
 const checking=!minShown;
 const lastMonth=startOfMonth(new Date(Date.now()+windowDays*86400000));
 const monthReady=slotsFor===format(month,'yyyy-MM')&&!loading,monthHasTimes=monthReady&&Object.values(slots).some(list=>list.length>0);
 useEffect(()=>{if(step!==1||!monthReady||!autoJump)return;if(monthHasTimes||month>=lastMonth){setAutoJump(false);return;}setMonth(addMonths(month,1));},[step,monthReady,autoJump,monthHasTimes,month,lastMonth]);
 function move(next:number){setStep(next);setError('');document.getElementById('booking-top')?.scrollIntoView({block:'start'});}
 async function submit(){if(!q||!start||!key||submitting)return;setSubmitting(true);setError('');try{if(isDemo){
 const details=form.getValues(),id=crypto.randomUUID(),end=new Date(new Date(start).getTime()+q.duration*60000).toISOString();
 const snapshot={style:q.service.name,addons:q.extras.map(e=>e.name),breakdown:q.breakdown,estimate:q.estimate,timezone:'America/Toronto',deposit:`${site.text.depositSummary} No payment is needed in this demo.`};
 const booking:Booking={id,reference:`DEMO-${id.slice(0,6).toUpperCase()}`,status:'pending_deposit',style_id:q.service.id,addon_ids:selection.extras,start_at:start,end_at:end,blocked_until:new Date(new Date(end).getTime()+30*60000).toISOString(),price_cents:q.total,duration_min:q.duration,client_name:details.name,client_phone:details.phone,client_email:details.email,client_instagram:details.instagram,client_notes:details.notes,admin_notes:'',google_event_id:null,calendar_url:null,snapshot,sync_state:'demo',created_at:new Date().toISOString()};
 addDemoBooking(booking);setReceipt({...booking,calendarSaved:true,emailSent:false});return;
 }const response=await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...selection,start,details:form.getValues(),idempotencyKey:key})});const data=await response.json();if(response.status===409){setStart('');setStep(1);setSlots({});setError(data.error);setKey(crypto.randomUUID());return;}if(!response.ok)throw new Error(data.error);setReceipt(data);}catch(e){setError((e as Error).message||'Something went wrong. Please retry.');}finally{setSubmitting(false);}}
 const picker=<ServicePicker catalog={catalog} categories={site.categories} value={selection} onChange={s=>{setTouched(true);setSelection(s);setStart('');setDay('');setKey(crypto.randomUUID());}}/>;
 const summary=<QuoteSummary catalog={catalog} selection={selection} depositNote={site.text.depositSummary}/>;
 if(receipt){
  const when=formatInTimeZone(receipt.start_at,receipt.snapshot.timezone,"EEEE, MMMM d 'at' h:mm a");
  const message=bookingMessage({service:receipt.snapshot.style,duration:durationLabel(receipt.duration_min),extras:receipt.snapshot.addons,estimate:receipt.snapshot.estimate,when,name:form.getValues('name'),reference:receipt.reference},true);
  return <section className="receipt"><div className="receipt-icon"><Check size={30}/></div><div className="eyebrow">{isDemo?'DEMO · ':''}{receipt.reference}</div><h1 className="page-title">Booking confirmed.</h1>
  <p className="page-intro">{receipt.snapshot.style}, {when}. Your time is saved. Complete these two steps to secure your appointment.</p>
  <ol className="booking-steps">
   <li className="booking-step"><span className="step-number" aria-hidden="true">1</span><div><h2 className="small-heading">{site.text.phone?'Text your booking to Styled by Sika':'Send your booking to Styled by Sika'}</h2><p className="muted">Your details are already written. {site.text.phone?'Tap below and press send.':'Choose how to send them.'}</p><NotifySika message={message} text={site.text} subject={`Booking ${receipt.reference}`}/></div></li>
   <li className="booking-step"><span className="step-number" aria-hidden="true">2</span><div><h2 className="small-heading">Send your {money(site.text.depositCents)} deposit</h2><DepositStep text={site.text} reference={receipt.reference}/></div></li>
  </ol>
  <div className="notice"><strong>Your booking</strong><p>{formatInTimeZone(receipt.start_at,receipt.snapshot.timezone,'EEEE, MMMM d · h:mm a zzz')}</p><p>{receipt.snapshot.style}</p>{receipt.snapshot.addons.length>0&&<p>Extras: {receipt.snapshot.addons.join(', ')}</p>}<p>{receipt.snapshot.estimate} · {durationLabel(receipt.duration_min)}</p><p>Reference: {receipt.reference}</p></div>
  {hairPrep&&<><h2 className="small-heading">Before your appointment</h2>{hairPrep.intro&&<p>{hairPrep.intro}</p>}<ul className="prose">{hairPrep.items.map(item=><li key={item}>{item}</li>)}</ul>{hairPrep.outro&&<p className="muted">{hairPrep.outro}</p>}</>}
  {isDemo&&<p className="muted">No email was sent. This appointment is stored only in this browser tab for the demo.</p>}
  <button className="button" onClick={()=>{const url=URL.createObjectURL(new Blob([makeICS(receipt)],{type:'text/calendar'}));const a=document.createElement('a');a.href=url;a.download=`${receipt.reference}.ics`;a.click();URL.revokeObjectURL(url);}}>{isDemo?'Download sample calendar file':'Add to my calendar'}</button>{isDemo&&<Link className="button button-outline full-width" href="/demo/admin">View demo dashboard ↗</Link>}</section>;
 }

 if(!online)return <div id="booking-top" className="estimator-grid"><div>{picker}</div><div>{summary}<div className="notice" role="status">Online booking is being set up. Message me at <a className="text-link" href={ig.dm} target="_blank" rel="noreferrer">{site.text.instagramHandle}</a> to book in the meantime 🤎</div></div></div>;
 return <div id="booking-top"><div className="booking-progress" aria-label={`Step ${step+1} of 4`}>{['Service','Date & time','Details','Review'].map((s,i)=><span className={step===i?'active':''} key={s} aria-current={step===i?'step':undefined}><b>{i+1}</b>{s}</span>)}</div><div className="estimator-grid"><div>
 {step===0&&picker}
 {step===1&&<section><h2 className="small-heading">Choose a date and time.</h2><p className="muted">All times in Vaughan, Ontario (America/Toronto).</p><div className="calendar-header"><button className="icon-button" aria-label="Previous month" disabled={month<=startOfMonth(new Date())} onClick={()=>{setAutoJump(false);setMonth(addMonths(month,-1));}}><ChevronLeft size={18}/></button><strong>{format(month,'MMMM yyyy')}</strong><button className="icon-button" aria-label="Next month" disabled={month>=lastMonth} onClick={()=>{setAutoJump(false);setMonth(addMonths(month,1));}}><ChevronRight size={18}/></button></div><div className="calendar-wrap"><div className={`calendar-grid ${!monthReady||autoJump||checking?'is-loading':''}`} aria-busy={!monthReady||autoJump||checking}>{['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><span className="weekday" key={d}>{d}</span>)}{Array.from({length:month.getDay()},(_,i)=><span key={`blank-${i}`}/>)}{Array.from({length:getDaysInMonth(month)},(_,i)=>{const date=format(new Date(month.getFullYear(),month.getMonth(),i+1),'yyyy-MM-dd');return <button key={date} type="button" aria-label={format(new Date(month.getFullYear(),month.getMonth(),i+1),'EEEE, MMMM d')} aria-pressed={day===date} disabled={!slots[date]?.length||loading||checking} className={day===date?'selected':''} onClick={()=>{setDay(date);setStart('');}}>{i+1}</button>;})}</div>{(!monthReady||autoJump||checking)&&<CalendarLoading name={firstName(site.text.name)}/>}</div><p className="fine-print">{!monthReady||autoJump||checking?'':monthHasTimes?`Pick a highlighted day, then a start time. Times are every 30 minutes and leave room for your ${durationRange(q?.service??{duration_min:0,duration_max_min:null})} appointment.`:''}</p>{monthReady&&!autoJump&&!checking&&!monthHasTimes&&<div className="notice" role="status">No open times in {format(month,'MMMM')}. {month<lastMonth?'Try the next month, or message me':'Message me'} at <a className="text-link" href={ig.dm} target="_blank" rel="noreferrer">{site.text.instagramHandle}</a> and I’ll let you know when new times open 🤎</div>}{day&&<fieldset><legend>Available times</legend><div className="chips">{slots[day]?.map(time=><button type="button" className={`chip ${start===time?'selected':''}`} aria-pressed={start===time} key={time} onClick={()=>{setStart(time);setKey(crypto.randomUUID());}}>{formatInTimeZone(time,'America/Toronto','h:mm a')}</button>)}</div></fieldset>}<p className="notice">None of these times work? <a className="text-link" href={ig.dm} target="_blank" rel="noreferrer">Message me on Instagram ↗</a></p></section>}
 {step===2&&<form id="details-form" onSubmit={form.handleSubmit(()=>move(3))} noValidate><h2 className="small-heading">Your contact details.</h2><div className="form-grid">{([['name','Full name'],['phone','Phone number'],['email','Email address'],['instagram','Instagram handle (optional)']] as const).map(([key,label])=><div key={key}><label className="field-label" htmlFor={key}>{label}</label><input id={key} {...form.register(key)} type={key==='email'?'email':key==='phone'?'tel':'text'} autoComplete={key==='name'?'name':key==='phone'?'tel':key==='email'?'email':'off'} aria-invalid={!!form.formState.errors[key]} aria-describedby={form.formState.errors[key]?`${key}-error`:undefined}/>{key==='phone'&&smsEnabled&&<p className="fine-print">Your confirmation and reminders are texted here.</p>}{key==='email'&&<p className="fine-print">Your confirmation and reminders are emailed here.</p>}{form.formState.errors[key]&&<p className="field-error" id={`${key}-error`}>{form.formState.errors[key]?.message}</p>}</div>)}<div className="span-two"><label className="field-label" htmlFor="notes">Anything you’d like me to know? (optional)</label><textarea id="notes" {...form.register('notes')} maxLength={300} placeholder="Special requests or anything I should know about your hair…"/><span className="fine-print">Up to 300 characters.</span></div><label className="honeypot" aria-hidden="true">Website<input {...form.register('website')} tabIndex={-1} autoComplete="off"/></label><label className="check-label span-two"><input type="checkbox" {...form.register('prep')}/><span>I have read and agree to the {policyLink}.</span></label>{form.formState.errors.prep&&<p className="field-error">{form.formState.errors.prep.message}</p>}</div></form>}
 {step===3&&<section><h2 className="small-heading">Review your appointment.</h2><dl className="review-list"><dt>Service</dt><dd>{q?.service.name}</dd><dt>Extras</dt><dd>{q?.extras.map(e=>e.name).join(', ')||'None'}</dd><dt>Your time</dt><dd>{start&&formatInTimeZone(start,'America/Toronto','EEEE, MMMM d · h:mm a zzz')}</dd><dt>Your details</dt><dd>{form.getValues('name')}<br/>{form.getValues('phone')}<br/>{form.getValues('email')}</dd><dt>Your notes</dt><dd>{form.getValues('notes')||'No special requests.'}</dd></dl><div className="notice">{isDemo?'This will save a sample appointment in this browser tab. No calendar event, email, or payment will be created.':'I will be happy to confirm your time and send deposit details; your appointment is confirmed once your deposit is received. By booking, you agree to the booking policies 🤎'}</div></section>}
 {error&&<div role="alert" className="status-message">{error}</div>}<div className="booking-actions">{step>0?<button className="button button-outline" onClick={()=>move(step-1)} disabled={submitting}>Back</button>:<span/>}{step===2?<button className="button" type="submit" form="details-form">Review booking <ArrowRight size={17}/></button>:step===3?<button className="button" onClick={submit} disabled={submitting}>{submitting?'Saving your appointment…':'Confirm booking'}</button>:<button className="button" disabled={!q||(step===1&&!start)} onClick={()=>move(step+1)}> {step===0?'Choose your time':'Your details'} <ArrowRight size={17}/></button>}</div></div>{summary}</div></div>;
}

// One-tap ways to send Sika the booking: text (prefilled), Instagram (copy, then paste) or email (prefilled).
function NotifySika({message,text,subject,heading}:{message:string;text:SiteText;subject:string;heading?:string}){
 const [copied,setCopied]=useState(false),[copyFailed,setCopyFailed]=useState(false);
 const ig=instagramLinks(text.instagramHandle),sms=text.phone?smsLink(text.phone,message):'';
 async function copy(){try{await navigator.clipboard.writeText(message);setCopied(true);setCopyFailed(false);}catch{setCopyFailed(true);}}
 return <div className={heading?'receipt-steps':'notify-inline'}>
  {heading&&<h2 className="small-heading">{heading}</h2>}
  <div className="notify-buttons">
   {sms&&<a className="button full-width" href={sms}><MessageSquare size={18} aria-hidden="true"/> Send as a text message</a>}
   {copied
    ?<a className="button full-width" href={ig.dm} target="_blank" rel="noreferrer"><Instagram size={18} aria-hidden="true"/> Copied — open Instagram and paste</a>
    :<button type="button" className={`button full-width ${sms?'button-outline':''}`} onClick={copy}><Instagram size={18} aria-hidden="true"/> Send on Instagram</button>}
   {copied&&<p className="notify-step" role="status">Your booking details are copied. In the Instagram chat with {text.instagramHandle}, tap the message box, choose <b>Paste</b>, then send.</p>}
   {copyFailed&&<p className="notify-step" role="status">Copying isn’t allowed in this browser. Open the message below, copy it, and send it to {text.instagramHandle} on Instagram.</p>}
   <a className="button button-outline full-width" href={mailLink(text.email,subject,message)}><Mail size={18} aria-hidden="true"/> Send by email</a>
  </div>
  <details open={copyFailed}><summary className="notify-step">See the message</summary><textarea readOnly className="message-preview" value={message} onFocus={e=>e.currentTarget.select()} aria-label="Your booking message"/></details>
 </div>;
}

// Step 2: where and how to send the deposit, with the booking reference to include.
function DepositStep({text,reference}:{text:SiteText;reference:string}){
 const [copied,setCopied]=useState(false);
 return <div className="deposit-step">
  {text.etransferTo?<>
   <p>Send <strong>{money(text.depositCents)}</strong> by e-transfer to:</p>
   <div className="copy-field"><strong>{text.etransferTo}</strong><button type="button" className="button button-small button-outline" onClick={async()=>{try{await navigator.clipboard.writeText(text.etransferTo);setCopied(true);}catch{/* the address is shown to copy by hand */}}}>{copied?'Copied':'Copy'}</button></div>
   <p className="muted">Put <strong>{reference}</strong> in the message so I can match it. Paying cash instead? Just let me know when you text.</p>
  </>:<p>I’ll reply with where to send it. You can pay by e-transfer or cash.</p>}
  <p className="muted"><Link href="/#deposit" target="_blank">Deposit policy</Link> · non-refundable, goes toward your balance.</p>
 </div>;
}
