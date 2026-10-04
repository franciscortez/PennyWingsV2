-- Migration: Add purchase charges so a provider debt can grow over time
-- Follow-up to #91 (debts and repayments)
--
-- Semantics after this migration:
--   debts.original_amount     = total charged to date (sum of active charges)
--   debts.outstanding_amount  = total charged - completed payments
-- Both columns are changed only by the checked RPCs below and in 202610040001.

create table if not exists public.debt_charges (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  charge_date date not null default current_date,
  note text,
  status text not null default 'active' check (status in ('active', 'voided')),
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_debt_charges_debt_id on public.debt_charges(debt_id);
create index if not exists idx_debt_charges_user_date on public.debt_charges(user_id, charge_date);

alter table public.debt_charges enable row level security;

create policy "Users can view own debt charges"
  on public.debt_charges for select
  using (auth.uid() = user_id);

-- The cap "outstanding <= original" no longer holds as a fixed column check
-- because original_amount now grows with each charge. Drop it by definition,
-- since the auto-generated name depends on the Postgres version.
do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conname
    from pg_constraint
    where conrelid = 'public.debts'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%outstanding_amount <= original_amount%'
  loop
    execute format('alter table public.debts drop constraint %I', constraint_row.conname);
  end loop;
end;
$$;

-- Backfill one charge per existing debt so the ledger matches original_amount.
insert into public.debt_charges (debt_id, user_id, amount, charge_date, note)
select d.id, d.user_id, d.original_amount, d.created_at::date, d.note
from public.debts d
where not exists (
  select 1 from public.debt_charges c where c.debt_id = d.id
);

-- RPC: create_debt_checked (now also records the first charge)
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

  insert into public.debt_charges (debt_id, user_id, amount, note)
  values (
    new_debt_id, current_user_id, p_original_amount,
    nullif(trim(coalesce(p_note, '')), '')
  );

  return jsonb_build_object('id', new_debt_id);
end;
$$;

-- RPC: add_debt_charge_checked
create or replace function public.add_debt_charge_checked(
  p_debt_id uuid,
  p_amount numeric,
  p_charge_date date default current_date,
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
  new_charge_id uuid;
  new_outstanding numeric;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception using errcode = '22023', message = 'Purchase amount must be greater than zero.';
  end if;

  select * into target_debt
  from public.debts
  where id = p_debt_id and user_id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Debt not found or unauthorized.';
  end if;

  if target_debt.status = 'archived' then
    raise exception using errcode = '22023', message = 'Cannot add purchases to an archived debt.';
  end if;

  insert into public.debt_charges (debt_id, user_id, amount, charge_date, note)
  values (
    p_debt_id, current_user_id, p_amount, coalesce(p_charge_date, current_date),
    nullif(trim(coalesce(p_note, '')), '')
  )
  returning id into new_charge_id;

  new_outstanding := target_debt.outstanding_amount + p_amount;

  update public.debts
  set original_amount = original_amount + p_amount,
      outstanding_amount = new_outstanding,
      status = 'outstanding',
      paid_at = null,
      updated_at = timezone('utc', now())
  where id = p_debt_id;

  return jsonb_build_object(
    'id', new_charge_id,
    'debt_id', p_debt_id,
    'amount', p_amount,
    'outstanding_amount', new_outstanding
  );
end;
$$;

-- RPC: void_debt_charge_checked
create or replace function public.void_debt_charge_checked(
  p_charge_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_charge public.debt_charges%rowtype;
  target_debt public.debts%rowtype;
  active_charge_count integer;
  new_outstanding numeric;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication is required.';
  end if;

  select * into target_charge
  from public.debt_charges
  where id = p_charge_id and user_id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Purchase not found or unauthorized.';
  end if;

  if target_charge.status = 'voided' then
    raise exception using errcode = '22023', message = 'Purchase has already been voided.';
  end if;

  select * into target_debt
  from public.debts
  where id = target_charge.debt_id and user_id = current_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Associated debt not found.';
  end if;

  if target_debt.status = 'archived' then
    raise exception using errcode = '22023', message = 'Cannot void purchases on an archived debt.';
  end if;

  select count(*) into active_charge_count
  from public.debt_charges
  where debt_id = target_debt.id and status = 'active';

  if active_charge_count <= 1 then
    raise exception using errcode = '22023', message = 'Cannot void the only purchase. Archive the debt instead.';
  end if;

  if target_debt.outstanding_amount < target_charge.amount then
    raise exception using errcode = '22023', message = 'Purchase has already been repaid. Reverse a payment first.';
  end if;

  new_outstanding := target_debt.outstanding_amount - target_charge.amount;

  update public.debts
  set original_amount = original_amount - target_charge.amount,
      outstanding_amount = new_outstanding,
      status = case when new_outstanding = 0 then 'paid' else status end,
      paid_at = case when new_outstanding = 0 then timezone('utc', now()) else paid_at end,
      updated_at = timezone('utc', now())
  where id = target_debt.id;

  update public.debt_charges
  set status = 'voided',
      voided_at = timezone('utc', now()),
      void_reason = nullif(trim(coalesce(p_reason, '')), '')
  where id = p_charge_id;
end;
$$;

-- RPC: reverse_debt_payment_checked (an archived debt stays archived)
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

  -- Reopen / increment debt balance, keeping an archived debt archived
  update public.debts
  set outstanding_amount = outstanding_amount + target_payment.amount,
      status = case when status = 'archived' then 'archived' else 'outstanding' end,
      paid_at = null,
      updated_at = timezone('utc', now())
  where id = target_debt.id;

  update public.debt_payments
  set status = 'reversed',
      reversed_at = timezone('utc', now()),
      reversal_reason = nullif(trim(coalesce(p_reason, '')), '')
  where id = p_payment_id;
end;
$$;

-- Permissions and Grants
revoke all on function public.add_debt_charge_checked(uuid, numeric, date, text) from public;
revoke all on function public.void_debt_charge_checked(uuid, text) from public;

grant execute on function public.add_debt_charge_checked(uuid, numeric, date, text) to authenticated;
grant execute on function public.void_debt_charge_checked(uuid, text) to authenticated;

grant select on public.debt_charges to authenticated;
