import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paymentIntentId } = body;

        if (!paymentIntentId) {
            return NextResponse.json(
                { error: 'paymentIntentId é obrigatório' },
                { status: 400 }
            );
        }

        if (!stripe) {
            return NextResponse.json(
                { success: true, status: 'demo', message: 'Stripe não configurado - modo demo' }
            );
        }

        // Capture the payment (charge the customer for no-show)
        const capturedIntent = await stripe.paymentIntents.capture(paymentIntentId);

        return NextResponse.json({
            success: true,
            status: capturedIntent.status,
            message: 'Pagamento cobrado (no-show)',
        });
    } catch (error) {
        console.error('Error capturing payment:', error);
        return NextResponse.json(
            { error: 'Erro ao cobrar pagamento' },
            { status: 500 }
        );
    }
}
