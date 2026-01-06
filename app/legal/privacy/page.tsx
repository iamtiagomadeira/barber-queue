import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'Política de Privacidade | Ventus',
    description: 'Política de privacidade e proteção de dados da plataforma Ventus.',
};

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
            <div className="container mx-auto max-w-3xl px-4 py-12">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="mb-8">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </Link>

                <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>

                <div className="prose prose-invert prose-zinc max-w-none space-y-6">
                    <p className="text-zinc-400">
                        Última atualização: {new Date().toLocaleDateString('pt-PT')}
                    </p>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">1. Introdução</h2>
                        <p className="text-zinc-300">
                            A Ventus ("nós", "nosso") está comprometida em proteger a sua privacidade.
                            Esta Política de Privacidade explica como recolhemos, utilizamos e protegemos
                            os seus dados pessoais em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">2. Dados que Recolhemos</h2>
                        <p className="text-zinc-300">Recolhemos os seguintes tipos de dados:</p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li><strong>Dados de registo:</strong> Nome, email, password (encriptada)</li>
                            <li><strong>Dados da barbearia:</strong> Nome do negócio, horários, serviços, equipa</li>
                            <li><strong>Dados de clientes:</strong> Nome, telefone (para notificações SMS)</li>
                            <li><strong>Dados de pagamento:</strong> Processados pelo Stripe (não armazenamos dados de cartão)</li>
                            <li><strong>Dados de utilização:</strong> Logs de acesso, estatísticas de uso</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">3. Finalidade do Tratamento</h2>
                        <p className="text-zinc-300">Utilizamos os seus dados para:</p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li>Fornecer e manter o Serviço</li>
                            <li>Processar pagamentos e subscrições</li>
                            <li>Enviar notificações SMS aos clientes (se ativado)</li>
                            <li>Melhorar a experiência do utilizador</li>
                            <li>Cumprir obrigações legais</li>
                            <li>Comunicar atualizações importantes do Serviço</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">4. Base Legal</h2>
                        <p className="text-zinc-300">O tratamento dos seus dados baseia-se em:</p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li><strong>Execução de contrato:</strong> Para fornecer o Serviço contratado</li>
                            <li><strong>Consentimento:</strong> Para comunicações de marketing (opcional)</li>
                            <li><strong>Interesse legítimo:</strong> Para melhorar o Serviço e prevenir fraude</li>
                            <li><strong>Obrigação legal:</strong> Para cumprir requisitos fiscais e regulatórios</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">5. Partilha de Dados</h2>
                        <p className="text-zinc-300">Podemos partilhar dados com:</p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li><strong>Stripe:</strong> Para processamento de pagamentos</li>
                            <li><strong>Supabase:</strong> Para armazenamento de dados (servidores na UE)</li>
                            <li><strong>Provedor de SMS:</strong> Para envio de notificações</li>
                            <li><strong>Autoridades:</strong> Quando exigido por lei</li>
                        </ul>
                        <p className="text-zinc-300">
                            Não vendemos os seus dados pessoais a terceiros.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">6. Segurança dos Dados</h2>
                        <p className="text-zinc-300">
                            Implementamos medidas de segurança técnicas e organizacionais, incluindo:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li>Encriptação de dados em trânsito (HTTPS/TLS)</li>
                            <li>Encriptação de passwords (bcrypt)</li>
                            <li>Autenticação segura via Supabase Auth</li>
                            <li>Backups regulares</li>
                            <li>Acesso restrito a dados sensíveis</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">7. Retenção de Dados</h2>
                        <p className="text-zinc-300">
                            Mantemos os seus dados enquanto a sua conta estiver ativa ou conforme necessário
                            para fornecer o Serviço. Após eliminação da conta, os dados são removidos no prazo
                            de 30 dias, exceto quando a retenção seja exigida por lei.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">8. Os Seus Direitos (RGPD)</h2>
                        <p className="text-zinc-300">Tem direito a:</p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li><strong>Acesso:</strong> Solicitar uma cópia dos seus dados</li>
                            <li><strong>Retificação:</strong> Corrigir dados incorretos</li>
                            <li><strong>Eliminação:</strong> Solicitar a eliminação dos seus dados</li>
                            <li><strong>Portabilidade:</strong> Receber os seus dados em formato estruturado</li>
                            <li><strong>Oposição:</strong> Opor-se ao tratamento para fins de marketing</li>
                            <li><strong>Limitação:</strong> Solicitar a limitação do tratamento</li>
                        </ul>
                        <p className="text-zinc-300">
                            Para exercer estes direitos, contacte-nos através de{' '}
                            <a href="mailto:privacidade@ventus.app" className="text-amber-400 hover:underline">
                                privacidade@ventus.app
                            </a>
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">9. Cookies</h2>
                        <p className="text-zinc-300">
                            Utilizamos cookies essenciais para o funcionamento do Serviço (autenticação, preferências).
                            Não utilizamos cookies de rastreamento ou publicidade de terceiros.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">10. Transferências Internacionais</h2>
                        <p className="text-zinc-300">
                            Os seus dados são armazenados em servidores na União Europeia. Caso sejam transferidos
                            para fora da UE, garantimos proteções adequadas conforme o RGPD.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">11. Alterações a Esta Política</h2>
                        <p className="text-zinc-300">
                            Podemos atualizar esta Política periodicamente. Notificaremos sobre alterações
                            significativas por email ou através do Serviço.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">12. Contacto</h2>
                        <p className="text-zinc-300">
                            Para questões sobre privacidade ou proteção de dados:
                        </p>
                        <ul className="list-disc list-inside text-zinc-300 space-y-2">
                            <li>Email: <a href="mailto:privacidade@ventus.app" className="text-amber-400 hover:underline">privacidade@ventus.app</a></li>
                            <li>Responsável pelo Tratamento: Ventus, Lda.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">13. Autoridade de Controlo</h2>
                        <p className="text-zinc-300">
                            Se considerar que o tratamento dos seus dados viola o RGPD, tem direito a apresentar
                            reclamação junto da Comissão Nacional de Proteção de Dados (CNPD).
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}
