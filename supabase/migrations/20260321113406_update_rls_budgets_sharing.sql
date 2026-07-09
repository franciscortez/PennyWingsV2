
-- Drop existing SELECT policies on budgets
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'budgets' AND cmd = 'SELECT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.budgets', pol.policyname);
    END LOOP;
END$$;

-- New SELECT policy: own OR accepted share
CREATE POLICY "view_own_or_shared_budgets" ON public.budgets
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.account_shares
      WHERE resource_type = 'budget'
        AND resource_id = budgets.id
        AND shared_with_user_id = auth.uid()
        AND status = 'accepted'
    )
  );
;
