
-- Create account_shares table
CREATE TABLE public.account_shares (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email   text NOT NULL,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resource_type       text NOT NULL CHECK (resource_type IN ('bank_card', 'e_wallet', 'budget')),
  resource_id         uuid NOT NULL,
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at          timestamptz DEFAULT timezone('utc', now()),
  updated_at          timestamptz DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.account_shares ENABLE ROW LEVEL SECURITY;

-- Owner can manage all their outgoing shares
CREATE POLICY "owner_manage_shares" ON public.account_shares
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Recipient can view their incoming shares
CREATE POLICY "recipient_view_shares" ON public.account_shares
  FOR SELECT
  USING (auth.uid() = shared_with_user_id);

-- Recipient can update (accept/reject) their incoming shares
CREATE POLICY "recipient_update_shares" ON public.account_shares
  FOR UPDATE
  USING (auth.uid() = shared_with_user_id)
  WITH CHECK (auth.uid() = shared_with_user_id);

-- RPC: Link pending shares to user by email on login
CREATE OR REPLACE FUNCTION public.map_share_user_id()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.account_shares
  SET 
    shared_with_user_id = auth.uid(),
    updated_at = now()
  WHERE 
    shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND shared_with_user_id IS NULL;
END;
$$;
;
