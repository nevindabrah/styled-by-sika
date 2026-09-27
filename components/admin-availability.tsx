'use client';
import { useRouter } from 'next/navigation';
import { AvailabilityEditor } from './availability-editor';
import type { TimeOff, WeekHours } from '@/lib/availability';

export function AdminAvailability({ hours, timeOff, timezone, buffer }: { hours: WeekHours; timeOff: TimeOff[]; timezone: string; buffer: number }) {
  const router = useRouter();
  async function save(body: object) {
    const res = await fetch('/api/admin/availability', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    router.refresh();
  }
  return <AvailabilityEditor hours={hours} timeOff={timeOff} timezone={timezone} buffer={buffer}
    onSaveHours={h => save({ hours: h })} onAddTimeOff={block => save({ addTimeOff: block })} onRemoveTimeOff={id => save({ removeTimeOff: id })} />;
}
