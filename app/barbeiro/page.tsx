'use client';

import { useState, useCallback, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import QueueList from './components/QueueList';
import ManualEntryForm from './components/ManualEntryForm';
import { QueueToggle } from './components/QueueToggle';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { Scissors, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// ID da barbearia por defeito (para MVP single-barbershop)
const DEFAULT_BARBEARIA_ID = '00000000-0000-0000-0000-000000000001';

function BarberDashboard() {
    const router = useRouter();
    const supabase = createClient();
    const [refreshKey, setRefreshKey] = useState(0);
    const [queueOpen, setQueueOpen] = useState(true);

    // Fetch queue status on mount
    useEffect(() => {
        async function fetchStatus() {
            try {
                const response = await fetch(`/api/barbershop/status?barbearia_id=${DEFAULT_BARBEARIA_ID}`);
                const result = await response.json();
                if (result.success && result.data) {
                    setQueueOpen(result.data.fila_aberta);
                }
            } catch (error) {
                console.log('Error fetching queue status:', error);
            }
        }
        fetchStatus();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/barbeiro/login');
    };

    // Função para forçar refresh da lista quando um cliente é adicionado manualmente
    const handleQueueRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    // Toggle queue open/closed
    const handleQueueToggle = async (newState: boolean) => {
        try {
            const response = await fetch('/api/barbershop/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barbearia_id: DEFAULT_BARBEARIA_ID,
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
                            <h1 className="text-lg font-bold">Painel do Barbeiro</h1>
                            <p className="text-sm text-muted-foreground">Ventus</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <QueueToggle isOpen={queueOpen} onToggle={handleQueueToggle} />
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
                    {/* Formulário de Entrada Manual */}
                    <ManualEntryForm
                        barbeariaId={DEFAULT_BARBEARIA_ID}
                        onAdded={handleQueueRefresh}
                    />

                    {/* Lista da Fila */}
                    <QueueList key={refreshKey} />

                    {/* QR Code Section */}
                    <div className="rounded-lg border border-gold/20 bg-card/50 p-6">
                        <h2 className="mb-4 text-lg font-semibold">QR Code para Clientes</h2>
                        <QRCodeDisplay />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function BarbeiroPage() {
    return (
        <AuthGuard>
            <BarberDashboard />
        </AuthGuard>
    );
}


