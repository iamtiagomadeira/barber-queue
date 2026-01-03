'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Scissors,
    Clock,
    Users,
    Loader2,
    CalendarCheck,
    MapPin,
    Phone,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import QueueForm from '@/components/QueueForm';
import BookingForm from '@/components/BookingForm';

interface Barbershop {
    id: string;
    nome: string;
    slug: string;
    endereco?: string;
    telefone?: string;
    fila_aberta: boolean;
}

interface Service {
    id: string;
    nome: string;
    duracao_media: number;
    preco: number;
}

type ViewMode = 'queue' | 'booking';

export default function ClientBarbershopPage() {
    const params = useParams();
    const slug = params.slug as string;
    const supabase = createClient();

    const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [queueCount, setQueueCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<ViewMode>('queue');

    useEffect(() => {
        async function loadBarbershop() {
            try {
                // Fetch barbershop by slug
                const { data: shop, error: shopError } = await supabase
                    .from('barbearias')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (shopError || !shop) {
                    setError('Barbearia não encontrada');
                    return;
                }

                setBarbershop(shop);

                // Fetch services
                const { data: servicesData } = await supabase
                    .from('servicos')
                    .select('*')
                    .eq('barbearia_id', shop.id)
                    .eq('activo', true)
                    .order('nome');

                setServices(servicesData || []);

                // Fetch queue count
                const { count } = await supabase
                    .from('fila_virtual')
                    .select('*', { count: 'exact', head: true })
                    .eq('barbearia_id', shop.id)
                    .in('status', ['em_espera', 'em_corte']);

                setQueueCount(count || 0);

            } catch {
                setError('Erro ao carregar barbearia');
            } finally {
                setIsLoading(false);
            }
        }

        loadBarbershop();

        // Set up realtime subscription for queue updates
        const channel = supabase
            .channel(`client-queue-${slug}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'fila_virtual',
                },
                () => {
                    // Refetch queue count
                    loadBarbershop();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [slug, supabase]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        );
    }

    if (error || !barbershop) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center">
                    <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Barbearia não encontrada</h1>
                    <p className="text-muted-foreground">{error || 'Verifique o endereço'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
                            <Scissors className="h-7 w-7 text-gold" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{barbershop.nome}</h1>
                            {barbershop.endereco && (
                                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {barbershop.endereco}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-2xl space-y-6">
                    {/* Status Card */}
                    <Card className="border-gold/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-lg font-medium">{queueCount} na fila</span>
                                    </div>
                                    <Badge className={barbershop.fila_aberta ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                                        {barbershop.fila_aberta ? 'Aberto' : 'Fechado'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* View Toggle */}
                    <div className="flex justify-center">
                        <div className="inline-flex items-center rounded-lg border border-gold/20 bg-card p-1">
                            <Button
                                variant={view === 'queue' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setView('queue')}
                                className={view === 'queue' ? 'bg-gold text-black hover:bg-gold/90 hover:text-black' : 'hover:bg-gold/20 hover:text-foreground'}
                            >
                                <Users className="mr-2 h-4 w-4" />
                                Fila Virtual
                            </Button>
                            <Button
                                variant={view === 'booking' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setView('booking')}
                                className={view === 'booking' ? 'bg-gold text-black hover:bg-gold/90 hover:text-black' : 'hover:bg-gold/20 hover:text-foreground'}
                            >
                                <CalendarCheck className="mr-2 h-4 w-4" />
                                Marcar
                            </Button>
                        </div>
                    </div>

                    {/* Forms */}
                    <div className="flex justify-center">
                        {view === 'queue' ? (
                            <QueueForm
                                barbeariaId={barbershop.id}
                                services={services}
                            />
                        ) : (
                            <BookingForm
                                barbeariaId={barbershop.id}
                                services={services}
                            />
                        )}
                    </div>

                    {/* Contact */}
                    {barbershop.telefone && (
                        <Card className="border-border/40">
                            <CardContent className="p-4">
                                <a
                                    href={`tel:${barbershop.telefone}`}
                                    className="flex items-center justify-center gap-2 text-muted-foreground hover:text-gold transition-colors"
                                >
                                    <Phone className="h-4 w-4" />
                                    {barbershop.telefone}
                                </a>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
