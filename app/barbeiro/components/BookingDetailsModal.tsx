'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Clock,
    User,
    Phone,
    Scissors,
    Calendar,
    CheckCircle2,
    XCircle,
    PlayCircle,
    Loader2,
    Euro
} from 'lucide-react';
import { Booking } from './BookingCard';

interface BookingDetailsModalProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange?: (id: string, status: Booking['status']) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    pendente: { label: 'Pendente', color: 'text-yellow-600', bgColor: 'bg-yellow-500/20' },
    confirmada: { label: 'Confirmada', color: 'text-green-600', bgColor: 'bg-green-500/20' },
    em_atendimento: { label: 'Em Atendimento', color: 'text-blue-600', bgColor: 'bg-blue-500/20' },
    concluida: { label: 'Concluída', color: 'text-gray-600', bgColor: 'bg-gray-500/20' },
    cancelada: { label: 'Cancelada', color: 'text-red-600', bgColor: 'bg-red-500/20' },
    no_show: { label: 'No Show', color: 'text-red-600', bgColor: 'bg-red-500/20' },
};

export default function BookingDetailsModal({
    booking,
    isOpen,
    onClose,
    onStatusChange
}: BookingDetailsModalProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);

    if (!booking) return null;

    const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pendente;

    const handleStatusChange = async (newStatus: Booking['status']) => {
        if (!onStatusChange) return;

        setIsUpdating(true);
        setActionInProgress(newStatus);
        try {
            await onStatusChange(booking.id, newStatus);
            // Keep modal open to show updated status
        } catch (error) {
            console.error('Error changing status:', error);
        } finally {
            setIsUpdating(false);
            setActionInProgress(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-gold" />
                        {booking.cliente_nome}
                    </DialogTitle>
                    <DialogDescription>
                        Detalhes da marcação
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Estado</span>
                        <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                            {statusConfig.label}
                        </Badge>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Data
                        </span>
                        <span className="font-medium">{formatDate(booking.data)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Hora
                        </span>
                        <span className="font-medium">{booking.hora.substring(0, 5)}</span>
                    </div>

                    {/* Service */}
                    {booking.servico && (
                        <>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Scissors className="h-4 w-4" />
                                    Serviço
                                </span>
                                <span className="font-medium">{booking.servico.nome}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Euro className="h-4 w-4" />
                                    Preço
                                </span>
                                <span className="font-medium text-gold">{booking.servico.preco}€</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Duração</span>
                                <span className="font-medium">{booking.duracao_minutos} minutos</span>
                            </div>
                        </>
                    )}

                    {/* Phone */}
                    {booking.cliente_telefone && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Telefone
                            </span>
                            <a
                                href={`tel:${booking.cliente_telefone}`}
                                className="font-medium text-gold hover:underline"
                            >
                                {booking.cliente_telefone}
                            </a>
                        </div>
                    )}

                    {/* Notes */}
                    {booking.notas && (
                        <div className="border-t pt-4">
                            <span className="text-sm text-muted-foreground">Notas</span>
                            <p className="mt-1 text-sm">{booking.notas}</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {onStatusChange && booking.status !== 'concluida' && booking.status !== 'cancelada' && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                        {booking.status === 'pendente' && (
                            <Button
                                size="sm"
                                onClick={() => handleStatusChange('confirmada')}
                                disabled={isUpdating}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                {actionInProgress === 'confirmada' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                )}
                                Confirmar
                            </Button>
                        )}

                        {(booking.status === 'pendente' || booking.status === 'confirmada') && (
                            <Button
                                size="sm"
                                onClick={() => handleStatusChange('em_atendimento')}
                                disabled={isUpdating}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                {actionInProgress === 'em_atendimento' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                )}
                                Iniciar
                            </Button>
                        )}

                        {booking.status === 'em_atendimento' && (
                            <Button
                                size="sm"
                                onClick={() => handleStatusChange('concluida')}
                                disabled={isUpdating}
                                className="flex-1 bg-gold text-black hover:bg-gold/90"
                            >
                                {actionInProgress === 'concluida' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                )}
                                Concluir
                            </Button>
                        )}

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange('cancelada')}
                            disabled={isUpdating}
                            className="text-destructive hover:bg-destructive/10"
                        >
                            {actionInProgress === 'cancelada' ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Cancelar
                        </Button>
                    </div>
                )}

                <div className="pt-2">
                    <Button onClick={onClose} variant="ghost" className="w-full">
                        Fechar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
