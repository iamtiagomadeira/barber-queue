'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scissors, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .slice(0, 50); // Limit length
}

function NewBarbershopContent() {
    const [nome, setNome] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nome.trim()) {
            toast({
                variant: "destructive",
                title: "Nome obrigatório",
                description: "Por favor, insere o nome da tua barbearia.",
            });
            return;
        }

        setIsLoading(true);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast({
                    variant: "destructive",
                    title: "Erro de autenticação",
                    description: "Por favor, faz login novamente.",
                });
                router.push('/barbeiro/login');
                return;
            }

            // Generate slug
            let slug = slugify(nome);

            // Check if slug already exists and make unique if needed
            const { data: existing } = await supabase
                .from('barbearias')
                .select('slug')
                .eq('slug', slug)
                .single();

            if (existing) {
                // Add random suffix to make unique
                slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
            }

            // Insert new barbershop
            const { data: newShop, error } = await supabase
                .from('barbearias')
                .insert({
                    nome: nome.trim(),
                    slug,
                    owner_id: user.id,
                    is_pro: false,
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating barbershop:', error);
                toast({
                    variant: "destructive",
                    title: "Erro ao criar barbearia",
                    description: error.message || "Não foi possível criar a barbearia. Tenta novamente.",
                });
                return;
            }

            toast({
                title: "Barbearia criada! 🎉",
                description: `${nome} foi criada com sucesso.`,
            });

            // Redirect to settings
            router.push(`/barbeiro/${slug}/settings`);

        } catch (error) {
            console.error('Error:', error);
            toast({
                variant: "destructive",
                title: "Erro inesperado",
                description: "Algo correu mal. Tenta novamente.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 ring-2 ring-amber-500/30">
                            <Scissors className="h-8 w-8 text-amber-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        Criar Nova Barbearia
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        Configura a tua barbearia em segundos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="nome" className="text-sm text-zinc-300">
                                Nome da Barbearia *
                            </Label>
                            <Input
                                id="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex: Barbearia do João"
                                className="bg-zinc-800/50 border-zinc-700 focus:ring-amber-500/50"
                                autoFocus
                            />
                            {nome && (
                                <p className="text-xs text-zinc-500">
                                    O teu link será: <span className="text-amber-400">/b/{slugify(nome) || 'exemplo'}</span>
                                </p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || !nome.trim()}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold hover:from-amber-400 hover:to-orange-400"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    A criar...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Criar Barbearia
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function NewBarbershopPage() {
    return (
        <AuthGuard>
            <NewBarbershopContent />
        </AuthGuard>
    );
}
