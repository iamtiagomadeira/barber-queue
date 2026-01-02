'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Scissors } from 'lucide-react';

// This page redirects barbers to their specific barbershop dashboard
export default function BarbeiroIndexPage() {
    const router = useRouter();
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function redirectToShop() {
            try {
                // Check if user is authenticated
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/barbeiro/login');
                    return;
                }

                // Get user's barbershop from profile
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('barbearia_id')
                    .eq('id', user.id)
                    .single();

                if (profileError || !profile?.barbearia_id) {
                    setError('Conta de barbeiro não configurada. Contacte o administrador.');
                    return;
                }

                // Get barbershop slug
                const { data: shop, error: shopError } = await supabase
                    .from('barbearias')
                    .select('slug')
                    .eq('id', profile.barbearia_id)
                    .single();

                if (shopError || !shop?.slug) {
                    setError('Barbearia não encontrada. Contacte o administrador.');
                    return;
                }

                // Redirect to specific barbershop dashboard
                router.push(`/barbeiro/${shop.slug}`);

            } catch {
                setError('Erro ao carregar. Tente novamente.');
            } finally {
                setIsLoading(false);
            }
        }

        redirectToShop();
    }, [router, supabase]);

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <Scissors className="h-12 w-12 text-gold mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Erro</h1>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/barbeiro/login')}
                        className="text-gold hover:underline"
                    >
                        Voltar ao Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto mb-4" />
                <p className="text-muted-foreground">A carregar a sua barbearia...</p>
            </div>
        </div>
    );
}
