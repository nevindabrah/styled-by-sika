// Creates (or updates) the braider's sign-in. Usage: npm run admin:create -- sika@example.com ["a password"]
// Without a password she signs in with a one-time link (printed below) and chooses her own password in the dashboard.
// The email must match ADMIN_EMAIL in .env.local; only that account can open /admin.
import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
nextEnv.loadEnvConfig(process.cwd());
const [email, password] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local first.'); process.exit(1); }
if (!email || (password && password.length < 10)) { console.error('Usage: npm run admin:create -- <email> [password of at least 10 characters]'); process.exit(1); }
if (process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.toLowerCase() !== email.toLowerCase()) console.warn(`Warning: ADMIN_EMAIL in .env.local is ${process.env.ADMIN_EMAIL}; only that address can sign in.`);
const auth = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).auth.admin;
const { data: existing } = await auth.listUsers({ perPage: 1000 });
const user = existing?.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
const result = user ? await auth.updateUserById(user.id, { ...(password ? { password } : {}), email_confirm: true }) : await auth.createUser({ email, ...(password ? { password } : {}), email_confirm: true });
if (result.error) { console.error(result.error.message); process.exit(1); }
console.log(`${user ? 'Updated' : 'Created'} sign-in for ${email}.`);
if (!password) {
 const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
 const { data, error } = await auth.generateLink({ type: 'magiclink', email, options: { redirectTo: `${site}/auth/callback` } });
 if (error) { console.error(`Could not make a sign-in link: ${error.message}`); process.exit(1); }
 console.log(`One-time sign-in link (expires in about an hour, works once):\n${data.properties.action_link}\nAfter signing in she sets her password under Availability → Your sign-in.`);
}
