import { NextRequest, NextResponse } from 'next/server';
import { stripe, DEPOSIT_AMOUNT, DEPOSIT_CURRENCY } from '@/lib/stripe';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_name, customer_phone, service_name } = body;

        // Create a PaymentIntent with automatic capture disabled (authorization only)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: DEPOSIT_AMOUNT,
            currency: DEPOSIT_CURRENCY,
            capture_method: 'manual', // This creates a hold, not an immediate charge
            metadata: {
                customer_name,
                customer_phone,
                service_name,
                type: 'queue_deposit',
            },
            description: `Depósito de fila - ${service_name} - ${customer_name}`,
        });

        return NextResponse.json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        return NextResponse.json(
            { error: 'Erro ao criar pagamento' },
            { status: 500 }
        );
    }
}
