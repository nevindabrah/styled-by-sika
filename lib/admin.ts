import 'server-only';
import { requireAdmin } from './auth';
import { db } from './db';
import type { Booking } from './types';
export async function getBookings(){await requireAdmin();const all:Booking[]=[];for(let page=0;;page++){const {data,error}=await db().from('bookings').select('*').order('start_at',{ascending:false}).range(page*1000,(page+1)*1000-1);if(error)throw error;all.push(...data as Booking[]);if(data.length<1000)break;}return all;}
export const statusLabel={pending_deposit:'Awaiting deposit',confirmed:'Confirmed',completed:'Completed',cancelled:'Cancelled',no_show:'No-show'};
