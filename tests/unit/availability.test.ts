import { describe, expect, it } from 'vitest';
import { hoursForDate, slotsForDay, weekdayOf } from '../../lib/availability';
const tz='America/Toronto';
const local=(iso:string)=>new Date(iso).toLocaleTimeString('en-US',{timeZone:tz,hour:'numeric',minute:'2-digit'});
const base={date:'2027-03-10',open:'09:00',close:'20:00',timezone:tz,buffer:30,now:new Date('2027-03-01T12:00:00Z'),noticeHours:24,windowDays:60};
describe('appointment slots',()=>{
 it('offers every half hour from her start time to her end time, however long the style',()=>{
  const slots=slotsForDay({...base,duration:300,busy:[]}).map(local);
  expect(slots[0]).toBe('9:00 AM');
  expect(slots.at(-1)).toBe('8:00 PM'); // a 5-hour style may start at 8pm and run past it
  expect(slotsForDay({...base,open:'10:00',close:'12:00',duration:720,busy:[]}).map(local)).toEqual(['10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM']);
 });
 it('removes every start that would overlap a booked appointment plus the break',()=>{
  // 5-hour appointment at 9:00 AM Toronto (EST) blocks until 2:30 PM including the 30-minute break.
  const busy=[{start:'2027-03-10T14:00:00Z',end:'2027-03-10T19:00:00Z'}];
  const slots=slotsForDay({...base,duration:120,busy}).map(local);
  expect(slots).not.toContain('9:00 AM');
  expect(slots).not.toContain('11:00 AM');
  expect(slots).not.toContain('2:00 PM');
  expect(slots[0]).toBe('2:30 PM');
  // A 2-hour appointment cannot start at 7:30 AM either, because it would run into the 9:00 booking.
  const early=slotsForDay({...base,open:'06:00',duration:120,busy}).map(local);
  expect(early).toContain('6:30 AM'); // 6:30–8:30 plus the break ends at 9:00 exactly
  expect(slots.at(-1)).toBe('8:00 PM'); // starts run right up to her end time
  expect(early).not.toContain('7:30 AM');
  expect(early).not.toContain('7:00 AM'); // 7:00–9:00 leaves no break before the 9:00 booking
 });
 it('respects closed days, blocked time and the notice window',()=>{
  expect(slotsForDay({...base,open:null,close:null,duration:60,busy:[]})).toEqual([]);
  const dayOff=[{start:'2027-03-10T05:00:00Z',end:'2027-03-11T05:00:00Z'}];
  expect(slotsForDay({...base,duration:60,busy:dayOff})).toEqual([]);
  // With the day already started, nothing inside the 24-hour notice window is offered.
  expect(slotsForDay({...base,duration:60,busy:[],now:new Date('2027-03-10T12:00:00Z')})).toEqual([]);
  expect(weekdayOf('2027-03-10')).toBe(3); // Wednesday
 });
});

describe('her planned weeks', () => {
 it('uses a planned day over her usual week, and her usual week otherwise', () => {
  const week = Array.from({ length: 7 }, () => ({ open: '09:00', close: '17:00' }));
  const plans = { '2026-12-09': { open: '12:00', close: '20:00' }, '2026-12-10': { open: null, close: null } };
  expect(hoursForDate('2026-12-09', week, plans)).toEqual({ open: '12:00', close: '20:00', planned: true });
  expect(hoursForDate('2026-12-10', week, plans)).toEqual({ open: null, close: null, planned: true });
  expect(hoursForDate('2026-12-11', week, plans)).toEqual({ open: '09:00', close: '17:00', planned: false });
 });
 it('12–8 start window, 6-hour style: every half hour 12–8, and a 12:00 booking blocks 12–6 (+ her break) for everyone', () => {
  const day = { date: '2026-12-09', open: '12:00', close: '20:00', timezone: tz, duration: 360, now: new Date('2026-07-01T12:00:00Z'), noticeHours: 24, windowDays: 365 };
  const all = slotsForDay({ ...day, buffer: 30, busy: [] }).map(local);
  expect(all[0]).toBe('12:00 PM'); expect(all.at(-1)).toBe('8:00 PM'); expect(all).toHaveLength(17);
  const booked = [{ start: '2026-12-09T17:00:00Z', end: '2026-12-09T23:00:00Z' }]; // 12:00–6:00 PM Toronto (EST)
  expect(slotsForDay({ ...day, buffer: 30, busy: booked }).map(local)).toEqual(['6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM']);
  expect(slotsForDay({ ...day, duration: 60, buffer: 0, busy: booked }).map(local)).toEqual(['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM']);
  // Nothing inside 12–6 is offered to anyone else.
  expect(slotsForDay({ ...day, duration: 60, buffer: 0, busy: booked }).map(local).some(t => /^(12|[1-5]):\d\d PM$/.test(t))).toBe(false);
 });
 it('can be booked months ahead within her window', () => {
  const far = { date: '2026-12-09', open: '10:00', close: '17:00', timezone: tz, duration: 120, buffer: 30, busy: [], now: new Date('2026-07-01T12:00:00Z'), noticeHours: 24 };
  expect(slotsForDay({ ...far, windowDays: 60 })).toEqual([]);
  expect(slotsForDay({ ...far, windowDays: 365 }).map(local)[0]).toBe('10:00 AM');
 });
});
