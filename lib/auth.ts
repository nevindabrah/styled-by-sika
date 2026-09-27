import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
export const authConfigured=()=>!!process.env.NEXT_PUBLIC_SUPABASE_URL&&!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY&&!!process.env.ADMIN_EMAIL;
export async function authClient(){const jar=await cookies();return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>jar.getAll(),setAll:(cookies)=>{try{cookies.forEach(({name,value,options})=>jar.set(name,value,options));}catch{/* Cookie refresh is also handled in middleware. */}}}});}
export async function isAdmin(){if(!authConfigured())return false;const {data:{user},error}=await (await authClient()).auth.getUser();return !error&&!!user&&user.email?.toLowerCase()===process.env.ADMIN_EMAIL?.toLowerCase();}
export async function requireAdmin(){if(!await isAdmin())redirect('/login');}
