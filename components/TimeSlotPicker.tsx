'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface TimeSlotPickerProps {
    slots: string[];
    selectedSlot: string | null;
    onSelect: (slot: string) => void;
    isLoading?: boolean;
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function TimeSlotPicker({
    slots,
    selectedSlot,
    onSelect,
    isLoading,
    selectedDate,
    onDateChange,
}: TimeSlotPickerProps) {
    const [weekOffset, setWeekOffset] = useState(0);

    // Generate dates for the current week view
    const getDates = () => {
        const dates: Date[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + weekOffset * 7 + i);
            dates.push(date);
        }
        return dates;
    };

    const dates = getDates();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = (date: Date) => date.getTime() === today.getTime();
    const isSelected = (date: Date) => date.toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0];
    const isPast = (date: Date) => date < today;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Escolha Data e Hora</h3>

            {/* Date Selector */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
                    disabled={weekOffset === 0}
                    className="shrink-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex flex-1 gap-1 overflow-x-auto pb-2">
                    {dates.map((date) => (
                        <button
                            key={date.toISOString()}
                            onClick={() => !isPast(date) && onDateChange(date)}
                            disabled={isPast(date)}
                            className={`flex min-w-[50px] flex-col items-center rounded-lg px-2 py-2 transition-all ${isSelected(date)
                                    ? 'bg-gold text-black'
                                    : isPast(date)
                                        ? 'bg-muted/30 text-muted-foreground opacity-50'
                                        : isToday(date)
                                            ? 'bg-gold/20 text-gold hover:bg-gold/30'
                                            : 'bg-card hover:bg-gold/10'
                                }`}
                        >
                            <span className="text-[10px] uppercase">
                                {WEEKDAYS[date.getDay()]}
                            </span>
                            <span className="text-lg font-bold">{date.getDate()}</span>
                            <span className="text-[10px]">
                                {MONTHS[date.getMonth()]}
                            </span>
                        </button>
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setWeekOffset(w => w + 1)}
                    className="shrink-0"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Time Slots */}
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gold" />
                </div>
            ) : slots.length === 0 ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Sem horários disponíveis para este dia.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Experimente outra data ou outro barbeiro.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {slots.map((slot) => (
                        <button
                            key={slot}
                            onClick={() => onSelect(slot)}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${selectedSlot === slot
                                    ? 'border-gold bg-gold text-black'
                                    : 'border-border/50 bg-card hover:border-gold/50 hover:bg-gold/10'
                                }`}
                        >
                            {slot}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
