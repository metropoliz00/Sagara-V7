-- =========================================================
-- MIGRATION: ADD MISSING COLUMNS TO EVENTS
-- Jalankan kode ini di SQL Editor Supabase Anda
-- =========================================================

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='status') THEN
    ALTER TABLE public.events ADD COLUMN status TEXT DEFAULT 'rencana';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='image_url') THEN
    ALTER TABLE public.events ADD COLUMN image_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='detail_url') THEN
    ALTER TABLE public.events ADD COLUMN detail_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='materi_url') THEN
    ALTER TABLE public.events ADD COLUMN materi_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='is_open_for_guests') THEN
    ALTER TABLE public.events ADD COLUMN is_open_for_guests BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='events' AND column_name='is_attendance_open') THEN
    ALTER TABLE public.events ADD COLUMN is_attendance_open BOOLEAN DEFAULT false;
  END IF;

END $$;
