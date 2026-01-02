'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Clock,
    Scissors,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';

interface QueuePosition {
    id: string;
    posicao: number;
    status: string;
    tempo_espera_estimado: number;
    cliente_nome: string;
    servico?: {
        nome: string;
        duracao_media: number;
        preco: number;
    };
    created_at: string;
}

export default function QueuePositionPage() {
    const params = useParams();
    const ticketId = params.ticketId as string;

    const [position, setPosition] = useState<QueuePosition | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLeaving, setIsLeaving] = useState(false);
    const supabase = createClient();

    const fetchPosition = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('fila_virtual')
                .select('*, servico:servicos(nome, duracao_media, preco)')
                .eq('id', ticketId)
                .single();

            if (fetchError) {
                setError('Posição não encontrada');
                return;
            }

            setPosition(data);
            setError(null);
        } catch {
            setError('Erro ao carregar posição');
        } finally {
            setIsLoading(false);
        }
    }, [ticketId, supabase]);

    useEffect(() => {
        fetchPosition();

        // Set up realtime subscription
        const channel = supabase
            .channel(`queue-position-${ticketId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'fila_virtual',
                    filter: `id=eq.${ticketId}`,
                },
                () => {
                    fetchPosition();
                }
            )
            .subscribe();

        // Also poll every 30 seconds as backup
        const interval = setInterval(fetchPosition, 30000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [ticketId, fetchPosition, supabase]);

    const handleLeaveQueue = async () => {
        if (!confirm('Tem a certeza que deseja sair da fila?')) return;

        setIsLeaving(true);
        try {
            const { error: updateError } = await supabase
                .from('fila_virtual')
                .update({ status: 'cancelado' })
                .eq('id', ticketId);

            if (updateError) {
                alert('Erro ao sair da fila');
            } else {
                // Position will update via realtime
            }
        } finally {
            setIsLeaving(false);
        }
    };

    const getStatusDisplay = () => {
        if (!position) return null;

        switch (position.status) {
            case 'em_espera':
                return {
                    icon: <Clock className="h-8 w-8" />,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-500/10',
                    title: 'Na Fila',
                    description: 'Aguarde a sua vez',
                };
            case 'em_corte':
                return {
                    icon: <Scissors className="h-8 w-8" />,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-500/10',
                    title: 'É a sua vez!',
                    description: 'Dirija-se ao barbeiro',
                };
            case 'concluido':
                return {
                    icon: <CheckCircle className="h-8 w-8" />,
                    color: 'text-green-500',
                    bgColor: 'bg-green-500/10',
                    title: 'Concluído',
                    description: 'Obrigado pela visita!',
                };
            case 'cancelado':
            case 'no_show':
                return {
                    icon: <XCircle className="h-8 w-8" />,
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-500/10',
                    title: 'Cancelado',
                    description: 'Já não está na fila',
                };
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        );
    }

    if (error || !position) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-red-500/30">
                    <CardContent className="p-6 text-center">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h1 className="text-xl font-bold mb-2">Posição não encontrada</h1>
                        <p className="text-muted-foreground">
                            O ticket pode ter expirado ou sido removido da fila.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusDisplay = getStatusDisplay();

    return (
        <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Scissors className="h-6 w-6 text-gold" />
                        <span className="text-gold font-semibold">Ventus</span>
                    </div>
                    <h1 className="text-2xl font-bold">A Sua Posição</h1>
                </div>

                {/* Main Status Card */}
                <Card className="border-gold/30">
                    <CardContent className="p-6">
                        <div className={`${statusDisplay?.bgColor} rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4`}>
                            <div className={statusDisplay?.color}>
                                {statusDisplay?.icon}
                            </div>
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold">{statusDisplay?.title}</h2>
                            <p className="text-muted-foreground">{statusDisplay?.description}</p>
                        </div>

                        {position.status === 'em_espera' && (
                            <>
                                {/* Position Number */}
                                <div className="text-center mb-6">
                                    <div className="text-6xl font-bold text-gold mb-1">
                                        {position.posicao}º
                                    </div>
                                    <p className="text-sm text-muted-foreground">na fila</p>
                                </div>

                                {/* Estimated Wait */}
                                <div className="flex items-center justify-center gap-2 mb-6">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-lg">
                                        Tempo estimado: <strong>{position.tempo_espera_estimado} min</strong>
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Service Info */}
                        {position.servico && (
                            <div className="bg-muted/30 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-muted-foreground">Serviço:</span>
                                    <span className="font-medium">{position.servico.nome}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Preço:</span>
                                    <span className="font-medium text-gold">€{position.servico.preco}</span>
                                </div>
                            </div>
                        )}

                        {/* Refresh Button */}
                        <Button
                            variant="outline"
                            className="w-full mb-2"
                            onClick={fetchPosition}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Atualizar
                        </Button>

                        {/* Leave Queue Button */}
                        {position.status === 'em_espera' && (
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleLeaveQueue}
                                disabled={isLeaving}
                            >
                                {isLeaving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <XCircle className="mr-2 h-4 w-4" />
                                )}
                                Sair da Fila
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Info */}
                <p className="text-center text-sm text-muted-foreground">
                    Esta página atualiza automaticamente.
                    <br />
                    Receberá um SMS quando for a sua vez.
                </p>
            </div>
        </div>
    );
}
