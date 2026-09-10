-- ==============================================================================
-- SQL MIGRATION: Menambahkan Kolom Toggle Tampilkan Nilai Siswa Pada Sumatif
-- ==============================================================================
-- Jalankan query berikut di Supabase SQL Editor pada database sekolah Anda:

-- 1. Tambahkan kolom show_score pada tabel sumatifs jika belum ada
ALTER TABLE sumatifs 
ADD COLUMN IF NOT EXISTS show_score BOOLEAN DEFAULT TRUE;

-- 2. Pastikan data lama memiliki nilai default TRUE
UPDATE sumatifs 
SET show_score = TRUE 
WHERE show_score IS NULL;
