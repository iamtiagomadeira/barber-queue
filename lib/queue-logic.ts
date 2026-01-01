import { FilaVirtual, Servico } from './types';

/**
 * Calculate estimated wait time for a customer entering the queue
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
 * Calculate how many people are ahead of a specific customer
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
