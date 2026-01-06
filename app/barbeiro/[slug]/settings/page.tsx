'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Scissors,
    ArrowLeft,
    Plus,
    Minus,
    Trash2,
    Save,
    Clock,
    Euro,
    Settings2,
    Calendar,
    Loader2,
    Check,
    X,
    Sparkles,
    PenLine,
    Users,
    User,
    Mail,
    Phone,
    Camera,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface Service {
    id: string;
    nome: string;
    duracao_media: number;
    preco: number;
    descricao?: string;
    activo: boolean;
}

interface ScheduleEntry {
    dia_semana: number;
    hora_abertura: string;
    hora_fecho: string;
    fechado: boolean;
}

interface Barber {
    id: string;
    nome: string;
    email?: string;
    telefone?: string;
    foto_url?: string;
    data_nascimento?: string;
    especialidades?: string[];
    bio?: string;
    activo: boolean;
}

interface Barbershop {
    id: string;
    nome: string;
    slug: string;
}

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Default schedule if none exists
const DEFAULT_SCHEDULE: ScheduleEntry[] = [
    { dia_semana: 0, hora_abertura: '09:00', hora_fecho: '13:00', fechado: true },
    { dia_semana: 1, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
    { dia_semana: 2, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
    { dia_semana: 3, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
    { dia_semana: 4, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
    { dia_semana: 5, hora_abertura: '09:00', hora_fecho: '19:00', fechado: false },
    { dia_semana: 6, hora_abertura: '09:00', hora_fecho: '17:00', fechado: false },
];

// Service templates for quick setup
const SERVICE_TEMPLATES = [
    { nome: 'Corte Clássico', duracao_media: 30, precoSugerido: 12 },
    { nome: 'Corte Fade', duracao_media: 45, precoSugerido: 15 },
    { nome: 'Corte Degradê', duracao_media: 40, precoSugerido: 14 },
    { nome: 'Barba', duracao_media: 20, precoSugerido: 8 },
    { nome: 'Corte + Barba', duracao_media: 50, precoSugerido: 20 },
    { nome: 'Riscos/Design', duracao_media: 15, precoSugerido: 5 },
    { nome: 'Sobrancelhas', duracao_media: 10, precoSugerido: 5 },
    { nome: 'Coloração', duracao_media: 60, precoSugerido: 25 },
    { nome: 'Tratamento Capilar', duracao_media: 30, precoSugerido: 15 },
    { nome: 'Kids (Criança)', duracao_media: 25, precoSugerido: 10 },
];

type TabType = 'services' | 'schedule' | 'barbers';

function SettingsContent({ barbershop }: { barbershop: Barbershop }) {
    const [activeTab, setActiveTab] = useState<TabType>('services');
    const [services, setServices] = useState<Service[]>([]);
    const [schedule, setSchedule] = useState<ScheduleEntry[]>(DEFAULT_SCHEDULE);
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingService, setEditingService] = useState<string | null>(null);
    const [newService, setNewService] = useState<Partial<Service> | null>(null);
    const [creationMode, setCreationMode] = useState<'template' | 'custom'>('template');
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [newBarber, setNewBarber] = useState<Partial<Barber> | null>(null);
    const [editingBarber, setEditingBarber] = useState<string | null>(null);

    const fetchServices = useCallback(async () => {
        try {
            const response = await fetch(`/api/services?barbearia_id=${barbershop.id}`);
            const result = await response.json();
            if (result.success) {
                setServices(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    }, [barbershop.id]);

    const fetchSchedule = useCallback(async () => {
        try {
            const response = await fetch(`/api/schedule?barbearia_id=${barbershop.id}`);
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
                setSchedule(result.data);
            } else {
                // Use default schedule if none exists
                setSchedule(DEFAULT_SCHEDULE);
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
            setSchedule(DEFAULT_SCHEDULE);
        }
    }, [barbershop.id]);

    const fetchBarbers = useCallback(async () => {
        try {
            const response = await fetch(`/api/barbers?barbearia_id=${barbershop.id}&active_only=false`);
            const result = await response.json();
            if (result.success) {
                setBarbers(result.data || []);
            }
        } catch (error) {
            console.error('Error fetching barbers:', error);
        }
    }, [barbershop.id]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchServices(), fetchSchedule(), fetchBarbers()]);
            setIsLoading(false);
        };
        loadData();
    }, [fetchServices, fetchSchedule, fetchBarbers]);

    const handleCreateService = async () => {
        if (!newService?.nome || !newService?.duracao_media || newService?.preco === undefined) return;

        setIsSaving(true);
        try {
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barbearia_id: barbershop.id,
                    ...newService,
                }),
            });
            const result = await response.json();
            if (result.success) {
                setServices(prev => [...prev, result.data]);
                setNewService(null);
            }
        } catch (error) {
            console.error('Error creating service:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateService = async (service: Service) => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/services', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(service),
            });
            const result = await response.json();
            if (result.success) {
                setServices(prev => prev.map(s => s.id === service.id ? result.data : s));
                setEditingService(null);
            }
        } catch (error) {
            console.error('Error updating service:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteService = async (id: string) => {
        if (!confirm('Tem a certeza que deseja eliminar este serviço?')) return;

        try {
            const response = await fetch(`/api/services?id=${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                setServices(prev => prev.filter(s => s.id !== id));
            }
        } catch (error) {
            console.error('Error deleting service:', error);
        }
    };

    const handleScheduleChange = (day: number, field: keyof ScheduleEntry, value: string | boolean) => {
        setSchedule(prev => prev.map(entry =>
            entry.dia_semana === day ? { ...entry, [field]: value } : entry
        ));
    };

    const handleSaveSchedule = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barbearia_id: barbershop.id,
                    schedule,
                }),
            });
            const result = await response.json();
            if (result.success) {
                setSaveMessage({ type: 'success', text: 'Horário guardado com sucesso!' });
                setTimeout(() => setSaveMessage(null), 4000);
            } else {
                setSaveMessage({ type: 'error', text: 'Não foi possível guardar o horário.' });
                setTimeout(() => setSaveMessage(null), 4000);
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            setSaveMessage({ type: 'error', text: 'Erro ao guardar horário.' });
            setTimeout(() => setSaveMessage(null), 4000);
        } finally {
            setIsSaving(false);
        }
    };

    // Barber handlers
    const handleCreateBarber = async () => {
        if (!newBarber?.nome) return;

        setIsSaving(true);
        try {
            const response = await fetch('/api/barbers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barbearia_id: barbershop.id,
                    ...newBarber,
                    activo: true,
                }),
            });
            const result = await response.json();
            if (result.success) {
                setBarbers(prev => [...prev, result.data]);
                setNewBarber(null);
            }
        } catch (error) {
            console.error('Error creating barber:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateBarber = async (barber: Barber) => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/barbers', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(barber),
            });
            const result = await response.json();
            if (result.success) {
                setBarbers(prev => prev.map(b => b.id === barber.id ? result.data : b));
                setEditingBarber(null);
            }
        } catch (error) {
            console.error('Error updating barber:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBarber = async (id: string) => {
        if (!confirm('Tens a certeza que queres eliminar este barbeiro?')) return;
        try {
            const response = await fetch(`/api/barbers?id=${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                setBarbers(prev => prev.filter(b => b.id !== id));
            }
        } catch (error) {
            console.error('Error deleting barber:', error);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Link href={`/barbeiro/${barbershop.slug}`}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                            <Settings2 className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Definições</h1>
                            <p className="text-sm text-muted-foreground">{barbershop.nome}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-4xl space-y-6">
                    <div className="flex gap-2 border-b border-border pb-2">
                        <Button
                            variant={activeTab === 'services' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('services')}
                        >
                            <Scissors className="mr-2 h-4 w-4" />
                            Serviços
                        </Button>
                        <Button
                            variant={activeTab === 'schedule' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('schedule')}
                        >
                            <Calendar className="mr-2 h-4 w-4" />
                            Horário
                        </Button>
                        <Button
                            variant={activeTab === 'barbers' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('barbers')}
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Barbeiros
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-gold" />
                        </div>
                    ) : (
                        <>
                            {activeTab === 'services' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold">Serviços</h2>
                                        <Button
                                            onClick={() => setNewService({ nome: '', duracao_media: 30, preco: 0, activo: true })}
                                            disabled={!!newService}
                                            className="bg-gold text-black hover:bg-gold/90"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Adicionar
                                        </Button>
                                    </div>

                                    {newService && (
                                        <Card className="border-gold/30 bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
                                            {/* Mode Toggle */}
                                            <div className="flex border-b border-zinc-800">
                                                <button
                                                    onClick={() => {
                                                        setCreationMode('template');
                                                        setNewService({ nome: '', duracao_media: 30, preco: 0, activo: true });
                                                    }}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${creationMode === 'template'
                                                        ? 'bg-gold/10 text-gold border-b-2 border-gold'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-zinc-800/50'
                                                        }`}
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                    Template
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setCreationMode('custom');
                                                        setNewService({ nome: '', duracao_media: 30, preco: 0, activo: true });
                                                    }}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${creationMode === 'custom'
                                                        ? 'bg-gold/10 text-gold border-b-2 border-gold'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-zinc-800/50'
                                                        }`}
                                                >
                                                    <PenLine className="h-4 w-4" />
                                                    Personalizado
                                                </button>
                                            </div>

                                            <CardContent className="p-5 space-y-5">
                                                {creationMode === 'template' ? (
                                                    /* Template Mode */
                                                    <div>
                                                        <Label className="mb-2 block text-sm text-muted-foreground">Escolher template</Label>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full h-12 justify-between text-left font-normal bg-zinc-900/50 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-gold/50 transition-all duration-200"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
                                                                            <Scissors className="h-4 w-4 text-gold" />
                                                                        </div>
                                                                        <span className={newService.nome ? 'text-foreground' : 'text-muted-foreground'}>
                                                                            {newService.nome || 'Seleccionar serviço...'}
                                                                        </span>
                                                                    </div>
                                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                className="w-[--radix-dropdown-menu-trigger-width] p-2 bg-zinc-900/95 backdrop-blur-xl border-zinc-700/50 shadow-2xl shadow-black/50"
                                                                sideOffset={8}
                                                            >
                                                                <DropdownMenuLabel className="text-gold font-semibold px-2 py-1.5">
                                                                    Templates de Serviço
                                                                </DropdownMenuLabel>
                                                                <DropdownMenuSeparator className="bg-zinc-700/50" />
                                                                <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1">
                                                                    {SERVICE_TEMPLATES.map((t) => (
                                                                        <DropdownMenuItem
                                                                            key={t.nome}
                                                                            onClick={() => {
                                                                                setNewService({
                                                                                    nome: t.nome,
                                                                                    duracao_media: t.duracao_media,
                                                                                    preco: t.precoSugerido,
                                                                                    activo: true,
                                                                                });
                                                                            }}
                                                                            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gold/10 focus:bg-gold/10 transition-all duration-150 group"
                                                                        >
                                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 group-hover:bg-gold/20 transition-colors">
                                                                                <Scissors className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="font-medium text-foreground group-hover:text-gold transition-colors">
                                                                                    {t.nome}
                                                                                </p>
                                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                                                        <Clock className="h-3 w-3" />
                                                                                        {t.duracao_media}min
                                                                                    </span>
                                                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gold">
                                                                                        <Euro className="h-3 w-3" />
                                                                                        {t.precoSugerido}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <div className="h-6 w-6 rounded-full bg-gold/20 flex items-center justify-center">
                                                                                    <Plus className="h-3 w-3 text-gold" />
                                                                                </div>
                                                                            </div>
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </div>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                ) : (
                                                    /* Custom Mode - Name Input */
                                                    <div>
                                                        <Label className="mb-2 block text-sm text-muted-foreground">Nome do Serviço</Label>
                                                        <div className="relative">
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
                                                                    <PenLine className="h-4 w-4 text-gold" />
                                                                </div>
                                                            </div>
                                                            <Input
                                                                value={newService.nome || ''}
                                                                onChange={(e) => setNewService(prev => ({ ...prev!, nome: e.target.value }))}
                                                                placeholder="Ex: Corte Especial"
                                                                className="h-12 pl-14 bg-zinc-900/50 border-zinc-700/50 focus:border-gold/50"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Duration & Price - Premium Stepper Inputs */}
                                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                                    {/* Duration Stepper */}
                                                    <div>
                                                        <Label className="mb-2 block text-sm text-muted-foreground">Duração</Label>
                                                        <div className="flex items-center gap-2 p-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg h-12">
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewService(prev => ({
                                                                    ...prev!,
                                                                    duracao_media: Math.max(5, (prev?.duracao_media || 30) - 5)
                                                                }))}
                                                                className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 hover:bg-gold/20 text-muted-foreground hover:text-gold transition-colors"
                                                            >
                                                                <Minus className="h-4 w-4" />
                                                            </button>
                                                            <div className="flex-1 text-center">
                                                                <div className="flex items-center justify-center gap-1.5">
                                                                    <Clock className="h-4 w-4 text-gold" />
                                                                    <span className="text-lg font-semibold text-foreground">
                                                                        {newService.duracao_media || 30}
                                                                    </span>
                                                                    <span className="text-sm text-muted-foreground">min</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setNewService(prev => ({
                                                                    ...prev!,
                                                                    duracao_media: Math.min(180, (prev?.duracao_media || 30) + 5)
                                                                }))}
                                                                className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 hover:bg-gold/20 text-muted-foreground hover:text-gold transition-colors"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Price Input */}
                                                    <div>
                                                        <Label className="mb-2 block text-sm text-muted-foreground">Preço</Label>
                                                        <div className="relative">
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
                                                                <Euro className="h-4 w-4 text-gold" />
                                                            </div>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={newService.preco || ''}
                                                                onChange={(e) => setNewService(prev => ({
                                                                    ...prev!,
                                                                    preco: parseFloat(e.target.value) || 0
                                                                }))}
                                                                placeholder="0.00"
                                                                className="w-full h-12 pl-14 pr-4 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-lg font-semibold text-foreground focus:outline-none focus:border-gold/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-3 pt-2">
                                                    <Button
                                                        onClick={handleCreateService}
                                                        disabled={isSaving || !newService.nome}
                                                        className="flex-1 h-11 bg-gold text-black hover:bg-gold/90 font-medium"
                                                    >
                                                        {isSaving ? (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Check className="mr-2 h-4 w-4" />
                                                        )}
                                                        Criar Serviço
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => setNewService(null)}
                                                        className="h-11 px-4 hover:bg-zinc-800"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <div className="space-y-2">
                                        {services.map(service => (
                                            <Card key={service.id} className="transition-colors hover:border-gold/30">
                                                <CardContent className="p-4">
                                                    {editingService === service.id ? (
                                                        <div className="grid gap-4 sm:grid-cols-4">
                                                            <div>
                                                                <Label>Nome</Label>
                                                                <Input
                                                                    value={service.nome}
                                                                    onChange={(e) => setServices(prev => prev.map(s => s.id === service.id ? { ...s, nome: e.target.value } : s))}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Duração (min)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={service.duracao_media}
                                                                    onChange={(e) => setServices(prev => prev.map(s => s.id === service.id ? { ...s, duracao_media: parseInt(e.target.value) || 0 } : s))}
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Preço (€)</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={service.preco}
                                                                    onChange={(e) => setServices(prev => prev.map(s => s.id === service.id ? { ...s, preco: parseFloat(e.target.value) || 0 } : s))}
                                                                />
                                                            </div>
                                                            <div className="flex items-end gap-2">
                                                                <Button onClick={() => handleUpdateService(service)} disabled={isSaving}>
                                                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                                </Button>
                                                                <Button variant="ghost" onClick={() => setEditingService(null)}>
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div>
                                                                    <p className="font-medium">{service.nome}</p>
                                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="h-3 w-3" />
                                                                            {service.duracao_media} min
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <Euro className="h-3 w-3" />
                                                                            {service.preco}€
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {!service.activo && (
                                                                    <Badge variant="secondary">Inactivo</Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button variant="ghost" size="sm" onClick={() => setEditingService(service.id)}>
                                                                    Editar
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)}>
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'schedule' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold">Horário de Funcionamento</h2>
                                        <Button onClick={handleSaveSchedule} disabled={isSaving} className="bg-gold text-black hover:bg-gold/90">
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                            Guardar
                                        </Button>
                                    </div>

                                    {/* Success/Error Banner */}
                                    {saveMessage && (
                                        <div className={`flex items-center gap-3 p-4 rounded-lg border ${saveMessage.type === 'success'
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                            : 'bg-red-500/20 border-red-500 text-red-400'
                                            }`}>
                                            {saveMessage.type === 'success' ? (
                                                <Check className="h-5 w-5" />
                                            ) : (
                                                <X className="h-5 w-5" />
                                            )}
                                            <span className="font-medium">{saveMessage.text}</span>
                                        </div>
                                    )}

                                    <Card>
                                        <CardContent className="p-4 space-y-4">
                                            {schedule.map(entry => (
                                                <div key={entry.dia_semana} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-border/30 pb-4 last:border-0 last:pb-0">
                                                    <div className="w-full sm:w-24 flex justify-between sm:block">
                                                        <span className="font-medium">{DIAS_SEMANA[entry.dia_semana]}</span>
                                                        {/* Mobile: show status inline */}
                                                        <div className="sm:hidden flex items-center gap-2">
                                                            <Switch
                                                                checked={!entry.fechado}
                                                                onCheckedChange={(checked) => handleScheduleChange(entry.dia_semana, 'fechado', !checked)}
                                                            />
                                                            <span className="text-sm text-muted-foreground">
                                                                {entry.fechado ? 'Fechado' : 'Aberto'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {/* Desktop: separate status toggle */}
                                                    <div className="hidden sm:flex items-center gap-2">
                                                        <Switch
                                                            checked={!entry.fechado}
                                                            onCheckedChange={(checked) => handleScheduleChange(entry.dia_semana, 'fechado', !checked)}
                                                        />
                                                        <span className="text-sm text-muted-foreground w-16">
                                                            {entry.fechado ? 'Fechado' : 'Aberto'}
                                                        </span>
                                                    </div>
                                                    {!entry.fechado && (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="time"
                                                                value={entry.hora_abertura}
                                                                onChange={(e) => handleScheduleChange(entry.dia_semana, 'hora_abertura', e.target.value)}
                                                                className="w-full sm:w-28"
                                                            />
                                                            <span className="text-muted-foreground">até</span>
                                                            <Input
                                                                type="time"
                                                                value={entry.hora_fecho}
                                                                onChange={(e) => handleScheduleChange(entry.dia_semana, 'hora_fecho', e.target.value)}
                                                                className="w-full sm:w-28"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}\n                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'barbers' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold">Equipa</h2>
                                        <Button
                                            onClick={() => setNewBarber({ nome: '', email: '', telefone: '', bio: '', especialidades: [], activo: true })}
                                            disabled={!!newBarber}
                                            className="bg-gold text-black hover:bg-gold/90"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Adicionar Barbeiro
                                        </Button>
                                    </div>

                                    {/* New Barber Form */}
                                    {newBarber && (
                                        <Card className="border-gold/30 bg-zinc-900/50">
                                            <CardHeader className="pb-4">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gold" />
                                                    Novo Barbeiro
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                                    <div>
                                                        <Label className="mb-2 block text-sm text-muted-foreground">Nome *</Label>
                                                        <div className="relative">
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                                                <User className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <Input
                                                                value={newBarber.nome || ''}
                                                                onChange={(e) => setNewBarber(prev => ({ ...prev!, nome: e.target.value }))}
                                                                placeholder="Nome completo"
                                                                className="pl-10 bg-zinc-900/50 border-zinc-700/50"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="mb-2 block text-sm text-muted-foreground">Email</Label>
                                                        <div className="relative">
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <Input
                                                                type="email"
                                                                value={newBarber.email || ''}
                                                                onChange={(e) => setNewBarber(prev => ({ ...prev!, email: e.target.value }))}
                                                                placeholder="email@exemplo.com"
                                                                className="pl-10 bg-zinc-900/50 border-zinc-700/50"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="mb-2 block text-sm text-muted-foreground">Telefone</Label>
                                                        <div className="relative">
                                                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                            </div>
                                                            <Input
                                                                type="tel"
                                                                value={newBarber.telefone || ''}
                                                                onChange={(e) => setNewBarber(prev => ({ ...prev!, telefone: e.target.value }))}
                                                                placeholder="+351 912 345 678"
                                                                className="pl-10 bg-zinc-900/50 border-zinc-700/50"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="mb-2 block text-sm text-muted-foreground">Data de Nascimento</Label>
                                                        <Input
                                                            type="date"
                                                            value={newBarber.data_nascimento || ''}
                                                            onChange={(e) => setNewBarber(prev => ({ ...prev!, data_nascimento: e.target.value }))}
                                                            className="bg-zinc-900/50 border-zinc-700/50"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label className="mb-2 block text-sm text-muted-foreground">Bio / Especialidades</Label>
                                                    <Input
                                                        value={newBarber.bio || ''}
                                                        onChange={(e) => setNewBarber(prev => ({ ...prev!, bio: e.target.value }))}
                                                        placeholder="Ex: Especialista em fade e barba..."
                                                        className="bg-zinc-900/50 border-zinc-700/50"
                                                    />
                                                </div>
                                                <div className="flex gap-3 pt-2">
                                                    <Button
                                                        onClick={handleCreateBarber}
                                                        disabled={isSaving || !newBarber.nome}
                                                        className="flex-1 h-11 bg-gold text-black hover:bg-gold/90"
                                                    >
                                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                                        Adicionar
                                                    </Button>
                                                    <Button variant="ghost" onClick={() => setNewBarber(null)} className="h-11">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Barbers List */}
                                    <div className="space-y-3">
                                        {barbers.length === 0 && !newBarber ? (
                                            <Card className="border-dashed border-2 border-zinc-700">
                                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 mb-4">
                                                        <Users className="h-8 w-8 text-gold" />
                                                    </div>
                                                    <h3 className="font-semibold mb-1">Ainda não tens barbeiros</h3>
                                                    <p className="text-sm text-muted-foreground mb-4">Adiciona membros da tua equipa para os clientes poderem escolher.</p>
                                                    <Button
                                                        onClick={() => setNewBarber({ nome: '', activo: true })}
                                                        className="bg-gold text-black hover:bg-gold/90"
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Adicionar Primeiro Barbeiro
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            barbers.map(barber => (
                                                <Card key={barber.id} className={`transition-colors ${!barber.activo ? 'opacity-50' : ''} hover:border-gold/30`}>
                                                    <CardContent className="p-4">
                                                        {editingBarber === barber.id ? (
                                                            /* Edit Mode */
                                                            <div className="space-y-4">
                                                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                                                    <div>
                                                                        <Label className="mb-1 block text-xs text-muted-foreground">Nome</Label>
                                                                        <Input
                                                                            value={barber.nome}
                                                                            onChange={(e) => setBarbers(prev => prev.map(b => b.id === barber.id ? { ...b, nome: e.target.value } : b))}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="mb-1 block text-xs text-muted-foreground">Email</Label>
                                                                        <Input
                                                                            value={barber.email || ''}
                                                                            onChange={(e) => setBarbers(prev => prev.map(b => b.id === barber.id ? { ...b, email: e.target.value } : b))}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="mb-1 block text-xs text-muted-foreground">Telefone</Label>
                                                                        <Input
                                                                            value={barber.telefone || ''}
                                                                            onChange={(e) => setBarbers(prev => prev.map(b => b.id === barber.id ? { ...b, telefone: e.target.value } : b))}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="mb-1 block text-xs text-muted-foreground">Bio</Label>
                                                                        <Input
                                                                            value={barber.bio || ''}
                                                                            onChange={(e) => setBarbers(prev => prev.map(b => b.id === barber.id ? { ...b, bio: e.target.value } : b))}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between pt-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Switch
                                                                            checked={barber.activo}
                                                                            onCheckedChange={(checked) => setBarbers(prev => prev.map(b => b.id === barber.id ? { ...b, activo: checked } : b))}
                                                                        />
                                                                        <span className="text-sm text-muted-foreground">Activo</span>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleUpdateBarber(barber)}
                                                                            disabled={isSaving}
                                                                            className="bg-gold text-black hover:bg-gold/90"
                                                                        >
                                                                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost" onClick={() => setEditingBarber(null)}>
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* View Mode */
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold/10">
                                                                    {barber.foto_url ? (
                                                                        <img src={barber.foto_url} alt={barber.nome} className="h-14 w-14 rounded-full object-cover" />
                                                                    ) : (
                                                                        <User className="h-6 w-6 text-gold" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <h3 className="font-semibold">{barber.nome}</h3>
                                                                        {!barber.activo && (
                                                                            <Badge variant="outline" className="text-xs">Inactivo</Badge>
                                                                        )}
                                                                    </div>
                                                                    {barber.bio && (
                                                                        <p className="text-sm text-muted-foreground truncate">{barber.bio}</p>
                                                                    )}
                                                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                                        {barber.email && (
                                                                            <span className="flex items-center gap-1">
                                                                                <Mail className="h-3 w-3" />
                                                                                {barber.email}
                                                                            </span>
                                                                        )}
                                                                        {barber.telefone && (
                                                                            <span className="flex items-center gap-1">
                                                                                <Phone className="h-3 w-3" />
                                                                                {barber.telefone}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Button size="icon" variant="ghost" onClick={() => setEditingBarber(barber.id)}>
                                                                        <PenLine className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteBarber(barber.id)}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

function SettingsPage() {
    const params = useParams();
    const slug = params.slug as string;
    const supabase = createClient();

    const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadBarbershop() {
            try {
                const { data: shop, error: shopError } = await supabase
                    .from('barbearias')
                    .select('id, nome, slug')
                    .eq('slug', slug)
                    .single();

                if (shopError || !shop) {
                    setError('Barbearia não encontrada');
                    return;
                }

                setBarbershop(shop);
            } catch {
                setError('Erro ao carregar barbearia');
            } finally {
                setIsLoading(false);
            }
        }

        loadBarbershop();
    }, [slug, supabase]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
        );
    }

    if (error || !barbershop) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-destructive">{error}</p>
            </div>
        );
    }

    return <SettingsContent barbershop={barbershop} />;
}

export default function BarbeiroSettingsPage() {
    return (
        <AuthGuard>
            <SettingsPage />
        </AuthGuard>
    );
}
