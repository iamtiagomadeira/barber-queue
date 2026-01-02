import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

function getStripe() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    return new Stripe(key);
}

// POST: Mark booking as no-show and handle deposit
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { booking_id, reter_deposito = true } = body;

        if (!booking_id) {
            return NextResponse.json(
                { success: false, error: 'ID da marcação é obrigatório' },
                { status: 400 }
            );
        }

        const supabase = getSupabase();
        const stripe = getStripe();

        if (!supabase) {
            return NextResponse.json({
                success: true,
                message: 'No-show registado (modo demo)',
            });
        }

        // 1. Get the booking
        const { data: booking, error: fetchError } = await supabase
            .from('marcacoes')
            .select('*')
            .eq('id', booking_id)
            .single();

        if (fetchError || !booking) {
            return NextResponse.json(
                { success: false, error: 'Marcação não encontrada' },
                { status: 404 }
            );
        }

        // 2. Update booking status to no_show
        const { error: updateError } = await supabase
            .from('marcacoes')
            .update({
                status: 'no_show',
                updated_at: new Date().toISOString(),
            })
            .eq('id', booking_id);

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return NextResponse.json(
                { success: false, error: 'Erro ao atualizar marcação' },
                { status: 500 }
            );
        }

        // 3. Handle deposit (if applicable)
        let depositAction = 'nenhum';

        if (booking.deposito_pago && booking.deposito_id && stripe) {
            if (reter_deposito) {
                // Deposit is already captured (we use automatic capture)
                // Just log that we're retaining it
                depositAction = 'retido';
                console.log(`No-show: Retaining deposit for booking ${booking_id}, payment ${booking.deposito_id}`);
            } else {
                // Refund the deposit
                try {
                    await stripe.refunds.create({
                        payment_intent: booking.deposito_id,
                    });
                    depositAction = 'devolvido';
                    console.log(`No-show: Refunded deposit for booking ${booking_id}`);
                } catch (refundError) {
                    console.error('Error refunding deposit:', refundError);
                    depositAction = 'erro_reembolso';
                }
            }
        }

        // 4. Optionally send SMS notification to customer
        // TODO: Implement SMS notification for no-show

        return NextResponse.json({
            success: true,
            message: 'No-show registado com sucesso',
            data: {
                booking_id,
                deposito_pago: booking.deposito_pago,
                deposito_action: depositAction,
            },
        });

    } catch (error) {
        console.error('Error in POST /api/bookings/no-show:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
