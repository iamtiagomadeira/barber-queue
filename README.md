# Ventus App 💈

Sistema de gestão de filas e marcações para barbearias, com suporte a multi-tenancy.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green)
![Stripe](https://img.shields.io/badge/Stripe-Payments-purple)

## 🚀 Funcionalidades

### Para Clientes (`/b/[slug]`)
- **Fila Virtual** - Entrar na fila e receber SMS quando for a vez
- **Reservas Online** - Marcar horário específico
- **Depósito de Segurança** - Pagamento via Stripe para garantir compromisso
- **Tracking em Tempo Real** - Ver posição na fila com updates via WebSocket

### Para Barbeiros (`/barbeiro/[slug]`)
- **Dashboard** - Vista de fila virtual e calendário de marcações
- **Gestão de Fila** - Chamar próximo, marcar como em atendimento, concluir
- **Calendário** - Vista diária, semanal, mensal das marcações
- **Checkout Completo** - Emitir fatura (Vendus), processar depósito, enviar SMS

### Definições (`/barbeiro/[slug]/settings`)
- **Serviços** - CRUD completo com templates pré-definidos
- **Horários** - Configuração de horário de funcionamento por dia

## 🏗️ Arquitectura Multi-Tenancy

```
/b/[slug]                    → Página pública do cliente
/barbeiro/login              → Login do barbeiro
/barbeiro/[slug]             → Dashboard do barbeiro (autenticado)
/barbeiro/[slug]/settings    → Definições da barbearia
```

Cada barbearia tem um `slug` único (ex: `ventus`) que é usado em todas as URLs.

### Base de Dados

```sql
barbearias
├── id (UUID)
├── nome
├── slug (UNIQUE)
└── ...

profiles
├── id (UUID) → refs auth.users
├── barbearia_id → refs barbearias
└── role ('barbeiro' | 'admin')

fila_virtual
├── id
├── barbearia_id
├── cliente_nome
├── servico_id
└── status ('espera' | 'chamado' | 'em_atendimento' | 'concluido')

marcacoes
├── id
├── barbearia_id
├── data, hora
├── servico_id
└── status
```

## 🔧 Setup Local

### 1. Clonar e Instalar

```bash
git clone https://github.com/iamtiagomadeira/ventus.git
cd ventus-app
npm install
```

### 2. Variáveis de Ambiente

Criar ficheiro `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (Pagamentos)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+351...

# Vendus (Facturação PT)
VENDUS_API_KEY=...
```

### 3. Base de Dados

Executar as migrações no Supabase SQL Editor:

```bash
# Ver ficheiro completo em:
cat docs/migration-add-slug.sql
```

### 4. Correr Localmente

```bash
npm run dev
```

Aceder a `http://localhost:3000/b/ventus`

## 🌐 Deploy (Vercel)

1. Conectar repositório ao Vercel
2. Adicionar variáveis de ambiente no dashboard
3. Deploy automático em cada push ao `main`

**URL de Produção:** `https://ventus-cyan.vercel.app`

## 📁 Estrutura do Projeto

```
ventus-app/
├── app/
│   ├── api/
│   │   ├── queue/          # APIs de fila (join, complete, leave)
│   │   ├── bookings/       # APIs de marcações
│   │   ├── services/       # CRUD de serviços
│   │   └── schedule/       # Horários de funcionamento
│   ├── b/[slug]/           # Página pública do cliente
│   └── barbeiro/
│       ├── login/          # Autenticação
│       └── [slug]/         # Dashboard do barbeiro
│           └── settings/   # Definições
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── QueueForm.tsx       # Formulário de entrada na fila
│   ├── BookingForm.tsx     # Formulário de marcação
│   ├── CheckoutModal.tsx   # Modal de checkout
│   └── ...
├── hooks/
│   ├── useRealtimeQueue.ts    # Supabase Realtime para fila
│   └── useRealtimeBookings.ts # Supabase Realtime para marcações
├── lib/
│   ├── supabase/           # Cliente Supabase (client + server)
│   ├── stripe.ts           # Funções Stripe (pagamentos, refunds)
│   └── queue-logic.ts      # Lógica de cálculo de espera
└── docs/
    ├── migration-add-slug.sql  # Migração de BD
    └── onboarding-guide.md     # Guia para novas barbearias
```

## 🔌 Integrações

| Serviço | Uso |
|---------|-----|
| **Supabase** | Auth, Database, Realtime |
| **Stripe** | Depósitos de segurança, Refunds |
| **Twilio** | Notificações SMS |
| **Vendus** | Emissão de faturas (PT) |

## 📝 Onboarding de Nova Barbearia

Ver guia completo em [`docs/onboarding-guide.md`](docs/onboarding-guide.md)

Resumo:
1. Criar entrada em `barbearias` com slug único
2. Criar utilizador no Supabase Auth
3. Criar entrada em `profiles` ligando user à barbearia
4. Configurar serviços e horários via UI

## 🧪 Testing

```bash
# Build de produção
npm run build

# Lint
npm run lint
```

## 📄 Licença

Propriedade privada de Ventus / Tiago Madeira.

---

Desenvolvido com ❤️ usando Next.js, Supabase, e muito café ☕
