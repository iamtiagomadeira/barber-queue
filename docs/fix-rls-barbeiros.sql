-- =====================================================
-- FIX: Políticas RLS para tabela barbeiros
-- =====================================================
-- Executar no Supabase SQL Editor

-- Primeiro, remover políticas antigas que dependem da tabela profiles
DROP POLICY IF EXISTS "barbeiros_insert_own" ON barbeiros;
DROP POLICY IF EXISTS "barbeiros_update_own" ON barbeiros;
DROP POLICY IF EXISTS "barbeiros_delete_own" ON barbeiros;
DROP POLICY IF EXISTS "barbeiros_read_public" ON barbeiros;

-- Criar políticas simplificadas (sem dependência de profiles)

-- Política: Leitura pública para barbeiros activos
CREATE POLICY "barbeiros_read_public" ON barbeiros
    FOR SELECT
    USING (true);

-- Política: Utilizadores autenticados podem criar barbeiros
CREATE POLICY "barbeiros_insert_authenticated" ON barbeiros
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Política: Utilizadores autenticados podem atualizar barbeiros
CREATE POLICY "barbeiros_update_authenticated" ON barbeiros
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Política: Utilizadores autenticados podem eliminar barbeiros
CREATE POLICY "barbeiros_delete_authenticated" ON barbeiros
    FOR DELETE
    USING (auth.role() = 'authenticated');
