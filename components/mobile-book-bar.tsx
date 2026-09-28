'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

// Phone and tablet only: appears once the top Book buttons scroll away and stays put (it doesn't react to
// the per-service Book buttons, so it never flickers while browsing the menu).
export function MobileBookBar({ note }: { note: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
      setShow(visible.size === 0);
    });
    document.querySelectorAll('[data-book-cta="main"]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return <div className={`mobile-book-bar ${show ? 'is-visible' : ''}`} aria-hidden={!show}>
    <span>{note}</span>
    <Link className="button button-small" href="/book" tabIndex={show ? undefined : -1}>Book now <ArrowUpRight size={16} /></Link>
  </div>;
}
