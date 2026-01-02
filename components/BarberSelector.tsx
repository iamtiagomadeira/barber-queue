'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Check } from 'lucide-react';
import Image from 'next/image';

interface Barber {
    id: string;
    nome: string;
    foto_url: string | null;
    bio?: string;
    especialidades?: string[];
}

interface BarberSelectorProps {
    barbers: Barber[];
    selectedBarberId: string | null;
    onSelect: (barberId: string) => void;
}

export function BarberSelector({ barbers, selectedBarberId, onSelect }: BarberSelectorProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Escolha o Barbeiro</h3>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {/* "Any Barber" option */}
                <Card
                    className={`cursor-pointer transition-all hover:border-gold/50 ${selectedBarberId === 'any'
                            ? 'border-gold bg-gold/10 ring-2 ring-gold'
                            : 'border-border/50'
                        }`}
                    onClick={() => onSelect('any')}
                >
                    <CardContent className="flex flex-col items-center p-4">
                        <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-gold/5">
                            <User className="h-8 w-8 text-gold" />
                            {selectedBarberId === 'any' && (
                                <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold">
                                    <Check className="h-4 w-4 text-black" />
                                </div>
                            )}
                        </div>
                        <span className="text-sm font-medium">Qualquer</span>
                        <span className="text-xs text-muted-foreground">Barbeiro disponível</span>
                    </CardContent>
                </Card>

                {/* Individual barbers */}
                {barbers.map((barber) => (
                    <Card
                        key={barber.id}
                        className={`cursor-pointer transition-all hover:border-gold/50 ${selectedBarberId === barber.id
                                ? 'border-gold bg-gold/10 ring-2 ring-gold'
                                : 'border-border/50'
                            }`}
                        onClick={() => onSelect(barber.id)}
                    >
                        <CardContent className="flex flex-col items-center p-4">
                            <div className="relative mb-3">
                                {barber.foto_url ? (
                                    <Image
                                        src={barber.foto_url}
                                        alt={barber.nome}
                                        width={64}
                                        height={64}
                                        className="h-16 w-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                                        <span className="text-2xl font-bold text-foreground">
                                            {barber.nome.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                {selectedBarberId === barber.id && (
                                    <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold">
                                        <Check className="h-4 w-4 text-black" />
                                    </div>
                                )}
                            </div>
                            <span className="text-sm font-medium text-center line-clamp-1">
                                {barber.nome}
                            </span>
                            {barber.especialidades && barber.especialidades.length > 0 && (
                                <div className="mt-1 flex flex-wrap justify-center gap-1">
                                    {barber.especialidades.slice(0, 2).map((esp) => (
                                        <Badge
                                            key={esp}
                                            variant="secondary"
                                            className="text-[10px] px-1.5 py-0"
                                        >
                                            {esp}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
