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
    LayoutGrid,
    List,
    Upload,
    Search,
    Lock,
    Crown,
    MessageSquare,
    CreditCard,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';

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
    is_pro?: boolean;
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
    const [barberViewMode, setBarberViewMode] = useState<'list' | 'gallery'>('gallery');
    const [isUploading, setIsUploading] = useState(false);
    const [barberToDelete, setBarberToDelete] = useState<Barber | null>(null);
    const [barberSearch, setBarberSearch] = useState('');
    const [viewingBarber, setViewingBarber] = useState<Barber | null>(null);
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const { toast } = useToast();

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
                toast({
                    title: "Serviço criado",
                    description: "O serviço foi adicionado com sucesso à lista.",
                });
            }
        } catch (error) {
            console.error('Error creating service:', error);
            toast({
                variant: "destructive",
                title: "Erro ao criar serviço",
                description: "Não foi possível criar o serviço. Tenta novamente.",
            });
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
                toast({
                    title: "Barbeiro adicionado",
                    description: `${newBarber.nome} foi adicionado à equipa.`,
                });
            } else {
                console.error('Error creating barber:', result.error);
                toast({
                    variant: "destructive",
                    title: "Erro ao criar barbeiro",
                    description: result.error || "Não foi possível criar o barbeiro. Verifica as permissões.",
                });
            }
        } catch (error) {
            console.error('Error creating barber:', error);
            toast({
                variant: "destructive",
                title: "Erro de rede",
                description: "Não foi possível conectar ao servidor. Tenta novamente.",
            });
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

    const handleDeleteBarber = async () => {
        if (!barberToDelete) return;
        try {
            const response = await fetch(`/api/barbers?id=${barberToDelete.id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                setBarbers(prev => prev.filter(b => b.id !== barberToDelete.id));
            }
        } catch (error) {
            console.error('Error deleting barber:', error);
        } finally {
            setBarberToDelete(null);
        }
    };

    // File upload handler
    const handleFileUpload = async (file: File, setPhotoUrl: (url: string) => void) => {
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'barbeiros');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.success && result.url) {
                setPhotoUrl(result.url);
            } else {
                console.error('Upload failed:', result.error);
                alert(result.error || 'Erro ao fazer upload da imagem');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erro ao fazer upload da imagem');
        } finally {
            setIsUploading(false);
        }
    };

    // Handle Pro upgrade
    const handleUpgrade = async () => {
        setIsUpgrading(true);
        try {
            const response = await fetch('/api/subscription/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barbearia_id: barbershop.id,
                    slug: barbershop.slug,
                }),
            });
            const result = await response.json();
            if (result.success && result.url) {
                window.location.href = result.url;
            } else {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: result.error || "Não foi possível iniciar o pagamento.",
                });
            }
        } catch (error) {
            console.error('Error starting checkout:', error);
            toast({
                variant: "destructive",
                title: "Erro de rede",
                description: "Não foi possível conectar ao servidor.",
            });
        } finally {
            setIsUpgrading(false);
            setShowUpgradeDialog(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
            {/* Premium Header */}
            <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-10">
                <div className="container mx-auto flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href={`/barbeiro/${barbershop.slug}`}>
                            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 ring-1 ring-amber-500/20">
                            <Settings2 className="h-6 w-6 text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Definições</h1>
                            <p className="text-sm text-zinc-500">{barbershop.nome}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mx-auto max-w-4xl space-y-8">
                    {/* Pro Features Section */}
                    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/10 ring-1 ring-amber-500/20">
                                        <Crown className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">Funcionalidades Pro</CardTitle>
                                        <p className="text-xs text-zinc-500">
                                            {barbershop.is_pro ? 'Plano Pro ativo' : 'Upgrada para desbloquear'}
                                        </p>
                                    </div>
                                </div>
                                {barbershop.is_pro && (
                                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-black">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Pro
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* SMS Notifications Toggle */}
                            <div
                                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${barbershop.is_pro
                                    ? 'border-zinc-700/50 bg-zinc-800/30'
                                    : 'border-zinc-700/30 bg-zinc-800/20 cursor-pointer hover:border-amber-500/30'
                                    }`}
                                onClick={!barbershop.is_pro ? () => setShowUpgradeDialog(true) : undefined}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${barbershop.is_pro ? 'bg-amber-500/20' : 'bg-zinc-700/50'
                                        }`}>
                                        <MessageSquare className={`h-4 w-4 ${barbershop.is_pro ? 'text-amber-400' : 'text-zinc-500'}`} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${barbershop.is_pro ? 'text-white' : 'text-zinc-400'}`}>
                                            Notificações SMS
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {barbershop.is_pro ? 'Envia SMS aos clientes' : 'Disponível no plano Pro'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!barbershop.is_pro && (
                                        <Lock className="h-4 w-4 text-zinc-500" />
                                    )}
                                    <Switch
                                        checked={barbershop.is_pro}
                                        disabled={!barbershop.is_pro}
                                        onCheckedChange={() => {
                                            if (!barbershop.is_pro) {
                                                setShowUpgradeDialog(true);
                                            }
                                        }}
                                        onClick={(e) => {
                                            if (!barbershop.is_pro) {
                                                e.preventDefault();
                                                setShowUpgradeDialog(true);
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Online Payments Toggle */}
                            <div
                                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${barbershop.is_pro
                                    ? 'border-zinc-700/50 bg-zinc-800/30'
                                    : 'border-zinc-700/30 bg-zinc-800/20 cursor-pointer hover:border-amber-500/30'
                                    }`}
                                onClick={!barbershop.is_pro ? () => setShowUpgradeDialog(true) : undefined}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${barbershop.is_pro ? 'bg-amber-500/20' : 'bg-zinc-700/50'
                                        }`}>
                                        <CreditCard className={`h-4 w-4 ${barbershop.is_pro ? 'text-amber-400' : 'text-zinc-500'}`} />
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${barbershop.is_pro ? 'text-white' : 'text-zinc-400'}`}>
                                            Pagamentos Online
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {barbershop.is_pro ? 'Aceita pagamentos online' : 'Disponível no plano Pro'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!barbershop.is_pro && (
                                        <Lock className="h-4 w-4 text-zinc-500" />
                                    )}
                                    <Switch
                                        checked={barbershop.is_pro}
                                        disabled={!barbershop.is_pro}
                                        onCheckedChange={() => {
                                            if (!barbershop.is_pro) {
                                                setShowUpgradeDialog(true);
                                            }
                                        }}
                                        onClick={(e) => {
                                            if (!barbershop.is_pro) {
                                                e.preventDefault();
                                                setShowUpgradeDialog(true);
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {!barbershop.is_pro && (
                                <Button
                                    onClick={() => setShowUpgradeDialog(true)}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold hover:from-amber-400 hover:to-orange-400"
                                >
                                    <Crown className="h-4 w-4 mr-2" />
                                    Fazer Upgrade para Pro - 29€/mês
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Premium Tab Navigation */}
                    <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-xl border border-white/5 backdrop-blur-sm">
                        <button
                            onClick={() => setActiveTab('services')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'services'
                                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 shadow-lg shadow-amber-500/10 border border-amber-500/20'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Scissors className="h-4 w-4" />
                            Serviços
                        </button>
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'schedule'
                                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 shadow-lg shadow-amber-500/10 border border-amber-500/20'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Calendar className="h-4 w-4" />
                            Horário
                        </button>
                        <button
                            onClick={() => setActiveTab('barbers')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'barbers'
                                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 shadow-lg shadow-amber-500/10 border border-amber-500/20'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Users className="h-4 w-4" />
                            Barbeiros
                        </button>
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
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'barbers' && (
                                <div className="space-y-4">
                                    {/* Header Row */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <div className="flex items-center gap-3 flex-1">
                                            <h2 className="text-lg font-semibold">Equipa</h2>
                                            {/* View Mode Toggle */}
                                            <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
                                                <button
                                                    onClick={() => setBarberViewMode('list')}
                                                    className={`p-1.5 rounded-md transition-colors ${barberViewMode === 'list'
                                                        ? 'bg-gold/20 text-gold'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                        }`}
                                                    title="Vista em Lista"
                                                >
                                                    <List className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setBarberViewMode('gallery')}
                                                    className={`p-1.5 rounded-md transition-colors ${barberViewMode === 'gallery'
                                                        ? 'bg-gold/20 text-gold'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                        }`}
                                                    title="Vista em Galeria"
                                                >
                                                    <LayoutGrid className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => setNewBarber({ nome: '', email: '', telefone: '', bio: '', especialidades: [], activo: true })}
                                            disabled={!!newBarber}
                                            className="bg-gold text-black hover:bg-gold/90"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Adicionar Barbeiro
                                        </Button>
                                    </div>

                                    {/* Premium Search Bar with Autocomplete */}
                                    {barbers.length > 0 && (
                                        <div className="relative">
                                            <Command className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-visible">
                                                <div className="flex items-center px-4 py-1">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/10">
                                                        <Search className="h-4 w-4 text-amber-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={barberSearch}
                                                        onChange={(e) => setBarberSearch(e.target.value)}
                                                        placeholder="Pesquisar na equipa..."
                                                        className="flex h-12 w-full bg-transparent px-3 text-sm font-medium outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                    />
                                                    {barberSearch && (
                                                        <button
                                                            onClick={() => setBarberSearch('')}
                                                            className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-white transition-all duration-200"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                {barberSearch && (
                                                    <CommandList className="border-t border-white/5 bg-black/20">
                                                        <CommandEmpty className="py-8 text-center">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/50">
                                                                    <Users className="h-5 w-5 text-zinc-500" />
                                                                </div>
                                                                <p className="text-sm text-zinc-500">Nenhum barbeiro encontrado</p>
                                                            </div>
                                                        </CommandEmpty>
                                                        <CommandGroup heading="Resultados" className="[&_[cmdk-group-heading]]:text-amber-500/80 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2">
                                                            {barbers
                                                                .filter(b =>
                                                                    b.nome.toLowerCase().includes(barberSearch.toLowerCase())
                                                                )
                                                                .slice(0, 5)
                                                                .map(barber => (
                                                                    <CommandItem
                                                                        key={barber.id}
                                                                        onSelect={() => { setViewingBarber(barber); setBarberSearch(''); }}
                                                                        className="flex items-center gap-4 px-4 py-3 mx-2 my-1 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/5 data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-amber-500/10 data-[selected=true]:to-orange-500/5 border border-transparent hover:border-amber-500/20"
                                                                    >
                                                                        <div className="relative">
                                                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/10 overflow-hidden ring-2 ring-amber-500/20">
                                                                                {barber.foto_url ? (
                                                                                    <img src={barber.foto_url} alt={barber.nome} className="h-11 w-11 object-cover" />
                                                                                ) : (
                                                                                    <User className="h-5 w-5 text-amber-400" />
                                                                                )}
                                                                            </div>
                                                                            {barber.activo && (
                                                                                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-semibold text-white">{barber.nome}</p>
                                                                        </div>
                                                                        {!barber.activo && (
                                                                            <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">Inactivo</Badge>
                                                                        )}
                                                                    </CommandItem>
                                                                ))
                                                            }
                                                        </CommandGroup>
                                                    </CommandList>
                                                )}
                                            </Command>
                                        </div>
                                    )}

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
                                                {/* Photo Upload */}
                                                <div className="flex items-start gap-4">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <label className="cursor-pointer group">
                                                            <div className="relative">
                                                                <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-gold/10 overflow-hidden border-2 border-gold/30 transition-colors group-hover:border-gold/50 ${isUploading ? 'animate-pulse' : ''}`}>
                                                                    {newBarber.foto_url ? (
                                                                        <img
                                                                            src={newBarber.foto_url}
                                                                            alt="Preview"
                                                                            className="h-20 w-20 object-cover"
                                                                        />
                                                                    ) : isUploading ? (
                                                                        <Loader2 className="h-8 w-8 text-gold animate-spin" />
                                                                    ) : (
                                                                        <Camera className="h-8 w-8 text-gold/50 group-hover:text-gold transition-colors" />
                                                                    )}
                                                                </div>
                                                                {!isUploading && (
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Upload className="h-5 w-5 text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                disabled={isUploading}
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        handleFileUpload(file, (url) => setNewBarber(prev => ({ ...prev!, foto_url: url })));
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                        <span className="text-xs text-muted-foreground">
                                                            {isUploading ? 'A carregar...' : 'Clica para carregar'}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <Label className="mb-2 block text-sm text-muted-foreground">Foto de Perfil</Label>
                                                        <p className="text-xs text-muted-foreground">
                                                            Clica na imagem para fazer upload de uma foto.
                                                            Formatos suportados: JPEG, PNG, WebP, GIF. Máximo 5MB.
                                                        </p>
                                                        {newBarber.foto_url && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="mt-2 text-xs text-destructive hover:text-destructive"
                                                                onClick={() => setNewBarber(prev => ({ ...prev!, foto_url: '' }))}
                                                            >
                                                                <Trash2 className="h-3 w-3 mr-1" />
                                                                Remover foto
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

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
                                    <div className={barberViewMode === 'gallery'
                                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                                        : 'space-y-3'
                                    }>
                                        {barbers.length === 0 && !newBarber ? (
                                            <Card className="border-dashed border-2 border-zinc-700 col-span-full">
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
                                            barbers
                                                .filter(barber => {
                                                    if (!barberSearch) return true;
                                                    const search = barberSearch.toLowerCase();
                                                    return (
                                                        barber.nome.toLowerCase().includes(search) ||
                                                        (barber.email && barber.email.toLowerCase().includes(search)) ||
                                                        (barber.bio && barber.bio.toLowerCase().includes(search)) ||
                                                        (barber.telefone && barber.telefone.includes(search))
                                                    );
                                                })
                                                .map(barber => (
                                                    <Card key={barber.id} className={`group relative overflow-hidden transition-all duration-300 cursor-pointer ${!barber.activo ? 'opacity-60' : ''} bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border border-white/5 hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/10 backdrop-blur-sm`} onClick={() => setViewingBarber(barber)}>
                                                        <CardContent className="p-5">
                                                            {barberViewMode === 'gallery' ? (
                                                                /* Gallery View Mode - Premium */
                                                                <div className="flex flex-col items-center text-center">
                                                                    <div className="relative mb-4">
                                                                        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 overflow-hidden ring-2 ring-amber-500/20 transition-all duration-300 group-hover:ring-amber-500/40 group-hover:scale-105">
                                                                            {barber.foto_url ? (
                                                                                <img src={barber.foto_url} alt={barber.nome} className="h-20 w-20 object-cover" />
                                                                            ) : (
                                                                                <User className="h-8 w-8 text-amber-400" />
                                                                            )}
                                                                        </div>
                                                                        {barber.activo && (
                                                                            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 ring-3 ring-zinc-900 flex items-center justify-center">
                                                                                <Check className="h-3 w-3 text-white" />
                                                                            </div>
                                                                        )}
                                                                        {!barber.activo && (
                                                                            <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center backdrop-blur-[1px]">
                                                                                <Badge className="text-[10px] bg-zinc-800 border-zinc-600 text-zinc-400">Inactivo</Badge>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <h3 className="font-semibold text-white text-sm">{barber.nome}</h3>
                                                                    {barber.bio && (
                                                                        <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">{barber.bio}</p>
                                                                    )}
                                                                    <div className="flex gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                                                                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingBarber(barber.id); }} className="h-8 px-3 bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 transition-colors">
                                                                            <PenLine className="h-3 w-3 mr-1" />
                                                                            Editar
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost" className="h-8 px-2 bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors" onClick={(e) => { e.stopPropagation(); setBarberToDelete(barber); }}>
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                /* List View Mode */
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold/10 overflow-hidden">
                                                                        {barber.foto_url ? (
                                                                            <img src={barber.foto_url} alt={barber.nome} className="h-14 w-14 object-cover" />
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
                                                                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setBarberToDelete(barber)}>
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

            {/* Delete Barber Confirmation Modal */}
            <AlertDialog open={!!barberToDelete} onOpenChange={() => setBarberToDelete(null)}>
                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-destructive" />
                            Eliminar Barbeiro
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Tens a certeza que queres eliminar <strong className="text-foreground">{barberToDelete?.nome}</strong>?
                            Esta ação não pode ser revertida.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-zinc-700 hover:bg-zinc-800">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteBarber}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Barber Modal */}
            <Dialog open={!!editingBarber} onOpenChange={() => setEditingBarber(null)}>
                <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <PenLine className="h-5 w-5 text-gold" />
                            Editar Barbeiro
                        </DialogTitle>
                        <DialogDescription>
                            Atualiza as informações do membro da equipa
                        </DialogDescription>
                    </DialogHeader>

                    {editingBarber && (() => {
                        const barber = barbers.find(b => b.id === editingBarber);
                        if (!barber) return null;

                        return (
                            <div className="space-y-6 py-4">
                                {/* Photo Upload Section */}
                                <div className="flex items-start gap-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <label className="cursor-pointer group">
                                            <div className="relative">
                                                <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-gold/10 overflow-hidden border-2 border-gold/30 transition-colors group-hover:border-gold/50 ${isUploading ? 'animate-pulse' : ''}`}>
                                                    {barber.foto_url ? (
                                                        <img src={barber.foto_url} alt={barber.nome} className="h-24 w-24 object-cover" />
                                                    ) : isUploading ? (
                                                        <Loader2 className="h-8 w-8 text-gold animate-spin" />
                                                    ) : (
                                                        <Camera className="h-10 w-10 text-gold/50 group-hover:text-gold transition-colors" />
                                                    )}
                                                </div>
                                                {!isUploading && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Upload className="h-6 w-6 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={isUploading}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        handleFileUpload(file, (url) => setBarbers(prev => prev.map(b => b.id === editingBarber ? { ...b, foto_url: url } : b)));
                                                    }
                                                }}
                                            />
                                        </label>
                                        <span className="text-xs text-muted-foreground">
                                            {isUploading ? 'A carregar...' : 'Clica para mudar'}
                                        </span>
                                        {barber.foto_url && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs text-destructive hover:text-destructive"
                                                onClick={() => setBarbers(prev => prev.map(b => b.id === editingBarber ? { ...b, foto_url: '' } : b))}
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Remover
                                            </Button>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <Label className="mb-2 block text-sm text-muted-foreground">Nome *</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    value={barber.nome}
                                                    onChange={(e) => setBarbers(prev => prev.map(b => b.id === editingBarber ? { ...b, nome: e.target.value } : b))}
                                                    className="pl-10 bg-zinc-800/50 border-zinc-700/50"
                                                    placeholder="Nome do barbeiro"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={barber.activo}
                                                onCheckedChange={(checked) => setBarbers(prev => prev.map(b => b.id === editingBarber ? { ...b, activo: checked } : b))}
                                            />
                                            <span className="text-sm">
                                                {barber.activo ? (
                                                    <span className="text-green-500">Activo</span>
                                                ) : (
                                                    <span className="text-red-500">Inactivo</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                    <div>
                                        <Label className="mb-2 block text-sm text-muted-foreground">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="email"
                                                value={barber.email || ''}
                                                onChange={(e) => setBarbers(prev => prev.map(b => b.id === editingBarber ? { ...b, email: e.target.value } : b))}
                                                className="pl-10 bg-zinc-800/50 border-zinc-700/50"
                                                placeholder="email@exemplo.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="mb-2 block text-sm text-muted-foreground">Telefone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="tel"
                                                value={barber.telefone || ''}
                                                onChange={(e) => {
                                                    // Only allow digits and limit to 9 characters for Portuguese numbers
                                                    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                                                    setBarbers(prev => prev.map(b => b.id === editingBarber ? { ...b, telefone: value } : b));
                                                }}
                                                className="pl-10 bg-zinc-800/50 border-zinc-700/50"
                                                placeholder="912345678"
                                                maxLength={9}
                                                pattern="[0-9]{9}"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">9 dígitos (ex: 912345678)</p>
                                    </div>
                                </div>

                                {/* Bio */}
                                <div>
                                    <Label className="mb-2 block text-sm text-muted-foreground">Bio</Label>
                                    <textarea
                                        value={barber.bio || ''}
                                        onChange={(e) => setBarbers(prev => prev.map(b => b.id === editingBarber ? { ...b, bio: e.target.value } : b))}
                                        className="w-full h-20 rounded-md border border-zinc-700/50 bg-zinc-800/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none"
                                        placeholder="Breve descrição sobre o barbeiro..."
                                    />
                                </div>

                                {/* Especialidades */}
                                <div>
                                    <Label className="mb-2 block text-sm text-muted-foreground">Especialidades</Label>
                                    <Input
                                        value={barber.especialidades?.join(', ') || ''}
                                        onChange={(e) => {
                                            const especialidades = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                            setBarbers(prev => prev.map(b => b.id === editingBarber ? { ...b, especialidades } : b));
                                        }}
                                        className="bg-zinc-800/50 border-zinc-700/50"
                                        placeholder="Fade, Barba, Degradê, Coloração..."
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Separa cada especialidade por vírgula</p>
                                </div>
                            </div>
                        );
                    })()}

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setEditingBarber(null)} className="border-zinc-700 hover:bg-zinc-800">
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                const barber = barbers.find(b => b.id === editingBarber);
                                if (barber) handleUpdateBarber(barber);
                            }}
                            disabled={isSaving}
                            className="bg-gold text-black hover:bg-gold/90"
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                            Guardar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Barber Details Modal */}
            <Dialog open={!!viewingBarber} onOpenChange={() => setViewingBarber(null)}>
                <DialogContent className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-white/10 max-w-lg">
                    <DialogHeader className="pb-4">
                        <DialogTitle className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/10 ring-2 ring-amber-500/20 overflow-hidden">
                                {viewingBarber?.foto_url ? (
                                    <img src={viewingBarber.foto_url} alt={viewingBarber.nome} className="h-12 w-12 object-cover" />
                                ) : (
                                    <User className="h-6 w-6 text-amber-400" />
                                )}
                            </div>
                            <div>
                                <span className="text-xl font-bold text-white">{viewingBarber?.nome}</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {viewingBarber?.activo ? (
                                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                            <Check className="h-3 w-3 mr-1" />
                                            Activo
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-zinc-400 border-zinc-600 text-xs">Inactivo</Badge>
                                    )}
                                </div>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {viewingBarber && (
                        <div className="space-y-4 py-2">
                            {/* Bio */}
                            {viewingBarber.bio && (
                                <div className="rounded-xl bg-white/5 p-4 border border-white/5">
                                    <p className="text-sm text-zinc-300 leading-relaxed">{viewingBarber.bio}</p>
                                </div>
                            )}

                            {/* Contact Info */}
                            <div className="grid gap-3">
                                {viewingBarber.email && (
                                    <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/5">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                                            <Mail className="h-4 w-4 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500">Email</p>
                                            <p className="text-sm text-white">{viewingBarber.email}</p>
                                        </div>
                                    </div>
                                )}
                                {viewingBarber.telefone && (
                                    <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/5">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                                            <Phone className="h-4 w-4 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500">Telefone</p>
                                            <p className="text-sm text-white">{viewingBarber.telefone}</p>
                                        </div>
                                    </div>
                                )}
                                {viewingBarber.data_nascimento && (
                                    <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/5">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                                            <Calendar className="h-4 w-4 text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500">Data de Nascimento</p>
                                            <p className="text-sm text-white">{new Date(viewingBarber.data_nascimento).toLocaleDateString('pt-PT')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setViewingBarber(null)}
                            className="flex-1 border-zinc-700 hover:bg-zinc-800"
                        >
                            Fechar
                        </Button>
                        <Button
                            onClick={() => { if (viewingBarber) { setEditingBarber(viewingBarber.id); setViewingBarber(null); } }}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400"
                        >
                            <PenLine className="h-4 w-4 mr-2" />
                            Editar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pro Upgrade Dialog */}
            <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <DialogContent className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-amber-500/20 max-w-md">
                    <DialogHeader className="text-center pb-4">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 ring-2 ring-amber-500/30">
                                <Crown className="h-8 w-8 text-amber-400" />
                            </div>
                        </div>
                        <DialogTitle className="text-2xl font-bold text-center">
                            Upgrade para <span className="text-amber-400">Pro</span>
                        </DialogTitle>
                        <DialogDescription className="text-center text-zinc-400">
                            Desbloqueia todas as funcionalidades premium
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-4">
                        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                                <MessageSquare className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Notificações SMS</p>
                                <p className="text-xs text-zinc-500">Reduz no-shows em até 70%</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                                <CreditCard className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Pagamentos Online</p>
                                <p className="text-xs text-zinc-500">Depósitos antecipados via Stripe</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                                <Calendar className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Agenda de Marcações</p>
                                <p className="text-xs text-zinc-500">Clientes marcam online 24/7</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                                <Users className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Barbeiros Ilimitados</p>
                                <p className="text-xs text-zinc-500">Adiciona toda a tua equipa</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center py-2">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-amber-400">29€</span>
                            <span className="text-zinc-500">/mês</span>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowUpgradeDialog(false)}
                            className="flex-1 border-zinc-700 hover:bg-zinc-800"
                        >
                            Agora não
                        </Button>
                        <Button
                            onClick={handleUpgrade}
                            disabled={isUpgrading}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400"
                        >
                            {isUpgrading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Crown className="h-4 w-4 mr-2" />
                            )}
                            Fazer Upgrade
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
                    .select('id, nome, slug, is_pro')
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
