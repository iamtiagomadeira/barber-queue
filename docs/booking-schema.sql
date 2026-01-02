-- Ventus Booking System Schema
-- Execute this in Supabase SQL Editor

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

---------------------------------------------------
-- BARBEIROS (Barbers with profile photos)
---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.barbeiros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbearia_id UUID REFERENCES public.barbearias(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    foto_url TEXT,
    bio TEXT,
    especialidades TEXT[], -- ex: ['fade', 'barba', 'designs']
    activo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0, -- for display ordering
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for barbeiros
ALTER TABLE public.barbeiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Barbeiros são públicos para leitura"
ON public.barbeiros FOR SELECT
USING (true);

CREATE POLICY "Apenas donos podem editar barbeiros"
ON public.barbeiros FOR ALL
USING (
    barbearia_id IN (
        SELECT id FROM public.barbearias WHERE auth.uid() = dono_id
    )
);

---------------------------------------------------
-- HORARIOS (Weekly schedule for each barber)
---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.horarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbeiro_id UUID REFERENCES public.barbeiros(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=Dom, 1=Seg...6=Sab
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    intervalo_minutos INTEGER DEFAULT 30,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for horarios
ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Horarios são públicos para leitura"
ON public.horarios FOR SELECT
USING (true);

CREATE POLICY "Apenas donos podem editar horarios"
ON public.horarios FOR ALL
USING (
    barbeiro_id IN (
        SELECT b.id FROM public.barbeiros b
        JOIN public.barbearias ba ON b.barbearia_id = ba.id
        WHERE auth.uid() = ba.dono_id
    )
);

---------------------------------------------------
-- MARCACOES (Appointments)
---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marcacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbearia_id UUID REFERENCES public.barbearias(id) ON DELETE CASCADE,
    barbeiro_id UUID REFERENCES public.barbeiros(id), -- null = any available
    servico_id UUID REFERENCES public.servicos(id),
    cliente_nome VARCHAR(100) NOT NULL,
    cliente_telefone VARCHAR(20) NOT NULL,
    cliente_email VARCHAR(255),
    data DATE NOT NULL,
    hora TIME NOT NULL,
    duracao_minutos INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'confirmada' CHECK (status IN ('pendente', 'confirmada', 'em_atendimento', 'concluida', 'cancelada', 'no_show')),
    notas TEXT,
    deposito_pago BOOLEAN DEFAULT false,
    deposito_id TEXT,
    lembrete_enviado BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for marcacoes
ALTER TABLE public.marcacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marcacoes visíveis para barbearia"
ON public.marcacoes FOR SELECT
USING (true);

CREATE POLICY "Clientes podem criar marcacoes"
ON public.marcacoes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Barbearias podem editar suas marcacoes"
ON public.marcacoes FOR UPDATE
USING (
    barbearia_id IN (
        SELECT id FROM public.barbearias WHERE auth.uid() = dono_id
    )
);

---------------------------------------------------
-- INDEXES for performance
---------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_marcacoes_data ON public.marcacoes(data);
CREATE INDEX IF NOT EXISTS idx_marcacoes_barbeiro ON public.marcacoes(barbeiro_id);
CREATE INDEX IF NOT EXISTS idx_marcacoes_barbearia_data ON public.marcacoes(barbearia_id, data);
CREATE INDEX IF NOT EXISTS idx_barbeiros_barbearia ON public.barbeiros(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_horarios_barbeiro ON public.horarios(barbeiro_id);

---------------------------------------------------
-- INSERT default barber for testing
---------------------------------------------------
INSERT INTO public.barbeiros (barbearia_id, nome, bio, especialidades, activo)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Carlos Silva',
    'Barbeiro profissional com 10 anos de experiência',
    ARRAY['fade', 'corte clássico', 'barba'],
    true
) ON CONFLICT DO NOTHING;

-- Insert default schedule (Mon-Sat 9:00-19:00)
INSERT INTO public.horarios (barbeiro_id, dia_semana, hora_inicio, hora_fim, intervalo_minutos)
SELECT 
    b.id,
    dia,
    '09:00'::TIME,
    '19:00'::TIME,
    30
FROM public.barbeiros b
CROSS JOIN generate_series(1, 6) AS dia -- Mon-Sat
WHERE b.nome = 'Carlos Silva'
ON CONFLICT DO NOTHING;
