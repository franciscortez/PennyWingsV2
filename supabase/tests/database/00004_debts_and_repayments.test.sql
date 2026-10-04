begin;
select plan(19);

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
  ('00000000-0000-0000-0000-000000000913', '00000000-0000-0000-0000-000000000091', 'Lent Wallet', 'lent', 10000, true, 'active');

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

rollback;
