'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBarbershop } from '@/contexts/BarbershopContext';
import { Loader2 } from 'lucide-react';

// This page handles the /b/[slug] route for client-facing barbershop pages
export default function BarbershopSlugPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const { setBarbershopBySlug, barbershop, isLoading, error } = useBarbershop();

    useEffect(() => {
        if (slug) {
            setBarbershopBySlug(slug);
        }
    }, [slug, setBarbershopBySlug]);

    useEffect(() => {
        // Once barbershop is loaded, redirect to the client page
        if (barbershop && !isLoading) {
            router.push(`/cliente?barbearia=${barbershop.id}`);
        }
    }, [barbershop, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Barbearia não encontrada</h1>
                    <p className="text-muted-foreground">
                        Verifique se o endereço está correcto.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
    );
}
