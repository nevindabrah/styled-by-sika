import { describe, expect, it } from 'vitest';
import { bookingSms, dueReminder, reminderMessage, toE164 } from '../../lib/reminder-rules';
import { defaultText } from '../../lib/content';
const start = '2027-03-10T15:00:00Z'; // 10:00 AM Toronto (EST)
const at = (hoursBefore: number) => new Date(new Date(start).getTime() - hoursBefore * 3600000);
const booking = { status: 'confirmed', start_at: start, created_at: '2027-03-01T12:00:00Z', reminder_day_sent_at: null, reminder_2h_sent_at: null };
describe('appointment reminders', () => {
 it('sends the 24-hour reminder from a day before until three hours before', () => {
  expect(dueReminder(booking, at(25))).toBeNull();
  expect(dueReminder(booking, at(24))).toBe('day');
  expect(dueReminder(booking, at(4))).toBe('day');
  expect(dueReminder(booking, at(2.5))).toBeNull();
  expect(dueReminder({ ...booking, reminder_day_sent_at: at(24).toISOString() }, at(20))).toBeNull();
 });
 it('sends the 2-hour reminder once, and never after the start', () => {
  expect(dueReminder(booking, at(2))).toBe('soon');
  expect(dueReminder(booking, at(0.5))).toBe('soon');
  expect(dueReminder({ ...booking, reminder_2h_sent_at: at(2).toISOString() }, at(1))).toBeNull();
  expect(dueReminder(booking, at(-0.1))).toBeNull();
 });
 it('skips the 24-hour reminder when the client booked less than a day ahead, and skips inactive bookings', () => {
  expect(dueReminder({ ...booking, created_at: at(25).toISOString() }, at(23))).toBeNull();
  expect(dueReminder({ ...booking, created_at: at(25).toISOString() }, at(2))).toBe('soon');
  for (const status of ['cancelled', 'no_show', 'completed']) expect(dueReminder({ ...booking, status }, at(2))).toBeNull();
  expect(dueReminder({ ...booking, status: 'pending_deposit' }, at(24))).toBe('day');
 });
 it('formats phone numbers for texting', () => {
  expect(toE164('416-555-0101')).toBe('+14165550101');
  expect(toE164('1 (647) 555 0101')).toBe('+16475550101');
  expect(toE164('+44 7700 900123')).toBe('+447700900123');
  expect(toE164('12345')).toBeNull();
 });
 it('writes clear reminder and booking messages with her details', () => {
  const b = { client_name: 'Taylor Client', start_at: start, status: 'pending_deposit', snapshot: { style: 'Large Knotless Braids — Shoulder Length', timezone: 'America/Toronto' } };
  const day = reminderMessage('day', b, defaultText());
  expect(day.subject).toContain('tomorrow');
  expect(day.email).toContain('Hi Taylor');
  expect(day.email).toContain('Wednesday, March 10 at 10:00 AM');
  expect(day.email).toContain('not confirmed until your deposit');
  expect(day.email).toContain('Freshly washed');
  expect(day.sms).toContain('@styledby.sika');
  expect(day.sms.length).toBeLessThan(320);
  const soon = reminderMessage('soon', { ...b, status: 'confirmed' }, defaultText());
  expect(soon.sms).toContain('today at 10:00 AM');
  expect(soon.sms).not.toContain('Deposit');
  expect(bookingSms('confirmed', b, defaultText())).toContain('confirmed');
 });
});
