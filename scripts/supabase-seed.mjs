import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { extraRow, serviceRow } from '../lib/seed.ts';
import { defaultContent } from '../lib/content.ts';
nextEnv.loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local first.'); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const content = defaultContent();
// Never overwrite what the braider has edited in her dashboard: existing rows are preserved.
const entries = [
 ['categories', content.categories, 'slug'],
 ['styles', content.services.map(serviceRow), 'id'],
 ['addons', content.extras.map(extraRow), 'id'],
 ['style_photos', content.photos.map(p => ({ ...p, id: undefined })), 'url'],
 ['site_content', [{ key: 'text', value: content.text }], 'key'],
 ['business_settings', [{ id: 1, timezone: 'America/Toronto', deposit_cents: content.text.depositCents, deposit_instructions: content.text.depositSummary, prices_confirmed: true, hours_confirmed: false, policies_confirmed: true }], 'id'],
 ['working_hours', Array.from({ length: 7 }, (_, weekday) => ({ weekday, open_time: null, close_time: null })), 'weekday'],
];
try {
 const { error: bucketError } = await db.storage.createBucket('photos', { public: true, fileSizeLimit: '3MB', allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] });
 if (bucketError && !/already exists/i.test(bucketError.message)) throw new Error(`photos bucket: ${bucketError.message}`);
 console.log('Photo storage ready.');
 for (const [table, rows, onConflict] of entries) {
  const { error } = await db.from(table).upsert(rows, { onConflict, ignoreDuplicates: true });
  if (error) throw new Error(`${table}: ${error.message ?? error.code}. Check the schema and migrations were applied.`);
  console.log(`Initialized ${table}; existing rows preserved.`);
 }
 console.log('Website content loaded. Sika can now edit everything from /admin.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
