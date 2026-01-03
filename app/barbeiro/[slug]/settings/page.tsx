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
    Trash2,
    Save,
    Clock,
    Euro,
    Settings2,
    Calendar,
    Loader2,
    Check,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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

type TabType = 'services' | 'schedule' | 'profile';

function SettingsContent({ barbershop }: { barbershop: Barbershop }) {
    const [activeTab, setActiveTab] = useState<TabType>('services');
    const [services, setServices] = useState<Service[]>([]);
    const [schedule, setSchedule] = useState<ScheduleEntry[]>(DEFAULT_SCHEDULE);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingService, setEditingService] = useState<string | null>(null);
    const [newService, setNewService] = useState<Partial<Service> | null>(null);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchServices(), fetchSchedule()]);
            setIsLoading(false);
        };
        loadData();
    }, [fetchServices, fetchSchedule]);

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
                                        <Card className="border-gold/50 bg-gold/5">
                                            <CardContent className="p-4 space-y-4">
                                                {/* Template selector */}
                                                <div>
                                                    <Label>Escolher template</Label>
                                                    <select
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                        value=""
                                                        onChange={(e) => {
                                                            const template = SERVICE_TEMPLATES.find(t => t.nome === e.target.value);
                                                            if (template) {
                                                                setNewService({
                                                                    nome: template.nome,
                                                                    duracao_media: template.duracao_media,
                                                                    preco: template.precoSugerido,
                                                                    activo: true,
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <option value="">Seleccionar serviço...</option>
                                                        {SERVICE_TEMPLATES.map(t => (
                                                            <option key={t.nome} value={t.nome}>
                                                                {t.nome} ({t.duracao_media}min - €{t.precoSugerido} sugerido)
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Manual fields */}
                                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                                                    <div>
                                                        <Label>Nome</Label>
                                                        <Input
                                                            value={newService.nome || ''}
                                                            onChange={(e) => setNewService(prev => ({ ...prev!, nome: e.target.value }))}
                                                            placeholder="Ex: Corte Fade"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Duração (min)</Label>
                                                        <Input
                                                            type="number"
                                                            value={newService.duracao_media || ''}
                                                            onChange={(e) => setNewService(prev => ({ ...prev!, duracao_media: parseInt(e.target.value) || 0 }))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label>Preço (€)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={newService.preco || ''}
                                                            onChange={(e) => setNewService(prev => ({ ...prev!, preco: parseFloat(e.target.value) || 0 }))}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Actions - full width on mobile */}
                                                <div className="flex gap-2 pt-2">
                                                    <Button onClick={handleCreateService} disabled={isSaving} className="flex-1 sm:flex-none">
                                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                                        Adicionar
                                                    </Button>
                                                    <Button variant="ghost" onClick={() => setNewService(null)}>
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
                                            ))}
                                        </CardContent>
                                    </Card>
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
