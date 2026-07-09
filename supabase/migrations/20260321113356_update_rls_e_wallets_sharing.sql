
-- Drop existing SELECT policies on e_wallets
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'e_wallets' AND cmd = 'SELECT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.e_wallets', pol.policyname);
    END LOOP;
END$$;

-- New SELECT policy: own OR accepted share
CREATE POLICY "view_own_or_shared_wallets" ON public.e_wallets
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.account_shares
      WHERE resource_type = 'e_wallet'
        AND resource_id = e_wallets.id
        AND shared_with_user_id = auth.uid()
        AND status = 'accepted'
    )
  );
;
