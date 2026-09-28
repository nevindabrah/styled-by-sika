// Applies supabase/schema.sql (once) and every file in supabase/migrations/ in order, remembering what ran.
// Usage: npm run db:migrate   (needs DATABASE_URL in .env.local — Supabase → Project Settings → Database → Connection string, URI)
import nextEnv from '@next/env';
import { readdirSync, readFileSync } from 'node:fs';
import pg from 'pg';
nextEnv.loadEnvConfig(process.cwd());
const url = process.env.DATABASE_URL;
if (!url) { console.error('Add DATABASE_URL to .env.local first (Supabase → Project Settings → Database → Connection string → URI, with your database password).'); process.exit(1); }
const client = new pg.Client({ connectionString: url, ssl: url.includes('localhost') ? undefined : { rejectUnauthorized: false } });
await client.connect();
try {
 await client.query('create table if not exists public.schema_migrations(name text primary key, applied_at timestamptz default now())');
 const done = new Set((await client.query('select name from public.schema_migrations')).rows.map(r => r.name));
 const files = ['schema.sql', ...readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).sort().map(f => `migrations/${f}`)];
 for (const file of files) {
  if (done.has(file)) { console.log(`✓ ${file} (already applied)`); continue; }
  if (file === 'schema.sql') {
   const { rows } = await client.query("select 1 from information_schema.tables where table_schema='public' and table_name='bookings'");
   if (rows.length) { console.log('✓ schema.sql (tables already exist, recorded as applied)'); await client.query('insert into public.schema_migrations(name) values($1)', [file]); continue; }
  }
  const sql = readFileSync(`supabase/${file}`, 'utf8');
  await client.query('begin');
  try { await client.query(sql.replace(/^\s*begin;|commit;\s*$/gim, '')); await client.query('insert into public.schema_migrations(name) values($1)', [file]); await client.query('commit'); console.log(`→ ${file} applied`); }
  catch (error) { await client.query('rollback'); throw new Error(`${file}: ${error.message}`); }
 }
 console.log('Database is up to date. Next: npm run db:seed');
} catch (error) { console.error(error.message); process.exitCode = 1; } finally { await client.end(); }
