import { describe, expect, it } from 'vitest';
import { slotsForDay, weekdayOf } from '../../lib/availability';
const tz='America/Toronto';
const local=(iso:string)=>new Date(iso).toLocaleTimeString('en-US',{timeZone:tz,hour:'numeric',minute:'2-digit'});
const base={date:'2027-03-10',open:'09:00',close:'20:00',timezone:tz,buffer:30,now:new Date('2027-03-01T12:00:00Z'),noticeHours:24,windowDays:60};
describe('appointment slots',()=>{
 it('offers half-hour starts that fit the whole appointment before closing',()=>{
  const slots=slotsForDay({...base,duration:300,busy:[]}).map(local);
  expect(slots[0]).toBe('9:00 AM');
  expect(slots.at(-1)).toBe('3:00 PM'); // 3pm + 5h = 8pm close
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
