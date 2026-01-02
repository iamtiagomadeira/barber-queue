import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

const DEFAULT_BARBEARIA_ID = '00000000-0000-0000-0000-000000000001';

// POST: Create a new booking
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            barbearia_id = DEFAULT_BARBEARIA_ID,
            barbeiro_id,
            servico_id,
            cliente_nome,
            cliente_telefone,
            cliente_email,
            cliente_nif,
            data,
            hora,
            deposito_id,
        } = body;

        // Validate required fields
        if (!cliente_nome || !cliente_telefone || !data || !hora || !servico_id) {
            return NextResponse.json(
                { success: false, error: 'Campos obrigatórios em falta' },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        if (!supabase) {
            // Return mock success for demo
            return NextResponse.json({
                success: true,
                data: {
                    id: 'mock-' + Date.now(),
                    cliente_nome,
                    data,
                    hora,
                    status: 'confirmada',
                },
                message: 'Marcação confirmada! (modo demo)',
            });
        }

        // Check if slot is still available
        const { data: existingBooking } = await supabase
            .from('marcacoes')
            .select('id')
            .eq('data', data)
            .eq('hora', hora)
            .eq('barbeiro_id', barbeiro_id)
            .in('status', ['pendente', 'confirmada', 'em_atendimento'])
            .single();

        if (existingBooking) {
            return NextResponse.json(
                { success: false, error: 'Este horário já não está disponível. Por favor escolha outro.' },
                { status: 409 }
            );
        }

        // Get service duration
        const { data: servico } = await supabase
            .from('servicos')
            .select('duracao_media')
            .eq('id', servico_id)
            .single();

        // Create booking
        const { data: booking, error } = await supabase
            .from('marcacoes')
            .insert({
                barbearia_id,
                barbeiro_id: barbeiro_id === 'any' ? null : barbeiro_id,
                servico_id,
                cliente_nome,
                cliente_telefone,
                cliente_email,
                cliente_nif,
                data,
                hora,
                duracao_minutos: servico?.duracao_media || 30,
                status: deposito_id ? 'confirmada' : 'pendente',
                deposito_pago: !!deposito_id,
                deposito_id,
            })
            .select('*, barbeiro:barbeiros(nome), servico:servicos(nome, preco)')
            .single();

        if (error) {
            console.error('Error creating booking:', error);
            return NextResponse.json(
                { success: false, error: 'Erro ao criar marcação' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: booking,
            message: 'Marcação confirmada!',
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// GET: List bookings for a barbershop/date
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const barbearia_id = searchParams.get('barbearia_id') || DEFAULT_BARBEARIA_ID;
        const data = searchParams.get('data'); // YYYY-MM-DD
        const barbeiro_id = searchParams.get('barbeiro_id');

        const supabase = getSupabase();

        if (!supabase) {
            return NextResponse.json({ success: true, data: [] });
        }

        let query = supabase
            .from('marcacoes')
            .select('*, barbeiro:barbeiros(nome, foto_url), servico:servicos(nome, preco, duracao_media)')
            .eq('barbearia_id', barbearia_id)
            .order('hora', { ascending: true });

        if (data) {
            query = query.eq('data', data);
        }

        if (barbeiro_id) {
            query = query.eq('barbeiro_id', barbeiro_id);
        }

        const { data: bookings, error } = await query;

        if (error) {
            console.error('Error fetching bookings:', error);
            return NextResponse.json(
                { success: false, error: 'Erro ao obter marcações' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: bookings || [] });
    } catch (error) {
        console.error('Error fetching bookings:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
