-- =====================================================
-- MIGRAÇÃO: Tabela Barbeiros
-- =====================================================
-- Executar no Supabase SQL Editor

-- Criar tabela barbeiros
CREATE TABLE IF NOT EXISTS barbeiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbearia_id UUID REFERENCES barbearias(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    foto_url TEXT,
    data_nascimento DATE,
    especialidades TEXT[] DEFAULT '{}',
    bio TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para queries por barbearia
CREATE INDEX IF NOT EXISTS idx_barbeiros_barbearia ON barbeiros(barbearia_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE barbeiros ENABLE ROW LEVEL SECURITY;

-- Política: Leitura pública (para página do cliente)
CREATE POLICY "barbeiros_read_public" ON barbeiros
    FOR SELECT
    USING (activo = true);

-- Política: Insert apenas por barbeiros da mesma barbearia
CREATE POLICY "barbeiros_insert_own" ON barbeiros
    FOR INSERT
    WITH CHECK (
        barbearia_id IN (
            SELECT barbearia_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Política: Update apenas por barbeiros da mesma barbearia
CREATE POLICY "barbeiros_update_own" ON barbeiros
    FOR UPDATE
    USING (
        barbearia_id IN (
            SELECT barbearia_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Política: Delete apenas por barbeiros da mesma barbearia
CREATE POLICY "barbeiros_delete_own" ON barbeiros
    FOR DELETE
    USING (
        barbearia_id IN (
            SELECT barbearia_id FROM profiles WHERE id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGER: Updated At
-- =====================================================

CREATE OR REPLACE FUNCTION update_barbeiros_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER barbeiros_updated_at
    BEFORE UPDATE ON barbeiros
    FOR EACH ROW
    EXECUTE FUNCTION update_barbeiros_updated_at();

-- =====================================================
-- DADOS DE EXEMPLO (opcional)
-- =====================================================

-- Adicionar barbeiro exemplo para a barbearia 'ventus'
-- INSERT INTO barbeiros (barbearia_id, nome, especialidades, bio)
-- SELECT id, 'João Silva', ARRAY['Corte Fade', 'Barba'], 'Barbeiro com 5 anos de experiência'
-- FROM barbearias WHERE slug = 'ventus';
