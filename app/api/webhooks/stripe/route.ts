import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log('💰 Payment succeeded:', paymentIntent.id);

            // Extract booking metadata
            const metadata = paymentIntent.metadata;
            if (metadata?.booking_id) {
                // Update booking status to confirmed
                // This could also trigger SMS confirmation
                console.log('Booking confirmed:', metadata.booking_id);
            }
            break;

        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object as Stripe.PaymentIntent;
            console.log('❌ Payment failed:', failedPayment.id);
            break;

        case 'charge.refunded':
            const refund = event.data.object as Stripe.Charge;
            console.log('💸 Refund processed:', refund.id);
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

// Disable body parsing for webhooks (we need raw body for signature verification)
export const config = {
    api: {
        bodyParser: false,
    },
};
