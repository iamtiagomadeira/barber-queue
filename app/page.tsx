import { Footer } from '@/components/blocks/footer-section';
import { Scissors, Clock, Shield, ArrowRight, CalendarCheck, Users, Check, Sparkles, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GlowingEffect } from '@/components/ui/glowing-effect';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
          {/* Logo Badge */}
          <div className="inline-flex items-center gap-3 rounded-full border border-gold/20 bg-gold/5 px-6 py-2">
            <Scissors className="h-5 w-5 text-gold" />
            <span className="text-sm font-medium text-gold">Ventus</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Gestão Inteligente
            <br />
            <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
              para Barbearias
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl">
            Fila virtual, marcações online, pagamentos seguros e muito mais.
            Tudo numa única plataforma pensada para o seu negócio.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold hover:from-amber-400 hover:to-orange-400 px-8 shadow-lg shadow-amber-500/25">
              <Link href="/barbeiro/login">
                Acesso Barbeiros
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 hover:border-white/50 px-8 backdrop-blur-sm">
              <Link href="/b/ventus">
                Ver Demo Cliente
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid w-full max-w-5xl mx-auto grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-border/50 bg-card/30 p-8 text-center backdrop-blur-sm hover:border-gold/30 transition-colors">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
              <Users className="h-7 w-7 text-gold" />
            </div>
            <h3 className="font-semibold text-lg">Fila Virtual</h3>
            <p className="text-sm text-muted-foreground">
              Seus clientes acompanham a fila em tempo real pelo telemóvel
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-xl border border-border/50 bg-card/30 p-8 text-center backdrop-blur-sm hover:border-gold/30 transition-colors">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
              <CalendarCheck className="h-7 w-7 text-gold" />
            </div>
            <h3 className="font-semibold text-lg">Marcações Online</h3>
            <p className="text-sm text-muted-foreground">
              Agenda organizada com confirmação automática e lembretes SMS
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-xl border border-border/50 bg-card/30 p-8 text-center backdrop-blur-sm hover:border-gold/30 transition-colors">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
              <Shield className="h-7 w-7 text-gold" />
            </div>
            <h3 className="font-semibold text-lg">Pagamentos Seguros</h3>
            <p className="text-sm text-muted-foreground">
              Depósito online elimina no-shows e garante compromisso
            </p>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Como Funciona</h2>
          <p className="text-muted-foreground mb-12">
            Simples para você e para os seus clientes
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-black font-bold">
                1
              </div>
              <h3 className="font-semibold">Configure a sua barbearia</h3>
              <p className="text-sm text-muted-foreground">
                Adicione serviços, horários e a sua equipa
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-black font-bold">
                2
              </div>
              <h3 className="font-semibold">Partilhe o seu link</h3>
              <p className="text-sm text-muted-foreground">
                Clientes acedem à fila ou marcam online
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-black font-bold">
                3
              </div>
              <h3 className="font-semibold">Gerencie tudo em um lugar</h3>
              <p className="text-sm text-muted-foreground">
                Dashboard completo para gerir o seu negócio
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Planos & Preços</h2>
          <p className="text-muted-foreground mb-12">
            Escolhe o plano ideal para o teu negócio
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <div className="relative flex flex-col rounded-2xl border border-border/50 bg-card/30 p-8 backdrop-blur-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">0€</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Perfeito para começar</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Fila virtual ilimitada
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Até 3 barbeiros
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Gestão de serviços
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Dashboard básico
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  SMS (Pro)
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  Pagamentos online (Pro)
                </li>
              </ul>
              <Button asChild className="w-full bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/40">
                <Link href="/barbeiro/login">
                  Começar Grátis
                </Link>
              </Button>
            </div>

            {/* Pro Plan - Highlighted */}
            <div className="relative flex flex-col rounded-2xl border-2 border-gold/50 bg-gradient-to-b from-gold/10 to-transparent p-8 backdrop-blur-sm">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-black">
                  <Sparkles className="h-3 w-3" />
                  Mais Popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gold">19€</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Para barbearias em crescimento</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Tudo do Starter
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Barbeiros ilimitados
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Notificações SMS
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Pagamentos online
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Relatórios avançados
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Suporte prioritário
                </li>
              </ul>
              <Button asChild className="w-full bg-gold text-black hover:bg-gold/90">
                <Link href="/barbeiro/login?plan=pro">
                  Escolher Pro
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Business Plan */}
            <div className="relative flex flex-col rounded-2xl border border-border/50 bg-card/30 p-8 backdrop-blur-sm">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">Business</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">49€</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Para redes de barbearias</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Tudo do Pro
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Múltiplas localizações
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  API personalizada
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Branding customizado
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  Gestor de conta dedicado
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-gold" />
                  SLA garantido
                </li>
              </ul>
              <Button asChild className="w-full bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600">
                <a href="mailto:tiago@ventus.app?subject=Ventus%20Business%20Plan">
                  <Mail className="mr-2 h-4 w-4" />
                  Contactar Vendas
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
