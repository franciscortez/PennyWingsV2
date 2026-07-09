-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_bank_cards_user_id ON public.bank_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_e_wallets_user_id ON public.e_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON public.transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON public.budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);

-- Cleanup overlapping profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;

CREATE POLICY "Users can manage own profile" ON public.profiles
FOR ALL TO authenticated USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));

-- Update Categories policies
DROP POLICY IF EXISTS "Users can view categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;

CREATE POLICY "Users can view categories" ON public.categories
FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = (select auth.uid()));

CREATE POLICY "Users can manage own categories" ON public.categories
FOR ALL TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- Update remaining tables
DROP POLICY IF EXISTS "Users can manage own budgets" ON public.budgets;
CREATE POLICY "Users can manage own budgets" ON public.budgets
FOR ALL TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;
CREATE POLICY "Users can manage own goals" ON public.goals
FOR ALL TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can manage own cards" ON public.bank_cards;
CREATE POLICY "Users can manage own cards" ON public.bank_cards
FOR ALL TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can manage own wallets" ON public.e_wallets;
CREATE POLICY "Users can manage own wallets" ON public.e_wallets
FOR ALL TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions" ON public.transactions
FOR ALL TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));;
