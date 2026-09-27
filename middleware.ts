import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function middleware(request:NextRequest){
 let response=NextResponse.next({request});
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||!process.env.ADMIN_EMAIL)return NextResponse.redirect(new URL('/login',request.url));
 const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>request.cookies.getAll(),setAll(cookies){cookies.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user||user.email?.toLowerCase()!==process.env.ADMIN_EMAIL.toLowerCase()){const redirect=NextResponse.redirect(new URL('/login',request.url));response.cookies.getAll().forEach(cookie=>redirect.cookies.set(cookie));return redirect;}
 return response;
}
export const config={matcher:['/admin/:path*']};
