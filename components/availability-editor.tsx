'use client';

import { useEffect, useState } from 'react';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { Trash2 } from 'lucide-react';
import { weekdayNames, type TimeOff, type WeekHours } from '@/lib/availability';

type Props = {
  hours: WeekHours; timeOff: TimeOff[]; timezone: string; buffer: number;
  onSaveHours: (hours: WeekHours) => Promise<void>;
  onAddTimeOff: (block: { start_at: string; end_at: string; reason: string }) => Promise<void>;
  onRemoveTimeOff: (id: string) => Promise<void>;
};

// Sika decides which times clients can book: weekly hours plus one-off blocked dates and times.
export function AvailabilityEditor({ hours: initial, timeOff, timezone, buffer, onSaveHours, onAddTimeOff, onRemoveTimeOff }: Props) {
  const [hours, setHours] = useState<WeekHours>(initial);
  // Follow saved hours when they change (after a save, refresh or demo reset) without losing the status message.
  const savedHours = JSON.stringify(initial);
  useEffect(() => { setHours(JSON.parse(savedHours)); }, [savedHours]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(''), [from, setFrom] = useState('09:00'), [to, setTo] = useState('20:00'), [allDay, setAllDay] = useState(true), [reason, setReason] = useState('');
  const dirty = JSON.stringify(hours) !== JSON.stringify(initial);
  const invalid = hours.some(d => d.open && d.close && d.open >= d.close);

  async function run(work: () => Promise<void>, done: string) {
    setBusy(true); setMessage('');
    try { await work(); setMessage(done); } catch (e) { setMessage((e as Error).message || 'Could not save. Please try again.'); } finally { setBusy(false); }
  }
  function setDay(i: number, patch: Partial<WeekHours[number]>) { setHours(hours.map((d, j) => j === i ? { ...d, ...patch } : d)); }

  return <section className="availability" aria-labelledby="availability-heading">
    <h2 id="availability-heading" className="small-heading">Your availability</h2>
    <p className="muted">Clients can only pick start times inside these hours that leave room for the whole appointment plus your {buffer}-minute break before the next client. Times are {timezone.replace('_', ' ')}.</p>

    <h3 className="availability-subheading">Weekly hours</h3>
    <div className="hours-grid" role="group" aria-label="Weekly hours">
      {hours.map((d, i) => {
        const open = d.open !== null;
        return <div key={i} className={`hours-row ${open ? '' : 'is-closed'}`}>
          <label className="hours-day"><input type="checkbox" checked={open} onChange={e => setDay(i, e.target.checked ? { open: '09:00', close: '20:00' } : { open: null, close: null })} /><span>{weekdayNames[i]}</span></label>
          {open ? <div className="hours-times">
            <label><span>Open</span><input type="time" step={1800} value={d.open ?? ''} onChange={e => setDay(i, { open: e.target.value })} aria-label={`${weekdayNames[i]} opening time`} /></label>
            <label><span>Close</span><input type="time" step={1800} value={d.close ?? ''} onChange={e => setDay(i, { close: e.target.value })} aria-label={`${weekdayNames[i]} closing time`} /></label>
          </div> : <span className="hours-closed">Closed</span>}
        </div>;
      })}
    </div>
    {invalid && <p className="field-error">Closing time must be after opening time.</p>}
    <div className="admin-actions">
      <button className="button" disabled={busy || !dirty || invalid} onClick={() => run(() => onSaveHours(hours), 'Hours saved. New bookings follow these times.')}>Save hours</button>
      {dirty && <button className="button button-outline" disabled={busy} onClick={() => setHours(initial)}>Undo changes</button>}
    </div>

    <h3 className="availability-subheading">Blocked dates & times</h3>
    <p className="muted">Days off, holidays, or a few hours you want to keep free. Blocked times never show as available.</p>
    {timeOff.length > 0 && <ul className="time-off-list">{timeOff.map(t => {
      const sameDay = formatInTimeZone(t.start_at, timezone, 'yyyy-MM-dd') === formatInTimeZone(new Date(new Date(t.end_at).getTime() - 60000), timezone, 'yyyy-MM-dd');
      const whole = sameDay && formatInTimeZone(t.start_at, timezone, 'HH:mm') === '00:00' && formatInTimeZone(t.end_at, timezone, 'HH:mm') === '00:00';
      return <li key={t.id}><div><strong>{formatInTimeZone(t.start_at, timezone, 'EEE, MMM d, yyyy')}</strong><span>{whole ? 'All day' : `${formatInTimeZone(t.start_at, timezone, 'h:mm a')} – ${formatInTimeZone(t.end_at, timezone, sameDay ? 'h:mm a' : 'EEE, MMM d h:mm a')}`}{t.reason && ` · ${t.reason}`}</span></div>
        <button className="icon-button" aria-label={`Remove blocked time on ${formatInTimeZone(t.start_at, timezone, 'MMMM d')}`} disabled={busy} onClick={() => run(() => onRemoveTimeOff(t.id), 'Blocked time removed.')}><Trash2 size={17} /></button></li>;
    })}</ul>}
    <form className="time-off-form" onSubmit={e => {
      e.preventDefault(); if (!date) return;
      const start_at = fromZonedTime(`${date}T${allDay ? '00:00' : from}:00`, timezone).toISOString();
      const end_at = allDay ? fromZonedTime(`${date}T00:00:00`, timezone) : fromZonedTime(`${date}T${to}:00`, timezone);
      if (allDay) end_at.setDate(end_at.getDate() + 1);
      if (end_at.getTime() <= new Date(start_at).getTime()) { setMessage('The end time must be after the start time.'); return; }
      run(() => onAddTimeOff({ start_at, end_at: end_at.toISOString(), reason: reason.trim() }), 'Time blocked off.').then(() => { setDate(''); setReason(''); });
    }}>
      <label><span>Date</span><input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label>
      <label className="check-label time-off-allday"><input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} /><span>Whole day</span></label>
      {!allDay && <><label><span>From</span><input type="time" step={1800} value={from} onChange={e => setFrom(e.target.value)} /></label><label><span>To</span><input type="time" step={1800} value={to} onChange={e => setTo(e.target.value)} /></label></>}
      <label className="time-off-reason"><span>Note (only you see it)</span><input value={reason} maxLength={80} onChange={e => setReason(e.target.value)} placeholder="Holiday, personal, …" /></label>
      <button className="button button-outline" disabled={busy || !date}>Block this time</button>
    </form>
    {message && <p className="status-message" role="status">{message}</p>}
  </section>;
}
