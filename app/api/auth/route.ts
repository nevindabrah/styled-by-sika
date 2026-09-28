import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authClient, authConfigured, isAdmin } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
export async function POST(request:Request){
 if(!authConfigured())return NextResponse.json({error:'Sign-in is temporarily unavailable.'},{status:503});
 try{const parsed=z.object({action:z.enum(['login','reset','logout','password']),email:z.email().optional(),password:z.string().max(200).optional()}).safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:'Please check your details.'},{status:400});
 const client=await authClient(),{action,email,password}=parsed.data;
 if(action==='logout'){await client.auth.signOut();return NextResponse.json({ok:true});}
 // Signed-in braider choosing or changing her own password.
 if(action==='password'){
  if(!await isAdmin())return NextResponse.json({error:'Please sign in again.'},{status:401});
  if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Request not allowed.'},{status:403});
  if(!password||password.length<10)return NextResponse.json({error:'Use at least 10 characters.'},{status:400});
  const {error}=await client.auth.updateUser({password});
  if(error)return NextResponse.json({error:error.message.includes('different')?'Choose a password you have not used before.':'Could not save the password. Please try again.'},{status:400});
  return NextResponse.json({ok:true});
 }
 if(!email)return NextResponse.json({error:'Enter your email address.'},{status:400});
 if(!await rateLimit(request,`auth-${action}`,action==='reset'?5:10))return NextResponse.json({error:'Too many attempts. Please wait an hour and try again.'},{status:429});
 // Never reveal whether an address is the braider's: resets always look successful.
 if(email.toLowerCase()!==process.env.ADMIN_EMAIL!.toLowerCase())return NextResponse.json(action==='reset'?{ok:true}:{error:'Email or password not recognised.'},{status:action==='reset'?200:401});
 // The reset email's link goes to /auth/confirm (see docs/GOING-LIVE.md, email template), which works on any device.
 const {error}=action==='reset'?await client.auth.resetPasswordForEmail(email,{redirectTo:`${process.env.NEXT_PUBLIC_SITE_URL}/admin/settings`}):await client.auth.signInWithPassword({email,password:password??''});
 if(error)return NextResponse.json({error:action==='reset'?'Unable to send the email right now. Try again in a few minutes.':'Email or password not recognised.'},{status:action==='reset'?503:401});
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Sign in is temporarily unavailable.'},{status:503});}
}
