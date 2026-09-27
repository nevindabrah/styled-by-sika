import 'server-only';
import { JWT } from 'google-auth-library';
import type { Booking } from './types';
import type { Busy } from './availability';
const root='https://www.googleapis.com/calendar/v3';
async function calendarRequest(path:string,init:RequestInit={}){
 const auth=new JWT({email:process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,key:process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g,'\n'),scopes:['https://www.googleapis.com/auth/calendar']});
 const token=await auth.getAccessToken();
 return fetch(`${root}${path}`,{...init,headers:{Authorization:`Bearer ${token.token}`,'Content-Type':'application/json',...init.headers},cache:'no-store',signal:AbortSignal.timeout(15000)});
}
const cache=new Map<string,{until:number;busy:Busy[]}>();
export async function getBusy(start:Date,end:Date,fresh=false):Promise<Busy[]>{
 const key=`${start.toISOString()}/${end.toISOString()}`;const cached=cache.get(key);if(!fresh && cached && cached.until>Date.now())return cached.busy;
 const res=await calendarRequest('/freeBusy',{method:'POST',body:JSON.stringify({timeMin:start.toISOString(),timeMax:end.toISOString(),items:[{id:process.env.GOOGLE_CALENDAR_ID}]})});
 if(!res.ok)throw new Error('Calendar unavailable.');const data=await res.json();const cal=data.calendars?.[process.env.GOOGLE_CALENDAR_ID!];if(!cal || cal.errors?.length)throw new Error('Calendar unavailable.');
 if(cache.size>120)cache.clear();cache.set(key,{until:Date.now()+60000,busy:cal.busy});return cal.busy;
}
export const eventId=(booking:Booking)=>`mb${booking.id.replaceAll('-','')}`;
export async function syncCalendar(booking:Booking){
 const id=eventId(booking),path=`/calendars/${encodeURIComponent(process.env.GOOGLE_CALENDAR_ID!)}/events`;
 if(booking.status==='cancelled') {const res=await calendarRequest(`${path}/${id}`,{method:'DELETE'});if(!res.ok&&res.status!==404&&res.status!==410)throw new Error('Calendar cancellation failed.');cache.clear();return {id,url:null};}
 const s=booking.snapshot;
 const event={id,summary:`${booking.status==='confirmed'?'PAID · ':''}${booking.client_name.split(' ')[0]} - ${s.style}`,start:{dateTime:booking.start_at},end:{dateTime:booking.end_at},colorId:booking.status==='confirmed'?'2':'3',description:[booking.reference,booking.client_name,booking.client_phone,booking.client_email,booking.client_instagram,s.style,s.addons.join(', '),`${s.estimate} · ${booking.status}`,booking.client_notes,'Booked via website.'].filter(Boolean).join('\n')};
 const existing=await calendarRequest(`${path}/${id}`);let res:Response;
 if(existing.ok)res=await calendarRequest(`${path}/${id}`,{method:'PATCH',body:JSON.stringify(event)});
 else if(existing.status===404)res=await calendarRequest(path,{method:'POST',body:JSON.stringify(event)});
 else throw new Error('Calendar lookup failed.');
 if(res.status===409)res=await calendarRequest(`${path}/${id}`);
 if(!res.ok)throw new Error('Calendar update failed.');const data=await res.json();cache.clear();return {id:data.id as string,url:data.htmlLink as string};
}
