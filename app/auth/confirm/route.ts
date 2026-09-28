import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authClient, authConfigured } from '@/lib/auth';
// One-time sign-in links made by `npm run admin:create` (and Supabase email templates) land here: the token is verified on the server and the session cookie set.
export async function GET(request:Request){
 const url=new URL(request.url),token_hash=url.searchParams.get('token_hash'),type=z.enum(['magiclink','email','recovery','invite','signup']).safeParse(url.searchParams.get('type'));
 if(token_hash&&type.success&&authConfigured()){const {error}=await (await authClient()).auth.verifyOtp({token_hash,type:type.data});if(!error)return NextResponse.redirect(new URL(type.data==='recovery'||type.data==='magiclink'||type.data==='invite'?'/admin/settings#password-heading':'/admin',request.url));}
 return NextResponse.redirect(new URL('/login?error=link',request.url));
}
