import type { Catalog, Extra, Service } from './types';
import { menuExtras, menuServices } from './menu';
// Stable ids let bookings and the database seed refer to the same services. Groups 1–4 were the retired starter catalog.
const id = (group: number, index: number) => `00000000-0000-4000-8000-${String(group * 100 + index).padStart(12, '0')}`;
export const seedCatalog: Catalog = {
 placeholder: false,
 services: menuServices.map(([slug,category,name,minutes,dollars,description,hair],i)=>({id:id(5,i),slug,category,name,description,hair,price_cents:dollars*100,duration_min:Array.isArray(minutes)?minutes[0]:minutes,duration_max_min:Array.isArray(minutes)?minutes[1]:null,active:true,sort_order:i})),
 extras: menuExtras.map((e,i)=>({id:id(6,i),slug:e.slug,group:e.group,name:e.name,description:e.description,price_cents:e.dollars*100,price_max_cents:e.maxDollars?e.maxDollars*100:null,price_plus:!!e.plus,duration_min:0,bookable:e.bookable??true,active:true,sort_order:i})),
};
// Database rows for the `styles` and `addons` tables (see supabase/migrations/003_service_menu.sql).
export const serviceRow=(s:Service)=>({id:s.id,slug:s.slug,category:s.category,name:s.name,description:s.description,bundles_needed:s.hair,base_price_cents:s.price_cents,base_duration_min:s.duration_min,base_duration_max_min:s.duration_max_min,featured:false,active:s.active,sort_order:s.sort_order,image_url:''});
export const extraRow=(e:Extra)=>({id:e.id,slug:e.slug,extra_group:e.group,name:e.name,description:e.description,price_cents:e.price_cents,price_max_cents:e.price_max_cents,price_plus:e.price_plus,duration_min:e.duration_min,bookable:e.bookable,active:e.active,sort_order:e.sort_order});
