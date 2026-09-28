import 'server-only';
import { Resend } from 'resend';
// Email goes through Resend; texts through Twilio. Texts are optional: without Twilio details nothing is texted.
export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.FROM_EMAIL);
export const smsConfigured = () => Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);

export async function sendEmail(to: string, subject: string, text: string, idempotencyKey: string) {
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.FROM_EMAIL!, to, subject, text, replyTo: process.env.BRAIDER_EMAIL || undefined }, { idempotencyKey });
  if (error) throw new Error(error.message);
}

export async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!, from = process.env.TWILIO_FROM!;
  const form = new URLSearchParams({ To: to, Body: body, ...(from.startsWith('MG') ? { MessagingServiceSid: from } : { From: from }) });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST', body: form, signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error(`Text message failed (${res.status}).`);
}
