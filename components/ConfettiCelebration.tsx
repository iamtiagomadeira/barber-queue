'use client';

import { useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiCelebrationProps {
    trigger: boolean;
    onComplete?: () => void;
}

export function ConfettiCelebration({ trigger, onComplete }: ConfettiCelebrationProps) {
    const hasTriggered = useRef(false);

    const fireConfetti = useCallback(() => {
        // Gold and white colors to match the Ventus theme
        const colors = ['#d4af37', '#f4d03f', '#ffffff', '#b8941f'];

        // First burst - left side
        confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: colors,
        });

        // Second burst - right side
        confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: colors,
        });

        // Center burst with more particles
        setTimeout(() => {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x: 0.5, y: 0.5 },
                colors: colors,
            });
        }, 150);

        // Final shower
        setTimeout(() => {
            confetti({
                particleCount: 30,
                angle: 90,
                spread: 120,
                origin: { x: 0.5, y: 0 },
                colors: colors,
                gravity: 1.2,
            });

            if (onComplete) {
                setTimeout(onComplete, 500);
            }
        }, 300);
    }, [onComplete]);

    useEffect(() => {
        if (trigger && !hasTriggered.current) {
            hasTriggered.current = true;
            fireConfetti();
        }
    }, [trigger, fireConfetti]);

    // Reset when trigger becomes false
    useEffect(() => {
        if (!trigger) {
            hasTriggered.current = false;
        }
    }, [trigger]);

    return null; // This component doesn't render anything visible
}

// Hook for easy usage
export function useConfetti() {
    const fire = useCallback(() => {
        const colors = ['#d4af37', '#f4d03f', '#ffffff', '#b8941f'];

        confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: colors,
        });

        confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: colors,
        });

        setTimeout(() => {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x: 0.5, y: 0.5 },
                colors: colors,
            });
        }, 150);
    }, []);

    return { fireConfetti: fire };
}
