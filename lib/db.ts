import { isDemo } from './demo';
import { bookingConfigurationIssues } from './launch-readiness';
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { seedCatalog } from './seed';
import { depositCents, depositSummary } from './business';
import type { BusinessSettings, Catalog } from './types';
export const hasDatabase=()=>!isDemo && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
// Services live in the original `styles` table and extras in `addons` (migration 003; row mapping in seed.ts).
export function db(){if(!hasDatabase()) throw new Error('Database is not configured.');return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function getCatalog():Promise<Catalog>{
 if(!hasDatabase()) return seedCatalog;
 const client=db(); const [styles,addons]=await Promise.all([client.from('styles').select('*').eq('active',true).order('sort_order'),client.from('addons').select('*').eq('active',true).order('sort_order')]);
 if(styles.error) throw styles.error; if(addons.error) throw addons.error;
 return {
  services:(styles.data??[]).map(r=>({id:r.id,slug:r.slug,category:r.category,name:r.name,description:r.description,hair:r.bundles_needed,price_cents:r.base_price_cents,duration_min:r.base_duration_min,duration_max_min:r.base_duration_max_min??null,active:r.active,sort_order:r.sort_order})),
  extras:(addons.data??[]).map(r=>({id:r.id,slug:r.slug,group:r.extra_group,name:r.name,description:r.description??'',price_cents:r.price_cents,price_max_cents:r.price_max_cents,price_plus:r.price_plus,duration_min:r.duration_min,bookable:r.bookable,active:r.active,sort_order:r.sort_order})),
  placeholder:!(await getSettings()).prices_confirmed,
 };
}
export async function getSettings():Promise<BusinessSettings>{
 if(!hasDatabase()) return {timezone:'America/Toronto',buffer_min:30,minimum_notice_hours:24,window_days:60,deposit_instructions:depositSummary,deposit_cents:depositCents,prices_confirmed:true,hours_confirmed:false,policies_confirmed:true};
 const {data,error}=await db().from('business_settings').select('*').eq('id',1).single();if(error)throw error; return data;
}
export async function bookingReady(){ if(!hasDatabase()) return false; return bookingConfigurationIssues(await getSettings(), process.env).length===0; }
