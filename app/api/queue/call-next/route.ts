import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getNextInQueue } from '@/lib/queue-logic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { barbearia_id } = body;

        if (!barbearia_id) {
            return NextResponse.json(
                { error: 'barbearia_id é obrigatório' },
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

        // Get current queue
        const { data: currentQueue, error: queueError } = await supabase
            .from('fila_virtual')
            .select('*')
            .eq('barbearia_id', barbearia_id)
            .in('status', ['em_espera', 'em_corte']);

        if (queueError) {
            return NextResponse.json(
                { error: 'Erro ao obter fila' },
                { status: 500 }
            );
        }

        // Get next customer
        const nextCustomer = getNextInQueue(currentQueue || []);

        if (!nextCustomer) {
            return NextResponse.json(
                { error: 'Nenhum cliente em espera' },
                { status: 404 }
            );
        }

        // Update customer status to 'em_corte'
        const { data: updatedEntry, error: updateError } = await supabase
            .from('fila_virtual')
            .update({
                status: 'em_corte',
                chamado_at: new Date().toISOString(),
            })
            .eq('id', nextCustomer.id)
            .select('*, servico:servicos(*)')
            .single();

        if (updateError) {
            return NextResponse.json(
                { error: 'Erro ao chamar próximo cliente' },
                { status: 500 }
            );
        }

        // TODO: Send SMS notification
        // await sendSMS(
        //   nextCustomer.cliente_telefone,
        //   `É a sua vez! Dirija-se à barbearia agora.`
        // );

        return NextResponse.json({
            success: true,
            data: updatedEntry,
            message: 'Cliente chamado com sucesso',
        });
    } catch (error) {
        console.error('Error calling next customer:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
