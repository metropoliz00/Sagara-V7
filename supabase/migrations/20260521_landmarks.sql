CREATE TABLE IF NOT EXISTS public.landmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    icon VARCHAR(50) DEFAULT '📍',
    color VARCHAR(50) DEFAULT 'bg-blue-500 text-white',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable read access for everyone" ON public.landmarks;
  CREATE POLICY "Enable read access for everyone" ON public.landmarks FOR SELECT USING (true);
  
  DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.landmarks;
  CREATE POLICY "Enable all access for authenticated users" ON public.landmarks FOR ALL TO authenticated USING (true) WITH CHECK (true);
END $$;
