-- Update training_participants to support more guest details
ALTER TABLE public.training_participants ADD COLUMN IF NOT EXISTS guest_nip TEXT;
ALTER TABLE public.training_participants ADD COLUMN IF NOT EXISTS guest_position TEXT;

-- Re-create unique indexes for upsert stability
CREATE UNIQUE INDEX IF NOT EXISTS training_participants_training_user_idx ON public.training_participants (training_id, user_id) WHERE (user_id IS NOT NULL AND training_id IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS training_participants_event_user_idx ON public.training_participants (event_id, user_id) WHERE (user_id IS NOT NULL AND event_id IS NOT NULL);
