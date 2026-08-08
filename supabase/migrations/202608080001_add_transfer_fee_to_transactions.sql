-- Add fee_amount column to transactions table
alter table public.transactions
  add column if not exists fee_amount numeric not null default 0 check (fee_amount >= 0);

-- Update process_transaction RPC
create or replace function public.process_transaction(
  p_type text,
  p_amount numeric,
  p_description text,
  p_transaction_date date,
  p_category_id uuid,
  p_payment_method text,
  p_card_id uuid default null,
  p_wallet_id uuid default null,
  p_to_card_id uuid default null,
  p_to_wallet_id uuid default null,
  p_user_id uuid default auth.uid(),
  p_fee_amount numeric default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  transaction_id uuid;
  cash_wallet_id uuid;
  balance_delta numeric;
  actual_fee numeric := coalesce(p_fee_amount, 0);
begin
  if p_user_id is distinct from auth.uid() then
    raise exception using errcode = '42501', message = 'Unauthorized.';
  end if;

  if actual_fee < 0 then
    raise exception using errcode = '22023', message = 'Fee amount cannot be negative.';
  end if;

  insert into public.transactions (
    user_id, type, amount, fee_amount, description, transaction_date, category_id,
    payment_method, card_id, wallet_id, to_card_id, to_wallet_id
  )
  values (
    p_user_id, p_type, p_amount, actual_fee, p_description, p_transaction_date,
    p_category_id, p_payment_method, p_card_id, p_wallet_id, p_to_card_id,
    p_to_wallet_id
  )
  returning id into transaction_id;

  if p_type = 'transfer' then
    perform public.update_card_balance(p_card_id, -(p_amount + actual_fee));
    perform public.update_wallet_balance(p_wallet_id, -(p_amount + actual_fee));
    perform public.update_card_balance(p_to_card_id, p_amount);
    perform public.update_wallet_balance(p_to_wallet_id, p_amount);
  else
    balance_delta :=
      case when p_type = 'income' then p_amount else -(p_amount + actual_fee) end;
    perform public.update_card_balance(p_card_id, balance_delta);
    perform public.update_wallet_balance(p_wallet_id, balance_delta);

    if p_type = 'withdrawal' then
      select id into cash_wallet_id
      from public.e_wallets
      where user_id = p_user_id and wallet_type = 'cash'
      limit 1;

      if cash_wallet_id is not null then
        perform public.update_wallet_balance(cash_wallet_id, p_amount);
      end if;
    end if;
  end if;

  return jsonb_build_object('id', transaction_id);
end;
$$;

-- Update process_transaction_checked RPC
create or replace function public.process_transaction_checked(
  p_amount numeric,
  p_card_id uuid,
  p_category_id uuid,
  p_description text,
  p_payment_method text,
  p_to_card_id uuid,
  p_to_wallet_id uuid,
  p_transaction_date date,
  p_type text,
  p_wallet_id uuid,
  p_fee_amount numeric default 0
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  source_balance numeric;
  source_wallet_type text;
  destination_found boolean;
  expected_category_type text;
  actual_fee numeric := coalesce(p_fee_amount, 0);
  total_required numeric;
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501', message = 'Authentication is required.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception using
      errcode = '22023', message = 'Amount must be greater than zero.';
  end if;

  if actual_fee < 0 then
    raise exception using
      errcode = '22023', message = 'Fee amount cannot be negative.';
  end if;

  if p_type not in ('income', 'expense', 'withdrawal', 'transfer') then
    raise exception using
      errcode = '22023', message = 'Choose a valid transaction type.';
  end if;

  if p_payment_method not in ('cash', 'card', 'ewallet') then
    raise exception using
      errcode = '22023', message = 'Choose a valid payment method.';
  end if;

  if p_transaction_date is null then
    raise exception using
      errcode = '22004', message = 'Transaction date is required.';
  end if;

  if (p_card_id is null) = (p_wallet_id is null) then
    raise exception using
      errcode = '22023', message = 'Choose exactly one source account.';
  end if;

  if p_card_id is not null then
    if p_payment_method <> 'card' then
      raise exception using
        errcode = '22023',
        message = 'The payment method does not match the source account.';
    end if;

    select balance into source_balance
    from public.bank_cards
    where id = p_card_id
      and user_id = current_user_id
      and is_active = true
    for update;
  else
    select balance, wallet_type
    into source_balance, source_wallet_type
    from public.e_wallets
    where id = p_wallet_id
      and user_id = current_user_id
      and is_active = true
    for update;

    if found and (
      (p_payment_method = 'cash' and source_wallet_type <> 'cash')
      or (p_payment_method = 'ewallet' and source_wallet_type = 'cash')
      or p_payment_method = 'card'
    ) then
      raise exception using
        errcode = '22023',
        message = 'The payment method does not match the source account.';
    end if;
  end if;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Source account was not found or is inactive.';
  end if;

  if p_type = 'withdrawal' and p_payment_method = 'cash' then
    raise exception using
      errcode = '22023',
      message = 'Withdrawals must come from a card or e-wallet.';
  end if;

  if p_type = 'transfer' then
    if (p_to_card_id is null) = (p_to_wallet_id is null) then
      raise exception using
        errcode = '22023',
        message = 'Choose exactly one destination account.';
    end if;

    if p_to_card_id is not null then
      select exists (
        select 1 from public.bank_cards
        where id = p_to_card_id
          and user_id = current_user_id
          and is_active = true
      ) into destination_found;
    else
      select exists (
        select 1 from public.e_wallets
        where id = p_to_wallet_id
          and user_id = current_user_id
          and is_active = true
      ) into destination_found;
    end if;

    if not destination_found then
      raise exception using
        errcode = 'P0002',
        message = 'Destination account was not found or is inactive.';
    end if;

    if p_card_id is not null and p_card_id = p_to_card_id then
      raise exception using
        errcode = '22023',
        message = 'Choose a different destination account.';
    end if;

    if p_wallet_id is not null and p_wallet_id = p_to_wallet_id then
      raise exception using
        errcode = '22023',
        message = 'Choose a different destination account.';
    end if;
  elsif p_to_card_id is not null or p_to_wallet_id is not null then
    raise exception using
      errcode = '22023',
      message = 'Only transfers can have a destination account.';
  end if;

  expected_category_type :=
    case when p_type = 'income' then 'income' else 'expense' end;

  perform 1
  from public.categories
  where id = p_category_id
    and type = expected_category_type
    and (user_id is null or user_id = current_user_id);

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Choose a valid category for this transaction.';
  end if;

  total_required := p_amount + actual_fee;
  if p_type in ('expense', 'withdrawal', 'transfer')
    and source_balance < total_required then
    raise exception using
      errcode = 'P0001', message = 'Insufficient balance.';
  end if;

  perform public.process_transaction(
    p_amount => p_amount,
    p_card_id => p_card_id,
    p_category_id => p_category_id,
    p_description => p_description,
    p_payment_method => p_payment_method,
    p_to_card_id => p_to_card_id,
    p_to_wallet_id => p_to_wallet_id,
    p_transaction_date => p_transaction_date,
    p_type => p_type,
    p_wallet_id => p_wallet_id,
    p_fee_amount => actual_fee
  );
end;
$$;

-- Update delete_transaction RPC
create or replace function public.delete_transaction(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_transaction public.transactions%rowtype;
  cash_wallet_id uuid;
  reversal_delta numeric;
  old_fee numeric;
begin
  select * into existing_transaction
  from public.transactions
  where id = p_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Transaction was not found or is unauthorized.';
  end if;

  delete from public.transactions where id = p_id;
  old_fee := coalesce(existing_transaction.fee_amount, 0);

  if existing_transaction.type = 'transfer' then
    perform public.update_card_balance(
      existing_transaction.card_id, existing_transaction.amount + old_fee
    );
    perform public.update_wallet_balance(
      existing_transaction.wallet_id, existing_transaction.amount + old_fee
    );
    perform public.update_card_balance(
      existing_transaction.to_card_id, -existing_transaction.amount
    );
    perform public.update_wallet_balance(
      existing_transaction.to_wallet_id, -existing_transaction.amount
    );
  else
    reversal_delta :=
      case
        when existing_transaction.type = 'income'
          then -existing_transaction.amount
        else existing_transaction.amount + old_fee
      end;
    perform public.update_card_balance(
      existing_transaction.card_id, reversal_delta
    );
    perform public.update_wallet_balance(
      existing_transaction.wallet_id, reversal_delta
    );

    if existing_transaction.type = 'withdrawal' then
      select id into cash_wallet_id
      from public.e_wallets
      where user_id = auth.uid() and wallet_type = 'cash'
      limit 1;

      if cash_wallet_id is not null then
        perform public.update_wallet_balance(
          cash_wallet_id, -existing_transaction.amount
        );
      end if;
    end if;
  end if;
end;
$$;

-- Update update_transaction_checked RPC
create or replace function public.update_transaction_checked(
  p_amount numeric,
  p_card_id uuid,
  p_category_id uuid,
  p_description text,
  p_id uuid,
  p_payment_method text,
  p_to_card_id uuid,
  p_to_wallet_id uuid,
  p_transaction_date date,
  p_type text,
  p_wallet_id uuid,
  p_fee_amount numeric default 0
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  old_transaction public.transactions%rowtype;
  source_balance numeric;
  source_wallet_type text;
  destination_found boolean;
  cash_wallet_id uuid;
  balance_delta numeric;
  expected_category_type text;
  actual_fee numeric := coalesce(p_fee_amount, 0);
  old_fee numeric;
  total_required numeric;
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501', message = 'Authentication is required.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception using
      errcode = '22023', message = 'Amount must be greater than zero.';
  end if;

  if actual_fee < 0 then
    raise exception using
      errcode = '22023', message = 'Fee amount cannot be negative.';
  end if;

  if p_type not in ('income', 'expense', 'withdrawal', 'transfer') then
    raise exception using
      errcode = '22023', message = 'Choose a valid transaction type.';
  end if;

  if p_payment_method not in ('cash', 'card', 'ewallet') then
    raise exception using
      errcode = '22023', message = 'Choose a valid payment method.';
  end if;

  if p_transaction_date is null then
    raise exception using
      errcode = '22004', message = 'Transaction date is required.';
  end if;

  select * into old_transaction
  from public.transactions
  where id = p_id and user_id = current_user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002', message = 'Transaction was not found.';
  end if;

  old_fee := coalesce(old_transaction.fee_amount, 0);

  if (p_card_id is null) = (p_wallet_id is null) then
    raise exception using
      errcode = '22023', message = 'Choose exactly one source account.';
  end if;

  if p_card_id is not null then
    if p_payment_method <> 'card' then
      raise exception using
        errcode = '22023',
        message = 'The payment method does not match the source account.';
    end if;

    select balance into source_balance
    from public.bank_cards
    where id = p_card_id
      and user_id = current_user_id
      and is_active = true
    for update;
  else
    select balance, wallet_type
    into source_balance, source_wallet_type
    from public.e_wallets
    where id = p_wallet_id
      and user_id = current_user_id
      and is_active = true
    for update;

    if found and (
      (p_payment_method = 'cash' and source_wallet_type <> 'cash')
      or (p_payment_method = 'ewallet' and source_wallet_type = 'cash')
      or p_payment_method = 'card'
    ) then
      raise exception using
        errcode = '22023',
        message = 'The payment method does not match the source account.';
    end if;
  end if;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Source account was not found or is inactive.';
  end if;

  if p_type = 'withdrawal' and p_payment_method = 'cash' then
    raise exception using
      errcode = '22023',
      message = 'Withdrawals must come from a card or e-wallet.';
  end if;

  if p_type = 'transfer' then
    if (p_to_card_id is null) = (p_to_wallet_id is null) then
      raise exception using
        errcode = '22023',
        message = 'Choose exactly one destination account.';
    end if;

    if p_to_card_id is not null then
      select exists (
        select 1 from public.bank_cards
        where id = p_to_card_id
          and user_id = current_user_id
          and is_active = true
      ) into destination_found;
    else
      select exists (
        select 1 from public.e_wallets
        where id = p_to_wallet_id
          and user_id = current_user_id
          and is_active = true
      ) into destination_found;
    end if;

    if not destination_found then
      raise exception using
        errcode = 'P0002',
        message = 'Destination account was not found or is inactive.';
    end if;

    if p_card_id is not null and p_card_id = p_to_card_id then
      raise exception using
        errcode = '22023',
        message = 'Choose a different destination account.';
    end if;

    if p_wallet_id is not null and p_wallet_id = p_to_wallet_id then
      raise exception using
        errcode = '22023',
        message = 'Choose a different destination account.';
    end if;
  elsif p_to_card_id is not null or p_to_wallet_id is not null then
    raise exception using
      errcode = '22023',
      message = 'Only transfers can have a destination account.';
  end if;

  expected_category_type :=
    case when p_type = 'income' then 'income' else 'expense' end;

  perform 1
  from public.categories
  where id = p_category_id
    and type = expected_category_type
    and (user_id is null or user_id = current_user_id);

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Choose a valid category for this transaction.';
  end if;

  -- Revert old transaction impact
  if old_transaction.type = 'transfer' then
    perform public.update_card_balance(
      old_transaction.card_id, old_transaction.amount + old_fee
    );
    perform public.update_wallet_balance(
      old_transaction.wallet_id, old_transaction.amount + old_fee
    );
    perform public.update_card_balance(
      old_transaction.to_card_id, -old_transaction.amount
    );
    perform public.update_wallet_balance(
      old_transaction.to_wallet_id, -old_transaction.amount
    );
  else
    balance_delta :=
      case
        when old_transaction.type = 'income' then -old_transaction.amount
        else old_transaction.amount + old_fee
      end;
    perform public.update_card_balance(old_transaction.card_id, balance_delta);
    perform public.update_wallet_balance(
      old_transaction.wallet_id, balance_delta
    );

    if old_transaction.type = 'withdrawal' then
      select id into cash_wallet_id
      from public.e_wallets
      where user_id = current_user_id and wallet_type = 'cash'
      limit 1;

      if cash_wallet_id is not null then
        perform public.update_wallet_balance(
          cash_wallet_id, -old_transaction.amount
        );
      end if;
    end if;
  end if;

  total_required := p_amount + actual_fee;

  -- Check balance for new transaction
  if p_type in ('expense', 'withdrawal', 'transfer') then
    if p_card_id is not null then
      select balance into source_balance
      from public.bank_cards
      where id = p_card_id and user_id = current_user_id
      for update;
    else
      select balance into source_balance
      from public.e_wallets
      where id = p_wallet_id and user_id = current_user_id
      for update;
    end if;

    if source_balance < total_required then
      raise exception using
        errcode = 'P0001', message = 'Insufficient balance.';
    end if;
  end if;

  update public.transactions
  set type = p_type,
      amount = p_amount,
      fee_amount = actual_fee,
      description = p_description,
      transaction_date = p_transaction_date,
      category_id = p_category_id,
      payment_method = p_payment_method,
      card_id = p_card_id,
      wallet_id = p_wallet_id,
      to_card_id = p_to_card_id,
      to_wallet_id = p_to_wallet_id,
      updated_at = timezone('utc', now())
  where id = p_id and user_id = current_user_id;

  if p_type = 'transfer' then
    perform public.update_card_balance(p_card_id, -total_required);
    perform public.update_wallet_balance(p_wallet_id, -total_required);
    perform public.update_card_balance(p_to_card_id, p_amount);
    perform public.update_wallet_balance(p_to_wallet_id, p_amount);
  else
    balance_delta :=
      case when p_type = 'income' then p_amount else -total_required end;
    perform public.update_card_balance(p_card_id, balance_delta);
    perform public.update_wallet_balance(p_wallet_id, balance_delta);

    if p_type = 'withdrawal' then
      select id into cash_wallet_id
      from public.e_wallets
      where user_id = current_user_id and wallet_type = 'cash'
      limit 1;

      if cash_wallet_id is not null then
        perform public.update_wallet_balance(cash_wallet_id, p_amount);
      end if;
    end if;
  end if;
end;
$$;
