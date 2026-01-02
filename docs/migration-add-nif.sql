-- Migration: Add cliente_nif column to marcacoes table
-- Execute this in Supabase SQL Editor

-- Add cliente_nif column if it doesn't exist
ALTER TABLE public.marcacoes 
ADD COLUMN IF NOT EXISTS cliente_nif VARCHAR(20);

-- Add comment for documentation
COMMENT ON COLUMN public.marcacoes.cliente_nif IS 'NIF do cliente para faturação (opcional)';
