import { formatInTimeZone } from 'date-fns-tz';
import type { SiteText } from './content';

// When reminders go out, in minutes before the appointment. The scheduler checks every 10 minutes.
export const reminderOffsets = { day: 24 * 60, soon: 120 } as const;
export type ReminderKind = keyof typeof reminderOffsets;
type Timing = { status: string; start_at: string; created_at: string; reminder_day_sent_at?: string | null; reminder_2h_sent_at?: string | null };

// Which reminder (if any) is due now. The 2-hour one wins; the 24-hour one is skipped when the client
// booked less than a day ahead (their confirmation just arrived) or when it is already within 3 hours.
export function dueReminder(b: Timing, now: Date): ReminderKind | null {
  if (!['pending_deposit', 'confirmed'].includes(b.status)) return null;
  const start = new Date(b.start_at).getTime(), t = now.getTime(), minute = 60000;
  if (start <= t) return null;
  if (!b.reminder_2h_sent_at && start - t <= reminderOffsets.soon * minute) return 'soon';
  const bookedAhead = start - new Date(b.created_at).getTime();
  if (!b.reminder_day_sent_at && start - t <= reminderOffsets.day * minute && start - t > 3 * 60 * minute && bookedAhead > 26 * 60 * minute) return 'day';
  return null;
}

// Canadian and US numbers to E.164 (+1XXXXXXXXXX); anything else must already include its country code.
export function toE164(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, '');
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  const d = digits.replace(/\+/g, '');
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  return null;
}

type BookingLike = { client_name: string; start_at: string; status: string; snapshot: { style: string; timezone: string } };
const first = (name: string) => name.trim().split(/\s+/)[0] || 'there';

export function reminderMessage(kind: ReminderKind, b: BookingLike, text: SiteText) {
  const tz = b.snapshot.timezone || 'America/Toronto';
  const when = formatInTimeZone(b.start_at, tz, kind === 'day' ? "EEEE, MMMM d 'at' h:mm a" : "'today at' h:mm a");
  const pending = b.status === 'pending_deposit';
  const prep = text.policies.find(p => p.id === 'hair-prep');
  const prepLines = prep ? [prep.intro, ...prep.items.map(i => `• ${i}`), prep.outro].filter(Boolean).join('\n') : '';
  const deposit = pending ? `\n\nYour appointment is not confirmed until your deposit has been received.\n${text.depositSummary}` : '';
  const subject = kind === 'day' ? 'Reminder: your Styled by Sika appointment tomorrow' : 'See you soon: your Styled by Sika appointment is today';
  const email = `Hi ${first(b.client_name)},\n\nThis is a reminder of your ${b.snapshot.style} appointment ${when}.${deposit}${kind === 'day' && prepLines ? `\n\n${prepLines}` : ''}\n\nNeed to reschedule? A minimum of 48 hours’ notice is required. Message ${text.instagramHandle} on Instagram or reply to ${text.email}.\n\nThank you for choosing Styled by Sika 🤎`;
  const sms = kind === 'day'
    ? `Styled by Sika: reminder of your ${b.snapshot.style} appointment ${when}.${pending ? ' Not confirmed until your deposit is received.' : ''} Please arrive with hair washed, dried and detangled. Questions? DM ${text.instagramHandle}. Reply STOP to opt out.`
    : `Styled by Sika: see you ${when} for your ${b.snapshot.style} appointment.${pending ? ' Deposit still needed to confirm.' : ''} Reply STOP to opt out.`;
  return { subject, email, sms };
}

export function bookingSms(kind: 'created' | 'confirmed' | 'cancelled', b: BookingLike, text: SiteText) {
  const when = formatInTimeZone(b.start_at, b.snapshot.timezone || 'America/Toronto', "EEE, MMM d 'at' h:mm a");
  if (kind === 'created') return `Styled by Sika: request received for ${b.snapshot.style} on ${when}. Your appointment is confirmed once your deposit is received; details are in your email. Reply STOP to opt out.`;
  if (kind === 'confirmed') return `Styled by Sika: deposit received. Your ${b.snapshot.style} appointment on ${when} is confirmed. See you then!`;
  return `Styled by Sika: your appointment on ${when} has been cancelled. Questions? DM ${text.instagramHandle}.`;
}
