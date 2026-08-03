-- ============================================================================
-- SQL SCRIPT: SCHEMA JURNAL HARIAN 7 KAIH (7 Kebiasaan Anak Indonesia Hebat)
-- ============================================================================
-- Jalankan script ini di SQL Editor Supabase atau PostgreSQL Database Anda.

-- 1. Buat Tabel jurnal_kaih_harian jika belum ada
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

-- 2. Buat Indeks untuk Pencarian Cepat Berdasarkan Kelas, Siswa, dan Tanggal
CREATE INDEX IF NOT EXISTS idx_jurnal_kaih_class_date ON jurnal_kaih_harian (class_id, date);
CREATE INDEX IF NOT EXISTS idx_jurnal_kaih_student ON jurnal_kaih_harian (student_id);

-- 3. Kebijakan Keamanan Row Level Security (RLS) - Jika RLS diaktifkan
ALTER TABLE jurnal_kaih_harian ENABLE ROW LEVEL SECURITY;

-- Izinkan pembacaan & penulisan data untuk pengguna terautentikasi / anon (Sesuai Konfigurasi App)
CREATE POLICY "Allow all access to jurnal_kaih_harian" ON jurnal_kaih_harian
  FOR ALL USING (true) WITH CHECK (true);
