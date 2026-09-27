import Link from 'next/link';
import { ArrowUpRight, Instagram } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';
import { contact } from '@/lib/business';

// Everything is on the landing page, so navigation is a short list of section links.
export const sectionLinks = [
  ['/#services', 'Services & prices'],
  ['/#before-you-book', 'Before you book'],
  ['/#contact', 'Contact'],
] as const;

export function Header() {
  return (
    <>
      <div className="announcement">
        <span className="announcement-place">STYLED BY SIKA · VAUGHAN, ONTARIO</span>
        <a className="announcement-ig" href={contact.instagramDmUrl} target="_blank" rel="noreferrer"><Instagram size={13} aria-hidden="true" /> DM {contact.instagramHandle}</a>
      </div>
      <header className="header">
        <Link href="/" className="wordmark" aria-label="Styled by Sika home">
          styled<span>by Sika</span>
        </Link>
        <nav className="section-nav" aria-label="Main navigation">
          {sectionLinks.map(([href, label]) => <Link key={href} href={href} className="nav-link">{label}</Link>)}
        </nav>
        <a className="icon-button header-ig" href={contact.instagramDmUrl} target="_blank" rel="noreferrer" aria-label={`Message ${contact.instagramHandle} on Instagram`} title={`Message ${contact.instagramHandle} on Instagram`}><Instagram size={19} aria-hidden="true" /></a>
        <ThemeToggle />
        <Link className="button button-small nav-book" href="/book" data-book-cta>
          Book now <ArrowUpRight size={16} />
        </Link>
      </header>
    </>
  );
}
