
-- Drop existing SELECT policies on transactions
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'transactions' AND cmd = 'SELECT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.transactions', pol.policyname);
    END LOOP;
END$$;

-- New SELECT policy: own transactions OR transactions belonging to shared accounts
CREATE POLICY "view_own_or_shared_transactions" ON public.transactions
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      card_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.account_shares
        WHERE resource_type = 'bank_card' AND resource_id = transactions.card_id AND shared_with_user_id = auth.uid() AND status = 'accepted'
      )
    )
    OR (
      wallet_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.account_shares
        WHERE resource_type = 'e_wallet' AND resource_id = transactions.wallet_id AND shared_with_user_id = auth.uid() AND status = 'accepted'
      )
    )
  );
;
