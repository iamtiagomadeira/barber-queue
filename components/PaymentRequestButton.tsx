'use client';

import { useState, useEffect } from 'react';
import { PaymentRequestButtonElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PaymentRequest } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PaymentRequestButtonProps {
    amount: number; // in cents
    currency?: string;
    label: string;
    onSuccess: (paymentIntentId: string) => void;
    onError?: (error: string) => void;
    clientSecret: string;
}

export function PaymentRequestButton({
    amount,
    currency = 'eur',
    label,
    onSuccess,
    onError,
    clientSecret,
}: PaymentRequestButtonProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
    const [canMakePayment, setCanMakePayment] = useState<boolean | null>(null);

    useEffect(() => {
        if (!stripe || !elements) return;

        const pr = stripe.paymentRequest({
            country: 'PT',
            currency: currency,
            total: {
                label: label,
                amount: amount,
            },
            requestPayerName: true,
            requestPayerEmail: true,
        });

        // Check if the Payment Request is available
        pr.canMakePayment().then(result => {
            if (result) {
                setPaymentRequest(pr);
                setCanMakePayment(true);
            } else {
                setCanMakePayment(false);
            }
        });
    }, [stripe, elements, amount, currency, label]);

    useEffect(() => {
        if (!paymentRequest || !clientSecret) return;

        paymentRequest.on('paymentmethod', async (event) => {
            if (!stripe) {
                event.complete('fail');
                return;
            }

            const { error, paymentIntent } = await stripe.confirmCardPayment(
                clientSecret,
                { payment_method: event.paymentMethod.id },
                { handleActions: false }
            );

            if (error) {
                event.complete('fail');
                onError?.(error.message || 'Erro no pagamento');
                return;
            }

            if (paymentIntent?.status === 'requires_action') {
                const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);
                if (confirmError) {
                    event.complete('fail');
                    onError?.(confirmError.message || 'Erro na confirmação');
                    return;
                }
            }

            event.complete('success');
            if (paymentIntent) {
                onSuccess(paymentIntent.id);
            }
        });
    }, [paymentRequest, clientSecret, stripe, onSuccess, onError]);

    // Still loading
    if (canMakePayment === null) {
        return (
            <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A verificar...
            </Button>
        );
    }

    // Apple Pay / Google Pay available
    if (canMakePayment && paymentRequest) {
        return (
            <div className="space-y-3">
                <PaymentRequestButtonElement
                    options={{
                        paymentRequest,
                        style: {
                            paymentRequestButton: {
                                type: 'default',
                                theme: 'dark',
                                height: '48px',
                            },
                        },
                    }}
                />
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">ou</span>
                    </div>
                </div>
            </div>
        );
    }

    // Not available - return null (will show card form instead)
    return null;
}
