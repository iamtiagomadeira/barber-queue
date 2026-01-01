'use client';

import { TypewriterEffectSmooth } from '@/components/ui/typewriter-effect';

export default function HeroTitle() {
    const words = [
        {
            text: "Elimine",
            className: "text-white",
        },
        {
            text: "a",
            className: "text-white",
        },
        {
            text: "Espera",
            className: "text-white",
        },
        {
            text: "Física",
            className: "text-gold",
        },
    ];

    return (
        <TypewriterEffectSmooth
            words={words}
            className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
            cursorClassName="bg-gold"
        />
    );
}
