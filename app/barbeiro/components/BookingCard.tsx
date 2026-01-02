'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    User,
    Phone,
    Scissors,
    Play,
    CheckCircle,
    XCircle,
    Loader2,
} from 'lucide-react';

export interface Booking {
    id: string;
    cliente_nome: string;
    cliente_telefone: string;
    cliente_email?: string;
    data: string;
    hora: string;
    duracao_minutos: number;
    status: 'pendente' | 'confirmada' | 'em_atendimento' | 'concluida' | 'cancelada' | 'no_show';
    notas?: string;
    deposito_pago: boolean;
    barbeiro?: { nome: string };
    servico?: { nome: string; preco: number };
}

interface BookingCardProps {
    booking: Booking;
    onStatusChange: (id: string, newStatus: Booking['status']) => Promise<void>;
}

const statusConfig = {
    pendente: {
        label: 'Pendente',
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: Clock,
    },
    confirmada: {
        label: 'Confirmada',
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: CheckCircle,
    },
    em_atendimento: {
        label: 'Em Atendimento',
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: Scissors,
    },
    concluida: {
        label: 'Concluída',
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: CheckCircle,
    },
    cancelada: {
        label: 'Cancelada',
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: XCircle,
    },
    no_show: {
        label: 'No-Show',
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: XCircle,
    },
};

export default function BookingCard({ booking, onStatusChange }: BookingCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const config = statusConfig[booking.status];
    const StatusIcon = config.icon;

    const handleStatusChange = async (newStatus: Booking['status']) => {
        setIsLoading(true);
        try {
            await onStatusChange(booking.id, newStatus);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (time: string) => {
        return time.substring(0, 5); // HH:MM
    };

    const getActions = () => {
        switch (booking.status) {
            case 'pendente':
                return (
                    <Button
                        size="sm"
                        onClick={() => handleStatusChange('confirmada')}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
                    </Button>
                );
            case 'confirmada':
                return (
                    <Button
                        size="sm"
                        onClick={() => handleStatusChange('em_atendimento')}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Play className="mr-1 h-3 w-3" /> Iniciar
                            </>
                        )}
                    </Button>
                );
            case 'em_atendimento':
                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => handleStatusChange('concluida')}
                            disabled={isLoading}
                            className="bg-gold text-black hover:bg-gold/90"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="mr-1 h-3 w-3" /> Concluir
                                </>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange('no_show')}
                            disabled={isLoading}
                        >
                            No-Show
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Card className="relative overflow-hidden border-gold/20 bg-card transition-all hover:border-gold/40">
            {/* Time indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold" />

            <CardContent className="p-4 pl-5">
                <div className="flex items-start justify-between gap-4">
                    {/* Left: Time and details */}
                    <div className="flex-1 space-y-2">
                        {/* Time */}
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gold">
                                {formatTime(booking.hora)}
                            </span>
                            <Badge className={`${config.color} border`}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {config.label}
                            </Badge>
                            {booking.deposito_pago && (
                                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                                    💳 Pago
                                </Badge>
                            )}
                        </div>

                        {/* Client info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span className="font-medium text-foreground">
                                    {booking.cliente_nome}
                                </span>
                            </span>
                            <a
                                href={`tel:${booking.cliente_telefone}`}
                                className="flex items-center gap-1 hover:text-gold"
                            >
                                <Phone className="h-4 w-4" />
                                {booking.cliente_telefone}
                            </a>
                        </div>

                        {/* Service info */}
                        <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <Scissors className="h-4 w-4" />
                                {booking.servico?.nome || 'Serviço não especificado'}
                            </span>
                            <span className="text-muted-foreground">
                                {booking.duracao_minutos} min
                            </span>
                            {booking.servico?.preco && (
                                <span className="font-semibold text-gold">
                                    €{booking.servico.preco}
                                </span>
                            )}
                        </div>

                        {/* Notes */}
                        {booking.notas && (
                            <p className="text-xs text-muted-foreground italic">
                                📝 {booking.notas}
                            </p>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex-shrink-0">{getActions()}</div>
                </div>
            </CardContent>
        </Card>
    );
}
