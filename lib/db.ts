import { isDemo } from './demo';
import { bookingConfigurationIssues } from './launch-readiness';
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { extraRow, serviceRow } from './seed';
import { defaultContent, defaultText, publicContent, type Category, type Photo, type SiteContent, type SiteText } from './content';
import type { BusinessSettings, Catalog, Extra, Service } from './types';
export const hasDatabase=()=>!isDemo && Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
// Services live in the original `styles` table and extras in `addons` (migration 003; row mapping in seed.ts).
export function db(){if(!hasDatabase()) throw new Error('Database is not configured.');return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});}
export const serviceFromRow=(r:Record<string,unknown>):Service=>({id:String(r.id),slug:String(r.slug),category:String(r.category),name:String(r.name),description:String(r.description??''),hair:String(r.bundles_needed??''),price_cents:Number(r.base_price_cents),duration_min:Number(r.base_duration_min),duration_max_min:r.base_duration_max_min==null?null:Number(r.base_duration_max_min),active:Boolean(r.active),sort_order:Number(r.sort_order??0)});
export const extraFromRow=(r:Record<string,unknown>):Extra=>({id:String(r.id),slug:String(r.slug),group:String(r.extra_group),name:String(r.name),description:String(r.description??''),price_cents:Number(r.price_cents),price_max_cents:r.price_max_cents==null?null:Number(r.price_max_cents),price_plus:Boolean(r.price_plus),duration_min:Number(r.duration_min??0),bookable:Boolean(r.bookable),active:Boolean(r.active),sort_order:Number(r.sort_order??0)});
export { serviceRow, extraRow };
// The whole editable site. `all` includes hidden items for the dashboard; the public site gets the filtered view.
export async function getContent(all=false):Promise<SiteContent>{
 if(!hasDatabase()) return all?defaultContent():publicContent(defaultContent());
 const client=db();
 const [categories,styles,addons,photos,text,settings]=await Promise.all([
  client.from('categories').select('*').order('sort_order'),client.from('styles').select('*').order('sort_order'),client.from('addons').select('*').order('sort_order'),
  client.from('style_photos').select('*').order('sort_order'),client.from('site_content').select('value').eq('key','text').maybeSingle(),getSettings(),
 ]);
 for(const r of [categories,styles,addons,photos,text]) if(r.error) throw r.error;
 const seed=defaultContent();
 const content:SiteContent={
  categories:(categories.data?.length?categories.data:seed.categories) as Category[],
  services:(styles.data??[]).map(serviceFromRow),
  extras:(addons.data??[]).map(extraFromRow),
  photos:(photos.data??[]) as Photo[],
  text:{...defaultText(),...((text.data?.value as Partial<SiteText>|undefined)??{}),depositCents:settings.deposit_cents??defaultText().depositCents},
  placeholder:!settings.prices_confirmed,
 };
 return all?content:publicContent(content);
}
export async function getCatalog():Promise<Catalog>{const c=await getContent();return {services:c.services,extras:c.extras,placeholder:c.placeholder};}
export async function getSettings():Promise<BusinessSettings>{
 if(!hasDatabase()){const t=defaultText();return {timezone:'America/Toronto',buffer_min:30,minimum_notice_hours:24,window_days:60,deposit_instructions:t.depositSummary,deposit_cents:t.depositCents,prices_confirmed:true,hours_confirmed:false,policies_confirmed:true,booking_open:false};}
 const {data,error}=await db().from('business_settings').select('*').eq('id',1).single();if(error)throw error; return data;
}
export async function bookingReady(){ if(!hasDatabase()) return false; return bookingConfigurationIssues(await getSettings(), process.env).length===0; }
