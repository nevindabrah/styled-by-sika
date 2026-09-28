'use client';
import { braiderFirstName } from '@/lib/braider-profile';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { readDemoBookings, saveDemoBookings, sampleBookings, readDemoAvailability, saveDemoAvailability, sampleAvailability, demoTimezone, demoBuffer, type DemoAvailability } from '@/lib/demo';
import { AvailabilityEditor } from './availability-editor';
import { ContentEditor } from './content-editor';
import { applyContentOp, defaultContent, type ContentOp, type SiteContent } from '@/lib/content';
import { readDemoContent, saveDemoContent, clearDemoContent } from '@/lib/demo';
import { durationLabel, money, priceLabel } from '@/lib/pricing';
import type { Booking } from '@/lib/types';

const labels = { pending_deposit: 'Awaiting deposit', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' };
export function DemoDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('Today');
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Upcoming');
  const [note, setNote] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [availability, setAvailability] = useState<DemoAvailability>(sampleAvailability);
  const [content, setContent] = useState<SiteContent>(defaultContent);
  useEffect(() => { setBookings(readDemoBookings()); setAvailability(readDemoAvailability()); setContent(readDemoContent(defaultContent())); setLoaded(true); }, []);
  async function applyContent(op: ContentOp) { const result = applyContentOp(content, op, () => crypto.randomUUID()); saveDemoContent(result.content); setContent(result.content); return result.message; }
  function persistAvailability(next: DemoAvailability) { saveDemoAvailability(next); setAvailability(next); }
  const booking = bookings.find(b => b.id === selected);
  const now = Date.now(), today = formatInTimeZone(now, 'America/Toronto', 'yyyy-MM-dd'), month = today.slice(0, 7);
  const monthly = bookings.filter(b => formatInTimeZone(b.start_at, 'America/Toronto', 'yyyy-MM') === month);
  function persist(next: Booking[]) { saveDemoBookings(next); setBookings(next); }
  function open(b: Booking) { setSelected(b.id); setNote(b.admin_notes); setCancelOpen(false); setMessage(''); setReason(''); }
  function update(status?: Booking['status']) {
    persist(bookings.map(b => b.id === selected ? { ...b, ...(status ? { status } : { admin_notes: note }) } : b));
    setCancelOpen(false);
    setMessage(status ? `Demo updated: ${labels[status]}. No calendar changes or emails were made.` : 'Private note saved in this demo.');
  }
  function rows(items: Booking[]) {
    return items.length ? [...items].sort((a,b) => a.start_at.localeCompare(b.start_at)).map(b => <button key={b.id} className="booking-row demo-booking-row" onClick={() => open(b)}>
      <div><strong>{b.client_name}</strong><p>{b.snapshot.style}</p><p>{formatInTimeZone(b.start_at, 'America/Toronto', 'EEE, MMM d · h:mm a')}</p></div>
      <div><span className={`badge ${b.status}`}>{labels[b.status]}</span><p>{b.snapshot.estimate}</p></div>
    </button>) : <p className="empty-state">No appointments in this view.</p>;
  }
  return <>
    <header className="admin-header"><Link href="/" className="wordmark">styled<span>by Sika</span></Link><nav className="admin-nav" aria-label="Demo dashboard">{['Today','Bookings','Clients','Website','Availability'].map(t => <button key={t} className={`chip ${tab === t ? 'selected' : ''}`} aria-pressed={tab === t} onClick={() => { setTab(t); setSelected(null); }}>{t}</button>)}<Link className="text-link" href="/">Back to website</Link></nav></header>
    <aside className="demo-banner"><span><strong>Demo dashboard</strong> · Sample appointments, saved only in this browser tab.</span><Link href="/book">Try the booking flow ↗</Link></aside>
    <main id="main" className="admin-main">
      {!loaded ? <p role="status">Loading sample appointments…</p> : booking ? <>
        <button className="button button-outline" onClick={() => setSelected(null)}>← All appointments</button>
        <div className="eyebrow" style={{marginTop:30}}>{booking.reference}</div><h1 className="page-title">{booking.client_name}</h1><span className={`badge ${booking.status}`}>{labels[booking.status]}</span>
        <h2 className="small-heading">Special requests</h2><p className="notice">{booking.client_notes || 'No special requests.'}</p>
        <dl className="review-list"><dt>When</dt><dd>{formatInTimeZone(booking.start_at,'America/Toronto','EEEE, MMMM d · h:mm a zzz')}</dd><dt>Service</dt><dd>{booking.snapshot.style}</dd><dt>Extras</dt><dd>{booking.snapshot.addons.join(', ') || 'None'}</dd><dt>Duration</dt><dd>{durationLabel(booking.duration_min)}</dd><dt>Phone</dt><dd>{booking.client_phone}</dd><dt>Email</dt><dd>{booking.client_email}</dd><dt>Instagram</dt><dd>{booking.client_instagram || 'Not provided'}</dd><dt>Price</dt><dd>{booking.snapshot.breakdown.map((item,i) => <div key={i}>{item.label}: {priceLabel(item)}</div>)}<strong>Total: {booking.snapshot.estimate}</strong></dd></dl>
        <div className="admin-actions">
          {booking.status === 'pending_deposit' && <button className="button" onClick={() => update('confirmed')}>Mark deposit paid</button>}
          {booking.status === 'confirmed' && <button className="button" onClick={() => update('completed')}>Mark completed</button>}
          {['pending_deposit','confirmed'].includes(booking.status) && <><button className="button button-outline" onClick={() => update('no_show')}>Mark no-show</button><button className="button button-outline" onClick={() => setCancelOpen(true)}>Cancel appointment</button></>}
        </div>
        {cancelOpen && <section className="notice"><h2 className="small-heading">Cancel this demo appointment?</h2><label htmlFor="cancel-reason">Reason (optional)</label><textarea id="cancel-reason" value={reason} onChange={e => setReason(e.target.value)} maxLength={500}/><p>No real client will be emailed.</p><div className="admin-actions"><button className="button" onClick={() => update('cancelled')}>Yes, cancel appointment</button><button className="button button-outline" onClick={() => setCancelOpen(false)}>Keep appointment</button></div></section>}
        <h2 className="small-heading">Private note</h2><label className="field-label" htmlFor="demo-note">Only visible in the dashboard</label><textarea id="demo-note" value={note} onChange={e => setNote(e.target.value)} maxLength={3000}/><button className="button button-outline" style={{marginTop:12}} onClick={() => update()}>Save private note</button>
        {message && <p className="status-message" role="status">{message}</p>}
      </> : <>
        <div className="eyebrow">STYLED BY SIKA · DEMO</div><h1 className="page-title">{tab === 'Today' ? <>Hi, <em>{braiderFirstName}.</em></> : tab === 'Website' ? <>Edit your <em>website.</em></> : tab}</h1>
        {tab === 'Today' && <>
          <div className="stat-grid"><div className="stat"><strong>{bookings.filter(b => b.status === 'pending_deposit').length}</strong><span>Awaiting deposit</span></div><div className="stat"><strong>{monthly.filter(b=>b.status!=='cancelled').length}</strong><span>Bookings this month</span></div><div className="stat"><strong>{money(monthly.filter(b=>['confirmed','completed'].includes(b.status)).reduce((n,b)=>n+b.price_cents,0))}</strong><span>Confirmed & completed</span></div></div>
          <h2 className="small-heading">Today</h2>{rows(bookings.filter(b => formatInTimeZone(b.start_at,'America/Toronto','yyyy-MM-dd') === today && b.status !== 'cancelled'))}
          <h2 className="small-heading">The next seven days</h2>{rows(bookings.filter(b => new Date(b.start_at).getTime() > now && new Date(b.start_at).getTime() < now + 7*86400000 && b.status !== 'cancelled'))}
        </>}
        {tab === 'Bookings' && <><div className="chips">{['Upcoming','Awaiting deposit','Past','Cancelled'].map(f => <button key={f} className={`chip ${filter===f?'selected':''}`} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f}{f==='Awaiting deposit'?` (${bookings.filter(b=>b.status==='pending_deposit').length})`:''}</button>)}</div><label className="field-label" htmlFor="demo-search" style={{marginTop:20}}>Find a client</label><input id="demo-search" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or phone"/>{rows(bookings.filter(b=>filter==='Cancelled'?b.status==='cancelled':filter==='Awaiting deposit'?b.status==='pending_deposit':filter==='Past'?new Date(b.start_at).getTime()<now&&b.status!=='cancelled':new Date(b.start_at).getTime()>=now&&b.status!=='cancelled').filter(b=>`${b.client_name} ${b.client_phone}`.toLowerCase().includes(search.toLowerCase())))}</>}
        {tab === 'Clients' && <>{Object.entries(Object.groupBy(bookings,b=>b.client_phone)).map(([phone,items])=>items&&<button className="booking-row demo-booking-row" key={phone} onClick={()=>open(items[0])}><div><strong>{items[0].client_name}</strong><p>{phone}</p></div><div>{items.filter(b=>b.status==='completed').length} completed visits<p>{[...new Set(items.map(b=>b.snapshot.style))].join(', ')}</p></div></button>)}</>}
        {tab === 'Website' && <ContentEditor content={content} onApply={applyContent} />}
        {tab === 'Availability' && <><AvailabilityEditor hours={availability.hours} timeOff={availability.timeOff} timezone={demoTimezone} rules={availability.rules}
          onSaveRules={async rules => persistAvailability({ ...availability, rules })}
          onSaveHours={async hours => persistAvailability({ ...availability, hours })}
          onAddTimeOff={async block => persistAvailability({ ...availability, timeOff: [...availability.timeOff, { id: crypto.randomUUID(), ...block }].sort((a, b) => a.start_at.localeCompare(b.start_at)) })}
          onRemoveTimeOff={async id => persistAvailability({ ...availability, timeOff: availability.timeOff.filter(t => t.id !== id) })} />
          <h2 className="small-heading">Business details</h2><p className="notice">In this demo, your hours, booking rules and blocked times are saved in this browser tab only.</p><dl className="review-list"><dt>Business</dt><dd>Styled by Sika</dd><dt>Location</dt><dd>Vaughan, Ontario</dd><dt>Timezone</dt><dd>America/Toronto</dd><dt>Deposit</dt><dd>CA$20, non-refundable</dd><dt>Payment</dt><dd>Cash or e-transfer</dd></dl><button className="button button-outline" onClick={()=>{persist(sampleBookings());persistAvailability(sampleAvailability());clearDemoContent();setContent(defaultContent());setMessage('Sample appointments, hours and website edits reset.');}}>Reset demo</button>{message&&<p role="status">{message}</p>}</>}
      </>}
    </main>
  </>;
}
