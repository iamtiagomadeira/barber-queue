'use client';

import { useState, useEffect } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Phone, AlertTriangle, PhoneCall, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SmsFailedAlertProps {
    isOpen: boolean;
    onClose: () => void;
    customerName: string;
    customerPhone: string;
}

export function SmsFailedAlert({ isOpen, onClose, customerName, customerPhone }: SmsFailedAlertProps) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    const handleCopyPhone = async () => {
        try {
            await navigator.clipboard.writeText(customerPhone);
            setCopied(true);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleCall = () => {
        window.location.href = `tel:${customerPhone}`;
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="border-destructive/50 bg-card max-w-md">
                <AlertDialogHeader>
                    {/* Warning Icon */}
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                        <AlertTriangle className="h-8 w-8 text-destructive animate-pulse" />
                    </div>

                    <AlertDialogTitle className="text-center text-xl">
                        SMS Não Enviado
                    </AlertDialogTitle>

                    <AlertDialogDescription className="text-center text-base">
                        Não foi possível notificar <strong className="text-foreground">{customerName}</strong> por SMS.
                        <br />
                        <span className="text-muted-foreground">Por favor, ligue ao cliente directamente.</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Phone Number Display */}
                <div className="my-4 rounded-lg border border-gold/30 bg-gold/5 p-4">
                    <div className="flex items-center justify-center gap-3">
                        <Phone className="h-5 w-5 text-gold" />
                        <span className="text-2xl font-bold tracking-wide text-foreground">
                            {customerPhone}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 border-gold/30 hover:bg-gold/10"
                        onClick={handleCopyPhone}
                    >
                        {copied ? (
                            <>
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                Copiado!
                            </>
                        ) : (
                            <>
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar
                            </>
                        )}
                    </Button>

                    <Button
                        className="flex-1 bg-gold text-black hover:bg-gold/90"
                        onClick={handleCall}
                    >
                        <PhoneCall className="mr-2 h-4 w-4" />
                        Ligar
                    </Button>
                </div>

                <AlertDialogFooter className="mt-4">
                    <AlertDialogAction
                        className="w-full bg-muted text-foreground hover:bg-muted/80"
                        onClick={onClose}
                    >
                        Entendido
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
