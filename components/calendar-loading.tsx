'use client';

import { useEffect, useState } from 'react';
import { Spark } from './spark';

// Shown over the calendar while times load: a spinning star and rotating, hair-themed phrases.
const phrases = (name: string) => [
  `Checking ${name}’s calendar`, 'Sectioning the week', 'Detangling the dates', 'Parting the schedule', 'Twisting through time slots',
  'Counting the packs', 'Stretching the hair', 'Laying the edges', 'Finding your braid day', 'Seeing when you can get styled',
];

export function CalendarLoading({ name }: { name: string }) {
  const list = phrases(name);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % list.length), 1400);
    return () => clearInterval(timer);
  }, [list.length]);
  return <div className="calendar-loading" role="status">
    <span className="visually-hidden">Checking the calendar</span>
    <span className="calendar-loading-spark" aria-hidden="true"><Spark weight={1.8} /></span>
    <span key={index} className="calendar-loading-word" aria-hidden="true">{list[index]}…</span>
  </div>;
}
