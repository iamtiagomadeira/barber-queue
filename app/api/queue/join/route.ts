import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a simple Supabase client for API routes
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        return null;
    }

    return createClient(url, key);
}

// Mock services for when Supabase is not connected
const MOCK_SERVICES = [
    { id: '1', nome: 'Fade', duracao_media: 45, preco: 15 },
    { id: '2', nome: 'Corte Clássico', duracao_media: 30, preco: 12 },
    { id: '3', nome: 'Barba', duracao_media: 20, preco: 8 },
    { id: '4', nome: 'Corte + Barba', duracao_media: 60, preco: 20 },
];

// In-memory queue for MVP demo (when Supabase is not configured)
const mockQueue: Array<{
    id: string;
    cliente_nome: string;
    cliente_telefone: string;
    servico_id: string;
    status: string;
    posicao: number;
    tempo_espera_estimado: number;
    deposito_id: string | null;
    created_at: string;
}> = [];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { cliente_nome, cliente_telefone, servico_id, barbearia_id, deposito_id } = body;

        // Validate input
        if (!cliente_nome || !cliente_telefone || !servico_id) {
            return NextResponse.json(
                { error: 'Campos obrigatórios em falta', details: { cliente_nome: !!cliente_nome, cliente_telefone: !!cliente_telefone, servico_id: !!servico_id } },
                { status: 400 }
            );
        }

        const supabase = getSupabase();
        const isUUID = servico_id.includes('-');

        // Variable to hold service data (from Supabase or mock)
        let serviceData: { id: string; nome: string; duracao_media: number; preco: number } | null = null;

        // Try to get service from Supabase if it's a UUID
        if (supabase && isUUID) {
            try {
                const { data: servico, error: servicoError } = await supabase
                    .from('servicos')
                    .select('*')
                    .eq('id', servico_id)
                    .single();

                if (!servicoError && servico) {
                    serviceData = servico;

                    // Try to insert into Supabase queue
                    const { data: currentQueue } = await supabase
                        .from('fila_virtual')
                        .select('*, servico:servicos(duracao_media)')
                        .eq('barbearia_id', barbearia_id || '00000000-0000-0000-0000-000000000001')
                        .in('status', ['em_espera', 'em_corte']);

                    const posicao = (currentQueue?.length || 0) + 1;
                    // Calculate wait time based on preceding customers' service durations
                    // First customer has 0 wait time
                    const tempo_espera_estimado = (currentQueue || []).reduce((acc, item) => {
                        // Use the service duration from each queue item, or default 30min
                        const itemDuration = item.servico?.duracao_media || 30;
                        return acc + itemDuration;
                    }, 0);

                    const { data: newEntry, error: insertError } = await supabase
                        .from('fila_virtual')
                        .insert({
                            barbearia_id: barbearia_id || '00000000-0000-0000-0000-000000000001',
                            servico_id,
                            cliente_nome,
                            cliente_telefone,
                            status: 'em_espera',
                            posicao,
                            tempo_espera_estimado,
                            deposito_pago: !!deposito_id,
                            deposito_id: deposito_id || null,
                        })
                        .select('*, servico:servicos(*)')
                        .single();

                    if (!insertError && newEntry) {
                        return NextResponse.json({
                            success: true,
                            data: newEntry,
                            position: posicao,
                            tempo_espera_estimado,
                            message: 'Entrou na fila com sucesso',
                        });
                    }

                    // If insert failed, log and continue to in-memory fallback
                    console.log('Supabase insert failed, using in-memory queue:', insertError?.message);
                }
            } catch (supabaseError) {
                console.log('Supabase error:', supabaseError);
            }
        }

        // If service not found in Supabase, try mock services
        if (!serviceData) {
            serviceData = MOCK_SERVICES.find(s => s.id === servico_id) || null;
        }

        // If still no service found, return error
        if (!serviceData) {
            return NextResponse.json(
                { error: 'Serviço não encontrado', servico_id },
                { status: 404 }
            );
        }

        // Use in-memory queue as fallback
        const activeQueue = mockQueue.filter(e => e.status === 'em_espera' || e.status === 'em_corte');
        const posicao = activeQueue.length + 1;
        const tempo_espera_estimado = activeQueue.reduce((acc, entry) => {
            // Find service duration - check both mock and the current service
            const entryService = MOCK_SERVICES.find(s => s.id === entry.servico_id);
            return acc + (entryService?.duracao_media || serviceData?.duracao_media || 30);
        }, 0);

        // Create new entry in mock queue
        const newEntry = {
            id: `mock-${Date.now()}`,
            cliente_nome,
            cliente_telefone,
            servico_id,
            status: 'em_espera',
            posicao,
            tempo_espera_estimado,
            deposito_id: deposito_id || null,
            created_at: new Date().toISOString(),
        };

        mockQueue.push(newEntry);

        return NextResponse.json({
            success: true,
            data: {
                ...newEntry,
                servico: serviceData,
            },
            position: posicao,
            tempo_espera_estimado,
            message: 'Entrou na fila com sucesso (modo demo)',
        });

    } catch (error) {
        console.error('Error joining queue:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor', details: String(error) },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const barbearia_id = searchParams.get('barbearia_id');

        const supabase = getSupabase();

        // Try Supabase first for queue data
        if (supabase) {
            try {
                // Get today's start for filtering completed records
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const { data, error } = await supabase
                    .from('fila_virtual')
                    .select('*, servico:servicos(*)')
                    .eq('barbearia_id', barbearia_id || '00000000-0000-0000-0000-000000000001')
                    .in('status', ['em_espera', 'em_corte', 'concluido', 'no_show'])
                    .gte('created_at', today.toISOString())
                    .order('posicao', { ascending: true });

                if (!error && data && data.length > 0) {
                    return NextResponse.json({ success: true, data });
                }
            } catch (supabaseError) {
                console.log('Supabase queue fetch failed, using mock queue');
            }
        }

        // Fallback: Return mock queue with service data
        const activeQueue = mockQueue
            .filter(e => e.status === 'em_espera' || e.status === 'em_corte');

        // We need to enrich queue entries with service data
        const enrichedQueue = await Promise.all(
            activeQueue.map(async (entry) => {
                // Try mock services first
                let serviceData = MOCK_SERVICES.find(s => s.id === entry.servico_id);

                // If not found and looks like UUID, try Supabase
                if (!serviceData && entry.servico_id.includes('-') && supabase) {
                    try {
                        const { data: servicoFromDb } = await supabase
                            .from('servicos')
                            .select('*')
                            .eq('id', entry.servico_id)
                            .single();

                        if (servicoFromDb) {
                            serviceData = servicoFromDb;
                        }
                    } catch (err) {
                        // Use fallback
                    }
                }

                return {
                    ...entry,
                    servico: serviceData || { id: entry.servico_id, nome: 'Serviço', duracao_media: 30, preco: 15 },
                };
            })
        );

        return NextResponse.json({ success: true, data: enrichedQueue });

    } catch (error) {
        console.error('Error getting queue:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
