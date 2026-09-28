'use client';
import { useEffect } from 'react';
// Fades sections gently into view as they scroll in (opacity and position only, so nothing shifts layout).
// Skipped entirely when the visitor prefers reduced motion; content is visible without JavaScript.
export function useReveal(selector: string) {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const targets = [...document.querySelectorAll<HTMLElement>(selector)].filter(el => el.getBoundingClientRect().top > innerHeight * 0.9);
    targets.forEach((el, i) => { el.classList.add('reveal'); el.style.setProperty('--reveal-delay', `${(i % 5) * 60}ms`); });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [selector]);
}
