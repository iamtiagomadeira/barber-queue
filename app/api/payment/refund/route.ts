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

        // Cancel the payment intent (releases the hold without charging)
        const canceledIntent = await stripe.paymentIntents.cancel(paymentIntentId);

        return NextResponse.json({
            success: true,
            status: canceledIntent.status,
            message: 'Depósito devolvido com sucesso',
        });
    } catch (error) {
        console.error('Error refunding payment:', error);
        return NextResponse.json(
            { error: 'Erro ao devolver depósito' },
            { status: 500 }
        );
    }
}
