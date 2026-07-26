
-- =========================================================
-- SQL FIX FOR GUGUS 3 MELATI (DATABASE TRIGGER ERROR)
-- Jalankan kode ini di SQL Editor Supabase Anda
-- =========================================================

-- 1. Pastikan kolom foto/avatar_url sinkron
DO $$ 
BEGIN 
  -- Rename avatar_url ke foto agar sesuai dengan kode aplikasi
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='avatar_url') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='foto') THEN
    ALTER TABLE public.user_profiles RENAME COLUMN avatar_url TO foto;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='foto') THEN
    ALTER TABLE public.user_profiles ADD COLUMN foto TEXT;
  END IF;

  -- Pastikan kolom password_text ada
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' AND column_name='password_text') THEN
    ALTER TABLE public.user_profiles ADD COLUMN password_text TEXT;
  END IF;
END $$;

-- 2. Perbaiki Trigger Function agar Super Tangguh (Resilient)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_username TEXT;
  target_role public.user_role;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- 1. Generate Username yang Aman
  default_username := LEFT(COALESCE(NULLIF(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1)), 50);
  final_username := default_username;

  -- 2. Resolusi Konflik Username (Penting!)
  WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = final_username AND id != new.id) LOOP
    counter := counter + 1;
    final_username := LEFT(default_username, 40) || '_' || counter || '_' || SUBSTRING(new.id::text, 1, 4);
  END LOOP;

  -- 3. Tentukan Role
  IF (new.raw_user_meta_data->>'role' = 'admin') THEN
    target_role := 'admin'::public.user_role;
  ELSE
    target_role := 'guru'::public.user_role;
  END IF;

  -- 4. Insert Data ke user_profiles
  INSERT INTO public.user_profiles (
    id, username, email, role, nama, foto,
    nip, kepegawaian, pangkat, jabatan, sekolah, password_text, created_at
  )
  VALUES (
    new.id, 
    final_username,
    new.email,
    target_role,
    COALESCE(new.raw_user_meta_data->>'nama', new.raw_user_meta_data->>'full_name', final_username),
    COALESCE(new.raw_user_meta_data->>'foto', new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'nip', ''),
    COALESCE(new.raw_user_meta_data->>'kepegawaian', ''),
    COALESCE(new.raw_user_meta_data->>'pangkat', ''),
    COALESCE(new.raw_user_meta_data->>'jabatan', ''),
    COALESCE(new.raw_user_meta_data->>'sekolah', ''),
    new.raw_user_meta_data->>'password_text',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    nama = EXCLUDED.nama,
    role = EXCLUDED.role,
    nip = EXCLUDED.nip,
    kepegawaian = EXCLUDED.kepegawaian,
    pangkat = EXCLUDED.pangkat,
    jabatan = EXCLUDED.jabatan,
    sekolah = EXCLUDED.sekolah,
    foto = EXCLUDED.foto,
    password_text = COALESCE(EXCLUDED.password_text, public.user_profiles.password_text);

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback Terakhir agar Auth User TIDAK Gagal Dibuat
    BEGIN
      INSERT INTO public.user_profiles (id, username, email, role)
      VALUES (new.id, 'user_' || SUBSTRING(new.id::text, 1, 8), new.email, 'guru'::public.user_role)
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Silence error
    END;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Pasang ulang Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
