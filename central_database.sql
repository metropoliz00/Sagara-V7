-- Central Lookup Database Schema
-- Run this in your CENTRAL (Pusat) Supabase database only.

CREATE TABLE IF NOT EXISTS school_databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code VARCHAR(50) UNIQUE NOT NULL,
  school_name VARCHAR(255) NOT NULL,
  supabase_url TEXT NOT NULL,
  supabase_anon_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE school_databases DISABLE ROW LEVEL SECURITY;

-- Create a basic users table for the central database so the superadmin can login
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  "fullName" VARCHAR(255) NOT NULL,
  "classId" VARCHAR(50),
  position VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default superadmin
INSERT INTO users (username, password, role, "fullName", position)
VALUES ('superadmin', 'superadmin123', 'superadmin', 'Administrator Pusat', 'Superadmin')
ON CONFLICT (username) DO NOTHING;
