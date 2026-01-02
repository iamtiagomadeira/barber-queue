import { NextRequest, NextResponse } from 'next/server';
import { stripe, DEPOSIT_CURRENCY } from '@/lib/stripe';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            amount,
            customer_name,
            customer_email,
            customer_phone,
            service_name,
            service_price,
            barber_name,
            booking_date,
            booking_time,
            metadata = {}
        } = body;

        // Use provided amount or default deposit
        const paymentAmount = amount || 500; // €5.00 default

        // Build description for receipt
        const description = [
            `Ventus - ${service_name}`,
            barber_name ? `Barbeiro: ${barber_name}` : null,
            booking_date ? `Data: ${booking_date}` : null,
            booking_time ? `Hora: ${booking_time}` : null,
        ].filter(Boolean).join(' | ');

        // Create PaymentIntent with full details
        const paymentIntent = await stripe.paymentIntents.create({
            amount: paymentAmount,
            currency: DEPOSIT_CURRENCY,
            capture_method: 'manual', // Hold, not immediate charge
            automatic_payment_methods: {
                enabled: true,
            },
            // Receipt email - Stripe will send receipt to this email
            receipt_email: customer_email || undefined,
            // Description appears on customer's bank statement and receipt
            description: description,
            // Statement descriptor (max 22 chars, appears on bank statement)
            statement_descriptor_suffix: 'VENTUS',
            // All booking details in metadata
            metadata: {
                type: 'booking_deposit',
                customer_name: customer_name || '',
                customer_email: customer_email || '',
                customer_phone: customer_phone || '',
                service_name: service_name || '',
                service_price: service_price?.toString() || '',
                barber_name: barber_name || '',
                booking_date: booking_date || '',
                booking_time: booking_time || '',
                ...metadata,
            },
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
