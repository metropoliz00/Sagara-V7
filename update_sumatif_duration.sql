-- ==============================================================================
-- SQL MIGRATION: Menambahkan Kolom Durasi & Waktu Mulai Pengerjaan Sumatif
-- ==============================================================================
-- Jalankan query berikut di Supabase SQL Editor pada database sekolah Anda:

-- 1. Tambahkan kolom started_at (waktu mulai tes) jika belum ada
ALTER TABLE sumatif_results 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now();

-- 2. Tambahkan kolom created_at jika belum ada
ALTER TABLE sumatif_results 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3. (Opsional) Mengisi waktu mulai data lama yang masih kosong
UPDATE sumatif_results 
SET started_at = submitted_at 
WHERE started_at IS NULL AND submitted_at IS NOT NULL;
