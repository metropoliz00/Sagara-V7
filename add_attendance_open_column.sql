ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS is_attendance_open BOOLEAN DEFAULT false;
