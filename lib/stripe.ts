import Stripe from 'stripe';

// Initialize Stripe with secret key (graceful fallback for demo mode)
const stripeClient = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

// Amount in cents (5€ = 500 cents)
export const DEPOSIT_AMOUNT = 500;
export const DEPOSIT_CURRENCY = 'eur';

/**
 * Create a payment intent for deposits
 */
export async function createPaymentIntent(amount: number, metadata: Record<string, string> = {}) {
    if (!stripeClient) {
        console.warn('Stripe not configured - running in demo mode');
        return {
            clientSecret: 'demo_client_secret',
            paymentIntentId: 'demo_pi_' + Date.now(),
        };
    }

    const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe uses cents
        currency: 'eur',
        metadata,
        automatic_payment_methods: {
            enabled: true,
        },
    });

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    };
}

/**
 * Refund a payment (deposit)
 * @param paymentIntentId - The Stripe Payment Intent ID to refund
 * @param reason - Optional reason for the refund
 */
export async function refundPayment(paymentIntentId: string, reason?: string): Promise<{
    success: boolean;
    refundId?: string;
    status?: string;
    demo?: boolean;
    error?: string;
}> {
    if (!stripeClient) {
        console.warn('Stripe not configured - skipping refund in demo mode');
        return {
            success: true,
            refundId: 'demo_refund_' + Date.now(),
            demo: true,
        };
    }

    // Skip demo payment intents
    if (paymentIntentId.startsWith('demo_')) {
        return {
            success: true,
            refundId: 'demo_refund_' + Date.now(),
            demo: true,
        };
    }

    try {
        const refund = await stripeClient.refunds.create({
            payment_intent: paymentIntentId,
            reason: 'requested_by_customer',
            metadata: reason ? { reason } : {},
        });

        return {
            success: true,
            refundId: refund.id,
            status: refund.status ?? undefined,
        };
    } catch (error) {
        console.error('Stripe refund error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Retrieve payment intent status
 */
export async function getPaymentIntent(paymentIntentId: string) {
    if (!stripeClient || paymentIntentId.startsWith('demo_')) {
        return { status: 'succeeded', demo: true };
    }

    try {
        const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
        return {
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
        };
    } catch (error) {
        console.error('Stripe retrieve error:', error);
        throw error;
    }
}

export const stripe = stripeClient;
export default stripeClient;
