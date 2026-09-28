import 'server-only';
import { db, getContent } from './db';
import { dueReminder, reminderMessage, toE164 } from './reminder-rules';
import { emailConfigured, sendEmail, sendSms, smsConfigured } from './notify';
import type { Booking } from './types';

// Called by the scheduler (GET /api/jobs every 10 minutes). Each reminder is claimed in the database before
// sending, so overlapping runs never send it twice.
export async function sendDueReminders(now = new Date()) {
  if (!emailConfigured() && !smsConfigured()) return 0;
  const client = db();
  const { data, error } = await client.from('bookings').select('*').in('status', ['pending_deposit', 'confirmed'])
    .gt('start_at', now.toISOString()).lte('start_at', new Date(now.getTime() + 25 * 3600000).toISOString());
  if (error) throw error;
  const text = (await getContent()).text;
  let sent = 0;
  for (const b of (data ?? []) as (Booking & { reminder_day_sent_at: string | null; reminder_2h_sent_at: string | null })[]) {
    const kind = dueReminder(b, now);
    if (!kind) continue;
    const column = kind === 'day' ? 'reminder_day_sent_at' : 'reminder_2h_sent_at';
    // A 2-hour reminder also retires a 24-hour one that never went out.
    const claim = { [column]: now.toISOString(), ...(kind === 'soon' && !b.reminder_day_sent_at ? { reminder_day_sent_at: now.toISOString() } : {}) };
    const { data: claimed, error: claimError } = await client.from('bookings').update(claim).eq('id', b.id).is(column, null).select('id');
    if (claimError) throw claimError;
    if (!claimed?.length) continue;
    const message = reminderMessage(kind, b, text);
    const results = await Promise.allSettled([
      emailConfigured() && b.client_email ? sendEmail(b.client_email, message.subject, message.email, `${b.id}-reminder-${kind}`) : Promise.resolve(),
      smsConfigured() && toE164(b.client_phone) ? sendSms(toE164(b.client_phone)!, message.sms) : Promise.resolve(),
    ]);
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length === results.length) {
      // Nothing went out: release the claim so the next run tries again.
      await client.from('bookings').update({ [column]: null }).eq('id', b.id);
      console.error('Reminder failed', { booking: b.id, kind, errors: failures.map(f => (f as PromiseRejectedResult).reason?.message) });
    } else { sent++; if (failures.length) console.error('Reminder partly sent', { booking: b.id, kind }); }
  }
  return sent;
}
