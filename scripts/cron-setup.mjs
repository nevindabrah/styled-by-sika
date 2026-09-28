// Schedules the reminder/retry run inside Supabase: every 10 minutes it calls GET <site>/api/jobs.
// Usage: npm run cron:setup -- https://styled-by-sika.vercel.app   (needs DATABASE_URL and CRON_SECRET in .env.local)
import nextEnv from '@next/env';
import pg from 'pg';
nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const site = (process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
const { DATABASE_URL: url, CRON_SECRET: secret } = process.env;
if (!/^https:\/\//.test(site)) { console.error('Pass the live https address: npm run cron:setup -- https://your-site'); process.exit(1); }
if (!url || !secret) { console.error('DATABASE_URL and CRON_SECRET must be set in .env.local.'); process.exit(1); }
if (!/^[\w-]+$/.test(secret)) { console.error('CRON_SECRET may only contain letters, digits, - and _.'); process.exit(1); }
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query('create extension if not exists pg_cron');
  await client.query('create extension if not exists pg_net');
  await client.query("select cron.unschedule(jobid) from cron.job where jobname = 'styled-by-sika-jobs'");
  const command = `select net.http_get(url := '${site}/api/jobs', headers := '{"Authorization": "Bearer ${secret}"}'::jsonb, timeout_milliseconds := 30000)`;
  await client.query("select cron.schedule('styled-by-sika-jobs', '*/10 * * * *', $1)", [command]);
  const { rows } = await client.query("select schedule, active from cron.job where jobname = 'styled-by-sika-jobs'");
  console.log(`Scheduled: every 10 minutes (${rows[0].schedule}), active: ${rows[0].active}, calling ${site}/api/jobs.`);
} catch (error) { console.error(error.message); process.exitCode = 1; } finally { await client.end(); }
