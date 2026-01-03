# Guia de Onboarding - Novas Barbearias

## Checklist Rápido

1. [ ] Recolher dados da barbearia
2. [ ] Criar conta no Supabase Auth
3. [ ] Executar SQL de criação
4. [ ] Enviar credenciais ao cliente
5. [ ] Agendar chamada de setup (opcional)

---

## 1. Dados a Recolher

Antes de criar a conta, pede ao cliente:

| Campo | Exemplo | Obrigatório |
|-------|---------|-------------|
| Nome da Barbearia | "Barbearia da Esquina" | ✅ |
| Slug (URL) | "barbearia-da-esquina" | ✅ |
| Morada | "Rua da Liberdade, 123" | ❌ |
| Telefone | "+351 912 345 678" | ❌ |
| Email do Barbeiro | "joao@barbearia.pt" | ✅ |
| Password temporária | "Ventus2024!" | ✅ |

> **Dica**: O slug deve ser lowercase, sem espaços, usa hífens. Será usado na URL: `ventus.pt/b/barbearia-da-esquina`

---

## 2. Criar Conta no Supabase

1. Vai a **Supabase Dashboard** > **Authentication** > **Users**
2. Clica **"Add user"** > **"Create new user"**
3. Preenche:
   - Email: email do barbeiro
   - Password: password temporária
   - ✅ Auto Confirm User
4. Clica **"Create user"**
5. **COPIA O USER ID** (vais precisar)

---

## 3. Executar SQL

Copia este SQL e substitui os valores:

```sql
-- ⚠️ SUBSTITUIR VALORES ABAIXO ⚠️

-- Variáveis (edita estas)
DO $$
DECLARE
    v_user_id UUID := 'COLA_O_USER_ID_AQUI';
    v_nome TEXT := 'Nome da Barbearia';
    v_slug TEXT := 'slug-da-barbearia';
    v_endereco TEXT := 'Morada aqui';
    v_telefone TEXT := '+351 912 345 678';
    v_barbearia_id UUID;
BEGIN
    -- 1. Criar barbearia
    INSERT INTO barbearias (id, nome, slug, endereco, telefone, fila_aberta, created_at)
    VALUES (
        uuid_generate_v4(),
        v_nome,
        v_slug,
        v_endereco,
        v_telefone,
        true,
        NOW()
    )
    RETURNING id INTO v_barbearia_id;
    
    -- 2. Associar user à barbearia
    UPDATE profiles 
    SET barbearia_id = v_barbearia_id, nome = v_nome
    WHERE id = v_user_id;
    
    -- 3. Criar serviços padrão
    INSERT INTO servicos (barbearia_id, nome, duracao_media, preco, activo) VALUES
        (v_barbearia_id, 'Corte', 30, 12, true),
        (v_barbearia_id, 'Barba', 20, 8, true),
        (v_barbearia_id, 'Corte + Barba', 45, 18, true),
        (v_barbearia_id, 'Fade', 40, 15, true);
    
    -- 4. Criar horário padrão (Seg-Sex 9h-19h, Sab 9h-17h)
    INSERT INTO horario_funcionamento (barbearia_id, dia_semana, hora_abertura, hora_fecho, fechado) VALUES
        (v_barbearia_id, 0, '09:00', '13:00', true),  -- Domingo fechado
        (v_barbearia_id, 1, '09:00', '19:00', false), -- Segunda
        (v_barbearia_id, 2, '09:00', '19:00', false), -- Terça
        (v_barbearia_id, 3, '09:00', '19:00', false), -- Quarta
        (v_barbearia_id, 4, '09:00', '19:00', false), -- Quinta
        (v_barbearia_id, 5, '09:00', '19:00', false), -- Sexta
        (v_barbearia_id, 6, '09:00', '17:00', false); -- Sábado
    
    RAISE NOTICE 'Barbearia criada com ID: %', v_barbearia_id;
    RAISE NOTICE 'URL Dashboard: /barbeiro/%', v_slug;
    RAISE NOTICE 'URL Cliente: /b/%', v_slug;
END $$;
```

---

## 4. Enviar ao Cliente

### Template de Email/WhatsApp:

```
Olá [NOME]! 👋

A tua conta Ventus está pronta! 🎉

📱 **Acesso ao Dashboard:**
Link: https://ventus.pt/barbeiro/[SLUG]
Email: [EMAIL]
Password: [PASSWORD_TEMPORARIA]

📲 **QR Code para Clientes:**
Os teus clientes podem entrar na fila virtual através de:
https://ventus.pt/b/[SLUG]

Podes imprimir o QR Code em Definições > QR Code.

💡 **Próximos passos:**
1. Faz login e altera a password
2. Ajusta os teus serviços e preços em Definições
3. Configura o horário de funcionamento
4. Imprime o QR Code e coloca na barbearia

Qualquer dúvida, estou aqui! 🙌
```

---

## 5. Troubleshooting

### Problema: "Barbearia não encontrada"
- Verifica se o slug está correcto na tabela `barbearias`
- Confirma que o `barbearia_id` está no `profiles` do user

### Problema: User não consegue fazer login
- Vai a Supabase Auth > Users e confirma que está "Confirmed"
- Tenta fazer reset password

### Problema: Serviços/Horários não aparecem
- Verifica se foram criados com o `barbearia_id` correcto

---

## Consultas Úteis

```sql
-- Ver todas as barbearias
SELECT id, nome, slug FROM barbearias;

-- Ver users e suas barbearias
SELECT p.id, p.nome, b.nome as barbearia, b.slug
FROM profiles p
LEFT JOIN barbearias b ON p.barbearia_id = b.id;

-- Ver serviços de uma barbearia
SELECT * FROM servicos WHERE barbearia_id = 'ID_AQUI';
```
