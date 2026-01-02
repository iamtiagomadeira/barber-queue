import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for API routes
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        return null;
    }

    return createClient(url, key);
}

const DEFAULT_BARBEARIA_ID = '00000000-0000-0000-0000-000000000001';

// GET: Get barbershop status (queue open/closed)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const barbearia_id = searchParams.get('barbearia_id') || DEFAULT_BARBEARIA_ID;

        const supabase = getSupabase();

        if (supabase) {
            const { data, error } = await supabase
                .from('barbearias')
                .select('id, nome, fila_aberta, horario')
                .eq('id', barbearia_id)
                .single();

            if (!error && data) {
                return NextResponse.json({
                    success: true,
                    data: {
                        id: data.id,
                        nome: data.nome,
                        fila_aberta: data.fila_aberta ?? true,
                        horario: data.horario || {},
                    }
                });
            }
        }

        // Fallback: return default open status
        return NextResponse.json({
            success: true,
            data: {
                id: barbearia_id,
                nome: 'Barbearia Ventus',
                fila_aberta: true,
                horario: {},
            }
        });
    } catch (error) {
        console.error('Error fetching barbershop status:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao obter estado da barbearia' },
            { status: 500 }
        );
    }
}

// POST: Update barbershop status (open/close queue)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { barbearia_id = DEFAULT_BARBEARIA_ID, fila_aberta } = body;

        if (typeof fila_aberta !== 'boolean') {
            return NextResponse.json(
                { success: false, error: 'Campo fila_aberta é obrigatório (boolean)' },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        if (!supabase) {
            return NextResponse.json(
                { success: false, error: 'Base de dados não configurada' },
                { status: 500 }
            );
        }

        const { data, error } = await supabase
            .from('barbearias')
            .update({ fila_aberta })
            .eq('id', barbearia_id)
            .select()
            .single();

        if (error) {
            console.error('Error updating barbershop status:', error);
            return NextResponse.json(
                { success: false, error: 'Erro ao actualizar estado da fila' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                fila_aberta: data.fila_aberta,
                message: data.fila_aberta ? 'Fila aberta' : 'Fila fechada',
            }
        });
    } catch (error) {
        console.error('Error updating barbershop status:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
