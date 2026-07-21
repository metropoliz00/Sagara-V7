-- Central Lookup & Warehousing Database Schema (SAGARA Central)
-- Run this in your CENTRAL (Pusat) Supabase database only.

CREATE TABLE IF NOT EXISTS school_databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code VARCHAR(50) UNIQUE NOT NULL,
  school_name VARCHAR(255) NOT NULL,
  supabase_url TEXT NOT NULL,
  supabase_anon_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on school_databases
ALTER TABLE school_databases DISABLE ROW LEVEL SECURITY;

-- Central superadmins table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  "fullName" VARCHAR(255) NOT NULL,
  "classId" VARCHAR(50),
  position VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default superadmin
INSERT INTO users (username, password, role, "fullName", position)
VALUES ('superadmin', 'superadmin123', 'superadmin', 'Administrator Pusat', 'Superadmin')
ON CONFLICT (username) DO NOTHING;

-- Multi-Tenant Synced School Tables for Central Warehousing
-- Each table matches its local equivalent but adds a 'school_code' partition key.

-- 1. Synced Users
CREATE TABLE IF NOT EXISTS synced_users (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  username TEXT NOT NULL,
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
  email TEXT,
  phone TEXT,
  address TEXT,
  photo TEXT,
  signature TEXT,
  student_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 2. Synced Class Config
CREATE TABLE IF NOT EXISTS synced_class_config (
  school_code VARCHAR(50) NOT NULL,
  class_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, class_id)
);

-- 3. Synced GTK Data
CREATE TABLE IF NOT EXISTS synced_gtk_data (
  school_code VARCHAR(50) NOT NULL,
  id TEXT NOT NULL,
  user_id UUID,
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
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 4. Synced Students
CREATE TABLE IF NOT EXISTS synced_students (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  class_id TEXT NOT NULL,
  nis TEXT NOT NULL,
  nisn TEXT,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 5. Synced Agendas
CREATE TABLE IF NOT EXISTS synced_agendas (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  class_id TEXT NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  type TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 6. Synced Materials
CREATE TABLE IF NOT EXISTS synced_materials (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 7. Synced Attendance
CREATE TABLE IF NOT EXISTS synced_attendance (
  school_code VARCHAR(50) NOT NULL,
  id TEXT NOT NULL,
  records JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 8. Synced Holidays
CREATE TABLE IF NOT EXISTS synced_holidays (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  class_id TEXT,
  date DATE NOT NULL,
  description TEXT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 9. Synced Counseling
CREATE TABLE IF NOT EXISTS synced_counseling (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 10. Synced Extracurriculars
CREATE TABLE IF NOT EXISTS synced_extracurriculars (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  schedule TEXT,
  coach TEXT,
  members JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 11. Synced Profiles
CREATE TABLE IF NOT EXISTS synced_profiles (
  school_code VARCHAR(50) NOT NULL,
  id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 12. Synced Inventory
CREATE TABLE IF NOT EXISTS synced_inventory (
  school_code VARCHAR(50) NOT NULL,
  id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  condition TEXT,
  qty NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 13. Synced Guests
CREATE TABLE IF NOT EXISTS synced_guests (
  school_code VARCHAR(50) NOT NULL,
  id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  name TEXT NOT NULL,
  agency TEXT,
  purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 14. Synced Penilaian Sikap
CREATE TABLE IF NOT EXISTS synced_penilaian_sikap (
  school_code VARCHAR(50) NOT NULL,
  student_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  keimanan NUMERIC DEFAULT 0,
  kewargaan NUMERIC DEFAULT 0,
  penalaran_kritis NUMERIC DEFAULT 0,
  kreativitas NUMERIC DEFAULT 0,
  kolaborasi NUMERIC DEFAULT 0,
  kemandirian NUMERIC DEFAULT 0,
  kesehatan NUMERIC DEFAULT 0,
  komunikasi NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, student_id)
);

-- 15. Synced Penilaian Karakter
CREATE TABLE IF NOT EXISTS synced_penilaian_karakter (
  school_code VARCHAR(50) NOT NULL,
  student_id TEXT NOT NULL,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, student_id)
);

-- 16. Synced Employment Links
CREATE TABLE IF NOT EXISTS synced_employment_links (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 17. Synced Learning Reports
CREATE TABLE IF NOT EXISTS synced_learning_reports (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  class_id TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT,
  subject TEXT,
  topic TEXT,
  document_link TEXT,
  teacher_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 18. Synced Jurnal Kelas
CREATE TABLE IF NOT EXISTS synced_jurnal_kelas (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  class_id TEXT NOT NULL,
  date DATE NOT NULL,
  day TEXT,
  content JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 19. Synced Buku Penghubung
CREATE TABLE IF NOT EXISTS synced_buku_penghubung (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  date DATE NOT NULL,
  sender TEXT,
  message TEXT,
  status TEXT,
  category TEXT,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 20. Synced Permission Requests
CREATE TABLE IF NOT EXISTS synced_permission_requests (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  class_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 21. Synced Support Documents
CREATE TABLE IF NOT EXISTS synced_support_documents (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 22. Synced Learning Documentation
CREATE TABLE IF NOT EXISTS synced_learning_documentation (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  class_id TEXT NOT NULL,
  nama_kegiatan TEXT NOT NULL,
  link_foto TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 23. Synced School Assets
CREATE TABLE IF NOT EXISTS synced_school_assets (
  school_code VARCHAR(50) NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  qty NUMERIC DEFAULT 0,
  condition TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 24. Synced BOS Management
CREATE TABLE IF NOT EXISTS synced_bos_management (
  school_code VARCHAR(50) NOT NULL,
  id TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT,
  category TEXT,
  description TEXT,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 25. Synced Book Loans
CREATE TABLE IF NOT EXISTS synced_book_loans (
  school_code VARCHAR(50) NOT NULL,
  id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT,
  class_id TEXT NOT NULL,
  books JSONB DEFAULT '[]',
  qty NUMERIC DEFAULT 0,
  status TEXT,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 26. Synced Book Inventory
CREATE TABLE IF NOT EXISTS synced_book_inventory (
  school_code VARCHAR(50) NOT NULL,
  id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  name TEXT NOT NULL,
  stock NUMERIC DEFAULT 0,
  total_stock NUMERIC DEFAULT 0,
  cover_url TEXT,
  digital_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 27. Synced Grades
CREATE TABLE IF NOT EXISTS synced_grades (
  school_code VARCHAR(50) NOT NULL,
  student_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  sum1 NUMERIC DEFAULT 0,
  sum2 NUMERIC DEFAULT 0,
  sum3 NUMERIC DEFAULT 0,
  sum4 NUMERIC DEFAULT 0,
  sas NUMERIC DEFAULT 0,
  extra_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, student_id, subject_id)
);

-- 28. Synced Academic Calendar
CREATE TABLE IF NOT EXISTS synced_academic_calendar (
  school_code VARCHAR(50) NOT NULL,
  id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 29. Synced Schedule
CREATE TABLE IF NOT EXISTS synced_schedule (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  class_id TEXT NOT NULL,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 30. Synced Graduates
CREATE TABLE IF NOT EXISTS synced_graduates (
  school_code VARCHAR(50) NOT NULL,
  id TEXT NOT NULL,
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
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 31. Synced Sumatifs
CREATE TABLE IF NOT EXISTS synced_sumatifs (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 32. Synced Sumatif Results
CREATE TABLE IF NOT EXISTS synced_sumatif_results (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  sumatif_id UUID,
  student_id TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  answers JSONB DEFAULT '{}',
  status_tes TEXT DEFAULT 'selesai',
  needs_grading BOOLEAN DEFAULT FALSE,
  manual_scores JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 33. Synced Emergency Alerts
CREATE TABLE IF NOT EXISTS synced_emergency_alerts (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  triggered_by UUID,
  triggered_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 34. Synced Performance Assessments
CREATE TABLE IF NOT EXISTS synced_performance_assessments (
  school_code VARCHAR(50) NOT NULL,
  id UUID NOT NULL,
  teacher_id UUID,
  teacher_name TEXT,
  supervisor_id UUID,
  supervisor_name TEXT,
  date TIMESTAMPTZ DEFAULT now(),
  scores JSONB NOT NULL,
  reflection TEXT,
  total_score INTEGER,
  percentage NUMERIC,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 35. Synced Learning Plans
CREATE TABLE IF NOT EXISTS synced_learning_plans (
  school_code VARCHAR(50) NOT NULL,
  id TEXT NOT NULL,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- 36. Synced Kokurikuler Plans
CREATE TABLE IF NOT EXISTS synced_kokurikuler_plans (
  school_code VARCHAR(50) NOT NULL,
  id TEXT NOT NULL,
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
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (school_code, id)
);

-- DISABLE RLS for all central tables to allow easy cross-school queries by authorized services
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename LIKE 'synced_%'
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(table_name) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;
