-- SQL Migration for Rencana Projek Kokurikuler (RPK) / Kokurikuler Plans
-- Jalankan skrip ini di Supabase SQL Editor Anda untuk membuat tabel kokurikuler_plans

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

-- Nonaktifkan RLS agar dapat dibaca/ditulis tanpa kendala policy
ALTER TABLE kokurikuler_plans DISABLE ROW LEVEL SECURITY;
