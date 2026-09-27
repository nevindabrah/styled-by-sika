import Link from 'next/link';
import { isDemo } from '@/lib/demo';
export function DemoBanner() { return isDemo ? <aside className="demo-banner" aria-label="Demo mode"><span><strong>Demo mode</strong> · Sample appointment times. No real bookings, payments, or emails.</span><Link href="/demo/admin">Preview braider dashboard ↗</Link></aside> : null; }
