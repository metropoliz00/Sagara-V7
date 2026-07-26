-- Table for Guest Accounts
CREATE TABLE IF NOT EXISTS public.guest_accounts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- In a real app, this should be hashed
    name TEXT NOT NULL,
    nip TEXT,
    position TEXT,
    institution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.guest_accounts ENABLE ROW LEVEL SECURITY;

-- Simple Policies (adjust as needed for production)
CREATE POLICY "Public guest_accounts are viewable by everyone for login" 
ON public.guest_accounts FOR SELECT USING (true);

CREATE POLICY "Only admins can manage guest accounts" 
ON public.guest_accounts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'ketua_kkg')
  )
);

-- Update training_participants to link to guest_accounts
ALTER TABLE public.training_participants ADD COLUMN IF NOT EXISTS guest_account_id UUID REFERENCES public.guest_accounts(id) ON DELETE SET NULL;

-- Update training_certificates to support guest accounts
ALTER TABLE public.training_certificates ADD COLUMN IF NOT EXISTS guest_account_id UUID REFERENCES public.guest_accounts(id) ON DELETE SET NULL;

-- Unique and Upsert Support for Guest Accounts
CREATE UNIQUE INDEX IF NOT EXISTS training_participants_training_guest_idx ON public.training_participants (training_id, guest_account_id) WHERE (guest_account_id IS NOT NULL AND training_id IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS training_participants_event_guest_idx ON public.training_participants (event_id, guest_account_id) WHERE (guest_account_id IS NOT NULL AND event_id IS NOT NULL);
