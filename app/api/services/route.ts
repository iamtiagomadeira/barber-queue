import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

const DEFAULT_BARBEARIA_ID = '00000000-0000-0000-0000-000000000001';

// GET: List services for a barbershop
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const barbearia_id = searchParams.get('barbearia_id') || DEFAULT_BARBEARIA_ID;

        const supabase = getSupabase();

        if (!supabase) {
            // Return mock services for demo
            return NextResponse.json({
                success: true,
                data: [
                    { id: '1', nome: 'Fade', duracao_media: 45, preco: 15, activo: true },
                    { id: '2', nome: 'Corte Clássico', duracao_media: 30, preco: 12, activo: true },
                    { id: '3', nome: 'Barba', duracao_media: 20, preco: 8, activo: true },
                    { id: '4', nome: 'Corte + Barba', duracao_media: 60, preco: 20, activo: true },
                ],
            });
        }

        const { data, error } = await supabase
            .from('servicos')
            .select('*')
            .eq('barbearia_id', barbearia_id)
            .order('nome', { ascending: true });

        if (error) {
            console.error('Error fetching services:', error);
            return NextResponse.json(
                { success: false, error: 'Erro ao obter serviços' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Error in GET /api/services:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// POST: Create a new service
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { barbearia_id = DEFAULT_BARBEARIA_ID, nome, duracao_media, preco, descricao } = body;

        if (!nome || !duracao_media || preco === undefined) {
            return NextResponse.json(
                { success: false, error: 'Nome, duração e preço são obrigatórios' },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        if (!supabase) {
            return NextResponse.json({
                success: true,
                data: { id: 'mock-' + Date.now(), nome, duracao_media, preco, descricao, activo: true },
                message: 'Serviço criado (modo demo)',
            });
        }

        const { data, error } = await supabase
            .from('servicos')
            .insert({
                barbearia_id,
                nome,
                duracao_media,
                preco,
                descricao: descricao || null,
                activo: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating service:', error);
            return NextResponse.json(
                { success: false, error: error.message || 'Erro ao criar serviço', details: error.code },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data,
            message: 'Serviço criado com sucesso',
        });
    } catch (error) {
        console.error('Error in POST /api/services:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// PATCH: Update a service
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, nome, duracao_media, preco, descricao, activo } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID do serviço é obrigatório' },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        if (!supabase) {
            return NextResponse.json({
                success: true,
                data: { id, nome, duracao_media, preco, descricao, activo },
                message: 'Serviço atualizado (modo demo)',
            });
        }

        const updateData: Record<string, unknown> = {};
        if (nome !== undefined) updateData.nome = nome;
        if (duracao_media !== undefined) updateData.duracao_media = duracao_media;
        if (preco !== undefined) updateData.preco = preco;
        if (descricao !== undefined) updateData.descricao = descricao;
        if (activo !== undefined) updateData.activo = activo;

        const { data, error } = await supabase
            .from('servicos')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating service:', error);
            return NextResponse.json(
                { success: false, error: 'Erro ao atualizar serviço' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data,
            message: 'Serviço atualizado com sucesso',
        });
    } catch (error) {
        console.error('Error in PATCH /api/services:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// DELETE: Remove a service
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID do serviço é obrigatório' },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        if (!supabase) {
            return NextResponse.json({
                success: true,
                message: 'Serviço removido (modo demo)',
            });
        }

        const { error } = await supabase
            .from('servicos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting service:', error);
            return NextResponse.json(
                { success: false, error: 'Erro ao remover serviço' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Serviço removido com sucesso',
        });
    } catch (error) {
        console.error('Error in DELETE /api/services:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
