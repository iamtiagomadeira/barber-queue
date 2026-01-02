'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface QueueToggleProps {
    isOpen: boolean;
    onToggle: (newState: boolean) => Promise<void>;
}

export function QueueToggle({ isOpen, onToggle }: QueueToggleProps) {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingState, setPendingState] = useState(false);

    const handleToggleClick = (newState: boolean) => {
        // If closing, show confirmation
        if (!newState) {
            setPendingState(newState);
            setShowConfirm(true);
        } else {
            // If opening, do it directly
            executeToggle(newState);
        }
    };

    const executeToggle = async (newState: boolean) => {
        setLoading(true);
        try {
            await onToggle(newState);
        } catch (error) {
            console.error('Error toggling queue:', error);
        } finally {
            setLoading(false);
            setShowConfirm(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-3">
                <Badge
                    variant={isOpen ? 'default' : 'destructive'}
                    className={`px-3 py-1 text-sm font-medium ${isOpen
                            ? 'bg-green-500/20 text-green-500 border-green-500/30'
                            : 'bg-red-500/20 text-red-500 border-red-500/30'
                        }`}
                >
                    {isOpen ? '🟢 Fila Aberta' : '🔴 Fila Fechada'}
                </Badge>

                <div className="flex items-center gap-2">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                        <Switch
                            checked={isOpen}
                            onCheckedChange={handleToggleClick}
                            className="data-[state=checked]:bg-green-500"
                        />
                    )}
                </div>
            </div>

            {/* Confirmation Dialog for Closing */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent className="bg-card border-destructive/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fechar Fila?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ao fechar a fila, novos clientes não poderão entrar.
                            Os clientes actualmente em espera continuarão a ser atendidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => executeToggle(pendingState)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Fechar Fila
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
