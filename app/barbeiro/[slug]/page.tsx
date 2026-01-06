'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import QueueList from '@/app/barbeiro/components/QueueList';
import ManualEntryForm from '@/app/barbeiro/components/ManualEntryForm';
import { QueueToggle } from '@/app/barbeiro/components/QueueToggle';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { Scissors, LogOut, Settings2, Loader2, Users, Calendar, Monitor, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import BookingsCalendar from '@/app/barbeiro/components/BookingsCalendar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ViewMode = 'queue' | 'calendar';

interface Barbershop {
    id: string;
    nome: string;
    slug: string;
    fila_aberta: boolean;
}

function BarberDashboardContent({ barbershop }: { barbershop: Barbershop }) {
    const router = useRouter();
    const supabase = createClient();
    const [refreshKey, setRefreshKey] = useState(0);
    const [queueOpen, setQueueOpen] = useState(barbershop.fila_aberta);
    const [view, setView] = useState<ViewMode>('queue');
    const [isClearing, setIsClearing] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/barbeiro/login');
    };

    const handleQueueRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    const handleQueueToggle = async (newState: boolean) => {
        try {
            const response = await fetch('/api/barbershop/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barbearia_id: barbershop.id,
                    fila_aberta: newState,
                }),
            });
            const result = await response.json();
            if (result.success) {
                setQueueOpen(newState);
            }
        } catch (error) {
            console.error('Error toggling queue:', error);
            throw error;
        }
    };

    const handleOpenKiosk = () => {
        window.open(`/b/${barbershop.slug}`, '_blank', 'fullscreen=yes');
    };

    const handleClearQueue = async () => {
        setIsClearing(true);
        try {
            // Use API route to clear queue (server-side has full access)
            const response = await fetch('/api/queue/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barbearia_id: barbershop.id }),
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Erro ao limpar fila');

            handleQueueRefresh();
        } catch (error) {
            console.error('Error clearing queue:', error);
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                            <Scissors className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">{barbershop.nome}</h1>
                            <p className="text-sm text-muted-foreground">Painel do Barbeiro</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <QueueToggle isOpen={queueOpen} onToggle={handleQueueToggle} />

                        {/* Kiosk Mode Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenKiosk}
                            className="bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
                        >
                            <Monitor className="mr-2 h-4 w-4" />
                            Modo Quiosque
                        </Button>

                        {/* Clear Queue Button */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                                    disabled={isClearing}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Fechar Dia
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Fechar Dia / Limpar Fila</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Isto irá remover todas as senhas pendentes da fila. Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleClearQueue}
                                        className="bg-red-500 hover:bg-red-600"
                                    >
                                        Confirmar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="outline" size="sm" onClick={() => router.push(`/barbeiro/${barbershop.slug}/settings`)}>
                            <Settings2 className="mr-2 h-4 w-4" />
                            Definições
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-4xl space-y-8">
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
                                variant={view === 'calendar' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setView('calendar')}
                                className={view === 'calendar' ? 'bg-gold text-black hover:bg-gold/90 hover:text-black' : 'hover:bg-gold/20 hover:text-foreground'}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                Calendário
                            </Button>
                        </div>
                    </div>

                    {view === 'queue' ? (
                        <div className="space-y-8">
                            <ManualEntryForm
                                barbeariaId={barbershop.id}
                                onAdded={handleQueueRefresh}
                            />
                            <QueueList key={refreshKey} barbeariaId={barbershop.id} />
                            <div className="rounded-lg border border-gold/20 bg-card/50 p-6">
                                <h2 className="mb-4 text-lg font-semibold">QR Code para Clientes</h2>
                                <QRCodeDisplay barbershopSlug={barbershop.slug} />
                            </div>
                        </div>
                    ) : (
                        <BookingsCalendar barbearia_id={barbershop.id} />
                    )}
                </div>
            </main>
        </div>
    );
}

function BarberDashboard() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const supabase = createClient();

    const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadBarbershop() {
            try {
                // First, verify the user is authenticated
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/barbeiro/login');
                    return;
                }

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

                // Verify user belongs to this barbershop (via profiles table)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('barbearia_id')
                    .eq('id', user.id)
                    .single();

                if (profile?.barbearia_id !== shop.id) {
                    setError('Não tem permissão para aceder a esta barbearia');
                    return;
                }

                setBarbershop(shop);
            } catch {
                setError('Erro ao carregar barbearia');
            } finally {
                setIsLoading(false);
            }
        }

        loadBarbershop();
    }, [slug, router, supabase]);

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
                    <h1 className="text-2xl font-bold mb-2 text-destructive">Erro</h1>
                    <p className="text-muted-foreground">{error || 'Barbearia não encontrada'}</p>
                    <Button className="mt-4" onClick={() => router.push('/barbeiro/login')}>
                        Voltar ao Login
                    </Button>
                </div>
            </div>
        );
    }

    return <BarberDashboardContent barbershop={barbershop} />;
}

export default function BarbeiroSlugPage() {
    return (
        <AuthGuard>
            <BarberDashboard />
        </AuthGuard>
    );
}
