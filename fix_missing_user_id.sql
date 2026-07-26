-- =========================================================
-- MIGRATION: FIX MISSING USER_ID COLUMN
-- Jalankan kode ini di SQL Editor Supabase Anda
-- =========================================================

-- 1. Perbaiki tabel kkg_materials
DO $$ 
BEGIN 
  -- Cek jika created_by ada, ubah namanya jadi user_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='kkg_materials' AND column_name='created_by') THEN
    ALTER TABLE public.kkg_materials RENAME COLUMN created_by TO user_id;
  -- Jika tidak ada created_by dan belum ada user_id, tambahkan kolom baru
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='kkg_materials' AND column_name='user_id') THEN
    ALTER TABLE public.kkg_materials ADD COLUMN user_id UUID REFERENCES public.user_profiles(id);
  END IF;
END $$;

-- 2. Perbaiki tabel meeting_minutes
DO $$ 
BEGIN 
  -- Cek jika created_by ada, ubah namanya jadi user_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='meeting_minutes' AND column_name='created_by') THEN
    ALTER TABLE public.meeting_minutes RENAME COLUMN created_by TO user_id;
  -- Jika tidak ada created_by dan belum ada user_id, tambahkan kolom baru
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='meeting_minutes' AND column_name='user_id') THEN
    ALTER TABLE public.meeting_minutes ADD COLUMN user_id UUID REFERENCES public.user_profiles(id);
  END IF;
END $$;

-- 3. Perbaiki tabel trainings (jika belum ada user_id)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='trainings' AND column_name='user_id') THEN
    ALTER TABLE public.trainings ADD COLUMN user_id UUID REFERENCES public.user_profiles(id);
  END IF;
END $$;

-- 4. Tambahkan constraint unik ke training_participants jika belum ada
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'training_participants_user_training_key') THEN
    ALTER TABLE public.training_participants ADD CONSTRAINT training_participants_user_training_key UNIQUE (training_id, user_id);
  END IF;
END $$;

-- 5. Refresh cache skema (Supabase melakukannya otomatis, tapi jika butuh manual bisa dilakukan di Settings API)
