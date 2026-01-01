# Barber Queue MVP 💈

Uma Progressive Web App (PWA) que elimina a espera física em barbearias através de uma fila virtual híbrida.

## 🎯 Objetivo

Resolver o **"Caos do Sábado de Manhã"** reduzindo walk-outs e no-shows através de:
- Fila virtual com notificações SMS
- Tempo de espera estimado em tempo real
- Hold de segurança de 5€ (depósito reembolsável)
- Interface premium com dark mode (Preto Mate e Dourado)

## 🚀 Tech Stack

- **Frontend**: Next.js 14+ (App Router) com TypeScript
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS
- **Backend/Auth**: Supabase
- **Notifications**: Twilio SMS (Placeholder)
- **Payments**: Stripe/MB WAY (Placeholder)

## 📦 Instalação

1. **Clone o repositório** (ou navegue até a pasta do projeto)

2. **Instale as dependências**:
   ```bash
   npm install --cache /tmp/.npm-cache
   ```

3. **Configure as variáveis de ambiente**:
   - Copie `env.example` para `.env.local`
   - Adicione as suas credenciais do Supabase:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Configure o Supabase**:
   - Crie um novo projeto no [Supabase](https://supabase.com)
   - Execute o SQL em `supabase-schema.sql` no SQL Editor do Supabase
   - Isto criará as tabelas necessárias e dados de exemplo

5. **Execute o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

6. **Abra no navegador**: http://localhost:3000

## 🏗️ Estrutura do Projeto

```
barber-queue/
├── app/
│   ├── api/
│   │   └── queue/
│   │       ├── join/route.ts       # API: Entrar na fila
│   │       ├── call-next/route.ts  # API: Chamar próximo
│   │       └── complete/route.ts   # API: Completar serviço
│   ├── barbeiro/
│   │   ├── components/
│   │   │   └── QueueList.tsx       # Lista da fila (Kiosk Mode)
│   │   ├── login/page.tsx          # Login do barbeiro
│   │   └── page.tsx                # Dashboard do barbeiro
│   ├── globals.css                 # Estilos globais (Dark Theme)
│   ├── layout.tsx                  # Layout principal
│   └── page.tsx                    # Landing page (Cliente)
├── components/
│   ├── ui/                         # Componentes Shadcn UI
│   └── QueueForm.tsx               # Formulário de entrada na fila
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Cliente Supabase (browser)
│   │   └── server.ts               # Cliente Supabase (server)
│   ├── queue-logic.ts              # Lógica da fila
│   ├── types.ts                    # TypeScript types
│   └── utils.ts                    # Utilidades
├── public/
│   └── manifest.json               # PWA manifest
├── supabase-schema.sql             # Schema da base de dados
└── README.md
```

## 🎨 Funcionalidades

### Interface do Cliente (PWA)
- ✅ Landing page minimalista "above the fold"
- ✅ Formulário de entrada na fila (Nome, Telemóvel, Serviço)
- ✅ Display de posição em tempo real ("X pessoas à sua frente")
- ✅ Tempo de espera estimado
- ⏳ Notificações SMS (Placeholder)
- ⏳ Hold de segurança de 5€ (Placeholder)

### Painel do Barbeiro (Kiosk Mode)
- ✅ Autenticação com Supabase
- ✅ Vista da fila em tempo real
- ✅ Botões grandes para "Chamar Próximo" e "Completar"
- ✅ Interface touch-friendly
- ✅ Estatísticas da fila (Em Espera, Em Corte)

### Backend & Lógica
- ✅ Cálculo de tempo de espera baseado na duração média do serviço
- ✅ Gestão de posições na fila
- ✅ API routes para operações CRUD
- ✅ Row Level Security (RLS) no Supabase

## 🗄️ Schema da Base de Dados

### Tabelas

**barbearias**
- `id` (UUID, PK)
- `nome` (TEXT)
- `endereco` (TEXT)
- `telefone` (TEXT)
- `created_at` (TIMESTAMP)

**servicos**
- `id` (UUID, PK)
- `barbearia_id` (UUID, FK)
- `nome` (TEXT) - ex: "Fade", "Corte Clássico"
- `duracao_media` (INTEGER) - minutos
- `preco` (DECIMAL)
- `created_at` (TIMESTAMP)

**fila_virtual**
- `id` (UUID, PK)
- `barbearia_id` (UUID, FK)
- `servico_id` (UUID, FK)
- `cliente_nome` (TEXT)
- `cliente_telefone` (TEXT)
- `status` (ENUM: 'em_espera', 'em_corte', 'concluido', 'no_show')
- `posicao` (INTEGER)
- `tempo_espera_estimado` (INTEGER) - minutos
- `deposito_pago` (BOOLEAN)
- `deposito_id` (TEXT)
- `created_at` (TIMESTAMP)
- `chamado_at` (TIMESTAMP)
- `concluido_at` (TIMESTAMP)

## 🔐 Autenticação

Atualmente usa autenticação mock. Para implementar autenticação real:

1. Configure o Supabase Auth no dashboard
2. Atualize `app/barbeiro/login/page.tsx` para usar `supabase.auth.signInWithPassword()`
3. Adicione middleware para proteger rotas

## 💳 Pagamentos (Placeholder)

O sistema de hold de 5€ está preparado mas não implementado. Para integrar:

1. **Stripe**:
   - Adicione as chaves da API em `.env.local`
   - Implemente `lib/stripe.ts`
   - Crie payment intent em `app/api/payment/create-hold/route.ts`

2. **MB WAY**:
   - Integre com a API do seu gateway de pagamentos
   - Implemente fluxo de autorização/captura

## 📱 PWA

Para testar a instalação PWA:

1. Abra a app no Chrome/Edge
2. Clique no ícone de instalação na barra de endereço
3. A app será instalada como standalone

**Nota**: Precisa de HTTPS em produção para PWA funcionar completamente.

## 🚧 Próximos Passos

- [ ] Integrar Twilio para notificações SMS
- [ ] Implementar Stripe/MB WAY para holds de segurança
- [ ] Adicionar real-time subscriptions do Supabase
- [ ] Implementar autenticação completa
- [ ] Adicionar analytics e métricas
- [ ] Deploy em produção (Vercel + Supabase)

## 📝 Notas de Desenvolvimento

### Problema com npm cache
Se encontrar erros de permissão com npm cache, use:
```bash
npm install --cache /tmp/.npm-cache
```

### Mock Data
A aplicação usa dados mock para demonstração. Para usar dados reais:
1. Configure o Supabase conforme descrito acima
2. Atualize os componentes para fazer chamadas API reais
3. Remova os arrays `MOCK_SERVICES` e `MOCK_QUEUE`

## 🎨 Design

- **Tema**: Dark Mode por defeito
- **Cores**: Preto Mate (#0a0a0a) e Dourado (#d4af37)
- **Tipografia**: Inter (Google Fonts)
- **UI**: Minimalista, focada na redução de fricção
- **Kiosk Mode**: Botões grandes e alto contraste

## 📄 Licença

Este é um projeto MVP. Adicione a sua licença conforme necessário.

---

**Desenvolvido para eliminar o Caos do Sábado de Manhã** 💈✨
