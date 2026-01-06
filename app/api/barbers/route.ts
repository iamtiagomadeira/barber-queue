import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface BarberData {
    id?: string;
    barbearia_id?: string;
    nome: string;
    email?: string;
    telefone?: string;
    foto_url?: string;
    data_nascimento?: string;
    especialidades?: string[];
    bio?: string;
    activo?: boolean;
}

// GET - List barbers for a barbershop
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const barbearia_id = searchParams.get('barbearia_id');
        const activeOnly = searchParams.get('active_only') !== 'false';

        if (!barbearia_id) {
            return NextResponse.json(
                { error: 'barbearia_id é obrigatório' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        let query = supabase
            .from('barbeiros')
            .select('*')
            .eq('barbearia_id', barbearia_id)
            .order('nome');

        if (activeOnly) {
            query = query.eq('activo', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching barbers:', error);
            return NextResponse.json(
                { error: 'Erro ao buscar barbeiros' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Error in GET /api/barbers:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// POST - Create a new barber
export async function POST(request: NextRequest) {
    try {
        const body: BarberData = await request.json();
        const { barbearia_id, nome, email, telefone, foto_url, data_nascimento, especialidades, bio } = body;

        if (!barbearia_id || !nome) {
            return NextResponse.json(
                { error: 'barbearia_id e nome são obrigatórios' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const { data, error } = await supabase
            .from('barbeiros')
            .insert({
                barbearia_id,
                nome,
                email,
                telefone,
                foto_url,
                data_nascimento,
                especialidades: especialidades || [],
                bio,
                activo: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating barber:', error);
            return NextResponse.json(
                { error: 'Erro ao criar barbeiro' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error in POST /api/barbers:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// PATCH - Update a barber
export async function PATCH(request: NextRequest) {
    try {
        const body: BarberData = await request.json();
        const { id, barbearia_id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'id é obrigatório' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        // Remove undefined values
        const cleanData = Object.fromEntries(
            Object.entries(updateData).filter(([, v]) => v !== undefined)
        );

        const { data, error } = await supabase
            .from('barbeiros')
            .update(cleanData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating barber:', error);
            return NextResponse.json(
                { error: 'Erro ao atualizar barbeiro' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Error in PATCH /api/barbers:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Remove a barber
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'id é obrigatório' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const { error } = await supabase
            .from('barbeiros')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting barber:', error);
            return NextResponse.json(
                { error: 'Erro ao eliminar barbeiro' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/barbers:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
