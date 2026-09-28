import { describe, expect, it } from 'vitest';
import { bookingConfigurationIssues, bookingEnvironmentKeys } from '../../lib/launch-readiness';
import type { BusinessSettings } from '../../lib/types';
const settings: BusinessSettings={timezone:'America/Toronto',buffer_min:30,minimum_notice_hours:24,window_days:60,deposit_cents:2000,deposit_instructions:'Pay by e-transfer.',prices_confirmed:true,hours_confirmed:true,policies_confirmed:true,booking_open:true};
const env={...Object.fromEntries(bookingEnvironmentKeys.map(k=>[k,'configured'])),NEXT_PUBLIC_SITE_URL:'https://example.com',NEXT_PUBLIC_DEMO_MODE:'false'};
describe('online booking readiness',()=>{
 it('works without any email or text service', ()=>expect(bookingConfigurationIssues(settings,env)).toEqual([]));
 it('is always on once configured; her hours decide which times exist',()=>{
  expect(bookingConfigurationIssues({...settings,booking_open:false,hours_confirmed:false},env)).toEqual([]);
 });
 it('blocks missing credentials, settings and demo mode',()=>{
  expect(bookingConfigurationIssues(null,{})).toContain('Business settings are missing.');
  expect(bookingConfigurationIssues(settings,{...env,NEXT_PUBLIC_DEMO_MODE:'true'})).toContain('Demo mode is enabled.');
  expect(bookingConfigurationIssues(settings,{...env,SUPABASE_SERVICE_ROLE_KEY:''})).toContain('Missing SUPABASE_SERVICE_ROLE_KEY.');
  expect(bookingConfigurationIssues(settings,{...env,NEXT_PUBLIC_SITE_URL:'http://localhost:3000'})).toContain('Set an HTTPS public site URL.');
 });
 it('treats optional services as all-or-nothing, and needs the scheduler once messages are on',()=>{
  expect(bookingConfigurationIssues(settings,{...env,RESEND_API_KEY:'re_x'})).toContain('Email needs both RESEND_API_KEY and FROM_EMAIL, or neither.');
  expect(bookingConfigurationIssues(settings,{...env,TWILIO_ACCOUNT_SID:'AC1'})).toContain('Text messages need all three TWILIO_* values, or none.');
  expect(bookingConfigurationIssues(settings,{...env,RESEND_API_KEY:'re_x',FROM_EMAIL:'a@b.c'})).toContain('Missing CRON_SECRET.');
  expect(bookingConfigurationIssues(settings,{...env,RESEND_API_KEY:'re_x',FROM_EMAIL:'a@b.c',CRON_SECRET:'s'})).toEqual([]);
  expect(bookingConfigurationIssues(settings,{...env,GOOGLE_CALENDAR_ID:'cal'})).toContain('Google Calendar needs all three GOOGLE_* values, or none.');
 });
});
