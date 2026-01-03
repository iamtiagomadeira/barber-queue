'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
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
    Euro,
    X
} from 'lucide-react';
import { Booking } from './BookingCard';

interface BookingDetailsModalProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange?: (id: string, status: Booking['status']) => void;
}

const STATUS_CONFIG: Record<string, { label: string; dotColor: string; bgColor: string }> = {
    pendente: { label: 'Pendente', dotColor: 'bg-amber-400', bgColor: 'bg-amber-400/10 text-amber-400' },
    confirmada: { label: 'Confirmada', dotColor: 'bg-emerald-400', bgColor: 'bg-emerald-400/10 text-emerald-400' },
    em_atendimento: { label: 'Em Atendimento', dotColor: 'bg-sky-400', bgColor: 'bg-sky-400/10 text-sky-400' },
    concluida: { label: 'Concluída', dotColor: 'bg-zinc-400', bgColor: 'bg-zinc-400/10 text-zinc-400' },
    cancelada: { label: 'Cancelada', dotColor: 'bg-red-400', bgColor: 'bg-red-400/10 text-red-400' },
    no_show: { label: 'No Show', dotColor: 'bg-red-400', bgColor: 'bg-red-400/10 text-red-400' },
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
        } catch (error) {
            console.error('Error changing status:', error);
        } finally {
            setIsUpdating(false);
            setActionInProgress(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${day} ${months[parseInt(month) - 1]} ${year}`;
    };

    const formatPhone = (phone: string) => {
        // Format: +351 912 345 678
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('351') && cleaned.length === 12) {
            return `+351 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
        }
        return phone;
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-[420px] bg-zinc-900 border-zinc-800 p-0 gap-0 overflow-hidden">
                {/* Header with gradient */}
                <div className="bg-gradient-to-br from-gold/20 via-gold/10 to-transparent p-6 pb-4">
                    <DialogHeader className="text-left">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                                    <User className="h-6 w-6 text-gold" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-semibold text-white">
                                        {booking.cliente_nome}
                                    </DialogTitle>
                                    <Badge className={`mt-1 border-0 ${statusConfig.bgColor}`}>
                                        <span className={`w-2 h-2 rounded-full mr-2 ${statusConfig.dotColor}`} />
                                        {statusConfig.label}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="bg-zinc-800/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                                <Calendar className="h-4 w-4" />
                                Data
                            </div>
                            <p className="text-white font-medium">{formatDate(booking.data)}</p>
                        </div>

                        {/* Time */}
                        <div className="bg-zinc-800/50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                                <Clock className="h-4 w-4" />
                                Hora
                            </div>
                            <p className="text-white font-medium">{booking.hora.substring(0, 5)}</p>
                        </div>
                    </div>

                    {/* Service */}
                    {booking.servico && (
                        <div className="bg-zinc-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-zinc-400 text-sm mb-1">
                                        <Scissors className="h-4 w-4" />
                                        Serviço
                                    </div>
                                    <p className="text-white font-medium">{booking.servico.nome}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-gold">{booking.servico.preco}€</p>
                                    <p className="text-xs text-zinc-500">{booking.duracao_minutos} min</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phone */}
                    {booking.cliente_telefone && (
                        <a
                            href={`tel:${booking.cliente_telefone}`}
                            className="flex items-center gap-3 bg-zinc-800/50 rounded-xl p-4 hover:bg-zinc-800 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-colors">
                                <Phone className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                                <p className="text-xs text-zinc-400">Telefone</p>
                                <p className="text-white font-medium">{formatPhone(booking.cliente_telefone)}</p>
                            </div>
                        </a>
                    )}

                    {/* Notes */}
                    {booking.notas && (
                        <div className="bg-zinc-800/50 rounded-xl p-4">
                            <p className="text-xs text-zinc-400 mb-1">Notas</p>
                            <p className="text-white text-sm">{booking.notas}</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                {onStatusChange && booking.status !== 'concluida' && booking.status !== 'cancelada' && (
                    <div className="p-6 pt-0 space-y-3">
                        {/* Primary Action */}
                        {booking.status === 'pendente' && (
                            <Button
                                onClick={() => handleStatusChange('confirmada')}
                                disabled={isUpdating}
                                className="w-full h-12 bg-gold hover:bg-gold/90 text-black font-semibold"
                            >
                                {actionInProgress === 'confirmada' ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="mr-2 h-5 w-5" />
                                )}
                                Confirmar Marcação
                            </Button>
                        )}

                        {(booking.status === 'pendente' || booking.status === 'confirmada') && (
                            <Button
                                onClick={() => handleStatusChange('em_atendimento')}
                                disabled={isUpdating}
                                className={`w-full h-12 font-semibold ${booking.status === 'confirmada'
                                        ? 'bg-gold hover:bg-gold/90 text-black'
                                        : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                                    }`}
                            >
                                {actionInProgress === 'em_atendimento' ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <PlayCircle className="mr-2 h-5 w-5" />
                                )}
                                Iniciar Atendimento
                            </Button>
                        )}

                        {booking.status === 'em_atendimento' && (
                            <Button
                                onClick={() => handleStatusChange('concluida')}
                                disabled={isUpdating}
                                className="w-full h-12 bg-gold hover:bg-gold/90 text-black font-semibold"
                            >
                                {actionInProgress === 'concluida' ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="mr-2 h-5 w-5" />
                                )}
                                Concluir Serviço
                            </Button>
                        )}

                        {/* Secondary actions row */}
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleStatusChange('cancelada')}
                                disabled={isUpdating}
                                variant="ghost"
                                className="flex-1 h-10 text-zinc-400 hover:text-red-400 hover:bg-red-400/10"
                            >
                                {actionInProgress === 'cancelada' ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <XCircle className="mr-2 h-4 w-4" />
                                )}
                                Cancelar
                            </Button>
                            <Button
                                onClick={onClose}
                                variant="ghost"
                                className="flex-1 h-10 text-zinc-400 hover:text-white hover:bg-zinc-800"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Fechar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Closed state - just close button */}
                {(!onStatusChange || booking.status === 'concluida' || booking.status === 'cancelada') && (
                    <div className="p-6 pt-0">
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            className="w-full h-10 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                            Fechar
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
