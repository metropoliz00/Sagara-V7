-- Change events category to text to support custom inputs
ALTER TABLE public.events ALTER COLUMN category TYPE TEXT USING category::text;

-- Update existing references if needed or we can drop the enum type if no longer used.
-- DROP TYPE IF EXISTS event_category;
