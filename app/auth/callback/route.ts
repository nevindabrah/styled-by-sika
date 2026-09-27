import { NextResponse } from 'next/server';
import { authClient, authConfigured } from '@/lib/auth';
export async function GET(request:Request){const url=new URL(request.url),code=url.searchParams.get('code');if(code&&authConfigured()){const {error}=await (await authClient()).auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL('/admin',request.url));}return NextResponse.redirect(new URL('/login?error=link',request.url));}
