// Owner-supplied welcome, policies and contact details. Edit here to update the website.

export const contact = {
  instagramHandle: '@styledby.sika',
  instagramUrl: 'https://www.instagram.com/styledby.sika/',
  // Opens a direct message thread in the Instagram app or website.
  instagramDmUrl: 'https://ig.me/m/styledby.sika',
  email: 'styledbysika@gmail.com',
};

export const depositCents = 2000;
export const paymentOptions = 'Cash or E-transfer';

export const welcome = {
  title: 'Welcome to Styled by Sika 🤎',
  body: 'I’m excited to have you here! 💕 I can’t wait to style you, bring your style to life, and give you a look you’ll absolutely love. Whether you’re trying a new style or coming back for your signature look, I’m happy to have you in my chair! ✨',
};

export const beforeYouBook = 'Please take a moment to review the services and all booking policies before securing your appointment. By booking, you confirm that you have read and agree to the policies below.';

export const policies: { id: string; title: string; intro?: string; items?: string[]; outro?: string }[] = [
  {
    id: 'deposit', title: 'Deposit',
    intro: 'A CA$20 non-refundable deposit is required to secure your appointment.',
    items: ['The deposit goes toward your remaining balance.', 'Your appointment is not confirmed until the deposit has been received.', 'Deposits are non-refundable.'],
  },
  { id: 'payment', title: 'Payment options', intro: paymentOptions },
  {
    id: 'cancellation', title: 'Cancellation & rescheduling',
    intro: 'A minimum of 48 hours’ notice is required for cancellations or rescheduling.',
    items: ['Cancellations made less than 48 hours before your appointment may result in your deposit being forfeited.', 'Repeated cancellations or rescheduling may require a new deposit to book.'],
  },
  {
    id: 'hair-prep', title: 'Hair prep',
    intro: 'Please arrive with your hair:',
    items: ['Freshly washed', 'Fully dried', 'Properly detangled', 'Free from excessive oils, grease, and product buildup'],
    outro: 'Your hair should be blow dried when you arrive. If your hair requires extensive detangling, washing, or additional preparation, an extra fee and/or additional time may apply.',
  },
  { id: 'hair-requirements', title: 'Hair requirements', intro: 'If you are unsure about what hair to purchase, feel free to reach out before your appointment. I will be happy to help :)' },
];

export const depositSummary = 'A CA$20 non-refundable deposit is required to secure your appointment. It goes toward your remaining balance. Your appointment is not confirmed until the deposit has been received. Payment options: cash or e-transfer.';

export const thankYou = {
  title: 'Thank you for choosing Styled by Sika 🤎',
  body: 'I’m excited to style you and create a look you’ll love! ✨🫶🏾',
};
