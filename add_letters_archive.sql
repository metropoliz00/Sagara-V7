-- =========================================================
-- MIGRATION: ADD LETTER ARCHIVE TABLES (ARSIP SURAT)
-- Jalankan kode ini di SQL Editor Supabase Anda
-- =========================================================

-- 1. Tabel Surat Masuk
CREATE TABLE IF NOT EXISTS public.incoming_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_number TEXT NOT NULL,
  title TEXT NOT NULL,
  sender TEXT NOT NULL,
  date_received DATE NOT NULL,
  file_url TEXT,
  user_id UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabel Surat Keluar
CREATE TABLE IF NOT EXISTS public.outgoing_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_number TEXT NOT NULL,
  title TEXT NOT NULL,
  recipient TEXT NOT NULL,
  date_sent DATE NOT NULL,
  file_url TEXT,
  user_id UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Kebijakan Keamanan (RLS)
ALTER TABLE public.incoming_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outgoing_letters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Auth all incoming_letters" ON public.incoming_letters;
    CREATE POLICY "Auth all incoming_letters" ON public.incoming_letters FOR ALL TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Auth all outgoing_letters" ON public.outgoing_letters;
    CREATE POLICY "Auth all outgoing_letters" ON public.outgoing_letters FOR ALL TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;
