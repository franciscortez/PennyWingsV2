/*
 * Harden transaction creation so authenticated clients cannot bypass the
 * invariants already enforced by update_transaction_checked.
 */

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
  p_wallet_id uuid
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
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501', message = 'Authentication is required.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception using
      errcode = '22023', message = 'Amount must be greater than zero.';
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

  if p_type in ('expense', 'withdrawal', 'transfer')
    and source_balance < p_amount then
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
    p_wallet_id => p_wallet_id
  );
end;
$$;
