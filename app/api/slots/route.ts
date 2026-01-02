import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

const DEFAULT_BARBEARIA_ID = '00000000-0000-0000-0000-000000000001';

// Helper to generate time slots
function generateTimeSlots(
    horaInicio: string,
    horaFim: string,
    intervaloMinutos: number = 30
): string[] {
    const slots: string[] = [];
    const [startHour, startMin] = horaInicio.split(':').map(Number);
    const [endHour, endMin] = horaFim.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (
        currentHour < endHour ||
        (currentHour === endHour && currentMin < endMin)
    ) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
        slots.push(timeStr);

        currentMin += intervaloMinutos;
        if (currentMin >= 60) {
            currentHour += Math.floor(currentMin / 60);
            currentMin = currentMin % 60;
        }
    }

    return slots;
}

// GET: Get available slots for a specific date and barber
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const barbearia_id = searchParams.get('barbearia_id') || DEFAULT_BARBEARIA_ID;
        const barbeiro_id = searchParams.get('barbeiro_id'); // optional
        const data = searchParams.get('data'); // YYYY-MM-DD format
        const servico_id = searchParams.get('servico_id');

        if (!data) {
            return NextResponse.json(
                { success: false, error: 'Data é obrigatória' },
                { status: 400 }
            );
        }

        const dateObj = new Date(data);
        const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon...6=Sat

        const supabase = getSupabase();

        // Default schedule if no Supabase or no horarios found
        let allSlots = generateTimeSlots('09:00', '19:00', 30);
        let bookedSlots: string[] = [];

        if (supabase) {
            // Get schedule for the barber (or any barber if not specified)
            let scheduleQuery = supabase
                .from('horarios')
                .select('*, barbeiro:barbeiros!inner(barbearia_id)')
                .eq('dia_semana', dayOfWeek)
                .eq('activo', true);

            if (barbeiro_id && barbeiro_id !== 'any') {
                scheduleQuery = scheduleQuery.eq('barbeiro_id', barbeiro_id);
            } else {
                // Get all barbers' schedules for this barbershop
                scheduleQuery = scheduleQuery.eq('barbeiro.barbearia_id', barbearia_id);
            }

            const { data: schedules } = await scheduleQuery;

            if (schedules && schedules.length > 0) {
                // Use the first schedule found (or combine multiple barbers' slots)
                const schedule = schedules[0];
                allSlots = generateTimeSlots(
                    schedule.hora_inicio,
                    schedule.hora_fim,
                    schedule.intervalo_minutos || 30
                );
            }

            // Get existing bookings for this date
            let bookingsQuery = supabase
                .from('marcacoes')
                .select('hora, barbeiro_id')
                .eq('data', data)
                .in('status', ['pendente', 'confirmada', 'em_atendimento']);

            if (barbeiro_id && barbeiro_id !== 'any') {
                bookingsQuery = bookingsQuery.eq('barbeiro_id', barbeiro_id);
            } else {
                bookingsQuery = bookingsQuery.eq('barbearia_id', barbearia_id);
            }

            const { data: bookings } = await bookingsQuery;

            if (bookings) {
                bookedSlots = bookings.map(b => b.hora.slice(0, 5)); // "HH:MM:SS" -> "HH:MM"
            }
        }

        // Filter out booked slots
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        // Filter out past slots if date is today
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        let finalSlots = availableSlots;
        if (data === today) {
            const currentTime = now.getHours() * 60 + now.getMinutes();
            finalSlots = availableSlots.filter(slot => {
                const [h, m] = slot.split(':').map(Number);
                return h * 60 + m > currentTime + 30; // At least 30min in future
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                date: data,
                barbeiro_id: barbeiro_id || 'any',
                slots: finalSlots,
                total_available: finalSlots.length,
            }
        });
    } catch (error) {
        console.error('Error fetching slots:', error);
        return NextResponse.json(
            { success: false, error: 'Erro ao obter slots' },
            { status: 500 }
        );
    }
}
