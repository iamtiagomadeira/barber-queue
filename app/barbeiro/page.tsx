'use client';

import AuthGuard from '@/components/AuthGuard';
import QueueList from './components/QueueList';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { Scissors, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

function BarberDashboard() {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/barbeiro/login');
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
                            <p className="text-sm text-muted-foreground">Kiosk Mode</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-4xl space-y-8">
                    <QueueList />

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
