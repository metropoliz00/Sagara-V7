-- =========================================================
-- MIGRATION: ADD MATERI & VIDEO URL TO TRAININGS
-- Jalankan kode ini di SQL Editor Supabase Anda
-- =========================================================

-- 1. Tambahkan kolom ke tabel trainings secara aman
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trainings' AND column_name='materi_url') THEN
    ALTER TABLE public.trainings ADD COLUMN materi_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trainings' AND column_name='video_url') THEN
    ALTER TABLE public.trainings ADD COLUMN video_url TEXT;
  END IF;
END $$;

-- 2. Pasang Kebijakan Keamanan (RLS) agar Admin bisa menyimpan
-- Kita mengizinkan semua user yang login (authenticated) untuk mengelola data ini demi kemudahan dev
-- Di tahap produksi, ini bisa diperketat ke user dengan role 'admin'
DO $$ BEGIN
    DROP POLICY IF EXISTS "Auth all trainings" ON public.trainings;
    CREATE POLICY "Auth all trainings" ON public.trainings FOR ALL TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
