-- SQL for Guest Book and Pangkat/Golongan update

-- 1. Create guest_book table
CREATE TABLE IF NOT EXISTS guest_book (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_name TEXT NOT NULL,
  guest_nip TEXT,
  guest_pangkat TEXT,
  guest_institution TEXT,
  guest_position TEXT,
  purpose TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add pangkat_golongan and peran to guest_accounts
-- Note: Replace 'guest_accounts' with your actual guest table name if different
ALTER TABLE guest_accounts ADD COLUMN IF NOT EXISTS pangkat_golongan TEXT;
ALTER TABLE guest_accounts ADD COLUMN IF NOT EXISTS peran TEXT DEFAULT 'Tamu Undangan';

-- 3. Add is_open_for_guests to events and trainings
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_open_for_guests BOOLEAN DEFAULT FALSE;
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS is_open_for_guests BOOLEAN DEFAULT FALSE;

-- 4. Add guest_peran to guest_book
ALTER TABLE guest_book ADD COLUMN IF NOT EXISTS guest_peran TEXT;

-- 4. Enable RLS and add policies (optional but recommended)
ALTER TABLE guest_book ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to insert (guests and admins)
DROP POLICY IF EXISTS "Anyone can insert guest book entries" ON guest_book;
CREATE POLICY "Anyone can insert guest book entries" ON guest_book
  FOR INSERT WITH CHECK (true);

-- Allow admins to view entries (assuming roles are handled in user_profiles)
DROP POLICY IF EXISTS "Admins can view guest book" ON guest_book;
CREATE POLICY "Admins can view guest book" ON guest_book
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
