'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Phone, Scissors, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface QueueEntry {
    id: string;
    cliente_nome: string;
    cliente_telefone: string;
    servico: {
        nome: string;
        duracao_media: number;
    } | null;
    posicao: number;
    tempo_espera_estimado: number;
    status: 'em_espera' | 'em_corte' | 'concluido' | 'no_show';
    deposito_id: string | null;
    created_at: string;
}

// Mock data for demonstration when Supabase not connected
const MOCK_QUEUE: QueueEntry[] = [
    {
        id: '1',
        cliente_nome: 'João Silva',
        cliente_telefone: '+351 912 345 678',
        servico: { nome: 'Fade', duracao_media: 45 },
        posicao: 1,
        tempo_espera_estimado: 0,
        status: 'em_espera',
        deposito_id: 'pi_mock_1',
        created_at: new Date().toISOString(),
    },
    {
        id: '2',
        cliente_nome: 'Pedro Santos',
        cliente_telefone: '+351 913 456 789',
        servico: { nome: 'Corte + Barba', duracao_media: 60 },
        posicao: 2,
        tempo_espera_estimado: 45,
        status: 'em_espera',
        deposito_id: 'pi_mock_2',
        created_at: new Date().toISOString(),
    },
    {
        id: '3',
        cliente_nome: 'Miguel Costa',
        cliente_telefone: '+351 914 567 890',
        servico: { nome: 'Barba', duracao_media: 20 },
        posicao: 3,
        tempo_espera_estimado: 105,
        status: 'em_espera',
        deposito_id: 'pi_mock_3',
        created_at: new Date().toISOString(),
    },
];

export default function QueueList() {
    const [queue, setQueue] = useState<QueueEntry[]>([]);
    const [currentCustomer, setCurrentCustomer] = useState<QueueEntry | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const supabase = createClient();

    // Fetch queue from API (supports both Supabase and in-memory fallback)
    const fetchQueue = async () => {
        setIsLoading(true);
        try {
            // Use the API endpoint which handles both Supabase and in-memory queue
            const response = await fetch('/api/queue/join?barbearia_id=00000000-0000-0000-0000-000000000001');
            const result = await response.json();

            if (result.success && result.data && result.data.length > 0) {
                const formattedData = result.data.map((entry: QueueEntry & { servico?: unknown }) => ({
                    ...entry,
                    servico: Array.isArray(entry.servico) ? entry.servico[0] : entry.servico
                })) as QueueEntry[];

                setQueue(formattedData);

                // Set current customer if there's one in 'em_corte' status
                const inService = formattedData.find(e => e.status === 'em_corte');
                if (inService) {
                    setCurrentCustomer(inService);
                }
            } else if (result.data && result.data.length === 0) {
                // Empty queue from API
                setQueue([]);
            }
        } catch (err) {
            console.log('Error fetching queue, using mock data:', err);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchQueue();

        // Set up real-time subscription
        const channel = supabase
            .channel('queue-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'fila_virtual',
                },
                () => {
                    fetchQueue();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleCallNext = async () => {
        const nextCustomer = queue.find((entry) => entry.status === 'em_espera');
        if (!nextCustomer) return;

        setActionLoading('call');

        // Try to update Supabase (may fail if using mock queue)
        try {
            const { error } = await supabase
                .from('fila_virtual')
                .update({
                    status: 'em_corte',
                    chamado_at: new Date().toISOString()
                })
                .eq('id', nextCustomer.id);

            if (error) {
                console.log('Supabase update failed (using mock mode):', error.message);
            }
        } catch (err) {
            console.log('Supabase not available, continuing with local state');
        }

        // Always update local state
        setCurrentCustomer(nextCustomer);
        setQueue(
            queue.map((entry) =>
                entry.id === nextCustomer.id
                    ? { ...entry, status: 'em_corte' as const }
                    : entry
            )
        );

        // Always try to send SMS notification
        try {
            const smsResponse = await fetch('/api/sms/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: nextCustomer.cliente_telefone,
                    message: `Olá ${nextCustomer.cliente_nome}! 🪒 É a sua vez na Barber Queue. Por favor dirija-se à barbearia. Obrigado!`,
                }),
            });
            const smsResult = await smsResponse.json();
            console.log('SMS result:', smsResult);
        } catch (smsError) {
            console.log('SMS notification failed:', smsError);
        }

        setActionLoading(null);
    };

    const handleComplete = async () => {
        if (!currentCustomer) return;

        setActionLoading('complete');

        try {
            // Refund the deposit
            if (currentCustomer.deposito_id && !currentCustomer.deposito_id.startsWith('pi_mock')) {
                await fetch('/api/payment/refund', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentIntentId: currentCustomer.deposito_id }),
                });
            }

            // Update status in Supabase
            const { error } = await supabase
                .from('fila_virtual')
                .update({
                    status: 'concluido',
                    concluido_at: new Date().toISOString()
                })
                .eq('id', currentCustomer.id);

            if (error) throw error;

            // Update local state
            setQueue(queue.filter(entry => entry.id !== currentCustomer.id));
            setCurrentCustomer(null);

        } catch (err) {
            console.error('Error completing:', err);
            // Fallback to local state update
            setQueue(queue.filter(entry => entry.id !== currentCustomer.id));
            setCurrentCustomer(null);
        }

        setActionLoading(null);
    };

    const handleNoShow = async (customer: QueueEntry) => {
        setActionLoading(customer.id);

        try {
            // Capture the deposit (charge for no-show)
            if (customer.deposito_id && !customer.deposito_id.startsWith('pi_mock')) {
                await fetch('/api/payment/capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentIntentId: customer.deposito_id }),
                });
            }

            // Update status in Supabase
            const { error } = await supabase
                .from('fila_virtual')
                .update({ status: 'no_show' })
                .eq('id', customer.id);

            if (error) throw error;

            // Update local state
            setQueue(queue.filter(entry => entry.id !== customer.id));
            if (currentCustomer?.id === customer.id) {
                setCurrentCustomer(null);
            }

        } catch (err) {
            console.error('Error marking no-show:', err);
            // Fallback to local state update
            setQueue(queue.filter(entry => entry.id !== customer.id));
            if (currentCustomer?.id === customer.id) {
                setCurrentCustomer(null);
            }
        }

        setActionLoading(null);
    };

    const formatWaitTime = (minutes: number): string => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) return `${hours}h`;
        return `${hours}h ${remainingMinutes}min`;
    };

    const waitingCount = queue.filter((entry) => entry.status === 'em_espera').length;
    const inServiceCount = queue.filter((entry) => entry.status === 'em_corte').length;

    return (
        <div className="space-y-6">
            {/* Header with Refresh */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Gestão da Fila</h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchQueue}
                    disabled={isLoading}
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="border-gold/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Em Espera
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gold">{waitingCount}</div>
                    </CardContent>
                </Card>
                <Card className="border-gold/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Em Corte
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{inServiceCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Current Customer */}
            {currentCustomer && (
                <Card className="border-gold bg-gold/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Scissors className="h-5 w-5 text-gold" />
                            Cliente Atual
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-lg font-semibold">
                                <User className="h-5 w-5 text-gold" />
                                {currentCustomer.cliente_nome}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                {currentCustomer.cliente_telefone}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Scissors className="h-4 w-4" />
                                {currentCustomer.servico?.nome || 'Serviço'} ({currentCustomer.servico?.duracao_media || 30} min)
                            </div>
                            {currentCustomer.deposito_id && (
                                <Badge variant="outline" className="border-green-500/50 text-green-500">
                                    💳 Depósito pago
                                </Badge>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                onClick={handleComplete}
                                disabled={actionLoading === 'complete'}
                                className="kiosk-button bg-gold text-black hover:bg-gold/90"
                            >
                                {actionLoading === 'complete' ? (
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                ) : (
                                    <CheckCircle className="mr-2 h-6 w-6" />
                                )}
                                Completar
                            </Button>
                            <Button
                                onClick={() => handleNoShow(currentCustomer)}
                                disabled={actionLoading === currentCustomer.id}
                                variant="destructive"
                                className="kiosk-button"
                            >
                                {actionLoading === currentCustomer.id ? (
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                ) : (
                                    <XCircle className="mr-2 h-6 w-6" />
                                )}
                                No-Show
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-4">
                <Button
                    onClick={handleCallNext}
                    disabled={waitingCount === 0 || currentCustomer !== null || actionLoading === 'call'}
                    className="kiosk-button bg-gold text-black hover:bg-gold/90 disabled:opacity-50"
                >
                    {actionLoading === 'call' ? (
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    ) : (
                        <User className="mr-2 h-6 w-6" />
                    )}
                    Chamar Próximo
                </Button>
            </div>

            {/* Queue List */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold">Fila de Espera</h3>
                {queue
                    .filter((entry) => entry.status === 'em_espera')
                    .sort((a, b) => a.posicao - b.posicao)
                    .map((entry) => (
                        <Card key={entry.id} className="border-border/50">
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-lg font-bold text-gold">
                                        {entry.posicao}
                                    </div>
                                    <div>
                                        <div className="font-semibold">{entry.cliente_nome}</div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {entry.cliente_telefone}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Scissors className="h-3 w-3" />
                                                {entry.servico?.nome || 'Serviço'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                ~{formatWaitTime(entry.tempo_espera_estimado)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleNoShow(entry)}
                                    disabled={actionLoading === entry.id}
                                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                >
                                    {actionLoading === entry.id ? (
                                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                    ) : (
                                        <XCircle className="mr-1 h-4 w-4" />
                                    )}
                                    No-Show
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                {waitingCount === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            Nenhum cliente em espera
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
