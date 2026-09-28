import Link from 'next/link';
import { braiderFirstName } from '@/lib/braider-profile';
export const metadata={title:'Sign in',robots:{index:false,follow:false}};
// One-time sign-in and reset links land here. Opening the link does nothing by itself: chat apps and email
// scanners open links to build previews, which would use up the token. Only tapping the button signs her in.
export default async function Confirm({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const p=await searchParams,token=typeof p.token_hash==='string'?p.token_hash:'',type=typeof p.type==='string'?p.type:'magiclink',reset=type==='recovery';
 return <main id="main" className="login-wrap"><Link className="wordmark" href="/">styled<span>by Sika</span></Link>
  <h1 className="small-heading">{reset?'Reset your password':`Welcome, ${braiderFirstName} 🤎`}</h1>
  <p className="muted">Tap the button to open your dashboard. You’ll then choose {reset?'a new':'your'} password under <strong>Your sign-in</strong>.</p>
  {token?<form method="post" action="/api/auth/confirm"><input type="hidden" name="token_hash" value={token}/><input type="hidden" name="type" value={type}/><button className="button full-width">Continue to my dashboard</button></form>
   :<p className="notice">This link is incomplete. On the sign-in page, tap “Forgot your password?” to get a new one.</p>}
  <p className="fine-print">The link works once and expires after about an hour.</p>
 </main>;
}
