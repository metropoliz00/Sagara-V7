-- ==============================================================================
-- SQL MIGRATION: Menambahkan Kolom Rincian Materi Pokok (materials) & Index pada Tabel learning_plans
-- ==============================================================================
-- Jalankan query berikut di Supabase SQL Editor pada database sekolah Anda:

-- 1. Tambahkan kolom materials bertipe JSONB jika belum ada
ALTER TABLE learning_plans 
ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb;

-- 2. Buat index pada kolom created_at agar query ORDER BY created_at DESC berjalan cepat dan tidak timeout
CREATE INDEX IF NOT EXISTS idx_learning_plans_created_at ON learning_plans (created_at DESC);

-- 3. (Opsional) Migrasi data lama: isi kolom materials dari data topic yang sudah ada
UPDATE learning_plans 
SET materials = jsonb_build_array(topic)
WHERE (materials IS NULL OR materials = '[]'::jsonb)
  AND topic IS NOT NULL 
  AND trim(topic) != '';

-- 4. (Jika terjadi error statement timeout): Hentikan proses/transaksi yang menggantung di Supabase
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE query ILIKE '%learning_plans%' 
  AND pid <> pg_backend_pid() 
  AND state IN ('active', 'idle in transaction');
