import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authClient, authConfigured } from '@/lib/auth';
// Uses the one-time token only when she taps "Continue" on /auth/confirm (a POST), never when a link preview opens it.
export async function POST(request:Request){
 const form=await request.formData().catch(()=>null);
 const token_hash=String(form?.get('token_hash')??''),type=z.enum(['magiclink','email','recovery','invite','signup']).safeParse(form?.get('type'));
 if(token_hash&&type.success&&authConfigured()){const {error}=await (await authClient()).auth.verifyOtp({token_hash,type:type.data});if(!error)return NextResponse.redirect(new URL(type.data==='signup'?'/admin':'/admin/settings#password-heading',request.url),303);}
 return NextResponse.redirect(new URL('/login?error=link',request.url),303);
}
