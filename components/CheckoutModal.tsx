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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Receipt, CreditCard, User, CheckCircle, Euro } from 'lucide-react';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (options: CheckoutOptions) => Promise<void>;
    customer: {
        nome: string;
        telefone: string;
        email?: string;
        nif?: string;
    };
    service: {
        nome: string;
        preco: number;
        duracao_minutos: number;
    };
    deposito?: {
        pago: boolean;
        valor: number;
        id?: string;
    };
}

interface CheckoutOptions {
    emitirFatura: boolean;
    nif?: string;
    tratamentoDeposito: 'abater' | 'devolver' | 'nenhum';
    enviarSms: boolean;
}

export default function CheckoutModal({
    isOpen,
    onClose,
    onComplete,
    customer,
    service,
    deposito,
}: CheckoutModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [emitirFatura, setEmitirFatura] = useState(false);
    const [nif, setNif] = useState(customer.nif || '');
    const [tratamentoDeposito, setTratamentoDeposito] = useState<'abater' | 'devolver'>('abater');
    const [enviarSms, setEnviarSms] = useState(true);

    const valorFinal = deposito?.pago && tratamentoDeposito === 'abater'
        ? Math.max(0, service.preco - (deposito?.valor || 0))
        : service.preco;

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            await onComplete({
                emitirFatura,
                nif: emitirFatura ? nif : undefined,
                tratamentoDeposito: deposito?.pago ? tratamentoDeposito : 'nenhum',
                enviarSms,
            });
            onClose();
        } catch (error) {
            console.error('Error completing checkout:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Finalizar Atendimento
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Confirme os detalhes antes de concluir o serviço.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-6 py-4">
                    {/* Customer Info */}
                    <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{customer.nome}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Serviço:</span>
                            <span>{service.nome}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Valor:</span>
                            <span className="font-semibold text-gold">€{service.preco}</span>
                        </div>
                    </div>

                    {/* Deposit Section */}
                    {deposito?.pago && (
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
                                        checked={tratamentoDeposito === 'abater'}
                                        onChange={() => setTratamentoDeposito('abater')}
                                        className="accent-gold"
                                    />
                                    <span className="text-sm">
                                        Abater no total (cobrar €{valorFinal})
                                    </span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="deposito"
                                        checked={tratamentoDeposito === 'devolver'}
                                        onChange={() => setTratamentoDeposito('devolver')}
                                        className="accent-gold"
                                    />
                                    <span className="text-sm">Devolver depósito</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Invoice Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Emitir Fatura</span>
                            </div>
                            <Switch
                                checked={emitirFatura}
                                onCheckedChange={setEmitirFatura}
                            />
                        </div>

                        {emitirFatura && (
                            <div className="pl-6 space-y-2">
                                <Label htmlFor="nif" className="text-sm">NIF do Cliente</Label>
                                <Input
                                    id="nif"
                                    value={nif}
                                    onChange={(e) => setNif(e.target.value)}
                                    placeholder="123456789"
                                    className="max-w-[200px]"
                                />
                            </div>
                        )}
                    </div>

                    {/* SMS Notification */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Enviar SMS de agradecimento</span>
                        <Switch
                            checked={enviarSms}
                            onCheckedChange={setEnviarSms}
                        />
                    </div>

                    {/* Total Summary */}
                    <div className="rounded-lg border-2 border-gold/30 bg-gold/5 p-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">A Cobrar</span>
                            <div className="flex items-center gap-1">
                                <Euro className="h-5 w-5 text-gold" />
                                <span className="text-2xl font-bold text-gold">{valorFinal}</span>
                            </div>
                        </div>
                        {deposito?.pago && tratamentoDeposito === 'abater' && (
                            <p className="text-xs text-muted-foreground mt-1">
                                (€{service.preco} - €{deposito.valor} depósito)
                            </p>
                        )}
                    </div>
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                    <Button
                        onClick={handleComplete}
                        disabled={isLoading || (emitirFatura && !nif)}
                        className="bg-gold text-black hover:bg-gold/90"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                A processar...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Concluir
                            </>
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
