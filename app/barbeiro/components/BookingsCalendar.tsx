'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Loader2,
    Clock,
    Grid3X3,
    LayoutList,
    AlignJustify
} from 'lucide-react';
import BookingCard, { Booking } from './BookingCard';
import BookingDetailsModal from './BookingDetailsModal';
import { cn } from '@/lib/utils';
import {
    format,
    addDays,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isToday,
    setHours,
    setMinutes,
    differenceInMinutes,
    addMonths,
    subMonths,
    addWeeks,
    subWeeks,
    isSameMonth,
    getDay
} from 'date-fns';
import { pt } from 'date-fns/locale';

interface BookingsCalendarProps {
    barbearia_id?: string;
}

type ViewMode = 'day' | 'week' | 'month' | 'list';

export default function BookingsCalendar({ barbearia_id = '00000000-0000-0000-0000-000000000001' }: BookingsCalendarProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchBookings = useCallback(async () => {
        setIsLoading(true);
        try {
            // Determine date range based on view
            let queryParams = `barbearia_id=${barbearia_id}`;

            if (viewMode === 'day' || viewMode === 'list') {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                queryParams += `&data=${dateStr}`;
            } else if (viewMode === 'week') {
                const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
                const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
                queryParams += `&start_date=${format(start, 'yyyy-MM-dd')}&end_date=${format(end, 'yyyy-MM-dd')}`;
            } else if (viewMode === 'month') {
                const start = startOfMonth(selectedDate);
                const end = endOfMonth(selectedDate);
                queryParams += `&start_date=${format(start, 'yyyy-MM-dd')}&end_date=${format(end, 'yyyy-MM-dd')}`;
            }

            const response = await fetch(`/api/bookings?${queryParams}`);
            const result = await response.json();
            if (result.success) {
                // Sort by time
                const sorted = (result.data || []).sort((a: Booking, b: Booking) =>
                    a.hora.localeCompare(b.hora)
                );
                setBookings(sorted);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setIsLoading(false);
        }
    }, [barbearia_id, selectedDate, viewMode]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleStatusChange = async (id: string, newStatus: Booking['status']) => {
        try {
            const response = await fetch(`/api/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                setBookings(prev =>
                    prev.map(b => (b.id === id ? { ...b, status: newStatus } : b))
                );
                // In day/week view, we want to see the update reflected instantly
            }
        } catch (error) {
            console.error('Error updating booking:', error);
        }
    };

    const navigate = (direction: number) => {
        const newDate = new Date(selectedDate);
        if (viewMode === 'day' || viewMode === 'list') {
            newDate.setDate(newDate.getDate() + direction);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + (direction * 7));
        } else if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + direction);
        }
        setSelectedDate(newDate);
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    // --- VIEW RENDERING HELPERS ---

    const getPositionStyle = (time: string, duration: number) => {
        const [h, m] = time.split(':').map(Number);
        const startHour = 8; // Start at 08:00
        const minutesFromStart = (h - startHour) * 60 + m;
        const pixelsPerMinute = 2; // 120px per hour

        return {
            top: `${minutesFromStart * pixelsPerMinute}px`,
            height: `${duration * pixelsPerMinute}px`,
        };
    };

    const getCurrentTimePosition = () => {
        const h = currentTime.getHours();
        const m = currentTime.getMinutes();
        const startHour = 8;
        const minutesFromStart = (h - startHour) * 60 + m;
        const pixelsPerMinute = 2;

        if (h < 8 || h > 20) return -1; // Out of view

        return minutesFromStart * pixelsPerMinute;
    };

    const getBookingStatusColor = (status: string) => {
        const statusColors: Record<string, string> = {
            pendente: 'bg-yellow-500/10 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-400',
            confirmada: 'bg-green-500/10 border-l-4 border-green-500 text-green-700 dark:text-green-400',
            em_atendimento: 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-700 dark:text-blue-400',
            concluida: 'bg-gray-500/10 border-l-4 border-gray-500 text-gray-500',
            cancelada: 'bg-red-500/5 border-l-4 border-red-500 text-red-500 opacity-50',
            no_show: 'bg-red-500/10 border-l-4 border-red-500 text-red-700 dark:text-red-400',
        };
        return statusColors[status] || statusColors.pendente;
    };

    // --- RENDERERS ---

    const renderDayView = () => {
        // Filter bookings for the selected date
        const dayBookings = bookings.filter(b => b.data === format(selectedDate, 'yyyy-MM-dd'));
        const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00
        const currentTimePos = getCurrentTimePosition();

        return (
            <div className="relative border rounded-lg bg-card overflow-hidden">
                <div className="relative min-h-[1440px]">
                    {/* Grid Lines */}
                    {hours.map(hour => (
                        <div key={hour} className="flex border-b border-border/30 h-[120px]">
                            <div className="w-16 p-2 text-xs text-muted-foreground text-right border-r border-border/30 sticky left-0 bg-card z-10">
                                {String(hour).padStart(2, '0')}:00
                            </div>
                            <div className="flex-1 relative">
                                <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-border/20"></div>
                            </div>
                        </div>
                    ))}

                    {/* Current Time Line */}
                    {currentTimePos >= 0 && isToday(selectedDate) && (
                        <div
                            className="absolute left-16 right-0 border-t-2 border-red-500 z-10 flex items-center pointer-events-none"
                            style={{ top: `${currentTimePos}px` }}
                        >
                            <div className="absolute -left-2 w-4 h-4 rounded-full bg-red-500 -mt-[1px]"></div>
                        </div>
                    )}

                    {/* Bookings */}
                    {dayBookings.map(booking => {
                        const style = getPositionStyle(booking.hora, booking.duracao_minutos);
                        return (
                            <div
                                key={booking.id}
                                onClick={() => setSelectedBooking(booking)}
                                className={cn(
                                    "absolute left-16 right-2 rounded-md p-2 text-sm overflow-hidden transition-all hover:brightness-95 cursor-pointer z-20 shadow-sm hover:ring-2 hover:ring-gold/50",
                                    getBookingStatusColor(booking.status)
                                )}
                                style={style}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold truncate">{booking.cliente_nome}</span>
                                    <span className="text-[10px] opacity-70 ml-1 whitespace-nowrap">{booking.hora.substring(0, 5)}</span>
                                </div>
                                <div className="text-xs opacity-90 truncate">
                                    {booking.servico?.nome}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

        return (
            <div className="flex flex-col border rounded-lg bg-card overflow-hidden">
                {/* Header Row */}
                <div className="flex border-b border-border">
                    <div className="w-16 border-r border-border bg-muted/30"></div> {/* Time axis header */}
                    {days.map(day => (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "flex-1 p-2 text-center border-r border-border min-w-[100px]",
                                isToday(day) && "bg-gold/10"
                            )}
                        >
                            <div className="text-xs text-muted-foreground font-medium uppercase">
                                {format(day, 'EEE', { locale: pt })}
                            </div>
                            <div className={cn(
                                "text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mx-auto",
                                isToday(day) ? "bg-gold text-black" : "text-foreground"
                            )}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Grid Body */}
                <div className="relative overflow-y-auto max-h-[800px]">
                    <div className="flex min-h-[1440px]">
                        {/* Time Axis */}
                        <div className="w-16 flex-shrink-0 border-r border-border bg-card z-10 sticky left-0">
                            {hours.map(hour => (
                                <div key={hour} className="h-[120px] p-2 text-xs text-muted-foreground text-right border-b border-border/30">
                                    {String(hour).padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>

                        {/* Days Columns */}
                        {days.map(day => {
                            const dayDateStr = format(day, 'yyyy-MM-dd');
                            const dayBookings = bookings.filter(b => b.data === dayDateStr);

                            return (
                                <div key={day.toISOString()} className="flex-1 relative border-r border-border/30 min-w-[100px]">
                                    {/* Background Grid Lines */}
                                    {hours.map(hour => (
                                        <div key={hour} className="h-[120px] border-b border-border/30 relative">
                                            <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-border/10"></div>
                                        </div>
                                    ))}

                                    {/* Bookings */}
                                    {dayBookings.map(booking => {
                                        const style = getPositionStyle(booking.hora, booking.duracao_minutos);
                                        return (
                                            <div
                                                key={booking.id}
                                                onClick={() => setSelectedBooking(booking)}
                                                className={cn(
                                                    "absolute left-1 right-1 rounded-md p-1 text-xs overflow-hidden transition-all hover:brightness-95 cursor-pointer z-10 shadow-sm border border-black/5 hover:ring-2 hover:ring-gold/50",
                                                    getBookingStatusColor(booking.status)
                                                )}
                                                style={style}
                                            >
                                                <div className="font-semibold truncate leading-tight">{booking.cliente_nome}</div>
                                                <div className="text-[10px] opacity-80 truncate hidden sm:block">
                                                    {booking.servico?.nome}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Current Time Line (if today) */}
                                    {isSameDay(day, new Date()) && getCurrentTimePosition() >= 0 && (
                                        <div
                                            className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                                            style={{ top: `${getCurrentTimePosition()}px` }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

        const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];

        return (
            <div className="border rounded-lg bg-card overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                    {weekDays.map(day => (
                        <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground uppercase">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 auto-rows-[120px]">
                    {calendarDays.map((day, idx) => {
                        const dayDateStr = format(day, 'yyyy-MM-dd');
                        const dayBookings = bookings.filter(b => b.data === dayDateStr);
                        const isCurrentMonth = isSameMonth(day, selectedDate);

                        return (
                            <div
                                key={day.toISOString()}
                                className={cn(
                                    "border-b border-r border-border/40 p-2 relative transition-colors hover:bg-muted/10",
                                    !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                                    isToday(day) && "bg-gold/5"
                                )}
                                onClick={() => {
                                    setSelectedDate(day);
                                    setViewMode('day');
                                }}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={cn(
                                        "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                                        isToday(day) ? "bg-gold text-black" : "text-muted-foreground"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {dayBookings.length > 0 && (
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1">
                                            {dayBookings.length}
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                    {dayBookings.slice(0, 3).map(booking => (
                                        <div
                                            key={booking.id}
                                            className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded truncate border-l-2",
                                                getBookingStatusColor(booking.status).replace('border-l-4', 'border-l-2')
                                            )}
                                        >
                                            <span className="font-semibold mr-1">{booking.hora.substring(0, 5)}</span>
                                            {booking.cliente_nome}
                                        </div>
                                    ))}
                                    {dayBookings.length > 3 && (
                                        <div className="text-[10px] text-muted-foreground pl-1">
                                            + {dayBookings.length - 3} outros
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-1">
                <div className="flex items-center gap-2 bg-card border rounded-lg p-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-[160px] text-center font-medium capitalize">
                        {format(selectedDate, viewMode === 'day' ? 'd MMMM yyyy' : 'MMMM yyyy', { locale: pt })}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    {!isToday(selectedDate) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToToday}
                            className="text-gold hover:text-gold/80"
                        >
                            Hoje
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-1 bg-card border rounded-lg p-1 overflow-x-auto">
                    <Button
                        variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('day')}
                    >
                        Dia
                    </Button>
                    <Button
                        variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('week')}
                    >
                        Semana
                    </Button>
                    <Button
                        variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('month')}
                    >
                        Mês
                    </Button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('list')}
                        title="Lista"
                    >
                        <LayoutList className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content & Validation */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20 min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-gold" />
                </div>
            ) : (
                <>
                    {viewMode === 'day' && renderDayView()}
                    {viewMode === 'week' && renderWeekView()}
                    {viewMode === 'month' && renderMonthView()}

                    {viewMode === 'list' && (
                        <div className="space-y-3">
                            {bookings.filter(b => b.data === format(selectedDate, 'yyyy-MM-dd')).length === 0 ? (
                                <Card className="border-border/40">
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                        <CalendarIcon className="h-10 w-10 mb-4 opacity-50" />
                                        <p>Sem marcações para este dia</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                bookings
                                    .filter(b => b.data === format(selectedDate, 'yyyy-MM-dd'))
                                    .map(booking => (
                                        <BookingCard
                                            key={booking.id}
                                            booking={booking}
                                            onStatusChange={handleStatusChange}
                                        />
                                    ))
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Booking Details Modal */}
            <BookingDetailsModal
                booking={selectedBooking}
                isOpen={!!selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onStatusChange={async (id, status) => {
                    await handleStatusChange(id, status);
                    // Update the selected booking in the modal
                    setSelectedBooking(prev => prev ? { ...prev, status } : null);
                }}
            />
        </div>
    );
}
