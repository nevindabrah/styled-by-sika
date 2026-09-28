'use client';
import Link from 'next/link';
import { Instagram } from 'lucide-react';
import { instagramLinks, type SiteContent } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';
import { sectionLinks } from './header';
export function Footer({ content: initial }: { content: SiteContent }){const { text }=useSiteContent(initial),ig=instagramLinks(text.instagramHandle);return <footer className="footer"><div className="footer-top"><div><Link href="/" className="wordmark">styled<span>by Sika</span></Link><p>Braids by {text.name}.</p><span className="muted">{text.location} · By appointment</span></div><div className="footer-links">{sectionLinks.map(([href,label])=><Link key={href} href={href}>{label}</Link>)}</div><div className="footer-links"><a href={ig.profile} target="_blank" rel="noreferrer"><Instagram size={15} aria-hidden="true"/> {text.instagramHandle} ↗</a><a href={`mailto:${text.email}`}>{text.email}</a><Link href="/admin">Braider sign in</Link></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Styled by Sika. All rights reserved.</span><span>{text.location.toUpperCase()}</span></div></footer>;}
