import { describe, expect, it } from 'vitest';
import { bookingMessage, mailLink, smsLink } from '../../lib/booking-message';
const summary = { service: 'S-Medium Knotless Braids — Standard Back Length', duration: '8 hr 30 min', extras: ['Boho/Curl Add-On (CA$30–CA$50)'], estimate: 'CA$210–CA$230' };
describe('booking messages to Sika', () => {
 it('fills in the chosen time and name instead of leaving blanks', () => {
  const m = bookingMessage({ ...summary, when: 'Friday, October 9 at 9:00 AM', name: 'Taylor Client' }, false);
  expect(m).toContain('Preferred time: Friday, October 9 at 9:00 AM');
  expect(m).toContain('Name: Taylor Client');
  expect(m).not.toMatch(/: \n|: $/m);
 });
 it('names a saved request with its reference', () => {
  const m = bookingMessage({ ...summary, when: 'Friday, October 9 at 9:00 AM', name: 'Taylor', reference: 'BR-1A2B3C4D' }, true);
  expect(m.startsWith('Hi Sika! I just requested a booking on your website:')).toBe(true);
  expect(m).toContain('Reference: BR-1A2B3C4D');
  expect(m).toContain('Time: Friday');
 });
 it('omits missing details without leaving empty lines', () => {
  const m = bookingMessage(summary, false);
  expect(m).not.toContain('Name:');
  expect(m).not.toMatch(/\n\n\n/);
 });
 it('prefills texts and emails', () => {
  expect(smsLink('(416) 555-0101', 'Hi & bye')).toBe('sms:4165550101?&body=Hi%20%26%20bye');
  expect(smsLink('', 'x')).toBe('');
  expect(mailLink('a@b.c', 'S', 'B 1')).toBe('mailto:a@b.c?subject=S&body=B%201');
 });
});
