import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

const DEFAULT_BARBEARIA_ID = '00000000-0000-0000-0000-000000000001';

// Mock barbers for demo
const MOCK_BARBERS = [
    {
        id: '1',
        nome: 'Carlos Silva',
        foto_url: null,
        bio: 'Barbeiro profissional com 10 anos de experiência',
        especialidades: ['fade', 'corte clássico', 'barba'],
        activo: true,
    },
    {
        id: '2',
        nome: 'Miguel Santos',
        foto_url: null,
        bio: 'Especialista em cortes modernos e designs',
        especialidades: ['fade', 'designs', 'coloração'],
        activo: true,
    },
];

// GET: List barbers for a barbershop
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const barbearia_id = searchParams.get('barbearia_id') || DEFAULT_BARBEARIA_ID;

        const supabase = getSupabase();

        if (supabase) {
            const { data, error } = await supabase
                .from('barbeiros')
                .select('*')
                .eq('barbearia_id', barbearia_id)
                .eq('activo', true)
                .order('ordem', { ascending: true });

            if (!error && data && data.length > 0) {
                return NextResponse.json({ success: true, data });
            }
        }

        // Fallback to mock data
        return NextResponse.json({ success: true, data: MOCK_BARBERS });
    } catch (error) {
        console.error('Error fetching barbers:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao obter barbeiros' },
            { status: 500 }
        );
    }
}

// POST: Create a new barber
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { barbearia_id = DEFAULT_BARBEARIA_ID, nome, foto_url, bio, especialidades } = body;

        if (!nome) {
            return NextResponse.json(
                { success: false, error: 'Nome é obrigatório' },
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
            .from('barbeiros')
            .insert({
                barbearia_id,
                nome,
                foto_url,
                bio,
                especialidades: especialidades || [],
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating barber:', error);
            return NextResponse.json(
                { success: false, error: 'Erro ao criar barbeiro' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error creating barber:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
