import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { SignOut } from '@/components/login-form';
export const metadata={title:'Your appointments',robots:{index:false,follow:false}};export const dynamic='force-dynamic';
export default async function AdminLayout({children}:{children:React.ReactNode}){await requireAdmin();return <><header className="admin-header"><Link href="/admin" className="wordmark">styled<span>by Sika</span></Link><nav className="admin-nav" aria-label="Your business"><Link href="/admin">Today</Link><Link href="/admin/bookings">Bookings</Link><Link href="/admin/clients">Clients</Link><Link href="/admin/content">Website</Link><Link href="/admin/settings">Availability</Link><SignOut/></nav></header><main id="main" className="admin-main">{children}</main></>;}
