import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { customer_id } = body;

        if (!customer_id) {
            return NextResponse.json(
                { error: 'customer_id é obrigatório' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Check authentication
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        // Get customer details
        const { data: customer, error: customerError } = await supabase
            .from('fila_virtual')
            .select('*')
            .eq('id', customer_id)
            .single();

        if (customerError || !customer) {
            return NextResponse.json(
                { error: 'Cliente não encontrado' },
                { status: 404 }
            );
        }

        // Update customer status to 'concluido'
        const { data: updatedEntry, error: updateError } = await supabase
            .from('fila_virtual')
            .update({
                status: 'concluido',
                concluido_at: new Date().toISOString(),
            })
            .eq('id', customer_id)
            .select('*')
            .single();

        if (updateError) {
            return NextResponse.json(
                { error: 'Erro ao completar serviço' },
                { status: 500 }
            );
        }

        // TODO: Process refund of deposit
        // if (customer.deposito_pago && customer.deposito_id) {
        //   await refundDeposit(customer.deposito_id);
        // }

        // TODO: Send SMS notification
        // await sendSMS(
        //   customer.cliente_telefone,
        //   `Serviço concluído! Obrigado pela sua visita.`
        // );

        return NextResponse.json({
            success: true,
            data: updatedEntry,
            message: 'Serviço completado com sucesso',
        });
    } catch (error) {
        console.error('Error completing service:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
