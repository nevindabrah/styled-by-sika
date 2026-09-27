import { braiderProfile } from '@/lib/braider-profile';
import { contact } from '@/lib/business';
import Link from 'next/link';
import { Instagram } from 'lucide-react';
import { sectionLinks } from './header';
export function Footer(){return <footer className="footer"><div className="footer-top"><div><Link href="/" className="wordmark">styled<span>by Sika</span></Link><p>Braids by {braiderProfile.name}.</p><span className="muted">Vaughan, Ontario · By appointment</span></div><div className="footer-links">{sectionLinks.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}</div><div className="footer-links"><a href={contact.instagramUrl} target="_blank" rel="noreferrer"><Instagram size={15} aria-hidden="true"/> {contact.instagramHandle} ↗</a><a href={`mailto:${contact.email}`}>{contact.email}</a><Link href="/admin">Braider sign in</Link></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Styled by Sika. All rights reserved.</span><span>VAUGHAN, ONTARIO</span></div></footer>;}
