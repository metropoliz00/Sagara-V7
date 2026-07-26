-- Update events table to support attendance
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_attendance_open BOOLEAN DEFAULT false;

-- Update training_participants to support events and guests
-- We rename the table to be more generic if possible, or just add the columns
ALTER TABLE public.training_participants ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.training_participants ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;
ALTER TABLE public.training_participants ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.training_participants ADD COLUMN IF NOT EXISTS guest_institution TEXT;

-- Adjust UNIQUE constraint (drop old, add new)
DO $$ BEGIN
    ALTER TABLE public.training_participants DROP CONSTRAINT IF EXISTS training_participants_training_id_user_id_key;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- For guests, we might not have a unique constraint on training_id + user_id if user_id is NULL
-- We should handle uniqueness in the app logic or add a more complex constraint.
