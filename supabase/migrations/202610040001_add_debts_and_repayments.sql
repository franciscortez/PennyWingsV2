-- Migration: Add debts and account-linked repayments tracking
-- Issue: #91

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_name text not null,
  debt_type text not null check (debt_type in ('bnpl', 'credit_card', 'personal_loan', 'other')),
  original_amount numeric not null check (original_amount > 0),
  outstanding_amount numeric not null check (outstanding_amount >= 0 and outstanding_amount <= original_amount),
  due_date date,
  note text,
  status text not null default 'outstanding' check (status in ('outstanding', 'paid', 'archived')),
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  payment_date date not null default current_date,
  payment_method text not null check (payment_method in ('cash', 'card', 'ewallet')),
  card_id uuid references public.bank_cards(id) on delete set null,
  wallet_id uuid references public.e_wallets(id) on delete set null,
  note text,
  status text not null default 'completed' check (status in ('completed', 'reversed')),
  reversed_at timestamptz,
  reversal_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint check_debt_payment_account check (
    (card_id is not null and wallet_id is null and payment_method = 'card') or
    (wallet_id is not null and card_id is null and payment_method in ('cash', 'ewallet'))
  )
);

create index if not exists idx_debts_user_status on public.debts(user_id, status);
create index if not exists idx_debts_user_due_date on public.debts(user_id, due_date);
create index if not exists idx_debt_payments_debt_id on public.debt_payments(debt_id);
create index if not exists idx_debt_payments_user_date on public.debt_payments(user_id, payment_date);

-- Enable RLS
alter table public.debts enable row level security;
alter table public.debt_payments enable row level security;

-- Policies for debts
create policy "Users can view own debts"
  on public.debts for select
  using (auth.uid() = user_id);

create policy "Users can insert own debts"
  on public.debts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own debts"
  on public.debts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies for debt_payments
create policy "Users can view own debt payments"
  on public.debt_payments for select
  using (auth.uid() = user_id);

create policy "Users can insert own debt payments"
  on public.debt_payments for insert
  with check (auth.uid() = user_id);

-- RPC: create_debt_checked
create or replace function public.create_debt_checked(
  p_provider_name text,
  p_debt_type text,
  p_original_amount numeric,
  p_due_date date default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_debt_id uuid;
  trimmed_provider text;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  trimmed_provider := trim(coalesce(p_provider_name, ''));
  if trimmed_provider = '' then
    raise exception using errcode = '22023', message = 'Provider name is required.';
  end if;

  if p_debt_type not in ('bnpl', 'credit_card', 'personal_loan', 'other') then
    raise exception using errcode = '22023', message = 'Invalid debt type.';
  end if;

  if p_original_amount is null or p_original_amount <= 0 then
    raise exception using errcode = '22023', message = 'Original amount must be greater than zero.';
  end if;

  insert into public.debts (
    user_id, provider_name, debt_type, original_amount, outstanding_amount,
    due_date, note, status
  )
  values (
    current_user_id, trimmed_provider, p_debt_type, p_original_amount, p_original_amount,
    p_due_date, nullif(trim(coalesce(p_note, '')), ''), 'outstanding'
  )
  returning id into new_debt_id;

  return jsonb_build_object('id', new_debt_id);
end;
$$;

-- RPC: update_debt_checked
create or replace function public.update_debt_checked(
  p_id uuid,
  p_provider_name text,
  p_debt_type text,
  p_due_date date default null,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  trimmed_provider text;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  trimmed_provider := trim(coalesce(p_provider_name, ''));
  if trimmed_provider = '' then
    raise exception using errcode = '22023', message = 'Provider name is required.';
  end if;

  if p_debt_type not in ('bnpl', 'credit_card', 'personal_loan', 'other') then
    raise exception using errcode = '22023', message = 'Invalid debt type.';
  end if;

  update public.debts
  set provider_name = trimmed_provider,
      debt_type = p_debt_type,
      due_date = p_due_date,
      note = nullif(trim(coalesce(p_note, '')), ''),
      updated_at = timezone('utc', now())
  where id = p_id and user_id = current_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Debt not found or unauthorized.';
  end if;
end;
$$;

-- RPC: archive_debt_checked
create or replace function public.archive_debt_checked(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  update public.debts
  set status = 'archived',
      updated_at = timezone('utc', now())
  where id = p_id and user_id = current_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Debt not found or unauthorized.';
  end if;
end;
$$;

-- RPC: unarchive_debt_checked
create or replace function public.unarchive_debt_checked(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  update public.debts
  set status = case when outstanding_amount = 0 then 'paid' else 'outstanding' end,
      updated_at = timezone('utc', now())
  where id = p_id and user_id = current_user_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Debt not found or unauthorized.';
  end if;
end;
$$;

-- RPC: pay_debt_checked
create or replace function public.pay_debt_checked(
  p_debt_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_card_id uuid default null,
  p_wallet_id uuid default null,
  p_payment_date date default current_date,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_debt public.debts%rowtype;
  source_balance numeric;
  source_wallet_type text;
  source_found boolean := false;
  new_payment_id uuid;
  new_outstanding numeric;
  effective_date date := coalesce(p_payment_date, current_date);
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception using errcode = '22023', message = 'Payment amount must be greater than zero.';
  end if;

  if p_payment_method not in ('cash', 'card', 'ewallet') then
    raise exception using errcode = '22023', message = 'Choose a valid payment method.';
  end if;

  if (p_card_id is null) = (p_wallet_id is null) then
    raise exception using errcode = '22023', message = 'Choose exactly one source account.';
  end if;

  -- Lock and validate debt
  select * into target_debt
  from public.debts
  where id = p_debt_id and user_id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Debt not found or unauthorized.';
  end if;

  if target_debt.status = 'archived' then
    raise exception using errcode = '22023', message = 'Cannot make payments on an archived debt.';
  end if;

  if target_debt.outstanding_amount <= 0 or target_debt.status = 'paid' then
    raise exception using errcode = '22023', message = 'Debt is already paid in full.';
  end if;

  if p_amount > target_debt.outstanding_amount then
    raise exception using errcode = '22023', message = 'Payment amount exceeds remaining debt balance.';
  end if;

  -- Lock and validate source account
  if p_card_id is not null then
    if p_payment_method <> 'card' then
      raise exception using errcode = '22023', message = 'Payment method does not match source account.';
    end if;

    select balance into source_balance
    from public.bank_cards
    where id = p_card_id
      and user_id = current_user_id
      and is_active = true
      and status = 'active'
    for update;

    if found then
      source_found := true;
    end if;
  else
    select balance, wallet_type into source_balance, source_wallet_type
    from public.e_wallets
    where id = p_wallet_id
      and user_id = current_user_id
      and is_active = true
      and status = 'active'
      and wallet_type not in ('lent')
    for update;

    if found then
      if (p_payment_method = 'cash' and source_wallet_type <> 'cash')
        or (p_payment_method = 'ewallet' and source_wallet_type = 'cash')
        or p_payment_method = 'card' then
        raise exception using errcode = '22023', message = 'Payment method does not match source account.';
      end if;
      source_found := true;
    end if;
  end if;

  if not source_found then
    raise exception using errcode = 'P0002', message = 'Source account was not found or is inactive.';
  end if;

  if source_balance < p_amount then
    raise exception using errcode = 'P0001', message = 'Insufficient balance.';
  end if;

  -- Atomic balance deduction
  if p_card_id is not null then
    perform public.update_card_balance(p_card_id, -p_amount);
  else
    perform public.update_wallet_balance(p_wallet_id, -p_amount);
  end if;

  -- Record payment
  insert into public.debt_payments (
    debt_id, user_id, amount, payment_date, payment_method,
    card_id, wallet_id, note, status
  )
  values (
    p_debt_id, current_user_id, p_amount, effective_date, p_payment_method,
    p_card_id, p_wallet_id, nullif(trim(coalesce(p_note, '')), ''), 'completed'
  )
  returning id into new_payment_id;

  -- Update debt outstanding amount and status
  new_outstanding := target_debt.outstanding_amount - p_amount;
  update public.debts
  set outstanding_amount = new_outstanding,
      status = case when new_outstanding = 0 then 'paid' else status end,
      paid_at = case when new_outstanding = 0 then timezone('utc', now()) else paid_at end,
      updated_at = timezone('utc', now())
  where id = p_debt_id;

  return jsonb_build_object(
    'id', new_payment_id,
    'debt_id', p_debt_id,
    'amount', p_amount,
    'remaining_balance', new_outstanding,
    'is_paid', new_outstanding = 0
  );
end;
$$;

-- RPC: reverse_debt_payment_checked
create or replace function public.reverse_debt_payment_checked(
  p_payment_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_payment public.debt_payments%rowtype;
  target_debt public.debts%rowtype;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  select * into target_payment
  from public.debt_payments
  where id = p_payment_id and user_id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Payment not found or unauthorized.';
  end if;

  if target_payment.status = 'reversed' then
    raise exception using errcode = '22023', message = 'Payment has already been reversed.';
  end if;

  select * into target_debt
  from public.debts
  where id = target_payment.debt_id and user_id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Associated debt not found.';
  end if;

  -- Refund source account
  if target_payment.card_id is not null then
    perform public.update_card_balance(target_payment.card_id, target_payment.amount);
  elsif target_payment.wallet_id is not null then
    perform public.update_wallet_balance(target_payment.wallet_id, target_payment.amount);
  end if;

  -- Reopen / increment debt balance
  update public.debts
  set outstanding_amount = outstanding_amount + target_payment.amount,
      status = 'outstanding',
      paid_at = null,
      updated_at = timezone('utc', now())
  where id = target_debt.id;

  -- Mark payment as reversed
  update public.debt_payments
  set status = 'reversed',
      reversed_at = timezone('utc', now()),
      reversal_reason = nullif(trim(coalesce(p_reason, '')), '')
  where id = p_payment_id;
end;
$$;

-- Permissions and Grants
revoke all on function public.create_debt_checked(text, text, numeric, date, text) from public;
revoke all on function public.update_debt_checked(uuid, text, text, date, text) from public;
revoke all on function public.archive_debt_checked(uuid) from public;
revoke all on function public.unarchive_debt_checked(uuid) from public;
revoke all on function public.pay_debt_checked(uuid, numeric, text, uuid, uuid, date, text) from public;
revoke all on function public.reverse_debt_payment_checked(uuid, text) from public;

grant execute on function public.create_debt_checked(text, text, numeric, date, text) to authenticated;
grant execute on function public.update_debt_checked(uuid, text, text, date, text) to authenticated;
grant execute on function public.archive_debt_checked(uuid) to authenticated;
grant execute on function public.unarchive_debt_checked(uuid) to authenticated;
grant execute on function public.pay_debt_checked(uuid, numeric, text, uuid, uuid, date, text) to authenticated;
grant execute on function public.reverse_debt_payment_checked(uuid, text) to authenticated;

grant select, insert, update on public.debts to authenticated;
grant select, insert on public.debt_payments to authenticated;
