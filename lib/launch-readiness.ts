import type { BusinessSettings } from './types';

// Needed before online booking can be switched on.
export const bookingEnvironmentKeys = [
 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_EMAIL',
 'RESEND_API_KEY', 'BRAIDER_EMAIL', 'FROM_EMAIL', 'NEXT_PUBLIC_SITE_URL',
] as const;
// Nice to have; the site works without them (no Google Calendar sync, in-memory rate limiting, no cron retries).
export const optionalEnvironmentKeys = [
 'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY', 'GOOGLE_CALENDAR_ID',
 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'CRON_SECRET', 'MAINTAINER_EMAIL',
] as const;

export function bookingConfigurationIssues(settings: BusinessSettings | null, env: Record<string, string | undefined>): string[] {
 const issues: string[] = [];
 if (env.NEXT_PUBLIC_DEMO_MODE === 'true') issues.push('Demo mode is enabled.');
 if (env.BOOKING_ENABLED !== 'true') issues.push('BOOKING_ENABLED is not true.');
 for (const name of bookingEnvironmentKeys) if (!env[name]?.trim()) issues.push(`Missing ${name}.`);
 const google = ['GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY', 'GOOGLE_CALENDAR_ID'].filter(k => env[k]?.trim()).length;
 if (google > 0 && google < 3) issues.push('Google Calendar needs all three GOOGLE_* values, or none.');
 if ((env.UPSTASH_REDIS_REST_URL ? 1 : 0) + (env.UPSTASH_REDIS_REST_TOKEN ? 1 : 0) === 1) issues.push('Upstash needs both URL and token, or neither.');
 if (env.NEXT_PUBLIC_SITE_URL) {
  try { const url = new URL(env.NEXT_PUBLIC_SITE_URL); if(url.protocol!=='https:' || ['localhost','127.0.0.1'].includes(url.hostname)) issues.push('Set an HTTPS public site URL.'); }
  catch { issues.push('Set a valid public site URL.'); }
 }
 if (!settings) return [...issues, 'Business settings are missing.'];
 if (!settings.prices_confirmed) issues.push('Prices need approval.');
 if (!settings.hours_confirmed) issues.push('Working hours need approval (save them once in the dashboard).');
 if (!settings.policies_confirmed) issues.push('Policies need approval.');
 if (settings.deposit_cents === null || settings.deposit_cents < 0 || !settings.deposit_instructions?.trim()) issues.push('Payment amount and instructions are required.');
 return issues;
}
