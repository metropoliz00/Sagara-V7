-- Fix missing tables for KKG Gugus 3 Melati

-- 1. Pelatihan Table (if not exists)
CREATE TABLE IF NOT EXISTS public.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date_start TIMESTAMP WITH TIME ZONE,
  date_end TIMESTAMP WITH TIME ZONE,
  location TEXT,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Training Participants Table (The one causing the error)
CREATE TABLE IF NOT EXISTS public.training_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    training_id UUID REFERENCES public.trainings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    attended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Training Attendance Table (Legacy/Alternate)
CREATE TABLE IF NOT EXISTS public.training_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES public.trainings(id) ON DELETE CASCADE,
  user_id UUID DEFAULT auth.uid(),
  check_in TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'present'
);

-- 4. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    user_name TEXT,
    user_role TEXT,
    action TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Security Policies (RLS)
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 1. Trainings policies
DROP POLICY IF EXISTS "Public view trainings" ON public.trainings;
CREATE POLICY "Public view trainings" ON public.trainings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin manage trainings" ON public.trainings;
CREATE POLICY "Admin manage trainings" ON public.trainings FOR ALL USING (true);

-- 2. Training Participants policies
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.training_participants;
CREATE POLICY "Users can view their own registrations" ON public.training_participants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can register themselves" ON public.training_participants;
CREATE POLICY "Users can register themselves" ON public.training_participants FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own attendance" ON public.training_participants;
CREATE POLICY "Users can update their own attendance" ON public.training_participants FOR UPDATE USING (true);

-- 3. Training Attendance policies
DROP POLICY IF EXISTS "Users can view their own attendance" ON public.training_attendance;
CREATE POLICY "Users can view their own attendance" ON public.training_attendance FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can mark presence" ON public.training_attendance;
CREATE POLICY "Users can mark presence" ON public.training_attendance FOR INSERT WITH CHECK (true);

-- 4. Activity Logs policies
DROP POLICY IF EXISTS "Admins can view logs" ON public.activity_logs;
CREATE POLICY "Admins can view logs" ON public.activity_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow system insert" ON public.activity_logs;
CREATE POLICY "Allow system insert" ON public.activity_logs FOR INSERT WITH CHECK (true);
