-- ==============================================================================
-- SQL MIGRATION: Menambahkan Kolom Rincian Materi Pokok (materials) pada Tabel learning_plans
-- ==============================================================================
-- Jalankan query berikut di Supabase SQL Editor pada database sekolah Anda:

-- 1. Tambahkan kolom materials bertipe JSONB jika belum ada
ALTER TABLE learning_plans 
ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb;

-- 2. (Opsional) Migrasi data lama: isi kolom materials dari data topic yang sudah ada
UPDATE learning_plans 
SET materials = jsonb_build_array(topic)
WHERE (materials IS NULL OR materials = '[]'::jsonb)
  AND topic IS NOT NULL 
  AND trim(topic) != '';
