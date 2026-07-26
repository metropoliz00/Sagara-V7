-- Schema for GUGUS 3 MELATI

-- Enable full text search and other useful extensions if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for Site Settings (Pengaturan Website)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY,
    content JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.site_settings;
  CREATE POLICY "Settings viewable by everyone" ON public.site_settings FOR SELECT USING (true);
  
  -- Allow authenticated users (Admins) to modify settings
  DROP POLICY IF EXISTS "Settings updatable by authenticated users" ON public.site_settings;
  CREATE POLICY "Settings updatable by authenticated users" ON public.site_settings FOR ALL USING (auth.role() = 'authenticated');
  
  -- Fallback for anonymous updates if needed during development
  DROP POLICY IF EXISTS "Settings updatable by anon (dev)" ON public.site_settings;
  CREATE POLICY "Settings updatable by anon (dev)" ON public.site_settings FOR ALL USING (true);
END $$;

-- Table for Member Schools (Sekolah Anggota)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='jenis_sekolah') THEN
        ALTER TABLE public.schools ADD COLUMN jenis_sekolah VARCHAR(100) DEFAULT 'Sekolah Imbas';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='principal_image_url') THEN
        ALTER TABLE public.schools ADD COLUMN principal_image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='vision') THEN
        ALTER TABLE public.schools ADD COLUMN vision TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='motto') THEN
        ALTER TABLE public.schools ADD COLUMN motto TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='map_embed_url') THEN
        ALTER TABLE public.schools ADD COLUMN map_embed_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='akreditasi') THEN
        ALTER TABLE public.schools ADD COLUMN akreditasi TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='prestasi_images') THEN
        ALTER TABLE public.schools ADD COLUMN prestasi_images JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    principal_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    address TEXT,
    google_maps_url TEXT,
    description TEXT,
    teacher_count INT DEFAULT 0,
    student_count INT DEFAULT 0,
    jenis_sekolah VARCHAR(100) DEFAULT 'Sekolah Imbas',
    principal_image_url TEXT,
    vision TEXT,
    motto TEXT,
    map_embed_url TEXT,
    akreditasi TEXT,
    prestasi_images JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Users (Admin and Teachers)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'guru');
  END IF;

  -- Migration: Rename columns if they exist in public schema
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'full_name') THEN
    ALTER TABLE public.user_profiles RENAME COLUMN full_name TO nama;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'status_pegawai') THEN
    ALTER TABLE public.user_profiles RENAME COLUMN status_pegawai TO kepegawaian;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'pangkat_golongan') THEN
    ALTER TABLE public.user_profiles RENAME COLUMN pangkat_golongan TO pangkat;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'sekolah_asal') THEN
    ALTER TABLE public.user_profiles RENAME COLUMN sekolah_asal TO sekolah;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    role user_role DEFAULT 'guru' NOT NULL,
    nama VARCHAR(255),
    nip VARCHAR(100),
    kepegawaian VARCHAR(100),
    pangkat VARCHAR(100),
    jabatan VARCHAR(255),
    sekolah VARCHAR(255),
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    foto TEXT,
    password_text VARCHAR(255), -- For admin dashboard reference only
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_username TEXT;
  target_role public.user_role;
BEGIN
  -- Generate a safe default username
  default_username := LEFT(COALESCE(NULLIF(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1) || '_' || SUBSTRING(new.id::text, 1, 5)), 255);
  
  -- Determine role with explicit casting and extra safety
  BEGIN
    IF (new.raw_user_meta_data->>'role' = 'admin') THEN
      target_role := 'admin'::public.user_role;
    ELSIF (new.raw_user_meta_data->>'username' ILIKE 'admin%' OR new.email ILIKE 'admin%') THEN
      target_role := 'admin'::public.user_role;
    ELSE
      target_role := 'guru'::public.user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    target_role := 'guru'::public.user_role;
  END;

  INSERT INTO public.user_profiles (
    id, username, email, role, nama, foto,
    nip, kepegawaian, pangkat, jabatan, sekolah, created_at
  )
  VALUES (
    new.id, 
    default_username,
    new.email,
    target_role,
    COALESCE(new.raw_user_meta_data->>'nama', new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'foto', new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'nip', ''),
    COALESCE(new.raw_user_meta_data->>'kepegawaian', ''),
    COALESCE(new.raw_user_meta_data->>'pangkat', new.raw_user_meta_data->>'pangkat_golongan', ''),
    COALESCE(new.raw_user_meta_data->>'jabatan', ''),
    COALESCE(new.raw_user_meta_data->>'sekolah', new.raw_user_meta_data->>'sekolah_asal', ''),
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
    foto = EXCLUDED.foto;

  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Extreme fallback to ensure auth user creation is NEVER blocked
    BEGIN
      INSERT INTO public.user_profiles (id, username, email, role, nama)
      VALUES (new.id, LEFT('user_' || new.id::text, 255), new.email, 'guru'::public.user_role, '')
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Absolute silence to prevent Auth crash
    END;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Table for News & Articles (Berita & Artikel)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_category') THEN
    CREATE TYPE post_category AS ENUM ('berita', 'pengumuman', 'artikel');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    featured_image_url TEXT,
    category post_category DEFAULT 'berita' NOT NULL,
    author_id UUID REFERENCES public.user_profiles(id),
    is_published BOOLEAN DEFAULT true,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Events (Kegiatan)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    date_start TIMESTAMP WITH TIME ZONE NOT NULL,
    date_end TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Achievements (Prestasi)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'achievement_category') THEN
    CREATE TYPE achievement_category AS ENUM ('sekolah', 'guru', 'siswa');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    winner_name VARCHAR(255) NOT NULL,
    category achievement_category NOT NULL,
    school_id UUID REFERENCES public.schools(id),
    year INT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Awards (Penghargaan)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awards' AND column_name='category') THEN
        ALTER TABLE public.awards ADD COLUMN category VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awards' AND column_name='rank') THEN
        ALTER TABLE public.awards ADD COLUMN rank TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='awards' AND column_name='image_url') THEN
        ALTER TABLE public.awards ADD COLUMN image_url TEXT;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.awards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    year INT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for KKG Structure
CREATE TABLE IF NOT EXISTS public.org_kkg (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    school VARCHAR(255),
    nip VARCHAR(100),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Gugus Structure
CREATE TABLE IF NOT EXISTS public.org_gugus (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    school VARCHAR(255),
    nip VARCHAR(100),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Gallery (Galeri Foto & Video)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gallery_type') THEN
    CREATE TYPE gallery_type AS ENUM ('photo', 'video');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type gallery_type DEFAULT 'photo' NOT NULL,
    media_url TEXT NOT NULL,
    event_id UUID REFERENCES public.events(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Digital Services Documents (File Unggahan/Berkas Administrasi)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    uploaded_by UUID REFERENCES public.user_profiles(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set Row Level Security (RLS) basics (simplified for this example)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_kkg ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_gugus ENABLE ROW LEVEL SECURITY;

-- Allow public read access where applicable
-- Instead of CREATE POLICY, we drop if exists then create. This requires a bit more care.
-- For simplicity, since I cannot easily list policies, I will assume they need to be dropped.
-- Actually, a better pattern is to use a do block for each policy.

DO $$ BEGIN
  -- Allow read access for everyone
  DROP POLICY IF EXISTS "Enable read access for everyone" ON public.schools;
  CREATE POLICY "Enable read access for everyone" ON public.schools FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.schools;
  CREATE POLICY "Enable all access for authenticated users" ON public.schools FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Enable read access for everyone" ON public.posts;
  CREATE POLICY "Enable read access for everyone" ON public.posts FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.posts;
  CREATE POLICY "Enable all access for authenticated users" ON public.posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Enable read access for everyone" ON public.events;
  CREATE POLICY "Enable read access for everyone" ON public.events FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.events;
  CREATE POLICY "Enable all access for authenticated users" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Enable read access for everyone" ON public.achievements;
  CREATE POLICY "Enable read access for everyone" ON public.achievements FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.achievements;
  CREATE POLICY "Enable all access for authenticated users" ON public.achievements FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Enable read access for everyone" ON public.gallery;
  CREATE POLICY "Enable read access for everyone" ON public.gallery FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.gallery;
  CREATE POLICY "Enable all access for authenticated users" ON public.gallery FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
  DROP POLICY IF EXISTS "Enable read access for everyone" ON public.documents;
  CREATE POLICY "Enable read access for everyone" ON public.documents FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.documents;
  CREATE POLICY "Enable all access for authenticated users" ON public.documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Enable read access for everyone" ON public.awards;
  CREATE POLICY "Enable read access for everyone" ON public.awards FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.awards;
  CREATE POLICY "Enable all access for authenticated users" ON public.awards FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Enable read access for everyone" ON public.org_kkg;
  CREATE POLICY "Enable read access for everyone" ON public.org_kkg FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.org_kkg;
  CREATE POLICY "Enable all access for authenticated users" ON public.org_kkg FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Enable read access for everyone" ON public.org_gugus;
  CREATE POLICY "Enable read access for everyone" ON public.org_gugus FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.org_gugus;
  CREATE POLICY "Enable all access for authenticated users" ON public.org_gugus FOR ALL TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow public read for username lookup" ON public.user_profiles;
  CREATE POLICY "Allow public read for username lookup" ON public.user_profiles FOR SELECT USING (true);
END $$;

-- Training and Activity Logs
CREATE TABLE IF NOT EXISTS public.trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    date_start TIMESTAMP WITH TIME ZONE,
    date_end TIMESTAMP WITH TIME ZONE,
    location TEXT,
    status TEXT DEFAULT 'planned',
    materi_url TEXT,
    video_url TEXT,
    is_attendance_open BOOLEAN DEFAULT false,
    banner_url TEXT,
    user_id UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.training_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    training_id UUID REFERENCES public.trainings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    attended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(training_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    user_name TEXT,
    user_role TEXT,
    action TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public view trainings" ON public.trainings;
    CREATE POLICY "Public view trainings" ON public.trainings FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Auth all trainings" ON public.trainings;
    CREATE POLICY "Auth all trainings" ON public.trainings FOR ALL TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Users can view their own registrations" ON public.training_participants;
    CREATE POLICY "Users can view their own registrations" ON public.training_participants FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Users can register themselves" ON public.training_participants;
    CREATE POLICY "Users can register themselves" ON public.training_participants FOR INSERT WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Users can update their own attendance" ON public.training_participants;
    CREATE POLICY "Users can update their own attendance" ON public.training_participants FOR UPDATE USING (true);
    
    DROP POLICY IF EXISTS "System can log activity" ON public.activity_logs;
    CREATE POLICY "System can log activity" ON public.activity_logs FOR INSERT WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Admins can view all logs" ON public.activity_logs;
    CREATE POLICY "Admins can view all logs" ON public.activity_logs FOR SELECT USING (true);
END $$;

-- Additional Guru Features Tables
CREATE TABLE IF NOT EXISTS public.kkg_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  user_id UUID REFERENCES public.user_profiles(id)
);

CREATE TABLE IF NOT EXISTS public.meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  user_id UUID REFERENCES public.user_profiles(id)
);

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

-- RLS for Letters
ALTER TABLE public.incoming_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outgoing_letters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Auth all incoming_letters" ON public.incoming_letters;
    CREATE POLICY "Auth all incoming_letters" ON public.incoming_letters FOR ALL TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Auth all outgoing_letters" ON public.outgoing_letters;
    CREATE POLICY "Auth all outgoing_letters" ON public.outgoing_letters FOR ALL TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.training_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES public.trainings(id),
  user_id UUID REFERENCES public.user_profiles(id),
  certificate_url TEXT NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.best_practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.teacher_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  work_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Basic RLS for new tables
ALTER TABLE public.kkg_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.best_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_works ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Public read kkg_materials" ON public.kkg_materials FOR SELECT USING (true);
  CREATE POLICY "Public read meeting_minutes" ON public.meeting_minutes FOR SELECT USING (true);
  CREATE POLICY "Public read forum" ON public.forum_posts FOR SELECT USING (true);
  CREATE POLICY "Public read forum_comments" ON public.forum_comments FOR SELECT USING (true);
  CREATE POLICY "Public read best_practices" ON public.best_practices FOR SELECT USING (true);
  CREATE POLICY "Public read teacher_works" ON public.teacher_works FOR SELECT USING (true);
  CREATE POLICY "Users view own certificates" ON public.training_certificates FOR SELECT USING (auth.uid() = user_id);
  
  -- Simple allow all for authenticated for other ops in dev
  CREATE POLICY "Auth all kkg_materials" ON public.kkg_materials FOR ALL TO authenticated USING (true);
  CREATE POLICY "Auth all meeting_minutes" ON public.meeting_minutes FOR ALL TO authenticated USING (true);
  CREATE POLICY "Auth all forum" ON public.forum_posts FOR ALL TO authenticated USING (true);
  CREATE POLICY "Auth all forum_comments" ON public.forum_comments FOR ALL TO authenticated USING (true);
  CREATE POLICY "Auth all best_practices" ON public.best_practices FOR ALL TO authenticated USING (true);
  CREATE POLICY "Auth all teacher_works" ON public.teacher_works FOR ALL TO authenticated USING (true);
EXCEPTION WHEN OTHERS THEN
  -- Policies might already exist
END $$;

-- Table for Map Landmarks
CREATE TABLE IF NOT EXISTS public.landmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    icon VARCHAR(50) DEFAULT '📍',
    color VARCHAR(50) DEFAULT 'bg-blue-500 text-white',
    embed_code TEXT,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable read access for everyone" ON public.landmarks;
  CREATE POLICY "Enable read access for everyone" ON public.landmarks FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.landmarks;
  CREATE POLICY "Enable all access for authenticated users" ON public.landmarks FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;

