'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Password sign-in, plus "Forgot your password?" which emails a link that works on any device
// and opens Your sign-in so she can choose a new password.
export function LoginForm(){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[forgot,setForgot]=useState(false),router=useRouter();
 async function send(action:'login'|'reset'){setBusy(true);setMessage('');try{const res=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,email,password})});const data=await res.json();if(!res.ok)throw new Error(data.error);if(action==='reset')setMessage('If that is your sign-in email, a link is on its way. Open it on any device (check spam too). It works once and expires in an hour.');else{router.push('/admin');router.refresh();}}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 if(forgot)return <form onSubmit={e=>{e.preventDefault();send('reset');}}>
  <p className="muted">Enter your sign-in email. We’ll send a link that signs you in and lets you choose a new password.</p>
  <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required/></label>
  <button className="button" disabled={busy||!email}>{busy?'One moment…':'Email me a link'}</button>
  <button className="button button-outline" type="button" disabled={busy} onClick={()=>{setForgot(false);setMessage('');}}>Back to sign in</button>
  {message&&<p className="status-message" role="status">{message}</p>}
 </form>;
 return <form onSubmit={e=>{e.preventDefault();send('login');}}>
  <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required/></label>
  <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></label>
  <button className="button" disabled={busy}>{busy?'One moment…':'Sign in ↗'}</button>
  <button className="button button-outline" type="button" disabled={busy} onClick={()=>{setForgot(true);setMessage('');}}>Forgot your password?</button>
  {message&&<p className="status-message" role="status">{message}</p>}
 </form>;
}
export function SignOut(){const router=useRouter();return <button className="text-link" style={{background:'transparent',borderTop:0,borderLeft:0,borderRight:0}} onClick={async()=>{await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});router.push('/login');router.refresh();}}>Sign out</button>;}
