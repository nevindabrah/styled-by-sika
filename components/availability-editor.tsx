'use client';

import { useEffect, useState } from 'react';
import { useUnsavedWarning } from '@/lib/use-unsaved-warning';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { addDays, addMonths, format, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { hoursForDate, weekdayNames, type DayPlan, type DayPlans, type TimeOff, type WeekHours } from '@/lib/availability';

export type BookingRules = { buffer_min: number; minimum_notice_hours: number; window_days: number };
type Props = {
  hours: WeekHours; timeOff: TimeOff[]; timezone: string; rules: BookingRules;
  onSaveRules: (rules: BookingRules) => Promise<void>;
  onSaveHours: (hours: WeekHours) => Promise<void>;
  onAddTimeOff: (block: { start_at: string; end_at: string; reason: string }) => Promise<void>;
  onRemoveTimeOff: (id: string) => Promise<void>;
  plans: DayPlans;
  onSaveDays: (days: DayPlan[]) => Promise<void>;
  onClearDays: (from: string, to: string) => Promise<void>;
};

// Sika decides which times clients can book: weekly hours plus one-off blocked dates and times.
export function AvailabilityEditor({ hours: initial, timeOff, timezone, rules: savedRules, onSaveRules, onSaveHours, onAddTimeOff, onRemoveTimeOff, plans, onSaveDays, onClearDays }: Props) {
  const [rules, setRules] = useState<BookingRules>(savedRules);
  const savedRulesKey = JSON.stringify(savedRules);
  useEffect(() => { setRules(JSON.parse(savedRulesKey)); }, [savedRulesKey]);
  const rulesDirty = JSON.stringify(rules) !== savedRulesKey;
  const buffer = savedRules.buffer_min;
  const [hours, setHours] = useState<WeekHours>(initial);
  // Follow saved hours when they change (after a save, refresh or demo reset) without losing the status message.
  const savedHours = JSON.stringify(initial);
  useEffect(() => { setHours(JSON.parse(savedHours)); }, [savedHours]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(''), [from, setFrom] = useState('09:00'), [to, setTo] = useState('20:00'), [allDay, setAllDay] = useState(true), [reason, setReason] = useState('');
  const dirty = JSON.stringify(hours) !== JSON.stringify(initial);
  const invalid = hours.some(d => d.open && d.close && d.open >= d.close);
  useUnsavedWarning(dirty || rulesDirty);

  async function run(work: () => Promise<void>, done: string) {
    setBusy(true); setMessage('');
    try { await work(); setMessage(done); } catch (e) { setMessage((e as Error).message || 'Could not save. Please try again.'); } finally { setBusy(false); }
  }
  function setDay(i: number, patch: Partial<WeekHours[number]>) { setHours(hours.map((d, j) => j === i ? { ...d, ...patch } : d)); }

  return <section className="availability" aria-labelledby="availability-heading">
    <h2 id="availability-heading" className="small-heading">Your availability</h2>
    <p className="muted">Your hours are the times you’re happy to <strong>start</strong> an appointment. Clients can start at any half hour from your From time up to your To time, however long the style takes. Two appointments never overlap, and you get your {buffer}-minute break after each one. Times are {timezone.replace('_', ' ')}.</p>

    <WeekPlanner week={initial} plans={plans} windowDays={savedRules.window_days} busy={busy} run={run} onSaveDays={onSaveDays} onClearDays={onClearDays} />

    <h3 className="availability-subheading">Your usual week</h3>
    <p className="muted">Used for any week you haven’t planned above. Leave every day closed if you only want to open the weeks you plan.</p>
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
    {(dirty || rulesDirty) && <div className="unsaved-bar"><span>Unsaved changes</span>{dirty && <button className="button button-small" disabled={busy || invalid} onClick={() => run(() => onSaveHours(hours), 'Hours saved. New bookings follow these times.')}>Save hours</button>}{rulesDirty && <button className="button button-small" disabled={busy} onClick={() => run(() => onSaveRules(rules), 'Booking rules saved.')}>Save rules</button>}</div>}
    <div className="admin-actions">
      <button className="button" disabled={busy || !dirty || invalid} onClick={() => run(() => onSaveHours(hours), 'Hours saved. New bookings follow these times.')}>Save hours</button>
      {dirty && <button className="button button-outline" disabled={busy} onClick={() => setHours(initial)}>Undo changes</button>}
    </div>

    <h3 className="availability-subheading">Booking rules</h3>
    <div className="editor-two">
      <label className="editor-field"><span>Break between clients</span><select value={rules.buffer_min} onChange={e => setRules({ ...rules, buffer_min: Number(e.target.value) })}>{[0, 15, 30, 45, 60, 90, 120].map(m => <option key={m} value={m}>{m === 0 ? 'No break' : `${m} minutes`}</option>)}</select></label>
      <label className="editor-field"><span>Book at least this far ahead</span><select value={rules.minimum_notice_hours} onChange={e => setRules({ ...rules, minimum_notice_hours: Number(e.target.value) })}>{[24, 48, 72, 96, 168].map(h => <option key={h} value={h}>{h === 168 ? '1 week' : `${h / 24} ${h === 24 ? 'day' : 'days'} (${h} hours)`}</option>)}</select></label>
      <label className="editor-field"><span>Clients can book up to</span><select value={rules.window_days} onChange={e => setRules({ ...rules, window_days: Number(e.target.value) })}>{[14, 30, 60, 90, 120, 180, 270, 365].map(d => <option key={d} value={d}>{d === 365 ? 'a year ahead' : d >= 90 ? `${Math.round(d / 30)} months ahead` : `${d} days ahead`}</option>)}</select></label>
    </div>
    <div className="admin-actions"><button className="button" disabled={busy || !rulesDirty} onClick={() => run(() => onSaveRules(rules), 'Booking rules saved.')}>Save booking rules</button></div>

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

// Plan a specific week (as far ahead as she likes). Saved days override her usual week for those dates only.
const mondayOf = (d: Date) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const iso = (d: Date) => format(d, 'yyyy-MM-dd');
function WeekPlanner({ week, plans, windowDays, busy, run, onSaveDays, onClearDays }: {
  week: WeekHours; plans: DayPlans; windowDays: number; busy: boolean;
  run: (work: () => Promise<void>, done: string) => Promise<void>;
  onSaveDays: (days: DayPlan[]) => Promise<void>; onClearDays: (from: string, to: string) => Promise<void>;
}) {
  const thisMonday = mondayOf(new Date());
  const [start, setStart] = useState(thisMonday);
  const [repeat, setRepeat] = useState(4);
  const dates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const saved = dates.map(d => { const date = iso(d), h = hoursForDate(date, week, plans); return { date, open: h.open, close: h.close, planned: h.planned }; });
  const savedKey = JSON.stringify(saved);
  const [draft, setDraft] = useState(saved);
  useEffect(() => { setDraft(JSON.parse(savedKey)); }, [savedKey]);
  const strip = (rows: typeof saved) => JSON.stringify(rows.map(({ date, open, close }) => ({ date, open, close })));
  const dirty = strip(draft) !== strip(saved);
  useUnsavedWarning(dirty);
  const today = iso(new Date()), limit = iso(addDays(new Date(), windowDays));
  const future = draft.filter(d => d.date >= today);
  const invalid = draft.some(d => d.open && d.close && d.open >= d.close);
  const months = Array.from({ length: 13 }, (_, i) => startOfMonth(addMonths(new Date(), i)));
  const setDay = (i: number, patch: Partial<(typeof draft)[number]>) => setDraft(draft.map((d, j) => j === i ? { ...d, ...patch } : d));
  function go(next: Date) { if (dirty && !confirm('You have unsaved changes to this week. Leave without saving?')) return; setStart(next); }
  const saveWeek = () => run(() => onSaveDays(future.map(({ date, open, close }) => ({ date, open, close }))), `Saved the week of ${format(start, 'MMMM d')}. Clients can book these times.`);
  const repeatWeek = () => run(() => onSaveDays(Array.from({ length: repeat }, (_, w) => draft.map(({ date, open, close }) => ({ date: iso(addDays(new Date(`${date}T12:00:00`), 7 * (w + 1))), open, close }))).flat()),
    `Copied this week’s hours to the next ${repeat} ${repeat === 1 ? 'week' : 'weeks'}.`);
  return <section className="week-planner" aria-labelledby="planner-heading">
    <h3 id="planner-heading" className="availability-subheading">Plan your weeks</h3>
    <p className="muted">Set the times you’re happy to start appointments for a specific week, as far ahead as you like. Clients see a start time every 30 minutes from your From time to your To time.</p>
    <div className="week-nav">
      <button type="button" className="icon-button" aria-label="Previous week" disabled={start <= thisMonday} onClick={() => go(addDays(start, -7))}><ChevronLeft size={18} /></button>
      <strong aria-live="polite">{format(start, 'MMM d')} – {format(dates[6], 'MMM d, yyyy')}</strong>
      <button type="button" className="icon-button" aria-label="Next week" onClick={() => go(addDays(start, 7))}><ChevronRight size={18} /></button>
    </div>
    <label className="editor-field week-jump"><span>Jump to</span><select aria-label="Jump to month" value="" onChange={e => { if (e.target.value) go(mondayOf(new Date(`${e.target.value}-01T12:00:00`))); }}>
      <option value="">Choose a month…</option>{months.map(m => <option key={iso(m)} value={format(m, 'yyyy-MM')}>{format(m, 'MMMM yyyy')}</option>)}
    </select></label>
    <div className="hours-grid" role="group" aria-label={`Hours for the week of ${format(start, 'MMMM d')}`}>
      {draft.map((d, i) => {
        const past = d.date < today, open = d.open !== null, label = format(dates[i], 'EEE, MMM d');
        return <div key={d.date} className={`hours-row ${open ? '' : 'is-closed'} ${past ? 'is-past' : ''}`}>
          <label className="hours-day"><input type="checkbox" checked={open} disabled={past} onChange={e => setDay(i, e.target.checked ? { open: '10:00', close: '17:00' } : { open: null, close: null })} aria-label={`Open on ${label}`} /><span>{label}</span>{!past && <small className={`day-source ${d.planned ? 'is-planned' : ''}`}>{d.planned ? 'this week' : 'usual'}</small>}</label>
          {past ? <span className="hours-closed">Past</span> : open ? <div className="hours-times">
            <label><span>From</span><input type="time" step={1800} value={d.open ?? ''} onChange={e => setDay(i, { open: e.target.value })} aria-label={`${label} from`} /></label>
            <label><span>To</span><input type="time" step={1800} value={d.close ?? ''} onChange={e => setDay(i, { close: e.target.value })} aria-label={`${label} to`} /></label>
          </div> : <span className="hours-closed">Not available</span>}
        </div>;
      })}
    </div>
    {invalid && <p className="field-error">The end time must be after the start time.</p>}
    {dates[0] > new Date(`${limit}T12:00:00`) && <p className="notice">Clients can only book up to {windowDays} days ahead, so they can’t see this week yet. Change <strong>Clients can book up to</strong> in Booking rules below.</p>}
    <div className="admin-actions">
      <button className="button" disabled={busy || invalid || !future.length} onClick={saveWeek}>Save this week</button>
      <label className="repeat-weeks"><span>Repeat for the next</span><select value={repeat} onChange={e => setRepeat(Number(e.target.value))} aria-label="Number of weeks to repeat">{[1, 2, 3, 4, 6, 8, 12].map(n => <option key={n} value={n}>{n} {n === 1 ? 'week' : 'weeks'}</option>)}</select></label>
      <button className="button button-outline" disabled={busy || invalid} onClick={repeatWeek}>Repeat</button>
      {saved.some(d => d.planned) && <button className="button button-outline" disabled={busy} onClick={() => run(() => onClearDays(iso(start), iso(dates[6])), 'This week now uses your usual hours.')}>Use my usual week</button>}
    </div>
    {dirty && <div className="unsaved-bar"><span>Unsaved changes</span><button className="button button-small" disabled={busy || invalid} onClick={saveWeek}>Save this week</button></div>}
  </section>;
}
