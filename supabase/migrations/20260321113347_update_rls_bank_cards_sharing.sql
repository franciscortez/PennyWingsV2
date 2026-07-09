
-- Drop existing SELECT policies on bank_cards (keep INSERT/UPDATE/DELETE as-is)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'bank_cards' AND cmd = 'SELECT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.bank_cards', pol.policyname);
    END LOOP;
END$$;

-- New SELECT policy: own OR accepted share
CREATE POLICY "view_own_or_shared_cards" ON public.bank_cards
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.account_shares
      WHERE resource_type = 'bank_card'
        AND resource_id = bank_cards.id
        AND shared_with_user_id = auth.uid()
        AND status = 'accepted'
    )
  );
;
