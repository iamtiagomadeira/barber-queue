'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Scissors, Clock, Users, ChevronDown, CreditCard, Loader2 } from 'lucide-react';
import { countries, defaultCountry, type Country } from '@/lib/countries';
import { createClient } from '@/lib/supabase/client';

// Dynamically import Stripe to avoid SSR issues
const StripeCheckout = dynamic(() => import('./StripeCheckout'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
    ),
});

interface Service {
    id: string;
    nome: string;
    duracao_media: number;
    preco: number;
}

// Fallback mock services in case Supabase is not connected
const MOCK_SERVICES: Service[] = [
    { id: '1', nome: 'Fade', duracao_media: 45, preco: 15 },
    { id: '2', nome: 'Corte Clássico', duracao_media: 30, preco: 12 },
    { id: '3', nome: 'Barba', duracao_media: 20, preco: 8 },
    { id: '4', nome: 'Corte + Barba', duracao_media: 60, preco: 20 },
];

type FormStep = 'form' | 'payment' | 'success';

export default function QueueForm() {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [selectedService, setSelectedService] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<FormStep>('form');
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
    const [queuePosition, setQueuePosition] = useState<number | null>(null);
    const [waitTime, setWaitTime] = useState<number>(0);
    const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch services from Supabase on mount
    useEffect(() => {
        async function fetchServices() {
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('servicos')
                    .select('id, nome, duracao_media, preco')
                    .order('preco', { ascending: true });

                if (data && data.length > 0) {
                    setServices(data);
                }
            } catch (err) {
                console.log('Using mock services (Supabase not connected)');
            }
        }
        fetchServices();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCountryDropdownOpen(false);
                setCountrySearch('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCountries = countries.filter(
        (country) =>
            country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
            country.dialCode.includes(countrySearch) ||
            country.code.toLowerCase().includes(countrySearch.toLowerCase())
    );

    const getSelectedService = () => services.find(s => s.id === selectedService);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const service = getSelectedService();
        if (!service) {
            setError('Por favor selecione um serviço');
            setIsSubmitting(false);
            return;
        }

        try {
            // Create payment intent
            const response = await fetch('/api/payment/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_name: nome,
                    customer_phone: `${selectedCountry.dialCode}${telefone.replace(/\s/g, '')}`,
                    service_name: service.nome,
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setClientSecret(data.clientSecret);
            setPaymentIntentId(data.paymentIntentId);
            setStep('payment');
        } catch (err) {
            setError('Erro ao iniciar pagamento. Por favor tente novamente.');
            console.error(err);
        }

        setIsSubmitting(false);
    };

    const handlePaymentSuccess = async (intentId: string) => {
        setPaymentIntentId(intentId);

        const service = getSelectedService();
        const fullPhone = `${selectedCountry.dialCode}${telefone.replace(/\s/g, '')}`;

        console.log('[QueueForm] Payment successful, joining queue...', { intentId, service, fullPhone, nome });

        try {
            // Join the queue
            const response = await fetch('/api/queue/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cliente_nome: nome,
                    cliente_telefone: fullPhone,
                    servico_id: service?.id,
                    barbearia_id: '00000000-0000-0000-0000-000000000001', // Default barbershop for MVP
                    deposito_id: intentId,
                }),
            });

            console.log('[QueueForm] Queue join response status:', response.status, response.statusText);

            // Check for HTTP error first
            if (!response.ok) {
                const text = await response.text();
                console.error('[QueueForm] HTTP error:', response.status, text);
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            const data = await response.json();
            console.log('[QueueForm] Queue join response data:', data);

            if (data.error) {
                // If queue join fails, refund the payment
                console.error('[QueueForm] API returned error:', data.error);
                await fetch('/api/payment/refund', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentIntentId: intentId }),
                });
                throw new Error(data.error);
            }

            setQueuePosition(data.position || 3);
            setWaitTime(data.tempo_espera_estimado || (service?.duracao_media || 45) * 3);
            setStep('success');
        } catch (err) {
            console.error('[QueueForm] Error joining queue:', err);
            setError('Erro ao entrar na fila. O pagamento foi devolvido.');
            setStep('form');
        }
    };

    const handlePaymentCancel = () => {
        setStep('form');
        setClientSecret(null);
    };

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setTelefone(formatted);
    };

    const selectCountry = (country: Country) => {
        setSelectedCountry(country);
        setIsCountryDropdownOpen(false);
        setCountrySearch('');
    };

    const formatWaitTime = (minutes: number): string => {
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (remainingMinutes === 0) {
            return `${hours}h`;
        }
        return `${hours}h ${remainingMinutes}min`;
    };

    const handleLeaveQueue = async () => {
        // Refund payment when leaving queue
        if (paymentIntentId) {
            try {
                await fetch('/api/payment/refund', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentIntentId }),
                });
            } catch (err) {
                console.error('Error refunding:', err);
            }
        }

        // Reset form
        setStep('form');
        setQueuePosition(null);
        setPaymentIntentId(null);
        setClientSecret(null);
        setNome('');
        setTelefone('');
        setSelectedService('');
    };

    // Success view
    if (step === 'success' && queuePosition !== null) {
        return (
            <Card className="w-full max-w-md border-gold/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
                        <Users className="h-8 w-8 text-gold" />
                    </div>
                    <CardTitle className="text-2xl">Está na Fila!</CardTitle>
                    <CardDescription>Aguarde a sua vez confortavelmente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center">
                        <div className="text-5xl font-bold text-gold">{queuePosition}</div>
                        <p className="mt-2 text-muted-foreground">
                            {queuePosition === 1 ? 'pessoa à sua frente' : 'pessoas à sua frente'}
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-4">
                        <Clock className="h-5 w-5 text-gold" />
                        <span className="text-sm">
                            Tempo estimado: <strong className="text-gold">~{formatWaitTime(waitTime)}</strong>
                        </span>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>✓ Receberá uma notificação SMS quando for a sua vez</p>
                        <p>✓ Pode sair e voltar - não perca o seu lugar</p>
                        <p>✓ Depósito de 5€ será devolvido após o serviço</p>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleLeaveQueue}
                    >
                        Sair da Fila
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Payment view
    if (step === 'payment' && clientSecret) {
        return (
            <Card className="w-full max-w-md border-gold/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                        <CreditCard className="h-6 w-6 text-gold" />
                    </div>
                    <CardTitle className="text-center text-xl">Depósito de Segurança</CardTitle>
                    <CardDescription className="text-center">
                        Hold de 5€ - Devolvido após o serviço
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StripeCheckout
                        clientSecret={clientSecret}
                        onSuccess={handlePaymentSuccess}
                        onCancel={handlePaymentCancel}
                    />
                </CardContent>
            </Card>
        );
    }

    // Form view
    return (
        <Card className="w-full max-w-md border-gold/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-2xl">Entrar na Fila</CardTitle>
                <CardDescription>
                    Elimine a espera física. Entre na fila virtual agora.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                            id="nome"
                            placeholder="Seu nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            className="border-gold/20 focus-visible:ring-gold"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="telefone">Telemóvel</Label>
                        <div className="flex gap-2">
                            {/* Country Code Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                    className="flex h-9 items-center gap-1 rounded-md border border-gold/20 bg-background px-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                                >
                                    <span className="text-lg">{selectedCountry.flag}</span>
                                    <span className="text-muted-foreground">{selectedCountry.dialCode}</span>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </button>

                                {isCountryDropdownOpen && (
                                    <div className="absolute left-0 top-10 z-50 w-64 rounded-md border border-border bg-card shadow-lg">
                                        <div className="p-2">
                                            <Input
                                                placeholder="Pesquisar país..."
                                                value={countrySearch}
                                                onChange={(e) => setCountrySearch(e.target.value)}
                                                className="h-8 text-sm"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            {filteredCountries.map((country) => (
                                                <button
                                                    key={country.code}
                                                    type="button"
                                                    onClick={() => selectCountry(country)}
                                                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${selectedCountry.code === country.code ? 'bg-gold/10' : ''
                                                        }`}
                                                >
                                                    <span className="text-lg">{country.flag}</span>
                                                    <span className="flex-1 truncate">{country.name}</span>
                                                    <span className="text-muted-foreground">{country.dialCode}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Phone Input */}
                            <Input
                                id="telefone"
                                type="tel"
                                placeholder="912 345 678"
                                value={telefone}
                                onChange={handlePhoneChange}
                                required
                                maxLength={15}
                                className="flex-1 border-gold/20 focus-visible:ring-gold"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Receberá SMS quando for a sua vez
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Serviço</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {services.map((service) => (
                                <button
                                    key={service.id}
                                    type="button"
                                    onClick={() => setSelectedService(service.id)}
                                    className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all hover:border-gold/50 ${selectedService === service.id
                                        ? 'border-gold bg-gold/10'
                                        : 'border-border'
                                        }`}
                                >
                                    <span className="font-medium">{service.nome}</span>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {service.duracao_media}min
                                    </div>
                                    <Badge variant="outline" className="mt-1 border-gold/30 text-gold">
                                        {service.preco}€
                                    </Badge>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                                €
                            </div>
                            <div className="flex-1 text-sm">
                                <p className="font-medium text-foreground">Hold de Segurança: 5€</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Depósito reembolsável para garantir o seu compromisso. Devolvido após o serviço.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-gold text-black hover:bg-gold/90"
                        disabled={!nome || !telefone || !selectedService || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                A processar...
                            </>
                        ) : (
                            <>
                                <Scissors className="mr-2 h-4 w-4" />
                                Entrar na Fila (5€)
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
