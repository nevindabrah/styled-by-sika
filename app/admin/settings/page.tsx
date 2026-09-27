import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/db';
import { getTimeOff, getWeekHours } from '@/lib/live-availability';
import { money } from '@/lib/pricing';
import { AdminAvailability } from '@/components/admin-availability';
export default async function Settings(){await requireAdmin();const s=await getSettings(),[hours,timeOff]=await Promise.all([getWeekHours(),getTimeOff(new Date())]);return <><div className="eyebrow">THE WAY YOU WORK</div><h1 className="page-title">Your <em>settings.</em></h1>
 <AdminAvailability hours={hours} timeOff={timeOff} timezone={s.timezone} buffer={s.buffer_min}/>
 <h2 className="small-heading">Business details</h2><p className="notice">Text David to change these.</p><dl className="review-list"><dt>Location</dt><dd>Vaughan, Ontario</dd><dt>Timezone</dt><dd>{s.timezone}</dd><dt>Break between clients</dt><dd>{s.buffer_min} minutes</dd><dt>Advance notice</dt><dd>{s.minimum_notice_hours} hours</dd><dt>Booking window</dt><dd>Up to {s.window_days} days ahead</dd><dt>Deposit</dt><dd>{s.deposit_cents===null?'To be confirmed':money(s.deposit_cents)}</dd></dl></>;}
