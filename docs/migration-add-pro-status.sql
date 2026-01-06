-- =====================================================
-- Migration: Add Pro Status to Barbearias
-- =====================================================
-- Executar no Supabase SQL Editor

-- Add is_pro column for subscription status
ALTER TABLE barbearias 
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;

-- Add stripe_customer_id for linking to Stripe customer
ALTER TABLE barbearias 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Optional: Create index for faster Pro status lookups
CREATE INDEX IF NOT EXISTS idx_barbearias_is_pro ON barbearias(is_pro);
