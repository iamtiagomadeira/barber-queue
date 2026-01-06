import { Footer } from '@/components/blocks/footer-section';
import { Pricing } from '@/components/pricing';
import { Scissors, ArrowRight, CalendarCheck, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
      <Pricing
        plans={[
          {
            name: "Starter",
            price: "0",
            yearlyPrice: "0",
            period: "mês",
            description: "Para testar a plataforma",
            buttonText: "Começar Grátis",
            href: "/barbeiro/register",
            isPopular: false,
            features: [
              "Fila Virtual Ilimitada",
              "Link da Loja Personalizado",
              "QR Code para Impressão",
              "Máximo 3 Barbeiros",
              "❌ Sem SMS",
              "❌ Sem Pagamentos Online",
              "❌ Sem Agenda de Marcações",
            ]
          },
          {
            name: "Pro",
            price: "29",
            yearlyPrice: "23",
            period: "mês",
            description: "Para barbearias que querem crescer",
            buttonText: "Fazer Upgrade",
            href: "/barbeiro/login?plan=pro",
            isPopular: true,
            features: [
              "✅ Tudo do Starter",
              "✅ Barbeiros Ilimitados",
              "✅ Lembretes SMS (-70% no-shows)",
              "✅ Pagamentos Online (Stripe)",
              "✅ Agenda de Marcações 24/7",
              "✅ Relatórios Avançados",
              "✅ Suporte Prioritário",
            ]
          },
          {
            name: "Business",
            price: "89",
            yearlyPrice: "71",
            period: "mês",
            description: "Para redes e grandes espaços",
            buttonText: "Contactar Vendas",
            href: "mailto:teste@ventus.pt?subject=Plano%20Business%20Ventus",
            isPopular: false,
            isContactSales: true,
            features: [
              "Tudo do Pro +",
              "Múltiplas Localizações",
              "Comissões Automáticas",
              "Faturação Vendus",
              "API Personalizada",
              "Gestor de Conta Dedicado",
              "SLA 99.9% Garantido",
            ]
          }
        ]}
      />

      <Footer />
    </main>
  );
}
