'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Scissors, Loader2 } from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CheckoutFormProps {
    onSuccess: (paymentIntentId: string) => void;
    onCancel: () => void;
}

function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setError(null);

        const { error: submitError, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href,
            },
            redirect: 'if_required',
        });

        if (submitError) {
            setError(submitError.message || 'Erro ao processar pagamento');
            setIsProcessing(false);
            return;
        }

        if (paymentIntent && paymentIntent.status === 'requires_capture') {
            // Payment authorized but not captured (hold successful)
            onSuccess(paymentIntent.id);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Payment was captured (shouldn't happen with manual capture)
            onSuccess(paymentIntent.id);
        }

        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg border border-gold/20 bg-card p-4">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                    }}
                />
            </div>

            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="flex-1"
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    disabled={!stripe || isProcessing}
                    className="flex-1 bg-gold text-black hover:bg-gold/90"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            A processar...
                        </>
                    ) : (
                        <>
                            <Scissors className="mr-2 h-4 w-4" />
                            Pagar 5€
                        </>
                    )}
                </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
                💳 Este é um hold de 5€ que será devolvido após o serviço
            </p>
        </form>
    );
}

interface StripeCheckoutProps {
    clientSecret: string;
    onSuccess: (paymentIntentId: string) => void;
    onCancel: () => void;
}

export default function StripeCheckout({
    clientSecret,
    onSuccess,
    onCancel,
}: StripeCheckoutProps) {
    const options = {
        clientSecret,
        appearance: {
            theme: 'night' as const,
            variables: {
                colorPrimary: '#d4af37',
                colorBackground: '#141414',
                colorText: '#ffffff',
                colorDanger: '#ef4444',
                fontFamily: 'system-ui, sans-serif',
                borderRadius: '8px',
            },
        },
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
        </Elements>
    );
}
