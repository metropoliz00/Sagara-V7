-- SAGARA School Database Schema
-- Run this in your Supabase SQL Editor for the School Database.

-- Drop existing tables to ensure clean schema if needed (Optional, remove if maintaining data)
-- DROP TABLE IF EXISTS academic_calendar, class_config, materials, schedule, grades, book_inventory, book_loans, bos_management, school_assets, learning_documentation, support_documents, permission_requests, buku_penghubung, jurnal_kelas, learning_reports, employment_links, penilaian_karakter, penilaian_sikap, guests, inventory, profiles, extracurriculars, counseling, holidays, attendance, agendas, students, users, graduates, sumatif_results, sumatifs, emergency_alerts, performance_assessments, learning_plans CASCADE;

-- (Include all tables from supabase_migration.sql here, excluding school_databases)
-- ... [All tables from supabase_migration.sql] ...

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT NOT NULL,
  full_name TEXT NOT NULL,
  nip TEXT,
  nuptk TEXT,
  birth_info TEXT,
  education TEXT,
  position TEXT,
  rank TEXT,
  class_id TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  photo TEXT,
  signature TEXT,
  student_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Class Config table
CREATE TABLE IF NOT EXISTS class_config (
  class_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. GTK Data table
CREATE TABLE IF NOT EXISTS gtk_data (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  nama TEXT NOT NULL,
  nip TEXT,
  nuptk TEXT,
  jenis_kelamin TEXT,
  tempat_lahir TEXT,
  tanggal_lahir DATE,
  ijazah_tertinggi TEXT,
  jabatan TEXT,
  status_pegawai TEXT,
  tmt_pengangkatan DATE,
  mulai_bekerja_disini DATE,
  pangkat_golongan TEXT,
  masa_kerja_tahun INTEGER DEFAULT 0,
  masa_kerja_bulan INTEGER DEFAULT 0,
  sk_terakhir TEXT,
  email_pribadi TEXT,
  email_belajar TEXT,
  foto TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  nisn TEXT,
  nik TEXT,
  name TEXT NOT NULL,
  gender TEXT,
  birth_place TEXT,
  birth_date DATE,
  religion TEXT,
  address TEXT,
  father_name TEXT,
  father_job TEXT,
  father_education TEXT,
  mother_name TEXT,
  mother_job TEXT,
  mother_education TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  parent_job TEXT,
  economy_status TEXT,
  height NUMERIC DEFAULT 0,
  weight NUMERIC DEFAULT 0,
  blood_type TEXT,
  health_notes TEXT,
  hobbies TEXT,
  ambition TEXT,
  achievements JSONB DEFAULT '[]',
  violations JSONB DEFAULT '[]',
  behavior_score NUMERIC DEFAULT 100,
  present NUMERIC DEFAULT 0,
  sick NUMERIC DEFAULT 0,
  permit NUMERIC DEFAULT 0,
  alpha NUMERIC DEFAULT 0,
  photo TEXT,
  teacher_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Agendas table
CREATE TABLE IF NOT EXISTS agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  type TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Materials table
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  records JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT,
  date DATE NOT NULL,
  description TEXT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Counseling table
CREATE TABLE IF NOT EXISTS counseling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT,
  date DATE NOT NULL,
  type TEXT,
  category TEXT,
  description TEXT,
  point NUMERIC DEFAULT 0,
  emotion TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Extracurriculars table
CREATE TABLE IF NOT EXISTS extracurriculars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  schedule TEXT,
  coach TEXT,
  members JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  condition TEXT,
  qty NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Guests table
CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  name TEXT NOT NULL,
  agency TEXT,
  purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Penilaian Sikap table
CREATE TABLE IF NOT EXISTS penilaian_sikap (
  student_id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  keimanan NUMERIC DEFAULT 0,
  kewargaan NUMERIC DEFAULT 0,
  penalaran_kritis NUMERIC DEFAULT 0,
  kreativitas NUMERIC DEFAULT 0,
  kolaborasi NUMERIC DEFAULT 0,
  kemandirian NUMERIC DEFAULT 0,
  kesehatan NUMERIC DEFAULT 0,
  komunikasi NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. Penilaian Karakter table
CREATE TABLE IF NOT EXISTS penilaian_karakter (
  student_id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  bangun_pagi TEXT,
  beribadah TEXT,
  berolahraga TEXT,
  makan_sehat TEXT,
  gemar_belajar TEXT,
  bermasyarakat TEXT,
  tidur_awal TEXT,
  catatan TEXT,
  afirmasi TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. Employment Links table
CREATE TABLE IF NOT EXISTS employment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. Learning Reports table
CREATE TABLE IF NOT EXISTS learning_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT,
  subject TEXT,
  topic TEXT,
  document_link TEXT,
  teacher_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. Jurnal Kelas table
CREATE TABLE IF NOT EXISTS jurnal_kelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  date DATE NOT NULL,
  day TEXT,
  content JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, date)
);

-- 19. Buku Penghubung table
CREATE TABLE IF NOT EXISTS buku_penghubung (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  date DATE NOT NULL,
  sender TEXT,
  message TEXT,
  status TEXT,
  category TEXT,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 20. Permission Requests table
CREATE TABLE IF NOT EXISTS permission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 21. Support Documents table
CREATE TABLE IF NOT EXISTS support_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 22. Learning Documentation table
CREATE TABLE IF NOT EXISTS learning_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  nama_kegiatan TEXT NOT NULL,
  link_foto TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 23. School Assets table
CREATE TABLE IF NOT EXISTS school_assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  qty NUMERIC DEFAULT 0,
  condition TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 24. BOS Management table
CREATE TABLE IF NOT EXISTS bos_management (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT,
  category TEXT,
  description TEXT,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 25. Book Loans table
CREATE TABLE IF NOT EXISTS book_loans (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT,
  class_id TEXT NOT NULL,
  books JSONB DEFAULT '[]',
  qty NUMERIC DEFAULT 0,
  status TEXT,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 26. Book Inventory table
CREATE TABLE IF NOT EXISTS book_inventory (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  name TEXT NOT NULL,
  stock NUMERIC DEFAULT 0,
  total_stock NUMERIC DEFAULT 0,
  cover_url TEXT,
  digital_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 27. Grades table
CREATE TABLE IF NOT EXISTS grades (
  student_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  sum1 NUMERIC DEFAULT 0,
  sum2 NUMERIC DEFAULT 0,
  sum3 NUMERIC DEFAULT 0,
  sum4 NUMERIC DEFAULT 0,
  sas NUMERIC DEFAULT 0,
  extra_data JSONB DEFAULT '{}'::jsonb,
  PRIMARY KEY (student_id, subject_id)
);

-- 28. Academic Calendar table
CREATE TABLE IF NOT EXISTS academic_calendar (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 29. Schedule table
CREATE TABLE IF NOT EXISTS schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 30. Graduates table
CREATE TABLE IF NOT EXISTS graduates (
  id TEXT PRIMARY KEY,
  nis TEXT,
  nisn TEXT,
  name TEXT NOT NULL,
  ijazah_number TEXT,
  status TEXT,
  graduation_year TEXT,
  continued_to TEXT,
  skl_url TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 31. Sumatifs table
CREATE TABLE IF NOT EXISTS sumatifs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  duration NUMERIC DEFAULT 60,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT FALSE,
  is_visible BOOLEAN DEFAULT TRUE,
  token TEXT,
  questions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 32. Sumatif Results table
CREATE TABLE IF NOT EXISTS sumatif_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sumatif_id UUID REFERENCES sumatifs(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  answers JSONB DEFAULT '{}',
  status_tes TEXT DEFAULT 'selesai',
  needs_grading BOOLEAN DEFAULT FALSE,
  manual_scores JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sumatif_id, student_id)
);

-- 33. Emergency Alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  triggered_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 34. Performance Assessments table
CREATE TABLE IF NOT EXISTS performance_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  teacher_name TEXT,
  supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  supervisor_name TEXT,
  date TIMESTAMPTZ DEFAULT now(),
  scores JSONB NOT NULL,
  reflection TEXT,
  total_score INTEGER,
  percentage NUMERIC,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 35. Learning Plans table
CREATE TABLE IF NOT EXISTS learning_plans (
  id TEXT PRIMARY KEY,
  school_name TEXT NOT NULL,
  compiler TEXT,
  nip TEXT,
  subject TEXT,
  topic TEXT,
  class_semester TEXT,
  academic_year TEXT,
  time_allocation TEXT,
  student_characteristics TEXT,
  profile_dimensions JSONB DEFAULT '[]'::jsonb,
  capaian_pembelajaran TEXT,
  learning_goals JSONB DEFAULT '[]'::jsonb,
  pendekatan TEXT,
  pendekatan_reason TEXT,
  model TEXT,
  model_reason TEXT,
  strategi TEXT,
  strategi_reason TEXT,
  metode JSONB DEFAULT '[]'::jsonb,
  metode_reason TEXT,
  lintas_disiplin TEXT,
  mitra TEXT,
  digital TEXT,
  lingkungan TEXT,
  kegiatan_awal JSONB DEFAULT '[]'::jsonb,
  kegiatan_inti JSONB DEFAULT '[]'::jsonb,
  kegiatan_penutup JSONB DEFAULT '[]'::jsonb,
  kegiatan_awal_title TEXT,
  kegiatan_inti_title TEXT,
  kegiatan_penutup_title TEXT,
  durasi_awal INTEGER,
  durasi_inti INTEGER,
  durasi_penutup INTEGER,
  asesmen_awal TEXT,
  asesmen_proses TEXT,
  asesmen_akhir TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_date TEXT,
  tempat_pengesahan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 36. Kokurikuler Plans (RPK) table
CREATE TABLE IF NOT EXISTS kokurikuler_plans (
  id TEXT PRIMARY KEY,
  identitas JSONB NOT NULL,
  analisis_kebutuhan JSONB NOT NULL,
  dimensi_profil JSONB DEFAULT '[]'::jsonb,
  tujuan_pembelajaran JSONB DEFAULT '[]'::jsonb,
  praktik_pedagogis TEXT,
  lingkungan_pembelajaran TEXT,
  pemanfaatan_digital TEXT,
  kemitraan JSONB NOT NULL,
  kegiatan JSONB DEFAULT '[]'::jsonb,
  asesmen JSONB NOT NULL,
  produk JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 37. Mail Records (Surat Menyurat) table
CREATE TABLE IF NOT EXISTS mail_records (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'masuk',
  letter_number TEXT NOT NULL,
  agenda_number TEXT,
  sender_or_recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  letter_date DATE,
  received_or_sent_date DATE,
  category TEXT DEFAULT 'Kedinasan',
  description TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'Selesai',
  class_id TEXT DEFAULT 'ALL',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DISABLE RLS for all tables
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(table_name) || ' DISABLE ROW LEVEL SECURITY';
        -- Optional: remove policies
    END LOOP;
END $$;

-- Insert default admin user
INSERT INTO users (username, password, role, full_name, class_id)
VALUES ('admin', '123456', 'admin', 'Administrator Utama', 'all')
ON CONFLICT (username) DO NOTHING;
