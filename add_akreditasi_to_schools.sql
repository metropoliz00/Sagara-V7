-- Run this SQL in your Supabase SQL Editor to add the missing columns
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS akreditasi TEXT;
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS prestasi_images JSONB DEFAULT '[]'::jsonb;
