'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Booking {
    id: string;
    barbearia_id: string;
    barbeiro_id: string | null;
    servico_id: string | null;
    cliente_nome: string;
    cliente_telefone: string;
    cliente_email?: string;
    data: string;
    hora: string;
    duracao_minutos: number;
    status: string;
    notas?: string;
    deposito_pago: boolean;
    deposito_id?: string;
    created_at: string;
    barbeiro?: { nome: string };
    servico?: { nome: string; preco: number };
}

interface UseRealtimeBookingsOptions {
    barbeariaId: string;
    date?: string; // YYYY-MM-DD format
    enabled?: boolean;
}

interface UseRealtimeBookingsReturn {
    bookings: Booking[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useRealtimeBookings({
    barbeariaId,
    date,
    enabled = true,
}: UseRealtimeBookingsOptions): UseRealtimeBookingsReturn {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const supabase = createClient();

    const fetchBookings = useCallback(async () => {
        try {
            let url = `/api/bookings?barbearia_id=${barbeariaId}`;
            if (date) {
                url += `&data=${date}`;
            }

            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                setBookings(result.data || []);
            }
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch bookings'));
        } finally {
            setIsLoading(false);
        }
    }, [barbeariaId, date]);

    useEffect(() => {
        if (!enabled) return;

        // Initial fetch
        fetchBookings();

        // Set up realtime subscription
        let channel: RealtimeChannel | null = null;

        const setupRealtime = async () => {
            channel = supabase
                .channel(`bookings-${barbeariaId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*', // Listen to INSERT, UPDATE, DELETE
                        schema: 'public',
                        table: 'marcacoes',
                        filter: `barbearia_id=eq.${barbeariaId}`,
                    },
                    (payload) => {
                        console.log('Realtime booking change:', payload.eventType);
                        // Refetch on any change
                        fetchBookings();
                    }
                )
                .subscribe((status) => {
                    console.log('Realtime bookings subscription status:', status);
                });
        };

        setupRealtime();

        // Cleanup
        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [barbeariaId, date, enabled, fetchBookings, supabase]);

    return {
        bookings,
        isLoading,
        error,
        refetch: fetchBookings,
    };
}
