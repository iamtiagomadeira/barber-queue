import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-15.clover',
});

const PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

if (!PRICE_ID) {
    console.error('NEXT_PUBLIC_STRIPE_PRO_PRICE_ID is not set');
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { barbearia_id, slug } = body;

        if (!barbearia_id) {
            return NextResponse.json(
                { error: 'barbearia_id é obrigatório' },
                { status: 400 }
            );
        }

        // Verify user is authenticated
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        // Get the origin for redirect URLs
        const origin = request.headers.get('origin') || 'http://localhost:3000';

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: PRICE_ID,
                    quantity: 1,
                },
            ],
            metadata: {
                barbearia_id,
                user_id: user.id,
            },
            success_url: `${origin}/barbeiro/${slug}/settings?success=true`,
            cancel_url: `${origin}/barbeiro/${slug}/settings?canceled=true`,
            customer_email: user.email,
        });

        return NextResponse.json({
            success: true,
            url: session.url,
            sessionId: session.id
        });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return NextResponse.json(
            { error: 'Erro ao criar sessão de pagamento' },
            { status: 500 }
        );
    }
}
