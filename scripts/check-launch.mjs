import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { bookingConfigurationIssues, optionalEnvironmentKeys } from '../lib/launch-readiness.ts';
nextEnv.loadEnvConfig(process.cwd());
const env=process.env;
let settings=null;
const issues=[];
if(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
 try {
  const db=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.from('business_settings').select('*').eq('id',1).single();
  if(error) issues.push('Cannot read business settings. Apply schema, migrations and seed.'); else settings=data;
  for(const table of ['styles','addons','categories','style_photos','site_content','time_off','working_hours','bookings','booking_jobs']) {
   const {count,error}=await db.from(table).select('*',{count:'exact',head:true});
   if(error) issues.push(`Cannot access ${table}.`);
   else if(['styles','addons'].includes(table)&&!count) issues.push(`${table} is empty.`);
  }
  const {data:hours,error:hoursError}=await db.from('working_hours').select('*');
  if(hoursError||hours?.length!==7||!hours.some(h=>h.open_time&&h.close_time)) issues.push('Configure all seven weekdays, with at least one working day.');
  if(env.NEXT_PUBLIC_SUPABASE_ANON_KEY){
   const anon=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
   const {error}=await anon.from('bookings').select('id').limit(1);
   // Schema explicitly revokes SELECT, so an empty successful response is not enough.
   if(!error || error.code!=='42501') issues.push('Verify anonymous booking access is denied by database grants.');
  }
 }catch {issues.push('Supabase connection failed. Check the URL, credentials and network.');}
}
issues.push(...bookingConfigurationIssues(settings,env));
const skipped=optionalEnvironmentKeys.filter(k=>!env[k]?.trim());
if(skipped.length)console.log('Optional, not configured: '+skipped.join(', ')+' (site works without them).');
if(issues.length){console.error('Launch configuration needs attention:\n'+[...new Set(issues)].map(s=>`- ${s}`).join('\n'));process.exitCode=1;}
else console.log('Database and configuration checks passed. Verify real calendar/email delivery and payment handling before opening bookings.');
console.log('Stripe Checkout is not integrated; this version uses manual payment instructions.');
