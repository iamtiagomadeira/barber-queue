'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, Clock, Loader2 } from 'lucide-react';

interface Service {
    id: string;
    nome: string;
    duracao_media: number;
    preco: number;
}

export default function ManualEntryForm({ barbeariaId, onAdded }: { barbeariaId: string, onAdded: () => void }) {
    const [name, setName] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingServices, setLoadingServices] = useState(true);

    const { toast } = useToast();
    const supabase = createClient();

    // Fetch services on mount
    useEffect(() => {
        async function fetchServices() {
            try {
                const { data, error } = await supabase
                    .from('servicos')
                    .select('id, nome, duracao_media, preco')
                    .order('preco', { ascending: true });

                if (data && data.length > 0) {
                    setServices(data);
                }
            } catch (err) {
                console.log('Error fetching services:', err);
            } finally {
                setLoadingServices(false);
            }
        }
        fetchServices();
    }, [supabase]);

    const getSelectedService = () => services.find(s => s.id === selectedServiceId);

    const handleAddWalkIn = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) return;
        setLoading(true);

        try {
            // A. Contar quantas pessoas estão à espera
            const { count, error: countError } = await supabase
                .from('fila_virtual')
                .select('*', { count: 'exact', head: true })
                .eq('barbearia_id', barbeariaId)
                .eq('status', 'em_espera');

            if (countError) {
                console.error('Erro ao contar fila:', countError);
            }

            const posicao = (count || 0) + 1;
            const selectedService = getSelectedService();

            // B. Calcular tempo de espera baseado no serviço ou default
            const tempoMedioCorte = selectedService?.duracao_media || 30;
            const tempoEspera = (posicao - 1) * tempoMedioCorte;

            // C. Inserir o novo cliente na fila_virtual
            const { error } = await supabase.from('fila_virtual').insert({
                barbearia_id: barbeariaId,
                cliente_nome: name,
                cliente_telefone: null,
                servico_id: selectedServiceId,
                status: 'em_espera',
                posicao: posicao,
                tempo_espera_estimado: tempoEspera,
                deposito_id: null,
                entrada_manual: true,
            });

            if (error) {
                console.error('Erro Supabase:', error.message, error.details, error.hint);
                throw error;
            }

            // D. Sucesso!
            const serviceName = selectedService?.nome || 'Serviço geral';
            toast({
                title: "Cliente Adicionado",
                description: `${name} entrou na fila (${serviceName} - posição ${posicao}).`,
            });

            setName('');
            setSelectedServiceId(null);
            onAdded();

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            console.error('Erro completo:', error);
            toast({
                title: "Erro",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card p-6 rounded-xl border border-gold/20 mb-8">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-gold" />
                Adicionar Cliente (Presencial)
            </h3>

            <form onSubmit={handleAddWalkIn} className="space-y-4">
                {/* Nome do Cliente */}
                <div className="space-y-2">
                    <Label htmlFor="manualName" className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                        Nome do Cliente
                    </Label>
                    <Input
                        id="manualName"
                        placeholder="Ex: Sr. Alberto"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        className="h-11 border-gold/20"
                    />
                </div>

                {/* Selector de Serviço */}
                <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                        Serviço (Opcional)
                    </Label>
                    {loadingServices ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">A carregar serviços...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {services.map((service) => (
                                <button
                                    key={service.id}
                                    type="button"
                                    onClick={() => setSelectedServiceId(
                                        selectedServiceId === service.id ? null : service.id
                                    )}
                                    className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all hover:border-gold/50 ${selectedServiceId === service.id
                                            ? 'border-gold bg-gold/10'
                                            : 'border-border'
                                        }`}
                                >
                                    <span className="font-medium text-sm">{service.nome}</span>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {service.duracao_media}min
                                    </div>
                                    <Badge variant="outline" className="mt-1 border-gold/30 text-gold text-xs">
                                        {service.preco}€
                                    </Badge>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Botão de Adicionar */}
                <Button
                    type="submit"
                    disabled={loading || !name}
                    className="w-full h-11 bg-gold text-black hover:bg-gold/90 font-medium"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            A adicionar...
                        </>
                    ) : (
                        <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Adicionar à Fila
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
