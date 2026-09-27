import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { extraRow, seedCatalog, serviceRow } from '../lib/seed.ts';
import { depositCents, depositSummary } from '../lib/business.ts';
nextEnv.loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local first.'); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
// Never overwrite the braider's edited prices, hours, policies, or appointments.
const entries = [
 ['styles', seedCatalog.services.map(serviceRow), 'id'],
 ['addons', seedCatalog.extras.map(extraRow), 'id'],
 ['business_settings', [{id:1,timezone:'America/Toronto',deposit_cents:depositCents,deposit_instructions:depositSummary,prices_confirmed:false,hours_confirmed:false,policies_confirmed:false}], 'id'],
 ['working_hours', Array.from({length:7}, (_,weekday)=>({weekday,open_time:null,close_time:null})), 'weekday'],
];
try {
 for (const [table, rows, onConflict] of entries) {
  const {error} = await db.from(table).upsert(rows, {onConflict, ignoreDuplicates:true});
  if (error) throw new Error(`${table}: ${error.code ?? 'database error'}. Check the schema and migrations were applied.`);
  console.log(`Initialized ${table}; existing rows preserved.`);
 }
 console.log('Service menu loaded. Approve prices, hours and policies in Supabase before enabling bookings.');
} catch(error) { console.error(error.message); process.exitCode=1; }
