-- Database Migration for Book Digital URL
ALTER TABLE book_inventory ADD COLUMN IF NOT EXISTS digital_url TEXT;

-- Migration for Tempat Pengesahan in Learning Plans
ALTER TABLE learning_plans ADD COLUMN IF NOT EXISTS tempat_pengesahan TEXT;

-- Table for Sumatifs
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
  token TEXT,
  questions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for Sumatif Results
CREATE TABLE IF NOT EXISTS sumatif_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sumatif_id UUID REFERENCES sumatifs(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  score NUMERIC DEFAULT 0,
  answers JSONB DEFAULT '{}',
  status_tes TEXT DEFAULT 'selesai',
  needs_grading BOOLEAN DEFAULT FALSE,
  manual_scores JSONB DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sumatif_id, student_id)
);
