// Writes .env.vercel: the variables the live site needs, copied from .env.local, ready to paste into
// Vercel → Settings → Environment Variables. Values are never printed. Usage: npm run env:vercel -- https://your-site
import { readFileSync, writeFileSync, chmodSync } from 'node:fs';
const site = process.argv.slice(2).find(a => !a.startsWith('--')) || 'https://styled-by-sika.vercel.app';
if (!/^https:\/\//.test(site)) { console.error('Pass the live https address, e.g. npm run env:vercel -- https://styled-by-sika.vercel.app'); process.exit(1); }
// DATABASE_URL is deliberately left out: only the setup scripts on your computer need it.
const keep = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_EMAIL', 'BRAIDER_EMAIL', 'BUSINESS_TIMEZONE',
  'RESEND_API_KEY', 'FROM_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY', 'GOOGLE_CALENDAR_ID',
  'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'CRON_SECRET', 'MAINTAINER_EMAIL', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM', 'BOOKING_ENABLED'];
// --only KEY,KEY writes just those (for adding new variables without duplicating existing ones).
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const local = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').map(l => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean).map(m => [m[1], m[2]]));
const lines = keep.filter(k => !only.length || only.includes(k)).filter(k => local[k]?.trim() && !(k === 'FROM_EMAIL' && local[k].includes('yourdomain.com'))).map(k => `${k}=${local[k]}`);
if (!only.length) lines.push(`NEXT_PUBLIC_SITE_URL=${site}`, 'NEXT_PUBLIC_DEMO_MODE=false');
writeFileSync('.env.vercel', lines.join('\n') + '\n'); chmodSync('.env.vercel', 0o600);
console.log(`Wrote .env.vercel with ${lines.length} variables: ${lines.map(l => l.split('=')[0]).join(', ')}.\nPaste it into Vercel, redeploy, then delete the file.`);
