'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface QueueEntry {
    id: string;
    barbearia_id: string;
    servico_id: string;
    cliente_nome: string;
    cliente_telefone: string;
    status: string;
    posicao: number;
    tempo_espera_estimado: number;
    deposito_pago: boolean;
    deposito_id: string | null;
    created_at: string;
    chamado_at: string | null;
    concluido_at: string | null;
    servico?: {
        id: string;
        nome: string;
        duracao_media: number;
        preco: number;
    };
}

interface UseRealtimeQueueOptions {
    barbeariaId: string;
    enabled?: boolean;
}

interface UseRealtimeQueueReturn {
    queue: QueueEntry[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useRealtimeQueue({
    barbeariaId,
    enabled = true,
}: UseRealtimeQueueOptions): UseRealtimeQueueReturn {
    const [queue, setQueue] = useState<QueueEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const supabase = createClient();

    const fetchQueue = useCallback(async () => {
        try {
            const response = await fetch(`/api/queue/join?barbearia_id=${barbeariaId}`);
            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                setQueue(result.data);
            } else if (Array.isArray(result.data)) {
                setQueue(result.data);
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch queue'));
        } finally {
            setIsLoading(false);
        }
    }, [barbeariaId]);

    useEffect(() => {
        if (!enabled) return;

        // Initial fetch
        fetchQueue();

        // Set up realtime subscription
        let channel: RealtimeChannel | null = null;

        const setupRealtime = async () => {
            channel = supabase
                .channel(`queue-${barbeariaId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Listen to INSERT, UPDATE, DELETE
                        schema: 'public',
                        table: 'fila_virtual',
                        filter: `barbearia_id=eq.${barbeariaId}`,
                    },
                    (payload) => {
                        console.log('Realtime queue change:', payload.eventType);
                        // Refetch the full queue on any change
                        // This is simpler than trying to manage partial updates
                        fetchQueue();
                    }
                )
                .subscribe((status) => {
                    console.log('Realtime queue subscription status:', status);
                });
        };

        setupRealtime();

        // Cleanup
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [barbeariaId, enabled, fetchQueue, supabase]);

    return {
        queue,
        isLoading,
        error,
        refetch: fetchQueue,
    };
}
