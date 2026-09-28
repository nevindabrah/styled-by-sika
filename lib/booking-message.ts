// The message a client sends Sika about a booking (Instagram, text or email), and links that prefill it.
export type BookingSummary = { service: string; duration: string; extras: string[]; estimate: string; when?: string; name?: string; reference?: string };

export function bookingMessage(b: BookingSummary, requested: boolean) {
  return [
    requested ? 'Hi Sika! I just requested a booking on your website:' : 'Hi Sika! I’d like to book:',
    `${b.service} (${b.duration})`,
    ...b.extras.map(e => `+ ${e}`),
    `Estimated total: ${b.estimate}`,
    b.when ? `${requested ? 'Time' : 'Preferred time'}: ${b.when}` : '',
    b.name ? `Name: ${b.name}` : '',
    b.reference ? `Reference: ${b.reference}` : '',
    '',
    'I have read and agree to the booking policies.',
  ].filter((line, i, all) => line !== '' || (all[i - 1] ?? '') !== '').join('\n').replace(/\n{3,}/g, '\n\n');
}

// Opens the phone's Messages app with the text filled in (the "?&body=" form works on iPhone and Android).
export function smsLink(phone: string, body: string) {
  const number = phone.replace(/[^\d+]/g, '');
  return number ? `sms:${number}?&body=${encodeURIComponent(body)}` : '';
}
export const mailLink = (email: string, subject: string, body: string) => `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
