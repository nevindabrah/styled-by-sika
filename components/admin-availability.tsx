'use client';
import { useRouter } from 'next/navigation';
import { AvailabilityEditor, type BookingRules } from './availability-editor';
import type { TimeOff, WeekHours } from '@/lib/availability';

export function AdminAvailability({ hours, timeOff, timezone, rules, bookingOpen }: { hours: WeekHours; timeOff: TimeOff[]; timezone: string; rules: BookingRules; bookingOpen: boolean }) {
  const router = useRouter();
  async function save(body: object) {
    const res = await fetch('/api/admin/availability', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    router.refresh();
  }
  return <AvailabilityEditor hours={hours} timeOff={timeOff} timezone={timezone} rules={rules} onSaveRules={r => save({ rules: r })} bookingOpen={bookingOpen} onToggleBooking={open => save({ bookingOpen: open })}
    onSaveHours={h => save({ hours: h })} onAddTimeOff={block => save({ addTimeOff: block })} onRemoveTimeOff={id => save({ removeTimeOff: id })} />;
}
