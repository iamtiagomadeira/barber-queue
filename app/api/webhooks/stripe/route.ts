import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Create Supabase admin client for webhook (bypasses RLS)
function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return null;
    return createClient(url, serviceKey);
}

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
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log('✅ Checkout session completed:', session.id);

            // Extract barbearia_id from metadata
            const barbearia_id = session.metadata?.barbearia_id;
            const customerId = session.customer as string;

            if (barbearia_id) {
                const supabase = getSupabaseAdmin();
                if (supabase) {
                    // Update barbershop to Pro status
                    const { error } = await supabase
                        .from('barbearias')
                        .update({
                            is_pro: true,
                            stripe_customer_id: customerId,
                        })
                        .eq('id', barbearia_id);

                    if (error) {
                        console.error('Error upgrading to Pro:', error);
                    } else {
                        console.log(`🎉 Barbershop ${barbearia_id} upgraded to Pro!`);
                    }
                }
            }
            break;
        }

        case 'customer.subscription.deleted': {
            // Handle subscription cancellation
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            console.log('❌ Subscription canceled:', subscription.id);

            const supabase = getSupabaseAdmin();
            if (supabase && customerId) {
                // Downgrade to free
                const { error } = await supabase
                    .from('barbearias')
                    .update({ is_pro: false })
                    .eq('stripe_customer_id', customerId);

                if (error) {
                    console.error('Error downgrading from Pro:', error);
                } else {
                    console.log(`📉 Customer ${customerId} downgraded to Free`);
                }
            }
            break;
        }

        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log('💰 Payment succeeded:', paymentIntent.id);

            // Extract booking metadata
            const metadata = paymentIntent.metadata;
            if (metadata?.booking_id) {
                // Update booking status to confirmed
                console.log('Booking confirmed:', metadata.booking_id);
            }
            break;
        }

        case 'payment_intent.payment_failed': {
            const failedPayment = event.data.object as Stripe.PaymentIntent;
            console.log('❌ Payment failed:', failedPayment.id);
            break;
        }

        case 'charge.refunded': {
            const refund = event.data.object as Stripe.Charge;
            console.log('💸 Refund processed:', refund.id);
            break;
        }

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

