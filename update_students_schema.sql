-- Migration Script: Update Students Table Schema (Dapodik Standard)
-- Jalankan query ini di SQL Editor Supabase Anda.
-- Script ini AMAN dan TIDAK MENGHAPUS data yang sudah ada di database (menggunakan ADD COLUMN IF NOT EXISTS).

ALTER TABLE students ADD COLUMN IF NOT EXISTS rt TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS rw TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS dusun TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS kelurahan TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS kecamatan TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS kode_pos TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS jenis_tinggal TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS alat_transportasi TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS telepon TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS hp TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS skhun TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS penerima_kps TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS no_kps TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_birth_year TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_income TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_nik TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_birth_year TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_income TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_nik TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_birth_year TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_education TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_income TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_nik TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS rombel TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS no_ujian_nasional TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS no_seri_ijazah TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS penerima_kip TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS nomor_kip TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS nama_di_kip TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS nomor_kks TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS no_registrasi_akta_lahir TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS bank TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS nomor_rekening_bank TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS rekening_atas_nama TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS layak_pip TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS alasan_layak_pip TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS kebutuhan_khusus TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS sekolah_asal TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS anak_ke TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS lintang TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS bujur TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS no_kk TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS lingkar_kepala NUMERIC DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS jml_saudara_kandung NUMERIC DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS jarak_rumah_km NUMERIC DEFAULT 0;

-- Sinkronkan data rombel dengan class_id (agar otomatis sama / sinkron)
UPDATE students SET rombel = class_id WHERE (rombel IS NULL OR rombel = '') AND class_id IS NOT NULL;
UPDATE students SET class_id = rombel WHERE (class_id IS NULL OR class_id = '') AND rombel IS NOT NULL;
