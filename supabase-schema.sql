-- Create tables for Barber Queue MVP

-- Barbearias table
CREATE TABLE IF NOT EXISTS barbearias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Servicos table
CREATE TABLE IF NOT EXISTS servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID NOT NULL REFERENCES barbearias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  duracao_media INTEGER NOT NULL, -- minutes
  preco DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fila Virtual table
CREATE TABLE IF NOT EXISTS fila_virtual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbearia_id UUID NOT NULL REFERENCES barbearias(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('em_espera', 'em_corte', 'concluido', 'no_show')),
  posicao INTEGER NOT NULL,
  tempo_espera_estimado INTEGER NOT NULL, -- minutes
  deposito_pago BOOLEAN DEFAULT FALSE,
  deposito_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  chamado_at TIMESTAMP WITH TIME ZONE,
  concluido_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fila_virtual_barbearia ON fila_virtual(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_fila_virtual_status ON fila_virtual(status);
CREATE INDEX IF NOT EXISTS idx_fila_virtual_posicao ON fila_virtual(posicao);
CREATE INDEX IF NOT EXISTS idx_servicos_barbearia ON servicos(barbearia_id);

-- Insert sample data for testing
INSERT INTO barbearias (nome, endereco, telefone) 
VALUES ('Barbearia Premium', 'Rua das Flores, 123, Lisboa', '21 123 4567')
ON CONFLICT DO NOTHING;

-- Get the barbearia ID for inserting services
DO $$
DECLARE
  barbearia_id UUID;
BEGIN
  SELECT id INTO barbearia_id FROM barbearias LIMIT 1;
  
  -- Insert sample services
  INSERT INTO servicos (barbearia_id, nome, duracao_media, preco)
  VALUES 
    (barbearia_id, 'Fade', 45, 15.00),
    (barbearia_id, 'Corte Clássico', 30, 12.00),
    (barbearia_id, 'Barba', 20, 8.00),
    (barbearia_id, 'Corte + Barba', 60, 20.00)
  ON CONFLICT DO NOTHING;
END $$;

-- Row Level Security (RLS) Policies
ALTER TABLE barbearias ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fila_virtual ENABLE ROW LEVEL SECURITY;

-- Allow public read access to barbearias and servicos
CREATE POLICY "Allow public read access to barbearias" 
  ON barbearias FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access to servicos" 
  ON servicos FOR SELECT 
  USING (true);

-- Allow public read access to fila_virtual
CREATE POLICY "Allow public read access to fila_virtual" 
  ON fila_virtual FOR SELECT 
  USING (true);

-- Allow public insert to fila_virtual (for customers joining queue)
CREATE POLICY "Allow public insert to fila_virtual" 
  ON fila_virtual FOR INSERT 
  WITH CHECK (true);

-- Allow authenticated users to update fila_virtual (for barbers)
CREATE POLICY "Allow authenticated update to fila_virtual" 
  ON fila_virtual FOR UPDATE 
  USING (auth.role() = 'authenticated');
