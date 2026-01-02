import { FilaVirtual, Servico } from './types';
import { createClient } from '@supabase/supabase-js';

// Helper to get Supabase client
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
}

interface Booking {
    id: string;
    hora: string;
    duracao_minutos: number;
    status: string;
}

interface HybridWaitResult {
    waitMinutes: number;
    queueMinutes: number;
    bookingBlockedMinutes: number;
    blockedSlots: string[];
    warning?: string;
}

/**
 * Calculate estimated wait time considering BOTH queue and scheduled bookings
 * This is the "hybrid" logic that accounts for appointments interrupting the queue
 * 
 * @param barbeariaId - The barbershop ID
 * @param currentQueue - Array of people currently waiting
 * @param servicoDuracao - Duration of the service being requested (minutes)
 * @param currentTime - Current time (for calculating which bookings are relevant)
 * @returns Hybrid wait result with breakdown
 */
export async function calculateHybridWaitTime(
    barbeariaId: string,
    currentQueue: Array<FilaVirtual & { servico?: { duracao_media: number } }>,
    servicoDuracao: number,
    currentTime: Date = new Date()
): Promise<HybridWaitResult> {
    // 1. Calculate base queue time (people ahead * their service durations)
    const queueEntries = currentQueue.filter(
        (entry) => entry.status === 'em_espera' || entry.status === 'em_corte'
    );

    // Sum up durations of people ahead (using their service duration if available)
    let queueMinutes = 0;
    for (const entry of queueEntries) {
        // If entry has servico with duration, use it; otherwise default to 30 min
        const entryDuration = entry.servico?.duracao_media || 30;
        queueMinutes += entryDuration;
    }

    // 2. Fetch upcoming bookings that could interrupt the queue
    const supabase = getSupabase();
    let bookingBlockedMinutes = 0;
    const blockedSlots: string[] = [];

    if (supabase) {
        // Get today's date
        const today = currentTime.toISOString().split('T')[0];
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;

        // Fetch bookings for today that haven't started yet
        const { data: bookings } = await supabase
            .from('marcacoes')
            .select('id, hora, duracao_minutos, status')
            .eq('barbearia_id', barbeariaId)
            .eq('data', today)
            .in('status', ['pendente', 'confirmada'])
            .gte('hora', currentTimeStr)
            .order('hora', { ascending: true });

        if (bookings && bookings.length > 0) {
            // Calculate how much "dead time" the queue will have due to bookings
            // Dead time = time when barber stops queue to attend scheduled appointments

            // Estimate when this new customer would be served if no bookings
            const estimatedStartMinutes = queueMinutes;
            const estimatedEndMinutes = queueMinutes + servicoDuracao;

            for (const booking of bookings) {
                // Convert booking time to minutes from current time
                const [h, m] = booking.hora.split(':').map(Number);
                const bookingStartMinutes = (h * 60 + m) - (currentHour * 60 + currentMinute);
                const bookingEndMinutes = bookingStartMinutes + (booking.duracao_minutos || 30);

                // Check if this booking overlaps with the queue processing window
                if (bookingStartMinutes >= 0 && bookingStartMinutes <= estimatedEndMinutes + 60) {
                    // This booking will interrupt the queue
                    bookingBlockedMinutes += booking.duracao_minutos || 30;
                    blockedSlots.push(booking.hora.substring(0, 5));
                }
            }
        }
    }

    // 3. Calculate total wait time
    const waitMinutes = queueMinutes + bookingBlockedMinutes;

    // 4. Generate warning if wait time is excessive
    let warning: string | undefined;
    if (waitMinutes > 120) {
        warning = `Tempo de espera elevado (${Math.round(waitMinutes / 60)}h). Considere agendar uma marcação.`;
    } else if (blockedSlots.length > 0) {
        warning = `Atenção: ${blockedSlots.length} marcação(ões) agendada(s) podem aumentar o tempo de espera.`;
    }

    return {
        waitMinutes,
        queueMinutes,
        bookingBlockedMinutes,
        blockedSlots,
        warning,
    };
}

/**
 * Calculate estimated wait time for a customer entering the queue (simple version)
 * @param currentQueue - Array of people currently waiting
 * @param servico - The service being requested
 * @returns Estimated wait time in minutes
 */
export function calculateWaitTime(
    currentQueue: FilaVirtual[],
    servico: Servico
): number {
    // Count people ahead in queue with 'em_espera' or 'em_corte' status
    const peopleAhead = currentQueue.filter(
        (entry) => entry.status === 'em_espera' || entry.status === 'em_corte'
    ).length;

    // Calculate wait time: number of people * average service duration
    const waitTime = peopleAhead * servico.duracao_media;

    return waitTime;
}

/**
 * Get the next position in the queue
 * @param currentQueue - Array of current queue entries
 * @returns Next position number
 */
export function getNextPosition(currentQueue: FilaVirtual[]): number {
    const activeEntries = currentQueue.filter(
        (entry) => entry.status === 'em_espera' || entry.status === 'em_corte'
    );

    if (activeEntries.length === 0) return 1;

    const maxPosition = Math.max(...activeEntries.map((entry) => entry.posicao));
    return maxPosition + 1;
}

/**
 * Update queue positions after someone is called or completes service
 * @param queue - Current queue entries
 * @param completedPosition - Position of the person who was called/completed
 * @returns Updated queue with recalculated positions
 */
export function updateQueuePositions(
    queue: FilaVirtual[],
    completedPosition: number
): FilaVirtual[] {
    return queue.map((entry) => {
        // Only update positions for people still waiting
        if (entry.status === 'em_espera' && entry.posicao > completedPosition) {
            return {
                ...entry,
                posicao: entry.posicao - 1,
            };
        }
        return entry;
    });
}

/**
 * Get the next person to be called from the queue
 * @param queue - Current queue entries
 * @returns The next person in line, or null if queue is empty
 */
export function getNextInQueue(queue: FilaVirtual[]): FilaVirtual | null {
    const waitingEntries = queue
        .filter((entry) => entry.status === 'em_espera')
        .sort((a, b) => a.posicao - b.posicao);

    return waitingEntries[0] || null;
}

/**
 * Get how many people are ahead of a specific customer
 * @param queue - Current queue entries
 * @param customerPosition - The customer's position
 * @returns Number of people ahead
 */
export function getPeopleAhead(
    queue: FilaVirtual[],
    customerPosition: number
): number {
    return queue.filter(
        (entry) =>
            (entry.status === 'em_espera' || entry.status === 'em_corte') &&
            entry.posicao < customerPosition
    ).length;
}

/**
 * Check if joining the queue is advisable based on bookings and current queue
 * @param barbeariaId - The barbershop ID
 * @param currentQueue - Current queue entries
 * @param servicoDuracao - Duration of requested service
 * @returns Object with recommendation
 */
export async function checkQueueAvailability(
    barbeariaId: string,
    currentQueue: FilaVirtual[],
    servicoDuracao: number
): Promise<{ canJoin: boolean; reason?: string; estimatedWait: number }> {
    const result = await calculateHybridWaitTime(
        barbeariaId,
        currentQueue,
        servicoDuracao
    );

    // If wait time is over 3 hours, recommend booking instead
    if (result.waitMinutes > 180) {
        return {
            canJoin: false,
            reason: 'O tempo de espera estimado é superior a 3 horas. Recomendamos que faça uma marcação.',
            estimatedWait: result.waitMinutes,
        };
    }

    return {
        canJoin: true,
        reason: result.warning,
        estimatedWait: result.waitMinutes,
    };
}
