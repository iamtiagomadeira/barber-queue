import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    typescript: true,
});

// Amount in cents (5€ = 500 cents)
export const DEPOSIT_AMOUNT = 500;
export const DEPOSIT_CURRENCY = 'eur';
