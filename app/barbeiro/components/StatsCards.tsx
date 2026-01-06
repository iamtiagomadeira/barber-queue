'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, UserCheck, CheckCircle2, QrCode, Share2 } from 'lucide-react';

interface StatsCardsProps {
    waitingCount: number;
    inServiceCount: number;
    completedToday: number;
    avgWaitTime: number;
    slug?: string;
}

export function StatsCards({ waitingCount, inServiceCount, completedToday, avgWaitTime, slug }: StatsCardsProps) {
    // Safely format values - handle NaN, undefined, null
    const safeValue = (val: number | string | undefined | null): string | number => {
        if (val === undefined || val === null) return 0;
        if (typeof val === 'number' && (isNaN(val) || !isFinite(val))) return 0;
        return val;
    };

    const formatWaitTime = (minutes: number): string => {
        if (isNaN(minutes) || !isFinite(minutes) || minutes <= 0) return '--';
        return `${Math.round(minutes)}min`;
    };

    // Check if this is a brand new barbershop with no activity
    const isEmptyState = waitingCount === 0 && inServiceCount === 0 && completedToday === 0;

    const stats = [
        {
            label: 'Na Fila',
            value: safeValue(waitingCount),
            icon: Users,
            color: 'text-gold',
            bgColor: 'bg-gold/10',
        },
        {
            label: 'A Cortar',
            value: safeValue(inServiceCount),
            icon: UserCheck,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
        },
        {
            label: 'Finalizados',
            value: safeValue(completedToday),
            icon: CheckCircle2,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            label: 'Espera Média',
            value: formatWaitTime(avgWaitTime),
            icon: Clock,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
        },
    ];

    // Show motivating empty state for new barbershops
    if (isEmptyState) {
        return (
            <Card className="border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
                <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
                            <QrCode className="h-8 w-8 text-gold" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-1">A sua fila está vazia!</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                                Partilhe o QR Code ou o link da sua barbearia para começar a receber clientes.
                            </p>
                        </div>
                        {slug && (
                            <div className="flex gap-2 mt-2">
                                <a
                                    href={`/b/${slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/10 text-gold text-sm font-medium hover:bg-gold/20 transition-colors"
                                >
                                    <Share2 className="h-4 w-4" />
                                    Ver Página do Cliente
                                </a>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.label} className="border-gold/10 bg-card/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
