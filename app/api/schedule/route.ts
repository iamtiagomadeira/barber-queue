import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

const DEFAULT_BARBEARIA_ID = '00000000-0000-0000-0000-000000000001';

interface ScheduleEntry {
    dia_semana: number; // 0=Dom, 1=Seg...6=Sab
    hora_abertura: string; // HH:MM
    hora_fecho: string; // HH:MM
    fechado: boolean;
}

// GET: Get barbershop schedule
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const barbearia_id = searchParams.get('barbearia_id') || DEFAULT_BARBEARIA_ID;

        const supabase = getSupabase();

        if (!supabase) {
            // Return default schedule for demo
            const defaultSchedule: ScheduleEntry[] = [
                { dia_semana: 0, hora_abertura: '09:00', hora_fecho: '13:00', fechado: true }, // Domingo fechado
                { dia_semana: 1, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
                { dia_semana: 2, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
                { dia_semana: 3, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
                { dia_semana: 4, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
                { dia_semana: 5, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
                { dia_semana: 6, hora_abertura: '09:00', hora_fecho: '17:00', fechado: false }, // Sábado fecha mais cedo
            ];
            return NextResponse.json({ success: true, data: defaultSchedule });
        }

        // First check if schedule exists for this barbershop
        const { data, error } = await supabase
            .from('horario_funcionamento')
            .select('*')
            .eq('barbearia_id', barbearia_id)
            .order('dia_semana', { ascending: true });

        if (error) {
            console.error('Error fetching schedule:', error);
            // Table might not exist yet - return default
            const defaultSchedule: ScheduleEntry[] = [
                { dia_semana: 0, hora_abertura: '09:00', hora_fecho: '13:00', fechado: true },
                { dia_semana: 1, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
                { dia_semana: 2, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
                { dia_semana: 3, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
                { dia_semana: 4, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
                { dia_semana: 5, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
                { dia_semana: 6, hora_abertura: '09:00', hora_fecho: '17:00', fechado: false },
            ];
            return NextResponse.json({ success: true, data: defaultSchedule });
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Error in GET /api/schedule:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// POST: Update barbershop schedule (upsert all days)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { barbearia_id = DEFAULT_BARBEARIA_ID, schedule } = body;

        if (!schedule || !Array.isArray(schedule)) {
            return NextResponse.json(
                { success: false, error: 'Horário inválido' },
                { status: 400 }
            );
        }

        const supabase = getSupabase();

        if (!supabase) {
            return NextResponse.json({
                success: true,
                data: schedule,
                message: 'Horário atualizado (modo demo)',
            });
        }

        // Upsert each day's schedule
        const upsertData = schedule.map((entry: ScheduleEntry) => ({
            barbearia_id,
            dia_semana: entry.dia_semana,
            hora_abertura: entry.hora_abertura,
            hora_fecho: entry.hora_fecho,
            fechado: entry.fechado || false,
        }));

        const { data, error } = await supabase
            .from('horario_funcionamento')
            .upsert(upsertData, {
                onConflict: 'barbearia_id,dia_semana',
            })
            .select();

        if (error) {
            console.error('Error updating schedule:', error);
            return NextResponse.json(
                { success: false, error: 'Erro ao atualizar horário' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data,
            message: 'Horário atualizado com sucesso',
        });
    } catch (error) {
        console.error('Error in POST /api/schedule:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
