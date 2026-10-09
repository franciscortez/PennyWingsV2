-- Repayments are expenses in the reporting ledger. The checked repayment RPC
-- remains the only authority for changing account and debt balances.
alter table public.transactions
  add column debt_payment_id uuid
  references public.debt_payments(id) on delete cascade;

create unique index transactions_debt_payment_id_key
  on public.transactions(debt_payment_id);

insert into public.categories (name, type, icon, color, is_default)
select 'Debt Repayment', 'expense', 'credit-card', '#f43f5e', true
where not exists (
  select 1 from public.categories
  where user_id is null and name = 'Debt Repayment' and type = 'expense' and is_default
);

create schema if not exists private;

create function private.sync_debt_payment_expense()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  repayment_category_id uuid;
  provider text;
begin
  if tg_op = 'INSERT' and new.status = 'completed' then
    select id into repayment_category_id
    from public.categories
    where user_id is null and name = 'Debt Repayment' and type = 'expense' and is_default
    order by id limit 1;

    if repayment_category_id is null then
      raise exception using errcode = 'P0002', message = 'Debt repayment category was not found.';
    end if;

    select provider_name into provider
    from public.debts where id = new.debt_id and user_id = new.user_id;

    if provider is null then
      raise exception using errcode = '42501', message = 'Associated debt was not found or is unauthorized.';
    end if;

    -- Ledger insert only: pay_debt_checked has already deducted the source.
    insert into public.transactions (
      user_id, created_by, type, payment_method, amount, fee_amount,
      card_id, wallet_id, category_id, description, transaction_date, created_at,
      debt_payment_id
    ) values (
      new.user_id, new.user_id, 'expense', new.payment_method, new.amount, 0,
      new.card_id, new.wallet_id, repayment_category_id,
      'Debt repayment: ' || provider ||
        case when new.note is null then '' else ' — ' || new.note end,
      new.payment_date, new.created_at, new.id
    );
  elsif tg_op = 'UPDATE' and old.status = 'completed' and new.status = 'reversed' then
    -- reverse_debt_payment_checked already refunded the source. Do not call
    -- delete_transaction, which would refund it a second time.
    delete from public.transactions where debt_payment_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function private.sync_debt_payment_expense() from public, anon, authenticated;

create trigger sync_debt_payment_expense
after insert or update of status on public.debt_payments
for each row execute function private.sync_debt_payment_expense();

-- Backfill completed payments only. Existing account/debt balances stay intact.
insert into public.transactions (
  user_id, created_by, type, payment_method, amount, fee_amount,
  card_id, wallet_id, category_id, description, transaction_date, created_at,
  debt_payment_id
)
select
  p.user_id, p.user_id, 'expense', p.payment_method, p.amount, 0,
  p.card_id, p.wallet_id,
  (select id from public.categories
   where user_id is null and name = 'Debt Repayment' and type = 'expense' and is_default
   order by id limit 1),
  'Debt repayment: ' || d.provider_name ||
    case when p.note is null then '' else ' — ' || p.note end,
  p.payment_date, p.created_at, p.id
from public.debt_payments p
join public.debts d on d.id = p.debt_id and d.user_id = p.user_id
where p.status = 'completed'
  and not exists (select 1 from public.transactions t where t.debt_payment_id = p.id);

create function private.protect_debt_payment_expense()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    -- Only the internal payment trigger creates links, never a direct API write.
    if new.debt_payment_id is not null and pg_catalog.pg_trigger_depth() < 2 then
      raise exception using errcode = '42501', message = 'Debt repayments must be recorded through Debts.';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.debt_payment_id is not null or new.debt_payment_id is not null then
      raise exception using errcode = '42501', message = 'Debt repayments must be managed through Debts.';
    end if;
    return new;
  end if;

  if old.debt_payment_id is not null
    and exists (select 1 from public.debt_payments where id = old.debt_payment_id and status = 'completed')
    and exists (select 1 from auth.users where id = old.user_id) then
    raise exception using errcode = '42501', message = 'Debt repayments must be reversed through Debts.';
  end if;
  -- Reversal and foreign-key cleanup delete the ledger row without money work.
  return old;
end;
$$;

revoke all on function private.protect_debt_payment_expense() from public, anon, authenticated;

create trigger protect_debt_payment_expense
before insert or update or delete on public.transactions
for each row execute function private.protect_debt_payment_expense();

-- Direct payment inserts could bypass the checked RPC's balance/ownership work.
revoke insert, update, delete on public.debt_payments from public, anon, authenticated;
