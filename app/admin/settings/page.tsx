import { requireAdmin } from '@/lib/auth';
import { getSettings } from '@/lib/db';
import { getTimeOff, getWeekHours } from '@/lib/live-availability';
import { money } from '@/lib/pricing';
import { AdminAvailability } from '@/components/admin-availability';
import { AccountPassword } from '@/components/account-password';
export default async function Settings(){await requireAdmin();const s=await getSettings(),[hours,timeOff]=await Promise.all([getWeekHours(),getTimeOff(new Date())]);return <><div className="eyebrow">THE WAY YOU WORK</div><h1 className="page-title">Your <em>settings.</em></h1>
 <AdminAvailability hours={hours} timeOff={timeOff} timezone={s.timezone} rules={{buffer_min:s.buffer_min,minimum_notice_hours:s.minimum_notice_hours,window_days:s.window_days}} bookingOpen={!!s.booking_open}/>
 <p className="muted">Deposit ({s.deposit_cents===null?'not set':money(s.deposit_cents)}) and payment wording are edited under Website → Text.</p>
 <AccountPassword email={process.env.ADMIN_EMAIL??''}/></>;}
