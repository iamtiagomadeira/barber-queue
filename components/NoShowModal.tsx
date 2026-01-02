'use client';

import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CreditCard, Euro } from 'lucide-react';

interface NoShowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reterDeposito: boolean) => Promise<void>;
    customer: {
        nome: string;
    };
    deposito?: {
        pago: boolean;
        valor: number;
    };
}

export default function NoShowModal({
    isOpen,
    onClose,
    onConfirm,
    customer,
    deposito,
}: NoShowModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [reterDeposito, setReterDeposito] = useState(true);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm(reterDeposito);
            onClose();
        } catch (error) {
            console.error('Error marking no-show:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Marcar como No-Show
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        O cliente <strong>{customer.nome}</strong> não compareceu à marcação.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    {deposito?.pago ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-green-500" />
                                <span className="text-sm font-medium">Depósito Pago</span>
                                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                    €{deposito.valor}
                                </Badge>
                            </div>

                            <div className="space-y-2 pl-6">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="deposito"
                                        checked={reterDeposito}
                                        onChange={() => setReterDeposito(true)}
                                        className="accent-destructive"
                                    />
                                    <div className="text-sm">
                                        <span className="font-medium">Reter depósito</span>
                                        <p className="text-muted-foreground text-xs">
                                            O valor de €{deposito.valor} fica para a barbearia
                                        </p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="deposito"
                                        checked={!reterDeposito}
                                        onChange={() => setReterDeposito(false)}
                                        className="accent-gold"
                                    />
                                    <div className="text-sm">
                                        <span className="font-medium">Devolver depósito</span>
                                        <p className="text-muted-foreground text-xs">
                                            O cliente será reembolsado
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Este cliente não tinha depósito pago.
                        </p>
                    )}

                    <div className="bg-destructive/10 rounded-lg p-4 text-sm">
                        <p className="text-destructive font-medium">
                            Esta acção não pode ser revertida.
                        </p>
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                A processar...
                            </>
                        ) : (
                            'Confirmar No-Show'
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
