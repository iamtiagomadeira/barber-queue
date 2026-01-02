# 🗄️ Ventus - SQL Queries Reference

Queries úteis para gestão da base de dados Supabase.

---

## 📊 Consultas (SELECT)

### Ver fila de hoje
```sql
SELECT * FROM fila_virtual 
WHERE created_at >= CURRENT_DATE 
ORDER BY created_at DESC;
```

### Ver clientes em espera
```sql
SELECT cliente_nome, cliente_telefone, posicao, tempo_espera_estimado, created_at
FROM fila_virtual 
WHERE status = 'em_espera' 
ORDER BY posicao ASC;
```

### Ver clientes finalizados hoje
```sql
SELECT cliente_nome, servico_id, created_at
FROM fila_virtual 
WHERE status = 'concluido' 
AND created_at >= CURRENT_DATE;
```

### Estatísticas do dia
```sql
SELECT 
    COUNT(*) FILTER (WHERE status = 'em_espera') as em_espera,
    COUNT(*) FILTER (WHERE status = 'em_corte') as em_corte,
    COUNT(*) FILTER (WHERE status = 'concluido') as finalizados,
    COUNT(*) FILTER (WHERE status = 'no_show') as no_show,
    AVG(tempo_espera_estimado) as tempo_medio
FROM fila_virtual 
WHERE created_at >= CURRENT_DATE;
```

### Ver serviços disponíveis
```sql
SELECT id, nome, duracao_media, preco 
FROM servicos 
ORDER BY preco ASC;
```

### Ver barbearias
```sql
SELECT * FROM barbearias;
```

---

## 🧹 Limpeza (DELETE)

### Limpar registos antigos (mais de 7 dias)
```sql
DELETE FROM fila_virtual 
WHERE created_at < NOW() - INTERVAL '7 days';
```

### Limpar registos de ontem
```sql
DELETE FROM fila_virtual 
WHERE created_at < CURRENT_DATE;
```

### Limpar TODA a fila (reset completo)
```sql
DELETE FROM fila_virtual;
```

---

## 🔧 Manutenção (UPDATE)

### Resetar posições da fila
```sql
UPDATE fila_virtual 
SET posicao = (
    SELECT COUNT(*) + 1 
    FROM fila_virtual f2 
    WHERE f2.created_at < fila_virtual.created_at 
    AND f2.status = 'em_espera'
)
WHERE status = 'em_espera';
```

### Marcar todos em espera como no_show
```sql
UPDATE fila_virtual 
SET status = 'no_show' 
WHERE status = 'em_espera' 
AND created_at < CURRENT_DATE;
```

---

## 📈 Relatórios

### Serviços mais populares (últimos 30 dias)
```sql
SELECT 
    s.nome,
    COUNT(*) as total,
    ROUND(AVG(f.tempo_espera_estimado)) as tempo_medio
FROM fila_virtual f
JOIN servicos s ON f.servico_id = s.id
WHERE f.created_at >= NOW() - INTERVAL '30 days'
AND f.status = 'concluido'
GROUP BY s.nome
ORDER BY total DESC;
```

### Clientes por dia da semana
```sql
SELECT 
    TO_CHAR(created_at, 'Day') as dia,
    COUNT(*) as total
FROM fila_virtual 
WHERE status = 'concluido'
GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(DOW FROM created_at)
ORDER BY EXTRACT(DOW FROM created_at);
```

### Receita diária (últimos 7 dias)
```sql
SELECT 
    DATE(f.created_at) as data,
    COUNT(*) as cortes,
    SUM(s.preco) as receita_total
FROM fila_virtual f
JOIN servicos s ON f.servico_id = s.id
WHERE f.status = 'concluido'
AND f.created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(f.created_at)
ORDER BY data DESC;
```

---

## 🛡️ Verificações

### Verificar RLS está activo
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### Verificar políticas activas
```sql
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## ⚡ Quick Actions

### Adicionar cliente manualmente
```sql
INSERT INTO fila_virtual (barbearia_id, cliente_nome, status, posicao, tempo_espera_estimado, entrada_manual)
VALUES ('00000000-0000-0000-0000-000000000001', 'Nome Cliente', 'em_espera', 1, 0, true);
```

### Chamar próximo cliente
```sql
UPDATE fila_virtual 
SET status = 'em_corte' 
WHERE id = (
    SELECT id FROM fila_virtual 
    WHERE status = 'em_espera' 
    ORDER BY posicao ASC 
    LIMIT 1
);
```

### Finalizar cliente actual
```sql
UPDATE fila_virtual 
SET status = 'concluido' 
WHERE status = 'em_corte';
```
