import QueueForm from '@/components/QueueForm';
import { Scissors, Clock, Shield } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      {/* Hero Section - Above the Fold */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex min-h-[90vh] flex-col items-center justify-center gap-12">
          {/* Header */}
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-gold/20 bg-gold/5 px-6 py-2">
              <Scissors className="h-5 w-5 text-gold" />
              <span className="text-sm font-medium text-gold">Barber Queue</span>
            </div>

            <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Elimine a Espera
              <br />
              <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                Física
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Entre na fila virtual da sua barbearia favorita.
              Receba notificação quando for a sua vez.
              <strong className="text-foreground"> Sem stress, sem drama.</strong>
            </p>
          </div>

          {/* Queue Form */}
          <QueueForm />

          {/* Features */}
          <div className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border/50 bg-card/30 p-6 text-center backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                <Clock className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-semibold">Tempo Real</h3>
              <p className="text-sm text-muted-foreground">
                Veja exatamente quantas pessoas estão à sua frente
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-lg border border-border/50 bg-card/30 p-6 text-center backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                <Shield className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-semibold">Seguro</h3>
              <p className="text-sm text-muted-foreground">
                Hold de 5€ devolvido após o serviço
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-lg border border-border/50 bg-card/30 p-6 text-center backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                <Scissors className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-semibold">Conveniente</h3>
              <p className="text-sm text-muted-foreground">
                Notificação SMS quando for a sua vez
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Barber Queue. Elimine o Caos do Sábado de Manhã.</p>
        </div>
      </footer>
    </main>
  );
}
