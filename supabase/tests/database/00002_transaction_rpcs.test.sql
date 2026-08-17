begin;
select plan(7);

-- 1. Check process_transaction_checked function exists
select has_function(
  'public',
  'process_transaction_checked',
  ARRAY['numeric', 'uuid', 'uuid', 'text', 'text', 'uuid', 'uuid', 'date', 'text', 'uuid', 'numeric'],
  'process_transaction_checked function should exist with fee_amount parameter'
);

-- 2. Check delete_transaction function exists
select has_function(
  'public',
  'delete_transaction',
  ARRAY['uuid'],
  'delete_transaction function should exist'
);

-- 3. Check update_transaction_checked function exists
select has_function(
  'public',
  'update_transaction_checked',
  ARRAY['numeric', 'uuid', 'uuid', 'text', 'uuid', 'text', 'uuid', 'uuid', 'date', 'text', 'uuid', 'numeric'],
  'update_transaction_checked function should exist with fee_amount parameter'
);

-- 4. Check transactions table has fee_amount column
select has_column(
  'public',
  'transactions',
  'fee_amount',
  'transactions table should have fee_amount column'
);

-- 5. Check fee_amount default is 0
select col_default_is(
  'public',
  'transactions',
  'fee_amount',
  '0',
  'transactions.fee_amount default should be 0'
);

-- 6. Check update_card_balance function exists
select has_function(
  'public',
  'update_card_balance',
  ARRAY['uuid', 'numeric'],
  'update_card_balance function should exist'
);

-- 7. Check update_wallet_balance function exists
select has_function(
  'public',
  'update_wallet_balance',
  ARRAY['uuid', 'numeric'],
  'update_wallet_balance function should exist'
);

select * from finish();
rollback;
