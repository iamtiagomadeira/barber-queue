import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { barbearia_id } = body;

        if (!barbearia_id) {
            return NextResponse.json(
                { success: false, error: 'barbearia_id é obrigatório' },
                { status: 400 }
            );
        }

        // Delete all pending entries from the queue
        const { error, count } = await supabaseAdmin
            .from('fila_virtual')
            .delete()
            .eq('barbearia_id', barbearia_id)
            .in('status', ['waiting', 'in_service']);

        if (error) {
            console.error('Error clearing queue:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Fila limpa com sucesso`,
            deletedCount: count
        });
    } catch (error) {
        console.error('Error in clear queue API:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
