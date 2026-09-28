import { braiderFirstName } from '@/lib/braider-profile';
import { isDemo } from '@/lib/demo';
import Link from 'next/link';
import { LoginForm } from '@/components/login-form';
import { authConfigured } from '@/lib/auth';
export const metadata={title:'Braider sign in',robots:{index:false,follow:false}};
export default async function Login({searchParams}:{searchParams:Promise<{error?:string}>}){const p=await searchParams;return <main id="main" className="login-wrap"><Link className="wordmark" href="/">styled<span>by Sika</span></Link><h1 className="small-heading">Welcome back, {braiderFirstName}.</h1><p className="muted">Your appointments. All in one place.</p>{!authConfigured()&&<p className="notice">Sign-in is temporarily unavailable.</p>}{p.error&&<p className="notice">That link has expired or was already used. Tap “Forgot your password?” to get a new one.</p>}{isDemo?<Link className="button full-width" href="/demo/admin">Open demo dashboard ↗</Link>:<LoginForm/>}</main>;}
