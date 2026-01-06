import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'Termos e Condições | Ventus',
    description: 'Termos e condições de utilização da plataforma Ventus.',
};

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
            <div className="container mx-auto max-w-3xl px-4 py-12">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="mb-8">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </Link>

                <h1 className="text-3xl font-bold mb-8">Termos e Condições</h1>

                <div className="prose prose-invert prose-zinc max-w-none space-y-6">
                    <p className="text-zinc-400">
                        Última atualização: {new Date().toLocaleDateString('pt-PT')}
                    </p>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
                        <p className="text-zinc-300">
                            Ao aceder e utilizar a plataforma Ventus ("Serviço"), você concorda em cumprir estes Termos e Condições.
                            Se não concordar com algum termo, não deve utilizar o Serviço.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">2. Descrição do Serviço</h2>
                        <p className="text-zinc-300">
                            O Ventus é uma plataforma de gestão para barbearias que oferece funcionalidades como:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li>Gestão de fila virtual</li>
                            <li>Sistema de marcações online</li>
                            <li>Gestão de serviços e equipa</li>
                            <li>Dashboard de estatísticas</li>
                            <li>Notificações SMS (plano Pro)</li>
                            <li>Pagamentos online (plano Pro)</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">3. Registo e Conta</h2>
                        <p className="text-zinc-300">
                            Para utilizar o Serviço, deve criar uma conta fornecendo informações precisas e completas.
                            É responsável por manter a confidencialidade das suas credenciais de acesso.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">4. Planos e Pagamentos</h2>
                        <p className="text-zinc-300">
                            O Ventus oferece um plano gratuito (Starter) e planos pagos (Pro e Business).
                            Os pagamentos são processados através do Stripe, uma plataforma de pagamentos segura.
                            As subscrições são renovadas automaticamente até serem canceladas.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">5. Cancelamento e Reembolsos</h2>
                        <p className="text-zinc-300">
                            Pode cancelar a sua subscrição a qualquer momento através das definições da conta.
                            O cancelamento entra em vigor no final do período de faturação atual.
                            Não são oferecidos reembolsos por períodos parciais.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">6. Uso Aceitável</h2>
                        <p className="text-zinc-300">
                            Concorda em não utilizar o Serviço para atividades ilegais, fraudulentas ou que violem
                            direitos de terceiros. Reservamo-nos o direito de suspender ou terminar contas que violem estes termos.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">7. Propriedade Intelectual</h2>
                        <p className="text-zinc-300">
                            Todo o conteúdo, design e código do Ventus são propriedade exclusiva da nossa empresa.
                            É proibida a reprodução, distribuição ou modificação sem autorização prévia.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">8. Limitação de Responsabilidade</h2>
                        <p className="text-zinc-300">
                            O Serviço é fornecido "tal como está". Não garantimos disponibilidade ininterrupta
                            nem ausência de erros. Não somos responsáveis por perdas indiretas ou consequenciais.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">9. Alterações aos Termos</h2>
                        <p className="text-zinc-300">
                            Podemos atualizar estes Termos periodicamente. Notificaremos sobre alterações significativas
                            por email ou através do Serviço. O uso continuado após alterações constitui aceitação dos novos termos.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">10. Contacto</h2>
                        <p className="text-zinc-300">
                            Para questões sobre estes Termos, contacte-nos através de:{' '}
                            <a href="mailto:suporte@ventus.app" className="text-amber-400 hover:underline">
                                suporte@ventus.app
                            </a>
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">11. Lei Aplicável</h2>
                        <p className="text-zinc-300">
                            Estes Termos são regidos pela lei portuguesa. Qualquer litígio será submetido
                            à jurisdição exclusiva dos tribunais portugueses.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
