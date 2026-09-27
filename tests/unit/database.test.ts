import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { extraRow, seedCatalog, serviceRow } from '../../lib/seed';
let db:PGlite;
beforeAll(async()=>{
 db=new PGlite({extensions:{btree_gist}});
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
 await db.exec(readFileSync('supabase/schema.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/002_launch_settings.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/003_service_menu.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/004_duration_ranges.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/005_time_off.sql','utf8'));
 await db.exec(readFileSync('supabase/migrations/006_site_content.sql','utf8'));
 for(const [table,rows] of [['styles',seedCatalog.services.map(serviceRow)],['addons',seedCatalog.extras.map(extraRow)]] as const){
  for(const row of rows){ const keys=Object.keys(row); await db.query(`insert into ${table} (${keys.join(',')}) values (${keys.map((_,i)=>'$'+(i+1)).join(',')})`,Object.values(row)); }
 }
},30000);
afterAll(async()=>{await db?.close();});
const service=seedCatalog.services[0].id;
async function book(reference:string,start:string,end:string){
 return db.query(`insert into bookings(reference,idempotency_key,style_id,start_at,end_at,blocked_until,price_cents,duration_min,client_name,client_phone,client_email,snapshot) values($1,gen_random_uuid(),$2,$3,$4,$4::timestamptz+interval '30 minutes',10000,60,'Test client','4165550100','test@example.com','{}') returning id`,[reference,service,start,end]);
}
describe('booking storage and database permissions',()=>{
 it('stores the full service menu and extras with price ranges',async()=>{
  const services=await db.query<{count:number}>('select count(*)::int as count from styles where active');
  expect(services.rows[0].count).toBe(seedCatalog.services.length);
  const extra=await db.query('select price_cents,price_max_cents,price_plus from addons where slug=$1',['extra-length']);
  expect(extra.rows).toEqual([{price_cents:2000,price_max_cents:5000,price_plus:false}]);
 });
 it('keeps personal data and background jobs inaccessible to browser roles',async()=>{
  for(const role of ['anon','authenticated']){
   await db.exec(`set role ${role}`);
   for(const table of ['bookings','booking_jobs','business_settings','time_off','site_content','style_photos']) await expect(db.query(`select * from ${table}`)).rejects.toMatchObject({code:'42501'});
   await expect(db.query("select * from claim_booking_job(null)")).rejects.toMatchObject({code:'42501'});
   await expect(db.query("update styles set base_price_cents=1")).rejects.toMatchObject({code:'42501'});
   await db.exec('reset role');
  }
 });
 it('stores a booking and creates a durable job, rejects overlapping slots including buffer',async()=>{
  await book('TEST-1','2027-01-10T14:00:00Z','2027-01-10T15:00:00Z');
  const jobs=await db.query('select kind from booking_jobs');
  expect(jobs.rows).toEqual([{kind:'created'}]);
  await expect(book('TEST-2','2027-01-10T15:15:00Z','2027-01-10T16:15:00Z')).rejects.toMatchObject({code:'23P01'});
  await book('TEST-3','2027-01-10T15:30:00Z','2027-01-10T16:30:00Z');
 });
 it('releases cancelled slots and queues the cancellation atomically',async()=>{
  await db.query("select admin_update_booking(id,'cancelled',null,'Client requested') from bookings where reference='TEST-1'");
  await book('TEST-4','2027-01-10T14:00:00Z','2027-01-10T15:00:00Z');
  const jobs=await db.query("select reason from booking_jobs where kind='cancelled'");
  expect(jobs.rows).toEqual([{reason:'Client requested'}]);
 });
});
