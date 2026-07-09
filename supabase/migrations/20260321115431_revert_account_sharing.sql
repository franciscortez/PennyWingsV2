DROP POLICY IF EXISTS "view_own_or_shared_cards" ON public.bank_cards;
DROP POLICY IF EXISTS "view_own_or_shared_budgets" ON public.budgets;
DROP POLICY IF EXISTS "view_own_or_shared_wallets" ON public.e_wallets;
DROP POLICY IF EXISTS "view_own_or_shared_transactions" ON public.transactions;
DROP TABLE IF EXISTS public.account_shares CASCADE;;
