begin;
select plan(6);

-- 1. Check RLS is enabled on public.transactions
select ok(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'transactions'),
  'RLS should be enabled on transactions'
);

-- 2. Check RLS is enabled on public.bank_cards
select ok(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'bank_cards'),
  'RLS should be enabled on bank_cards'
);

-- 3. Check RLS is enabled on public.e_wallets
select ok(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'e_wallets'),
  'RLS should be enabled on e_wallets'
);

-- 4. Check RLS is enabled on public.categories
select ok(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'categories'),
  'RLS should be enabled on categories'
);

-- 5. Check RLS is enabled on public.account_memberships
select ok(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'account_memberships'),
  'RLS should be enabled on account_memberships'
);

-- 6. Check RLS is enabled on public.joint_account_invites
select ok(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'joint_account_invites'),
  'RLS should be enabled on joint_account_invites'
);

select * from finish();
rollback;
