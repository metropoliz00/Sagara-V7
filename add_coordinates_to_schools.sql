-- =========================================================
-- MIGRATION: ADD COORDINATES & MAP ICON TO SCHOOLS
-- Jalankan kode ini di SQL Editor Supabase Anda
-- =========================================================

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='schools' AND column_name='latitude') THEN
    ALTER TABLE public.schools ADD COLUMN latitude TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='schools' AND column_name='longitude') THEN
    ALTER TABLE public.schools ADD COLUMN longitude TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='schools' AND column_name='map_icon') THEN
    ALTER TABLE public.schools ADD COLUMN map_icon TEXT;
  END IF;
END $$;
