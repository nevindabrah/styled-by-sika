import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import type { Booking } from '@/lib/types';
const labels={pending_deposit:'Awaiting deposit',confirmed:'Confirmed',completed:'Completed',cancelled:'Cancelled',no_show:'No-show'};
export function BookingRow({booking:b}:{booking:Booking}){return <Link className="booking-row" href={`/admin/bookings/${b.id}`}><div><strong>{b.client_name}</strong><p>{b.snapshot.style}</p><p>{formatInTimeZone(b.start_at,b.snapshot.timezone,'EEE, MMM d · h:mm a')}</p></div><div><span className={`badge ${b.status}`}>{labels[b.status]}</span>{b.sync_state!=='synced'&&<p>Confirmation processing</p>}</div></Link>;}
