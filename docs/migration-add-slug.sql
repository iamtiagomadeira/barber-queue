-- Migration: Add slug column to barbearias table for multi-tenancy routing
-- Run this in Supabase SQL Editor

-- Add slug column
ALTER TABLE barbearias
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_barbearias_slug ON barbearias(slug);

-- Update existing barbershop with a slug (use a default for now)
UPDATE barbearias
SET slug = 'ventus'
WHERE id = '00000000-0000-0000-0000-000000000001' AND slug IS NULL;

-- Make slug NOT NULL after setting defaults
-- ALTER TABLE barbearias ALTER COLUMN slug SET NOT NULL;

-- Add barbearia_id to profiles if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS barbearia_id UUID REFERENCES barbearias(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_barbearia_id ON profiles(barbearia_id);

-- Update existing profile for the test user (replace USER_ID with actual)
-- UPDATE profiles SET barbearia_id = '00000000-0000-0000-0000-000000000001' WHERE id = 'YOUR_USER_ID';
