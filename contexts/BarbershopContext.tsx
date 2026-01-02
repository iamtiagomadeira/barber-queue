'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Barbershop {
    id: string;
    nome: string;
    endereco?: string;
    telefone?: string;
    slug?: string;
}

interface BarbershopContextType {
    barbershop: Barbershop | null;
    barbershopId: string;
    isLoading: boolean;
    error: Error | null;
    setBarbershopBySlug: (slug: string) => Promise<void>;
    setBarbershopById: (id: string) => Promise<void>;
}

const DEFAULT_BARBEARIA_ID = '00000000-0000-0000-0000-000000000001';

const BarbershopContext = createContext<BarbershopContextType | undefined>(undefined);

export function BarbershopProvider({ children }: { children: ReactNode }) {
    const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const supabase = createClient();

    // Get barbershop ID - uses context or falls back to default
    const barbershopId = barbershop?.id || DEFAULT_BARBEARIA_ID;

    // Fetch barbershop by slug (for client-facing pages)
    const setBarbershopBySlug = async (slug: string) => {
        setIsLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('barbearias')
                .select('*')
                .eq('slug', slug)
                .single();

            if (fetchError) throw new Error('Barbearia não encontrada');
            setBarbershop(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao carregar barbearia'));
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch barbershop by ID (for barber-facing pages)
    const setBarbershopById = async (id: string) => {
        setIsLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('barbearias')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) throw new Error('Barbearia não encontrada');
            setBarbershop(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao carregar barbearia'));
        } finally {
            setIsLoading(false);
        }
    };

    // For barber pages, try to get barbershop from authenticated user's profile
    useEffect(() => {
        const fetchFromAuth = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    // Try to get user's barbershop from profiles table
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('barbearia_id')
                        .eq('id', user.id)
                        .single();

                    if (profile?.barbearia_id) {
                        await setBarbershopById(profile.barbearia_id);
                        return;
                    }
                }

                // Fall back to default
                await setBarbershopById(DEFAULT_BARBEARIA_ID);
            } catch {
                // Fall back to default on any error
                setIsLoading(false);
            }
        };

        fetchFromAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <BarbershopContext.Provider
            value={{
                barbershop,
                barbershopId,
                isLoading,
                error,
                setBarbershopBySlug,
                setBarbershopById,
            }}
        >
            {children}
        </BarbershopContext.Provider>
    );
}

export function useBarbershop() {
    const context = useContext(BarbershopContext);
    if (context === undefined) {
        // Return default values if used outside provider
        return {
            barbershop: null,
            barbershopId: DEFAULT_BARBEARIA_ID,
            isLoading: false,
            error: null,
            setBarbershopBySlug: async () => { },
            setBarbershopById: async () => { },
        };
    }
    return context;
}

// Hook for getting current barbershop ID (convenience)
export function useCurrentBarbershopId(): string {
    const { barbershopId } = useBarbershop();
    return barbershopId;
}
