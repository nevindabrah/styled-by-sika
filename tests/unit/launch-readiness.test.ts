import { describe, expect, it } from 'vitest';
import { bookingConfigurationIssues, bookingEnvironmentKeys } from '../../lib/launch-readiness';
import type { BusinessSettings } from '../../lib/types';
const settings: BusinessSettings={timezone:'America/Toronto',buffer_min:30,minimum_notice_hours:24,window_days:60,deposit_cents:5000,deposit_instructions:'Pay using the provided instructions.',prices_confirmed:true,hours_confirmed:true,policies_confirmed:true,cancellation_policy:'Contact Sika 48 hours ahead.',lateness_policy:'Contact Sika if running late.',guest_policy:'No guests.'};
const env={...Object.fromEntries(bookingEnvironmentKeys.map(k=>[k,'configured'])),NEXT_PUBLIC_SITE_URL:'https://example.com',BOOKING_ENABLED:'true',NEXT_PUBLIC_DEMO_MODE:'false'};
describe('live booking configuration',()=>{
 it('blocks missing credentials, settings and demo mode',()=>{
  expect(bookingConfigurationIssues(null,{})).toContain('Business settings are missing.');
  expect(bookingConfigurationIssues(settings,{...env,NEXT_PUBLIC_DEMO_MODE:'true'})).toContain('Demo mode is enabled.');
  expect(bookingConfigurationIssues(settings,{...env,SUPABASE_SERVICE_ROLE_KEY:''})).toContain('Missing SUPABASE_SERVICE_ROLE_KEY.');
 });
 it('requires actual policy text even when approval flags are set',()=>{
  expect(bookingConfigurationIssues({...settings,cancellation_policy:null},env)).toContain('Enter cancellation, lateness and guest policies.');
 });
 it('blocks unapproved prices and local callback URLs',()=>{
  expect(bookingConfigurationIssues({...settings,prices_confirmed:false},{...env,NEXT_PUBLIC_SITE_URL:'http://localhost:3000'})).toEqual(expect.arrayContaining(['Prices need approval.','Set an HTTPS public site URL.']));
 });
 it('allows a complete approved configuration',()=>expect(bookingConfigurationIssues(settings,env)).toEqual([]));
});
