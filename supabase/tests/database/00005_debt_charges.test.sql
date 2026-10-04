begin;
select plan(20);

-- Fixture users
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000093', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'charge-owner-93@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000094', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'charge-stranger-94@example.test', '', now(), now(), now());

insert into public.bank_cards (id, user_id, card_name, card_type, balance, is_active, status)
values ('00000000-0000-0000-0000-000000000931', '00000000-0000-0000-0000-000000000093', 'BDO Debit', 'debit', 1000, true, 'active');

-- Run as user 93
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000093';
set local role authenticated;

-- Atome starts with a 20 purchase, then a 50 purchase is added the next day
select public.create_debt_checked(
  p_provider_name => 'Atome',
  p_debt_type => 'bnpl',
  p_original_amount => 20
);

reset role;
select is((select count(*)::int from public.debt_charges c join public.debts d on d.id = c.debt_id where d.provider_name = 'Atome'), 1, 'create records the first charge');
select is((select sum(c.amount) from public.debt_charges c join public.debts d on d.id = c.debt_id where d.provider_name = 'Atome' and c.status = 'active'), 20::numeric, 'first charge equals initial amount');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000093';
set local role authenticated;

select public.add_debt_charge_checked(
  p_debt_id => (select id from public.debts where provider_name = 'Atome'),
  p_amount => 50,
  p_charge_date => '2026-10-05',
  p_note => 'Second purchase'
);

reset role;
select is((select outstanding_amount from public.debts where provider_name = 'Atome'), 70::numeric, 'outstanding grows to 70 after second purchase');
select is(
  (select original_amount from public.debts where provider_name = 'Atome'),
  (select sum(c.amount) from public.debt_charges c join public.debts d on d.id = c.debt_id where d.provider_name = 'Atome' and c.status = 'active'),
  'original_amount equals the sum of active charges'
);

-- RLS: stranger sees nothing, and nobody can insert charges directly
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000094';
set local role authenticated;
select is((select count(*)::int from public.debt_charges), 0, 'user 94 cannot view user 93 charges');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000093';
set local role authenticated;
select throws_ok(
  $$
    insert into public.debt_charges (debt_id, user_id, amount)
    values (
      (select id from public.debts where provider_name = 'Atome'),
      '00000000-0000-0000-0000-000000000093',
      999
    )
  $$,
  '42501',
  null,
  'direct charge insert is denied'
);

select throws_ok(
  $$
    select public.add_debt_charge_checked(
      p_debt_id => (select id from public.debts where provider_name = 'Atome'),
      p_amount => 0
    )
  $$,
  '22023',
  'Purchase amount must be greater than zero.',
  'zero purchase is rejected'
);

-- One payment settles both purchases
select public.pay_debt_checked(
  p_debt_id => (select id from public.debts where provider_name = 'Atome'),
  p_amount => 70,
  p_payment_method => 'card',
  p_card_id => '00000000-0000-0000-0000-000000000931'
);

reset role;
select is((select status from public.debts where provider_name = 'Atome'), 'paid', 'single 70 payment settles two purchases');

-- A new purchase reopens a paid debt
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000093';
set local role authenticated;
select public.add_debt_charge_checked(
  p_debt_id => (select id from public.debts where provider_name = 'Atome'),
  p_amount => 30
);

reset role;
select is((select status from public.debts where provider_name = 'Atome'), 'outstanding', 'purchase reopens a paid debt');
select is((select paid_at is null from public.debts where provider_name = 'Atome'), true, 'paid_at cleared on reopen');
select is((select outstanding_amount from public.debts where provider_name = 'Atome'), 30::numeric, 'only the new purchase is outstanding');

-- Voiding the unpaid 30 purchase settles the debt again
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000093';
set local role authenticated;
select public.void_debt_charge_checked(
  p_charge_id => (select c.id from public.debt_charges c join public.debts d on d.id = c.debt_id where d.provider_name = 'Atome' and c.amount = 30),
  p_reason => 'Cancelled order'
);

reset role;
select is((select status from public.debt_charges where amount = 30 and user_id = '00000000-0000-0000-0000-000000000093'), 'voided', 'charge marked voided');
select is((select original_amount from public.debts where provider_name = 'Atome'), 70::numeric, 'void reduces total charged back to 70');
select is((select status from public.debts where provider_name = 'Atome'), 'paid', 'void to zero outstanding marks debt paid');

-- A repaid purchase cannot be voided
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000093';
set local role authenticated;
select throws_ok(
  $$
    select public.void_debt_charge_checked(
      p_charge_id => (select c.id from public.debt_charges c join public.debts d on d.id = c.debt_id where d.provider_name = 'Atome' and c.amount = 20)
    )
  $$,
  '22023',
  'Purchase has already been repaid. Reverse a payment first.',
  'repaid purchase cannot be voided'
);

-- The only purchase cannot be voided, and archived debts reject purchases
select public.create_debt_checked(
  p_provider_name => 'Solo',
  p_debt_type => 'bnpl',
  p_original_amount => 10
);

select throws_ok(
  $$
    select public.void_debt_charge_checked(
      p_charge_id => (select c.id from public.debt_charges c join public.debts d on d.id = c.debt_id where d.provider_name = 'Solo')
    )
  $$,
  '22023',
  'Cannot void the only purchase. Archive the debt instead.',
  'only purchase cannot be voided'
);

select public.archive_debt_checked((select id from public.debts where provider_name = 'Solo'));

select throws_ok(
  $$
    select public.add_debt_charge_checked(
      p_debt_id => (select id from public.debts where provider_name = 'Solo'),
      p_amount => 5
    )
  $$,
  '22023',
  'Cannot add purchases to an archived debt.',
  'archived debt rejects purchases'
);

-- Reversing a payment keeps an archived debt archived
select public.archive_debt_checked((select id from public.debts where provider_name = 'Atome'));
select public.reverse_debt_payment_checked(
  p_payment_id => (select id from public.debt_payments where amount = 70 and user_id = '00000000-0000-0000-0000-000000000093'),
  p_reason => 'Paid wrong provider'
);

reset role;
select is((select status from public.debts where provider_name = 'Atome'), 'archived', 'reversal keeps archived debt archived');
select is((select outstanding_amount from public.debts where provider_name = 'Atome'), 70::numeric, 'reversal restores 70 outstanding');
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000931'), 1000::numeric, 'reversal refunds the source card');

rollback;
