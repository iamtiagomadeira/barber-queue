'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, UserCheck, CheckCircle2 } from 'lucide-react';

interface StatsCardsProps {
    waitingCount: number;
    inServiceCount: number;
    completedToday: number;
    avgWaitTime: number;
}

export function StatsCards({ waitingCount, inServiceCount, completedToday, avgWaitTime }: StatsCardsProps) {
    const stats = [
        {
            label: 'Na Fila',
            value: waitingCount,
            icon: Users,
            color: 'text-gold',
            bgColor: 'bg-gold/10',
        },
        {
            label: 'A Cortar',
            value: inServiceCount,
            icon: UserCheck,
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
        },
        {
            label: 'Finalizados',
            value: completedToday,
            icon: CheckCircle2,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            label: 'Espera Média',
            value: `${avgWaitTime}min`,
            icon: Clock,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
        },
    ];

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
