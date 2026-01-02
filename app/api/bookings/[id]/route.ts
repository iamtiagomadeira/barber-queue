import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

// PATCH: Update booking status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // params is now a Promise in Next.js 15+
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json(
                { success: false, error: 'Status é obrigatório' },
                { status: 400 }
            );
        }

        const validStatuses = ['pendente', 'confirmada', 'em_atendimento', 'concluida', 'cancelada', 'no_show'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Status inválido' },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        if (!supabase) {
            return NextResponse.json({
                success: true,
                message: 'Status atualizado (modo demo)',
                data: { id, status }
            });
        }

        const { data, error } = await supabase
            .from('marcacoes')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating booking:', error);
            return NextResponse.json(
                { success: false, error: 'Erro ao atualizar marcação' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data,
            message: 'Status atualizado com sucesso'
        });

    } catch (error) {
        console.error('Error in PATCH /api/bookings/[id]:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
