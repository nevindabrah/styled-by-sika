import type { BusinessSettings } from './types';

// Needed before online booking can be switched on.
export const bookingEnvironmentKeys = [
 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_EMAIL', 'NEXT_PUBLIC_SITE_URL',
] as const;
// Nice to have. Without email or texts, clients see their request on screen and Sika contacts them herself.
export const optionalEnvironmentKeys = [
 'RESEND_API_KEY', 'FROM_EMAIL', 'BRAIDER_EMAIL', 'CRON_SECRET',
 'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY', 'GOOGLE_CALENDAR_ID',
 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'MAINTAINER_EMAIL',
 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM',
] as const;

const allOrNone = (env: Record<string, string | undefined>, keys: string[]) => { const n = keys.filter(k => env[k]?.trim()).length; return n === 0 ? 'none' : n === keys.length ? 'all' : 'some'; };

export function bookingConfigurationIssues(settings: BusinessSettings | null, env: Record<string, string | undefined>): string[] {
 const issues: string[] = [];
 if (env.NEXT_PUBLIC_DEMO_MODE === 'true') issues.push('Demo mode is enabled.');
 for (const name of bookingEnvironmentKeys) if (!env[name]?.trim()) issues.push(`Missing ${name}.`);
 const email = allOrNone(env, ['RESEND_API_KEY', 'FROM_EMAIL']), sms = allOrNone(env, ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM']);
 if (email === 'some') issues.push('Email needs both RESEND_API_KEY and FROM_EMAIL, or neither.');
 if (sms === 'some') issues.push('Text messages need all three TWILIO_* values, or none.');
 // Reminders and retries run from the scheduler, which needs its password once any messages are sent.
 if ((email === 'all' || sms === 'all') && !env.CRON_SECRET?.trim()) issues.push('Missing CRON_SECRET.');
 if (allOrNone(env, ['GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY', 'GOOGLE_CALENDAR_ID']) === 'some') issues.push('Google Calendar needs all three GOOGLE_* values, or none.');
 if (allOrNone(env, ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) === 'some') issues.push('Upstash needs both URL and token, or neither.');
 if (env.NEXT_PUBLIC_SITE_URL) {
  try { const url = new URL(env.NEXT_PUBLIC_SITE_URL); if(url.protocol!=='https:' || ['localhost','127.0.0.1'].includes(url.hostname)) issues.push('Set an HTTPS public site URL.'); }
  catch { issues.push('Set a valid public site URL.'); }
 }
 if (!settings) return [...issues, 'Business settings are missing.'];
 if (!settings.prices_confirmed) issues.push('Prices need approval.');
 if (!settings.policies_confirmed) issues.push('Policies need approval.');
 if (settings.deposit_cents === null || settings.deposit_cents < 0 || !settings.deposit_instructions?.trim()) issues.push('Payment amount and instructions are required.');
 return issues;
}
