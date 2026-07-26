-- Add extra rich fields to the landmarks table
ALTER TABLE public.landmarks ADD COLUMN IF NOT EXISTS embed_code TEXT;
ALTER TABLE public.landmarks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.landmarks ADD COLUMN IF NOT EXISTS image_url TEXT;
