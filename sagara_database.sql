-- ==============================================================================
-- DATABASE SAGARA - UNIFIED SINGLE DATABASE SCHEMA
-- ==============================================================================
-- Skema Database Tunggal (Unified) untuk Aplikasi SAGARA.
-- Menggabungkan seluruh tabel Pusat dan Sekolah ke dalam satu Database SAGARA.
-- Jalankan seluruh script SQL ini di Supabase SQL Editor Database SAGARA Anda.
-- ==============================================================================

-- 1. Tabel Registrasi Database & Metadata Sekolah (Eks Database Pusat)
CREATE TABLE IF NOT EXISTS school_databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code VARCHAR(50) UNIQUE NOT NULL,
  school_name VARCHAR(255) NOT NULL,
  supabase_url TEXT NOT NULL,
  supabase_anon_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Pengguna (Users) - Mendukung Superadmin, Admin, Guru, KS, Siswa
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

-- 3. Tabel Konfigurasi Kelas
CREATE TABLE IF NOT EXISTS class_config (
  class_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel Data GTK (Guru dan Tenaga Kependidikan)
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

-- 5. Tabel Data Siswa
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  buku_induk TEXT,
  nisn TEXT,
  nik TEXT,
  name TEXT NOT NULL,
  gender TEXT,
  birth_place TEXT,
  birth_date DATE,
  religion TEXT,
  address TEXT,
  rt TEXT,
  rw TEXT,
  dusun TEXT,
  kelurahan TEXT,
  kecamatan TEXT,
  kode_pos TEXT,
  jenis_tinggal TEXT,
  alat_transportasi TEXT,
  telepon TEXT,
  hp TEXT,
  email TEXT,
  skhun TEXT,
  penerima_kps TEXT,
  no_kps TEXT,
  father_name TEXT,
  father_birth_year TEXT,
  father_education TEXT,
  father_job TEXT,
  father_income TEXT,
  father_nik TEXT,
  mother_name TEXT,
  mother_birth_year TEXT,
  mother_education TEXT,
  mother_job TEXT,
  mother_income TEXT,
  mother_nik TEXT,
  parent_name TEXT,
  guardian_birth_year TEXT,
  guardian_education TEXT,
  parent_job TEXT,
  guardian_income TEXT,
  guardian_nik TEXT,
  parent_phone TEXT,
  rombel TEXT,
  no_ujian_nasional TEXT,
  no_seri_ijazah TEXT,
  penerima_kip TEXT,
  nomor_kip TEXT,
  nama_di_kip TEXT,
  nomor_kks TEXT,
  no_registrasi_akta_lahir TEXT,
  bank TEXT,
  nomor_rekening_bank TEXT,
  rekening_atas_nama TEXT,
  layak_pip TEXT,
  alasan_layak_pip TEXT,
  kebutuhan_khusus TEXT,
  sekolah_asal TEXT,
  anak_ke TEXT,
  lintang TEXT,
  bujur TEXT,
  no_kk TEXT,
  weight NUMERIC DEFAULT 0,
  height NUMERIC DEFAULT 0,
  lingkar_kepala NUMERIC DEFAULT 0,
  jml_saudara_kandung NUMERIC DEFAULT 0,
  jarak_rumah_km NUMERIC DEFAULT 0,
  blood_type TEXT,
  health_notes TEXT,
  hobbies TEXT,
  ambition TEXT,
  economy_status TEXT,
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

-- 6. Tabel Agenda Kelas
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

-- 7. Tabel Materi Pembelajaran
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

-- 8. Tabel Presensi / Absensi
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  records JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Tabel Hari Libur & Kalender
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT,
  date DATE NOT NULL,
  description TEXT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Tabel Bimbingan Konseling & Pelanggaran
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

-- 11. Tabel Ekstrakurikuler
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

-- 12. Tabel Profil Aplikasi & Sekolah
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Tabel Inventaris Kelas
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  condition TEXT,
  qty NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Tabel Buku Tamu
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

-- 15. Tabel Penilaian Sikap (DPL)
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

-- 16. Tabel Penilaian Karakter (7 KAIH)
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

-- 17. Tabel Jurnal Harian 7 KAIH Siswa
CREATE TABLE IF NOT EXISTS jurnal_kaih_harian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  date DATE NOT NULL,
  bangun_pagi TEXT DEFAULT 'Belum Terbiasa',
  beribadah TEXT DEFAULT 'Belum Terbiasa',
  berolahraga TEXT DEFAULT 'Belum Terbiasa',
  makan_sehat TEXT DEFAULT 'Belum Terbiasa',
  gemar_belajar TEXT DEFAULT 'Belum Terbiasa',
  bermasyarakat TEXT DEFAULT 'Belum Terbiasa',
  tidur_awal TEXT DEFAULT 'Belum Terbiasa',
  catatan TEXT,
  catatan_guru TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_student_kaih_date UNIQUE (student_id, date)
);

-- 18. Tabel Tautan Aplikasi Terintegrasi
CREATE TABLE IF NOT EXISTS employment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. Tabel Laporan Pembelajaran
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

-- 20. Tabel Jurnal Kelas
CREATE TABLE IF NOT EXISTS jurnal_kelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  date DATE NOT NULL,
  day TEXT,
  content JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_id, date)
);

-- 21. Tabel Buku Penghubung
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

-- 22. Tabel Permohonan Izin Siswa
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

-- 23. Tabel Dokumen Bukti Dukung
CREATE TABLE IF NOT EXISTS support_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 24. Tabel Dokumentasi Pembelajaran
CREATE TABLE IF NOT EXISTS learning_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  nama_kegiatan TEXT NOT NULL,
  link_foto TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 25. Tabel Sarana & Prasarana Sekolah
CREATE TABLE IF NOT EXISTS school_assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  qty NUMERIC DEFAULT 0,
  condition TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 26. Tabel Pengelolaan Dana BOS
CREATE TABLE IF NOT EXISTS bos_management (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT,
  category TEXT,
  description TEXT,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 27. Tabel Peminjaman Buku Perpustakaan
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

-- 28. Tabel Inventaris Buku Perpustakaan
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

-- 29. Tabel Nilai & Rapor
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

-- 30. Tabel Kalender Akademik
CREATE TABLE IF NOT EXISTS academic_calendar (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 31. Tabel Jadwal Pelajaran
CREATE TABLE IF NOT EXISTS schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id TEXT NOT NULL,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 32. Tabel Data Lulusan / Alumni
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

-- 33. Tabel Soal & Ujian Sumatif
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
  show_score BOOLEAN DEFAULT TRUE,
  token TEXT,
  questions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 34. Tabel Hasil Pengerjaan Sumatif Siswa
CREATE TABLE IF NOT EXISTS sumatif_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sumatif_id UUID REFERENCES sumatifs(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  answers JSONB DEFAULT '{}',
  status_tes TEXT DEFAULT 'selesai',
  needs_grading BOOLEAN DEFAULT FALSE,
  manual_scores JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sumatif_id, student_id)
);

-- 35. Tabel Tanggap Darurat / Emergency Alerts
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  triggered_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 36. Tabel Penilaian Kinerja Guru (Supervisi KS)
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

-- 37. Tabel Rencana Pembelajaran Mingguan (RPM)
CREATE TABLE IF NOT EXISTS learning_plans (
  id TEXT PRIMARY KEY,
  school_name TEXT NOT NULL,
  compiler TEXT,
  nip TEXT,
  subject TEXT,
  topic TEXT,
  materials JSONB DEFAULT '[]'::jsonb,
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

CREATE INDEX IF NOT EXISTS idx_learning_plans_created_at ON learning_plans (created_at DESC);

-- 38. Tabel Rencana Projek Kokurikuler (RPK)
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

-- 39. Tabel Pengarsipan Surat Menyurat
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

-- 40. Tabel Permohonan Izin Pegawai / GTK
CREATE TABLE IF NOT EXISTS staff_leave_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  nip TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  pangkat TEXT NOT NULL,
  kategori_ijin TEXT NOT NULL,
  tanggal_mulai TIMESTAMP WITH TIME ZONE NOT NULL,
  tanggal_selesai TIMESTAMP WITH TIME ZONE NOT NULL,
  alasan TEXT NOT NULL,
  status TEXT DEFAULT 'Menunggu',
  rejection_reason TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 41. Tabel Topik & Asesmen Formatif
CREATE TABLE IF NOT EXISTS formatif_topics (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  title TEXT NOT NULL,
  assessment_type TEXT NOT NULL DEFAULT 'Observasi',
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 42. Tabel Nilai Formatif Siswa
CREATE TABLE IF NOT EXISTS formatif_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT REFERENCES formatif_topics(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- NONAKTIFKAN ROW LEVEL SECURITY (RLS) AGAR AKSES SEMPURNA
-- ==============================================================================
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
    END LOOP;
END $$;

-- ==============================================================================
-- SEED DATA DEFAULT (AKUN UTAMA & PROFIL AWAL)
-- ==============================================================================

-- Superadmin & Admin Akun
INSERT INTO users (username, password, role, full_name, class_id, position)
VALUES 
  ('superadmin', 'superadmin123', 'superadmin', 'Administrator Pusat', 'ALL', 'Superadmin Pusat'),
  ('admin', '123456', 'admin', 'Administrator Utama', 'ALL', 'Admin Sekolah')
ON CONFLICT (username) DO NOTHING;

-- Default Profile jika belum ada
INSERT INTO profiles (id, data)
VALUES (
  'school_profile',
  '{
    "name": "SAGARA School",
    "npsn": "12345678",
    "address": "Jl. Pendidikan Nasional No. 1",
    "headmaster": "Kepala Sekolah, M.Pd",
    "headmasterNip": "197501012000031001",
    "year": "2024/2025",
    "semester": "1",
    "primaryColor": "#5AB2FF"
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
