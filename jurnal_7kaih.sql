-- ============================================================================
-- SQL SCRIPT: SCHEMA JURNAL HARIAN 7 KAIH (7 Kebiasaan Anak Indonesia Hebat)
-- ============================================================================
-- Jalankan script ini di SQL Editor Supabase atau PostgreSQL Database Anda.

-- 1. Buat Tabel jurnal_kaih_harian jika belum ada (Default status dikosongkan '')
CREATE TABLE IF NOT EXISTS jurnal_kaih_harian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  date DATE NOT NULL,
  bangun_pagi TEXT DEFAULT '',
  beribadah TEXT DEFAULT '',
  berolahraga TEXT DEFAULT '',
  makan_sehat TEXT DEFAULT '',
  gemar_belajar TEXT DEFAULT '',
  bermasyarakat TEXT DEFAULT '',
  tidur_awal TEXT DEFAULT '',
  catatan TEXT,
  catatan_guru TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_student_kaih_date UNIQUE (student_id, date)
);

-- 2. Migrasi/Aplikasi Kolom Baru & Penyesuaian Default jika Tabel Sudah Ada
ALTER TABLE jurnal_kaih_harian ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE jurnal_kaih_harian ALTER COLUMN bangun_pagi SET DEFAULT '';
ALTER TABLE jurnal_kaih_harian ALTER COLUMN beribadah SET DEFAULT '';
ALTER TABLE jurnal_kaih_harian ALTER COLUMN berolahraga SET DEFAULT '';
ALTER TABLE jurnal_kaih_harian ALTER COLUMN makan_sehat SET DEFAULT '';
ALTER TABLE jurnal_kaih_harian ALTER COLUMN gemar_belajar SET DEFAULT '';
ALTER TABLE jurnal_kaih_harian ALTER COLUMN bermasyarakat SET DEFAULT '';
ALTER TABLE jurnal_kaih_harian ALTER COLUMN tidur_awal SET DEFAULT '';

-- 3. Buat Indeks untuk Pencarian Cepat Berdasarkan Kelas, Siswa, dan Tanggal
CREATE INDEX IF NOT EXISTS idx_jurnal_kaih_class_date ON jurnal_kaih_harian (class_id, date);
CREATE INDEX IF NOT EXISTS idx_jurnal_kaih_student ON jurnal_kaih_harian (student_id);

-- 4. Kebijakan Keamanan Row Level Security (RLS) - Jika RLS diaktifkan
ALTER TABLE jurnal_kaih_harian ENABLE ROW LEVEL SECURITY;

-- Izinkan pembacaan & penulisan data untuk pengguna terautentikasi / anon
DROP POLICY IF EXISTS "Allow all access to jurnal_kaih_harian" ON jurnal_kaih_harian;
CREATE POLICY "Allow all access to jurnal_kaih_harian" ON jurnal_kaih_harian
  FOR ALL USING (true) WITH CHECK (true);

