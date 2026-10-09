begin;
select plan(48);

-- Fixture users
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'debt-owner-91@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000092', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'debt-stranger-92@example.test', '', now(), now(), now());

-- Fixture accounts for user 91
insert into public.bank_cards (id, user_id, card_name, card_type, balance, is_active, status)
values ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000091', 'BDO Debit', 'debit', 5000, true, 'active');

insert into public.e_wallets (id, user_id, wallet_name, wallet_type, balance, is_active, status)
values
  ('00000000-0000-0000-0000-000000000912', '00000000-0000-0000-0000-000000000091', 'GCash', 'gcash', 2000, true, 'active'),
  ('00000000-0000-0000-0000-000000000913', '00000000-0000-0000-0000-000000000091', 'Lent Wallet', 'lent', 10000, true, 'active'),
  ('00000000-0000-0000-0000-000000000914', '00000000-0000-0000-0000-000000000091', 'Cash', 'cash', 2000, true, 'active');

-- An ordinary expense must survive repayments and reversals unchanged.
-- Account fixtures represent balances after this existing expense.
insert into public.transactions (
  id, user_id, card_id, type, payment_method, amount, description, transaction_date
) values (
  '00000000-0000-0000-0000-000000000915', '00000000-0000-0000-0000-000000000091',
  '00000000-0000-0000-0000-000000000911', 'expense', 'card', 100, 'Ordinary expense', '2026-10-01'
);

-- Run as user 91
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000091';
set local role authenticated;

-- Test 1: create_debt_checked
select public.create_debt_checked(
  p_provider_name => 'Atome',
  p_debt_type => 'bnpl',
  p_original_amount => 3000,
  p_due_date => '2026-10-31',
  p_note => 'Gadget purchase'
);

reset role;
select is((select count(*)::int from public.debts where user_id = '00000000-0000-0000-0000-000000000091'), 1, 'debt created for user 91');
select is((select outstanding_amount from public.debts where user_id = '00000000-0000-0000-0000-000000000091'), 3000::numeric, 'debt initial outstanding amount equals original');
select is((select status from public.debts where user_id = '00000000-0000-0000-0000-000000000091'), 'outstanding', 'debt initial status is outstanding');

-- Test 2: RLS isolation for user 92
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000092';
set local role authenticated;
select is((select count(*)::int from public.debts), 0, 'user 92 cannot view user 91 debts');

-- Test 3: Rejections (Overpayment, insufficient balance, lent account)
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000091';
set local role authenticated;

select throws_ok(
  $$
    select public.pay_debt_checked(
      p_debt_id => (select id from public.debts where user_id = '00000000-0000-0000-0000-000000000091' limit 1),
      p_amount => 3500,
      p_payment_method => 'card',
      p_card_id => '00000000-0000-0000-0000-000000000911'
    )
  $$,
  '22023',
  'Payment amount exceeds remaining debt balance.',
  'overpayment is rejected'
);

select throws_ok(
  $$
    select public.pay_debt_checked(
      p_debt_id => (select id from public.debts where user_id = '00000000-0000-0000-0000-000000000091' limit 1),
      p_amount => 2500,
      p_payment_method => 'ewallet',
      p_wallet_id => '00000000-0000-0000-0000-000000000912'
    )
  $$,
  'P0001',
  'Insufficient balance.',
  'insufficient balance is rejected'
);

select throws_ok(
  $$
    select public.pay_debt_checked(
      p_debt_id => (select id from public.debts where user_id = '00000000-0000-0000-0000-000000000091' limit 1),
      p_amount => 1000,
      p_payment_method => 'ewallet',
      p_wallet_id => '00000000-0000-0000-0000-000000000913'
    )
  $$,
  'P0002',
  'Source account was not found or is inactive.',
  'lent wallet is rejected'
);

-- Test 4: Partial repayment
reset role;
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000911'), 5000::numeric, 'rejected payments leave card balance unchanged');
select is((select balance from public.e_wallets where id = '00000000-0000-0000-0000-000000000912'), 2000::numeric, 'insufficient funds leave wallet balance unchanged');
select is((select outstanding_amount from public.debts where user_id = '00000000-0000-0000-0000-000000000091'), 3000::numeric, 'rejected payments leave debt unchanged');
select is((select count(*)::int from public.debt_payments where user_id = '00000000-0000-0000-0000-000000000091'), 0, 'rejected payments leave no payment history');
select is((select count(*)::int from public.transactions where user_id = '00000000-0000-0000-0000-000000000091'), 1, 'rejected payments create no transactions');
select is((select sum(amount) from public.transactions where user_id = '00000000-0000-0000-0000-000000000091' and type = 'expense'), 100::numeric, 'rejected payments leave ordinary spending unchanged');
set local role authenticated;

select public.pay_debt_checked(
  p_debt_id => (select id from public.debts where user_id = '00000000-0000-0000-0000-000000000091' limit 1),
  p_amount => 1000,
  p_payment_method => 'card',
  p_card_id => '00000000-0000-0000-0000-000000000911',
  p_payment_date => '2026-10-15',
  p_note => 'First installment'
);

reset role;
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000911'), 4000::numeric, 'source card balance deducted 1000');
select is((select outstanding_amount from public.debts where user_id = '00000000-0000-0000-0000-000000000091'), 2000::numeric, 'debt outstanding reduced to 2000');
select is((select status from public.debts where user_id = '00000000-0000-0000-0000-000000000091'), 'outstanding', 'debt status remains outstanding on partial payment');
select is((select count(*)::int from public.debt_payments where user_id = '00000000-0000-0000-0000-000000000091'), 1, 'debt payment audit record created');
select is((select count(*)::int from public.transactions where user_id = '00000000-0000-0000-0000-000000000091'), 2, 'partial card repayment creates one expense transaction');
select is((select sum(amount) from public.transactions where user_id = '00000000-0000-0000-0000-000000000091' and type = 'expense'), 1100::numeric, 'partial card repayment adds its amount to expenses');
select is((select amount from public.transactions where debt_payment_id = (select id from public.debt_payments where amount = 1000)), 1000::numeric, 'expense links to the exact repayment');
select is((select transaction_date from public.transactions where debt_payment_id = (select id from public.debt_payments where amount = 1000)), '2026-10-15'::date, 'expense uses repayment date');
select is((select name from public.categories where id = (select category_id from public.transactions where debt_payment_id = (select id from public.debt_payments where amount = 1000))), 'Debt Repayment', 'expense has a repayment category');
select is(has_table_privilege('authenticated', 'public.debt_payments', 'INSERT'), false, 'direct payment inserts cannot bypass checked RPC');

set local role authenticated;
select throws_ok(
  $$select public.delete_transaction((select id from public.transactions where debt_payment_id is not null limit 1))$$,
  '42501', 'Debt repayments must be reversed through Debts.', 'transaction deletion cannot bypass debt reversal'
);
select throws_ok(
  $$update public.transactions set amount = 25 where debt_payment_id is not null$$,
  '42501', 'Debt repayments must be managed through Debts.', 'direct transaction editing cannot alter a repayment'
);
reset role;
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000911'), 4000::numeric, 'rejected ledger edits leave balance unchanged');

-- Test 5: Full repayment
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000091';
set local role authenticated;

select public.pay_debt_checked(
  p_debt_id => (select id from public.debts where user_id = '00000000-0000-0000-0000-000000000091' limit 1),
  p_amount => 2000,
  p_payment_method => 'card',
  p_card_id => '00000000-0000-0000-0000-000000000911',
  p_payment_date => '2026-10-20',
  p_note => 'Final settlement'
);

reset role;
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000911'), 2000::numeric, 'source card balance deducted 2000');
select is((select outstanding_amount from public.debts where user_id = '00000000-0000-0000-0000-000000000091'), 0::numeric, 'debt outstanding is zero');
select is((select status from public.debts where user_id = '00000000-0000-0000-0000-000000000091'), 'paid', 'debt status marked paid');
select is((select paid_at is not null from public.debts where user_id = '00000000-0000-0000-0000-000000000091'), true, 'paid_at timestamp populated');
select is((select count(*)::int from public.transactions where user_id = '00000000-0000-0000-0000-000000000091'), 3, 'full card repayment creates one additional expense transaction');
select is((select sum(amount) from public.transactions where user_id = '00000000-0000-0000-0000-000000000091' and type = 'expense'), 3100::numeric, 'full card repayment adds its amount to expenses');

-- Test 6: Reversal of payment
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000091';
set local role authenticated;

select public.reverse_debt_payment_checked(
  p_payment_id => (select id from public.debt_payments where amount = 2000 limit 1),
  p_reason => 'Accidental duplicate payment'
);

reset role;
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000911'), 4000::numeric, 'source card refunded 2000');
select is((select outstanding_amount from public.debts where user_id = '00000000-0000-0000-0000-000000000091'), 2000::numeric, 'debt outstanding re-incremented to 2000');
select is((select status from public.debts where user_id = '00000000-0000-0000-0000-000000000091'), 'outstanding', 'debt reopened to outstanding status');
select is((select status from public.debt_payments where amount = 2000 limit 1), 'reversed', 'payment marked reversed');
select is((select count(*)::int from public.transactions where user_id = '00000000-0000-0000-0000-000000000091'), 2, 'card reversal removes only its linked expense');
select is((select sum(amount) from public.transactions where user_id = '00000000-0000-0000-0000-000000000091' and type = 'expense'), 1100::numeric, 'card reversal removes its amount from expenses');

-- Test 7: E-wallet and cash repayments use the same separate ledger.
set local role authenticated;
select public.pay_debt_checked(
  p_debt_id => (select id from public.debts where user_id = '00000000-0000-0000-0000-000000000091'),
  p_amount => 500, p_payment_method => 'ewallet',
  p_wallet_id => '00000000-0000-0000-0000-000000000912'
);
reset role;
select is((select balance from public.e_wallets where id = '00000000-0000-0000-0000-000000000912'), 1500::numeric, 'e-wallet repayment deducts once');
select is((select count(*)::int from public.transactions where user_id = '00000000-0000-0000-0000-000000000091'), 3, 'e-wallet repayment creates one expense');
select is((select sum(amount) from public.transactions where user_id = '00000000-0000-0000-0000-000000000091' and type = 'expense'), 1600::numeric, 'e-wallet repayment adds its amount to expenses');

set local role authenticated;
select public.reverse_debt_payment_checked(
  p_payment_id => (select id from public.debt_payments where wallet_id = '00000000-0000-0000-0000-000000000912'),
  p_reason => 'Wallet repayment regression'
);
reset role;
select is((select balance from public.e_wallets where id = '00000000-0000-0000-0000-000000000912'), 2000::numeric, 'e-wallet reversal refunds once');
select is((select count(*)::int from public.transactions where user_id = '00000000-0000-0000-0000-000000000091'), 2, 'e-wallet reversal removes its expense');

set local role authenticated;
select public.pay_debt_checked(
  p_debt_id => (select id from public.debts where user_id = '00000000-0000-0000-0000-000000000091'),
  p_amount => 500, p_payment_method => 'cash',
  p_wallet_id => '00000000-0000-0000-0000-000000000914'
);
reset role;
select is((select balance from public.e_wallets where id = '00000000-0000-0000-0000-000000000914'), 1500::numeric, 'cash repayment deducts once');
select is((select count(*)::int from public.transactions where user_id = '00000000-0000-0000-0000-000000000091'), 3, 'cash repayment creates one expense');
select is((select sum(amount) from public.transactions where user_id = '00000000-0000-0000-0000-000000000091' and type = 'expense'), 1600::numeric, 'cash repayment adds its amount to expenses');

set local role authenticated;
select public.reverse_debt_payment_checked(
  p_payment_id => (select id from public.debt_payments where wallet_id = '00000000-0000-0000-0000-000000000914'),
  p_reason => 'Cash repayment regression'
);
reset role;
select is((select balance from public.e_wallets where id = '00000000-0000-0000-0000-000000000914'), 2000::numeric, 'cash reversal refunds once');
select is((select count(*)::int from public.transactions where user_id = '00000000-0000-0000-0000-000000000091'), 2, 'cash reversal removes its expense');

select * from finish();

rollback;
