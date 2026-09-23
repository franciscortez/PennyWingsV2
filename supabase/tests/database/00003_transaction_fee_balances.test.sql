begin;
select plan(26);

-- All fixture rows are rolled back at the end of this test.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000036',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'transfer-fee-36@example.test', '',
  now(), now(), now()
);

insert into public.bank_cards (id, user_id, card_name, card_type, balance)
values (
  '00000000-0000-0000-0000-000000000361',
  '00000000-0000-0000-0000-000000000036',
  'Fixture source', 'debit', 100
);

insert into public.e_wallets (id, user_id, wallet_name, wallet_type, balance)
values (
  '00000000-0000-0000-0000-000000000362',
  '00000000-0000-0000-0000-000000000036',
  'Fixture destination', 'gcash', 10
);

insert into public.categories (id, user_id, name, type)
values (
  '00000000-0000-0000-0000-000000000363',
  '00000000-0000-0000-0000-000000000036',
  'Fixture transfer', 'expense'
);

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000036';
set local role authenticated;

select public.process_transaction_checked(
  p_amount => 40,
  p_card_id => '00000000-0000-0000-0000-000000000361',
  p_category_id => '00000000-0000-0000-0000-000000000363',
  p_description => 'Original note',
  p_payment_method => 'card',
  p_to_card_id => null,
  p_to_wallet_id => '00000000-0000-0000-0000-000000000362',
  p_transaction_date => '2026-09-23',
  p_type => 'transfer',
  p_wallet_id => null,
  p_fee_amount => 15
);

reset role;
select is((select fee_amount from public.transactions where user_id = '00000000-0000-0000-0000-000000000036'), 15::numeric, 'create saves fee');
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000361'), 45::numeric, 'create deducts amount plus fee from source');
select is((select balance from public.e_wallets where id = '00000000-0000-0000-0000-000000000362'), 50::numeric, 'create credits amount to destination');

set local role authenticated;
select public.update_transaction_checked(
  p_amount => 40,
  p_card_id => '00000000-0000-0000-0000-000000000361',
  p_category_id => '00000000-0000-0000-0000-000000000363',
  p_description => 'Changed note',
  p_id => (select id from public.transactions where user_id = auth.uid()),
  p_payment_method => 'card',
  p_to_card_id => null,
  p_to_wallet_id => '00000000-0000-0000-0000-000000000362',
  p_transaction_date => '2026-09-23',
  p_type => 'transfer',
  p_wallet_id => null,
  p_fee_amount => 15
);
reset role;
select is((select fee_amount from public.transactions where user_id = '00000000-0000-0000-0000-000000000036'), 15::numeric, 'note edit retains fee');
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000361'), 45::numeric, 'note edit retains source balance');
select is((select balance from public.e_wallets where id = '00000000-0000-0000-0000-000000000362'), 50::numeric, 'note edit retains destination balance');

set local role authenticated;
select public.update_transaction_checked(
  p_amount => 40,
  p_card_id => '00000000-0000-0000-0000-000000000361',
  p_category_id => '00000000-0000-0000-0000-000000000363',
  p_description => 'Changed fee',
  p_id => (select id from public.transactions where user_id = auth.uid()),
  p_payment_method => 'card',
  p_to_card_id => null,
  p_to_wallet_id => '00000000-0000-0000-0000-000000000362',
  p_transaction_date => '2026-09-23',
  p_type => 'transfer',
  p_wallet_id => null,
  p_fee_amount => 25
);
reset role;
select is((select fee_amount from public.transactions where user_id = '00000000-0000-0000-0000-000000000036'), 25::numeric, 'fee edit saves new fee');
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000361'), 35::numeric, 'fee edit reverses old deduction and applies new one');
select is((select balance from public.e_wallets where id = '00000000-0000-0000-0000-000000000362'), 50::numeric, 'fee edit retains destination credit');

set local role authenticated;
select throws_ok($$
  select public.process_transaction_checked(
    p_amount => 30,
    p_card_id => '00000000-0000-0000-0000-000000000361',
    p_category_id => '00000000-0000-0000-0000-000000000363',
    p_description => 'Too expensive with fee',
    p_payment_method => 'card',
    p_to_card_id => null,
    p_to_wallet_id => '00000000-0000-0000-0000-000000000362',
    p_transaction_date => '2026-09-23',
    p_type => 'transfer',
    p_wallet_id => null,
    p_fee_amount => 10
  )
$$, 'P0001', 'Insufficient balance.', 'checked RPC rejects amount plus fee');
reset role;
select is((select count(*) from public.transactions where user_id = '00000000-0000-0000-0000-000000000036'), 1::bigint, 'failed transfer creates no transaction');
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000361'), 35::numeric, 'failed transfer preserves source balance');
select is((select balance from public.e_wallets where id = '00000000-0000-0000-0000-000000000362'), 50::numeric, 'failed transfer preserves destination balance');

insert into public.bank_cards (id, user_id, card_name, card_type, balance)
values (
  '00000000-0000-0000-0000-000000000364',
  '00000000-0000-0000-0000-000000000036',
  'Fixture withdrawal source', 'debit', 100
);

insert into public.e_wallets (id, user_id, wallet_name, wallet_type, balance)
values (
  '00000000-0000-0000-0000-000000000365',
  '00000000-0000-0000-0000-000000000036',
  'Fixture cash', 'cash', 10
);

set local role authenticated;
select public.process_transaction_checked(
  p_amount => 40,
  p_card_id => '00000000-0000-0000-0000-000000000364',
  p_category_id => '00000000-0000-0000-0000-000000000363',
  p_description => 'Original withdrawal',
  p_payment_method => 'card',
  p_to_card_id => null,
  p_to_wallet_id => null,
  p_transaction_date => '2026-09-23',
  p_type => 'withdrawal',
  p_wallet_id => null,
  p_fee_amount => 15
);
reset role;
select is((select fee_amount from public.transactions where user_id = '00000000-0000-0000-0000-000000000036' and type = 'withdrawal'), 15::numeric, 'withdrawal create saves fee');
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000364'), 45::numeric, 'withdrawal create deducts amount plus fee from source');
select is((select balance from public.e_wallets where id = '00000000-0000-0000-0000-000000000365'), 50::numeric, 'withdrawal create credits only amount to cash');

set local role authenticated;
select public.update_transaction_checked(
  p_amount => 40,
  p_card_id => '00000000-0000-0000-0000-000000000364',
  p_category_id => '00000000-0000-0000-0000-000000000363',
  p_description => 'Changed withdrawal note',
  p_id => (select id from public.transactions where user_id = auth.uid() and type = 'withdrawal'),
  p_payment_method => 'card',
  p_to_card_id => null,
  p_to_wallet_id => null,
  p_transaction_date => '2026-09-23',
  p_type => 'withdrawal',
  p_wallet_id => null,
  p_fee_amount => 15
);
reset role;
select is((select fee_amount from public.transactions where user_id = '00000000-0000-0000-0000-000000000036' and type = 'withdrawal'), 15::numeric, 'withdrawal note edit retains fee');
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000364'), 45::numeric, 'withdrawal note edit retains source balance');
select is((select balance from public.e_wallets where id = '00000000-0000-0000-0000-000000000365'), 50::numeric, 'withdrawal note edit retains cash balance');

set local role authenticated;
select public.update_transaction_checked(
  p_amount => 40,
  p_card_id => '00000000-0000-0000-0000-000000000364',
  p_category_id => '00000000-0000-0000-0000-000000000363',
  p_description => 'Changed withdrawal fee',
  p_id => (select id from public.transactions where user_id = auth.uid() and type = 'withdrawal'),
  p_payment_method => 'card',
  p_to_card_id => null,
  p_to_wallet_id => null,
  p_transaction_date => '2026-09-23',
  p_type => 'withdrawal',
  p_wallet_id => null,
  p_fee_amount => 25
);
reset role;
select is((select fee_amount from public.transactions where user_id = '00000000-0000-0000-0000-000000000036' and type = 'withdrawal'), 25::numeric, 'withdrawal fee edit saves new fee');
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000364'), 35::numeric, 'withdrawal fee edit reverses old deduction and applies new one');
select is((select balance from public.e_wallets where id = '00000000-0000-0000-0000-000000000365'), 50::numeric, 'withdrawal fee edit retains cash credit');

set local role authenticated;
select throws_ok($$
  select public.process_transaction_checked(
    p_amount => 30,
    p_card_id => '00000000-0000-0000-0000-000000000364',
    p_category_id => '00000000-0000-0000-0000-000000000363',
    p_description => 'Too expensive withdrawal',
    p_payment_method => 'card',
    p_to_card_id => null,
    p_to_wallet_id => null,
    p_transaction_date => '2026-09-23',
    p_type => 'withdrawal',
    p_wallet_id => null,
    p_fee_amount => 10
  )
$$, 'P0001', 'Insufficient balance.', 'checked RPC rejects withdrawal amount plus fee');
reset role;
select is((select count(*) from public.transactions where user_id = '00000000-0000-0000-0000-000000000036' and type = 'withdrawal'), 1::bigint, 'failed withdrawal creates no transaction');
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000364'), 35::numeric, 'failed withdrawal preserves source balance');
select is((select balance from public.e_wallets where id = '00000000-0000-0000-0000-000000000365'), 50::numeric, 'failed withdrawal preserves cash balance');

select * from finish();
rollback;
