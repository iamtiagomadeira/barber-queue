'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Scissors, Clock, ArrowLeft, ArrowRight, Loader2, CheckCircle2, Calendar } from 'lucide-react';
import { BarberSelector } from './BarberSelector';
import { TimeSlotPicker } from './TimeSlotPicker';
import { useConfetti } from './ConfettiCelebration';

// Dynamically import Stripe
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

interface Barber {
    id: string;
    nome: string;
    foto_url: string | null;
    bio?: string;
    especialidades?: string[];
}

type BookingStep = 'service' | 'barber' | 'datetime' | 'details' | 'payment' | 'success';

const MOCK_SERVICES: Service[] = [
    { id: '1', nome: 'Fade', duracao_media: 45, preco: 15 },
    { id: '2', nome: 'Corte Clássico', duracao_media: 30, preco: 12 },
    { id: '3', nome: 'Barba', duracao_media: 20, preco: 8 },
    { id: '4', nome: 'Corte + Barba', duracao_media: 60, preco: 20 },
];

interface BookingFormProps {
    barbeariaId?: string;
    services?: Service[];
}

export default function BookingForm({ barbeariaId, services: propServices }: BookingFormProps) {
    const [step, setStep] = useState<BookingStep>('service');
    const [services, setServices] = useState<Service[]>(MOCK_SERVICES);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [slots, setSlots] = useState<string[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    // Form state
    const [selectedService, setSelectedService] = useState<string>('');
    const [selectedBarber, setSelectedBarber] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [nif, setNif] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { fireConfetti } = useConfetti();

    // Fetch services
    useEffect(() => {
        async function fetchServices() {
            try {
                const res = await fetch('/api/services');
                const data = await res.json();
                if (data.success && data.data.length > 0) {
                    setServices(data.data);
                }
            } catch (err) {
                console.log('Using mock services');
            }
        }
        fetchServices();
    }, []);

    // Fetch barbers
    useEffect(() => {
        async function fetchBarbers() {
            try {
                const res = await fetch('/api/barbers');
                const data = await res.json();
                if (data.success) {
                    setBarbers(data.data);
                }
            } catch (err) {
                console.log('Error fetching barbers');
            }
        }
        fetchBarbers();
    }, []);

    // Fetch slots when date or barber changes
    useEffect(() => {
        if (step !== 'datetime') return;

        async function fetchSlots() {
            setSlotsLoading(true);
            try {
                const dateStr = selectedDate.toISOString().split('T')[0];
                const res = await fetch(
                    `/api/slots?data=${dateStr}&barbeiro_id=${selectedBarber || 'any'}&servico_id=${selectedService}`
                );
                const data = await res.json();
                if (data.success) {
                    setSlots(data.data.slots);
                }
            } catch (err) {
                console.log('Error fetching slots');
                setSlots([]);
            }
            setSlotsLoading(false);
        }
        fetchSlots();
    }, [step, selectedDate, selectedBarber, selectedService]);

    const getService = () => services.find(s => s.id === selectedService);
    const getBarber = () => barbers.find(b => b.id === selectedBarber);

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 9);
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    };

    const handlePaymentSuccess = async (paymentIntentId: string) => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    servico_id: selectedService,
                    barbeiro_id: selectedBarber || 'any',
                    cliente_nome: nome,
                    cliente_telefone: '+351' + telefone.replace(/\s/g, ''),
                    cliente_email: email,
                    cliente_nif: nif || null,
                    data: selectedDate.toISOString().split('T')[0],
                    hora: selectedSlot,
                    deposito_id: paymentIntentId,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setStep('success');
                fireConfetti();
            } else {
                setError(data.error || 'Erro ao criar marcação');
            }
        } catch (err) {
            setError('Erro ao processar marcação');
        }
        setIsSubmitting(false);
    };

    const handlePaymentInit = async () => {
        const service = getService();
        const barber = getBarber();
        if (!service) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/payment/create-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: service.preco * 100,
                    customer_name: nome,
                    customer_email: email,
                    customer_phone: '+351' + telefone.replace(/\s/g, ''),
                    service_name: service.nome,
                    service_price: service.preco,
                    barber_name: selectedBarber === 'any' ? 'Qualquer disponível' : barber?.nome,
                    booking_date: selectedDate.toLocaleDateString('pt-PT', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                    }),
                    booking_time: selectedSlot,
                }),
            });
            const data = await res.json();
            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
                setStep('payment');
            }
        } catch (err) {
            setError('Erro ao iniciar pagamento');
        }
        setIsSubmitting(false);
    };

    const canProceed = () => {
        switch (step) {
            case 'service': return !!selectedService;
            case 'barber': return !!selectedBarber;
            case 'datetime': return !!selectedSlot;
            case 'details':
                const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                return nome.length >= 2 && telefone.replace(/\s/g, '').length === 9 && isEmailValid;
            default: return false;
        }
    };

    const nextStep = () => {
        const steps: BookingStep[] = ['service', 'barber', 'datetime', 'details'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex < steps.length - 1) {
            setStep(steps[currentIndex + 1]);
        } else if (step === 'details') {
            handlePaymentInit();
        }
    };

    const prevStep = () => {
        const steps: BookingStep[] = ['service', 'barber', 'datetime', 'details', 'payment'];
        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
            if (step === 'payment') setClientSecret(null);
            setStep(steps[currentIndex - 1]);
        }
    };

    // Success view
    if (step === 'success') {
        const service = getService();
        const barber = getBarber();
        return (
            <Card className="w-full max-w-md border-gold/20 bg-card/50 backdrop-blur-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl">Marcação Confirmada!</CardTitle>
                    <CardDescription>Guarde os detalhes da sua marcação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border border-gold/20 bg-gold/5 p-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Serviço:</span>
                            <span className="font-medium">{service?.nome}</span>
                        </div>
                        {barber && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Barbeiro:</span>
                                <span className="font-medium">{barber.nome}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Data:</span>
                            <span className="font-medium">
                                {selectedDate.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Hora:</span>
                            <span className="font-medium text-gold">{selectedSlot}</span>
                        </div>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        Receberá um SMS de lembrete antes da sua marcação.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Payment view
    if (step === 'payment' && clientSecret) {
        const service = getService();
        return (
            <Card className="w-full max-w-md border-gold/20 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <Button variant="ghost" size="sm" onClick={prevStep} className="w-fit">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <CardTitle>Pagamento</CardTitle>
                    <CardDescription>Depósito de €{service?.preco} para confirmar</CardDescription>
                </CardHeader>
                <CardContent>
                    <StripeCheckout
                        clientSecret={clientSecret}
                        amount={service?.preco || 0}
                        onSuccess={handlePaymentSuccess}
                        onCancel={prevStep}
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md border-gold/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                {step !== 'service' && (
                    <Button variant="ghost" size="sm" onClick={prevStep} className="w-fit">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                )}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                        {step === 'service' && <Scissors className="h-5 w-5 text-gold" />}
                        {step === 'barber' && <Scissors className="h-5 w-5 text-gold" />}
                        {step === 'datetime' && <Calendar className="h-5 w-5 text-gold" />}
                        {step === 'details' && <Clock className="h-5 w-5 text-gold" />}
                    </div>
                    <div>
                        <CardTitle>
                            {step === 'service' && 'Escolha o Serviço'}
                            {step === 'barber' && 'Escolha o Barbeiro'}
                            {step === 'datetime' && 'Escolha Data e Hora'}
                            {step === 'details' && 'Os Seus Dados'}
                        </CardTitle>
                        <CardDescription>
                            Passo {['service', 'barber', 'datetime', 'details'].indexOf(step) + 1} de 4
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                {/* Step 1: Service Selection */}
                {step === 'service' && (
                    <div className="grid gap-3">
                        {services.map((service) => (
                            <button
                                key={service.id}
                                onClick={() => setSelectedService(service.id)}
                                className={`flex items-center justify-between rounded-lg border p-4 transition-all ${selectedService === service.id
                                    ? 'border-gold bg-gold/10 ring-2 ring-gold'
                                    : 'border-border/50 hover:border-gold/50'
                                    }`}
                            >
                                <div className="text-left">
                                    <div className="font-medium">{service.nome}</div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {service.duracao_media}min
                                    </div>
                                </div>
                                <Badge variant="secondary" className="bg-gold/10 text-gold">
                                    €{service.preco}
                                </Badge>
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 2: Barber Selection */}
                {step === 'barber' && (
                    <BarberSelector
                        barbers={barbers}
                        selectedBarberId={selectedBarber}
                        onSelect={setSelectedBarber}
                    />
                )}

                {/* Step 3: Date & Time */}
                {step === 'datetime' && (
                    <TimeSlotPicker
                        slots={slots}
                        selectedSlot={selectedSlot}
                        onSelect={setSelectedSlot}
                        isLoading={slotsLoading}
                        selectedDate={selectedDate}
                        onDateChange={(date) => {
                            setSelectedDate(date);
                            setSelectedSlot('');
                        }}
                    />
                )}

                {/* Step 4: Customer Details */}
                {step === 'details' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome</Label>
                            <Input
                                id="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="O seu nome"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="telefone">Telemóvel</Label>
                            <div className="flex gap-2">
                                <div className="flex items-center rounded-md border border-border/50 px-3 text-sm">
                                    🇵🇹 +351
                                </div>
                                <Input
                                    id="telefone"
                                    value={telefone}
                                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                                    placeholder="912 345 678"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@exemplo.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nif">NIF <span className="text-muted-foreground text-xs">(opcional, para fatura)</span></Label>
                            <Input
                                id="nif"
                                value={nif}
                                onChange={(e) => setNif(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                placeholder="123456789"
                            />
                        </div>

                        {/* Summary */}
                        <div className="rounded-lg border border-gold/20 bg-gold/5 p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Serviço:</span>
                                <span>{getService()?.nome}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Barbeiro:</span>
                                <span>{selectedBarber === 'any' ? 'Qualquer' : getBarber()?.nome}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Data:</span>
                                <span>{selectedDate.toLocaleDateString('pt-PT')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Hora:</span>
                                <span className="text-gold font-medium">{selectedSlot}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gold/20">
                                <span className="font-medium">Total:</span>
                                <span className="font-bold text-gold">€{getService()?.preco}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <Button
                    onClick={nextStep}
                    disabled={!canProceed() || isSubmitting}
                    className="w-full bg-gold text-black hover:bg-gold/90"
                >
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    {step === 'details' ? 'Pagar e Confirmar' : 'Continuar'}
                </Button>
            </CardContent>
        </Card>
    );
}
