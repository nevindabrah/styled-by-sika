import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { Booking } from './types';
import { seedCatalog } from './seed';
import { quote } from './pricing';
import { depositSummary } from './business';
import { slotsForDay, weekdayOf, type TimeOff, type WeekHours } from './availability';

export const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const storageKey = 'styled-by-sika-demo-appointments';
const settingsKey = 'styled-by-sika-demo-availability';
export const demoTimezone = 'America/Toronto', demoBuffer = 30, demoNoticeHours = 24, demoWindowDays = 60;

// Demonstration fixtures only: these are not the braider's real hours. She edits them in the demo dashboard.
export type DemoAvailability = { hours: WeekHours; timeOff: TimeOff[] };
export const sampleAvailability = (): DemoAvailability => ({
  hours: [{ open: null, close: null }, ...Array.from({ length: 6 }, () => ({ open: '09:00', close: '20:00' }))],
  timeOff: [],
});
export function readDemoAvailability(): DemoAvailability {
  if (typeof window === 'undefined') return sampleAvailability();
  try { const saved = sessionStorage.getItem(settingsKey); return saved ? JSON.parse(saved) : sampleAvailability(); }
  catch { return sampleAvailability(); }
}
export function saveDemoAvailability(settings: DemoAvailability) { sessionStorage.setItem(settingsKey, JSON.stringify(settings)); }

// Same rules as the live site: her hours, minus time off and every saved appointment plus the clean-up buffer.
export function demoSlots(date: string, duration: number): string[] {
  const { hours, timeOff } = readDemoAvailability();
  const day = hours[weekdayOf(date)];
  const busy = [
    ...readDemoBookings().filter(b => b.status !== 'cancelled').map(b => ({ start: b.start_at, end: b.end_at })),
    ...timeOff.map(t => ({ start: t.start_at, end: t.end_at })),
  ];
  return slotsForDay({ date, open: day?.open ?? null, close: day?.close ?? null, timezone: demoTimezone, duration, buffer: demoBuffer, busy, now: new Date(), noticeHours: demoNoticeHours, windowDays: demoWindowDays });
}

export function sampleBookings(): Booking[] {
  const q = quote(seedCatalog, { service: seedCatalog.services[1].id, extras: [] });
  return ['Avery Demo', 'Jordan Demo', 'Morgan Demo'].map((name, i) => {
    const day = formatInTimeZone(Date.now() + i * 86400000, demoTimezone, 'yyyy-MM-dd');
    const start = fromZonedTime(`${day}T10:00:00`, demoTimezone);
    const end = new Date(start.getTime() + q.duration * 60000);
    return {
      id: `demo-${i + 1}`, reference: `DEMO-00${i + 1}`, status: i === 0 ? 'confirmed' : 'pending_deposit',
      style_id: q.service.id, addon_ids: [],
      start_at: start.toISOString(), end_at: end.toISOString(), blocked_until: new Date(end.getTime() + demoBuffer * 60000).toISOString(),
      price_cents: q.total, duration_min: q.duration, client_name: name, client_phone: `+1 416 555 010${i}`,
      client_email: `demo${i + 1}@example.com`, client_instagram: '', client_notes: i === 0 ? 'Demo note: I would like a centre part.' : '', admin_notes: '',
      google_event_id: null, calendar_url: null,
      snapshot: { style: q.service.name, addons: [], breakdown: q.breakdown, estimate: q.estimate, timezone: demoTimezone, deposit: `${depositSummary} No payment is needed in this demo.` },
      sync_state: 'demo', created_at: new Date().toISOString(),
    };
  });
}
export function readDemoBookings(): Booking[] {
  if (typeof window === 'undefined') return [];
  try { const saved = sessionStorage.getItem(storageKey); return saved ? JSON.parse(saved) : sampleBookings(); }
  catch { return sampleBookings(); }
}
export function saveDemoBookings(bookings: Booking[]) { sessionStorage.setItem(storageKey, JSON.stringify(bookings)); }
export function addDemoBooking(booking: Booking) { saveDemoBookings([booking, ...readDemoBookings()]); }

// Demo website content: everything the editor changes, kept in this browser tab.
const contentKey = 'styled-by-sika-demo-content';
export function readDemoContent<T>(fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { const saved = sessionStorage.getItem(contentKey); return saved ? JSON.parse(saved) : fallback; } catch { return fallback; }
}
export function saveDemoContent(content: unknown) { sessionStorage.setItem(contentKey, JSON.stringify(content)); }
export function clearDemoContent() { sessionStorage.removeItem(contentKey); }
