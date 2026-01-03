-- Migration: Complete setup for multi-tenancy
-- Run this in Supabase SQL Editor

-- 1. Add slug column to barbearias (if not exists)
ALTER TABLE barbearias
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_barbearias_slug ON barbearias(slug);

-- 3. Update existing barbershop with a slug
UPDATE barbearias
SET slug = 'ventus'
WHERE id = '00000000-0000-0000-0000-000000000001' AND slug IS NULL;

-- 4. Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    telefone TEXT,
    barbearia_id UUID REFERENCES barbearias(id),
    role TEXT DEFAULT 'barbeiro',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create index for barbearia_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_barbearia_id ON profiles(barbearia_id);

-- 6. Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Create policy to allow users to read their own profile
CREATE POLICY IF NOT EXISTS "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 8. Create policy to allow users to update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 9. Create a trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Create profile for existing users (if any)
INSERT INTO profiles (id, nome)
SELECT id, email
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 11. IMPORTANT: After running this, you need to manually link your user to the barbershop:
-- Get your user ID from Supabase Auth > Users, then run:
-- UPDATE profiles SET barbearia_id = '00000000-0000-0000-0000-000000000001' WHERE id = 'YOUR_USER_ID_HERE';

-- 12. Create horario_funcionamento table for schedule
CREATE TABLE IF NOT EXISTS horario_funcionamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barbearia_id UUID REFERENCES barbearias(id) ON DELETE CASCADE NOT NULL,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=Dom, 6=Sab
    hora_abertura TIME DEFAULT '09:00',
    hora_fecho TIME DEFAULT '19:00',
    fechado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(barbearia_id, dia_semana)
);

-- 13. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_horario_barbearia ON horario_funcionamento(barbearia_id);

-- 14. Enable RLS on horario_funcionamento
ALTER TABLE horario_funcionamento ENABLE ROW LEVEL SECURITY;

-- 15. Allow all authenticated users to read schedules
CREATE POLICY IF NOT EXISTS "Anyone can read schedule"
ON horario_funcionamento FOR SELECT
TO authenticated
USING (true);

-- 16. Allow barbers to update their own barbershop schedule
CREATE POLICY IF NOT EXISTS "Barbers can update own schedule"
ON horario_funcionamento FOR ALL
TO authenticated
USING (
    barbearia_id IN (
        SELECT barbearia_id FROM profiles WHERE id = auth.uid()
    )
);

-- 17. Insert default schedule for Ventus barbershop
INSERT INTO horario_funcionamento (barbearia_id, dia_semana, hora_abertura, hora_fecho, fechado) VALUES
('00000000-0000-0000-0000-000000000001', 0, '09:00', '13:00', true),  -- Domingo fechado
('00000000-0000-0000-0000-000000000001', 1, '09:00', '19:00', false), -- Segunda
('00000000-0000-0000-0000-000000000001', 2, '09:00', '19:00', false), -- Terça
('00000000-0000-0000-0000-000000000001', 3, '09:00', '19:00', false), -- Quarta
('00000000-0000-0000-0000-000000000001', 4, '09:00', '19:00', false), -- Quinta
('00000000-0000-0000-0000-000000000001', 5, '09:00', '19:00', false), -- Sexta
('00000000-0000-0000-0000-000000000001', 6, '09:00', '17:00', false)  -- Sábado
ON CONFLICT (barbearia_id, dia_semana) DO NOTHING;
