/*
 * PennyWings V2 current-schema baseline.
 *
 * This migration recreates the complete application-owned public schema from
 * an empty Supabase project. The existing production project already contains
 * this state and records migration version 202607090005 as applied.
 *
 * Joint accounts are intentionally not implemented here. The current user_id
 * columns remain the canonical account owner; a later forward-only migration
 * can add memberships and invitations without changing ownership semantics.
 */

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  avatar_url text
);

create table public.bank_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_name text not null,
  card_type text not null
    check (card_type in ('credit', 'debit', 'savings')),
  balance numeric not null default 0.00,
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  text_color text default '#ffffff',
  last_four text
);

create table public.e_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_name text not null,
  wallet_type text not null,
  balance numeric not null default 0.00,
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  text_color text default '#ffffff',
  account_identifier text
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  color text,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  limit_amount numeric not null,
  period text not null default 'monthly',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0.00,
  target_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  linked_card_id uuid references public.bank_cards(id) on delete set null,
  linked_wallet_id uuid references public.e_wallets(id) on delete set null
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid references public.bank_cards(id) on delete set null,
  wallet_id uuid references public.e_wallets(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  type text not null
    check (type in ('income', 'expense', 'withdrawal', 'transfer')),
  payment_method text not null
    check (payment_method in ('cash', 'card', 'ewallet')),
  amount numeric not null,
  description text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  receipt_url text,
  to_card_id uuid references public.bank_cards(id),
  to_wallet_id uuid references public.e_wallets(id)
);

create table public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_month date not null,
  income_total numeric(14, 2) not null default 0,
  expense_total numeric(14, 2) not null default 0,
  withdrawal_total numeric(14, 2) not null default 0,
  transfer_total numeric(14, 2) not null default 0,
  net_cashflow numeric(14, 2) not null default 0,
  transaction_count integer not null default 0,
  category_breakdown jsonb not null default '[]'::jsonb,
  account_snapshot jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint monthly_reports_month_start_check check (
    report_month = date_trunc('month', report_month)::date
  ),
  constraint monthly_reports_income_check check (income_total >= 0),
  constraint monthly_reports_expense_check check (expense_total >= 0),
  constraint monthly_reports_withdrawal_check check (withdrawal_total >= 0),
  constraint monthly_reports_transfer_check check (transfer_total >= 0),
  constraint monthly_reports_transaction_count_check check (
    transaction_count >= 0
  ),
  constraint monthly_reports_user_month_key unique (user_id, report_month)
);

create index idx_bank_cards_user_id on public.bank_cards(user_id);
create index idx_bank_cards_user_active
  on public.bank_cards(user_id) where is_active = true;
create index idx_e_wallets_user_id on public.e_wallets(user_id);
create index idx_e_wallets_user_active
  on public.e_wallets(user_id) where is_active = true;
create index idx_categories_user_id on public.categories(user_id);
create index idx_budgets_user_id on public.budgets(user_id);
create index idx_budgets_category_id on public.budgets(category_id);
create index idx_goals_user_id on public.goals(user_id);
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_card_id on public.transactions(card_id);
create index idx_transactions_wallet_id on public.transactions(wallet_id);
create index idx_transactions_category_id on public.transactions(category_id);
create index idx_transactions_user_type
  on public.transactions(user_id, type);
create index idx_transactions_user_date_created
  on public.transactions(user_id, transaction_date desc, created_at desc);
create index monthly_reports_user_month_idx
  on public.monthly_reports(user_id, report_month desc);

alter table public.profiles enable row level security;
alter table public.bank_cards enable row level security;
alter table public.e_wallets enable row level security;
alter table public.categories enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;
alter table public.transactions enable row level security;
alter table public.monthly_reports enable row level security;

create policy "Users can manage own profile"
  on public.profiles for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users can manage own cards"
  on public.bank_cards for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can manage own wallets"
  on public.e_wallets for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Categories: Access default or own"
  on public.categories for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));

create policy "Categories: Manage own categories"
  on public.categories for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can manage own budgets"
  on public.budgets for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can manage own goals"
  on public.goals for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can manage own transactions"
  on public.transactions for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can manage own monthly reports"
  on public.monthly_reports for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on table public.profiles from anon;
revoke all on table public.bank_cards from anon;
revoke all on table public.e_wallets from anon;
revoke all on table public.categories from anon;
revoke all on table public.budgets from anon;
revoke all on table public.goals from anon;
revoke all on table public.transactions from anon;
revoke all on table public.monthly_reports from anon;

grant select, insert, update, delete
  on table public.profiles,
  public.bank_cards,
  public.e_wallets,
  public.categories,
  public.budgets,
  public.goals,
  public.transactions,
  public.monthly_reports
  to authenticated;

insert into public.categories (user_id, name, type, icon, color, is_default)
values
  (null, 'Allowance', 'expense', 'hand-coins', '#F97316', true),
  (null, 'Bills', 'expense', 'receipt', '#EF4444', true),
  (null, 'Business', 'expense', 'briefcase', '#F43F5E', true),
  (null, 'Date', 'expense', 'heart', '#FB7185', true),
  (null, 'Education', 'expense', 'book', '#E11D48', true),
  (null, 'Electric Bills', 'expense', 'zap', '#F59E0B', true),
  (null, 'Entertainment', 'expense', 'film', '#E11D48', true),
  (null, 'Family', 'expense', 'home', '#6366F1', true),
  (null, 'Food & Dining', 'expense', 'utensils', '#FB7185', true),
  (null, 'Gifts', 'expense', 'gift', '#EC4899', true),
  (null, 'Groceries', 'expense', 'shopping-cart', '#F97316', true),
  (null, 'Health', 'expense', 'heart', '#F43F5E', true),
  (null, 'Investment', 'expense', 'trending-down', '#E11D48', true),
  (null, 'Others', 'expense', 'more-horizontal', '#94A3B8', true),
  (null, 'Savings', 'expense', 'savings', '#0EA5E9', true),
  (null, 'Shopping', 'expense', 'shopping-bag', '#F43F5E', true),
  (null, 'Transportation', 'expense', 'truck', '#FDA4AF', true),
  (null, 'Travel', 'expense', 'plane', '#FDA4AF', true),
  (null, 'Utilities', 'expense', 'zap', '#FB7185', true),
  (null, 'Water Bills', 'expense', 'droplets', '#0EA5E9', true),
  (null, 'Allowance', 'income', 'hand-coins', '#FBBF24', true),
  (null, 'Business', 'income', 'trending-up', '#22C55E', true),
  (null, 'Gift', 'income', 'gift', '#86EFAC', true),
  (null, 'Investment', 'income', 'pie-chart', '#16A34A', true),
  (null, 'Salary', 'income', 'briefcase', '#4ADE80', true),
  (null, 'Savings', 'income', 'savings', '#0EA5E9', true);

create or replace function public.update_card_balance(
  p_id uuid,
  p_delta numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bank_cards
  set balance = balance + p_delta
  where id = p_id and user_id = auth.uid();
end;
$$;

create or replace function public.update_wallet_balance(
  p_id uuid,
  p_delta numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.e_wallets
  set balance = balance + p_delta
  where id = p_id and user_id = auth.uid();
end;
$$;

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
  p_user_id uuid default auth.uid()
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
begin
  if p_user_id is distinct from auth.uid() then
    raise exception using errcode = '42501', message = 'Unauthorized.';
  end if;

  insert into public.transactions (
    user_id, type, amount, description, transaction_date, category_id,
    payment_method, card_id, wallet_id, to_card_id, to_wallet_id
  )
  values (
    p_user_id, p_type, p_amount, p_description, p_transaction_date,
    p_category_id, p_payment_method, p_card_id, p_wallet_id, p_to_card_id,
    p_to_wallet_id
  )
  returning id into transaction_id;

  if p_type = 'transfer' then
    perform public.update_card_balance(p_card_id, -p_amount);
    perform public.update_wallet_balance(p_wallet_id, -p_amount);
    perform public.update_card_balance(p_to_card_id, p_amount);
    perform public.update_wallet_balance(p_to_wallet_id, p_amount);
  else
    balance_delta :=
      case when p_type = 'income' then p_amount else -p_amount end;
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
  source_balance numeric;
begin
  if auth.uid() is null then
    raise exception using
      errcode = '42501', message = 'Authentication is required.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception using
      errcode = '22023', message = 'Amount must be greater than zero.';
  end if;

  if p_type in ('expense', 'withdrawal', 'transfer') then
    if (p_card_id is null) = (p_wallet_id is null) then
      raise exception using
        errcode = '22023', message = 'Choose exactly one source account.';
    end if;

    if p_card_id is not null then
      select balance into source_balance
      from public.bank_cards
      where id = p_card_id
        and user_id = auth.uid()
        and is_active = true
      for update;
    else
      select balance into source_balance
      from public.e_wallets
      where id = p_wallet_id
        and user_id = auth.uid()
        and is_active = true
      for update;
    end if;

    if not found then
      raise exception using
        errcode = 'P0002',
        message = 'Source account was not found or is inactive.';
    end if;

    if source_balance < p_amount then
      raise exception using
        errcode = 'P0001', message = 'Insufficient balance.';
    end if;
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

  if existing_transaction.type = 'transfer' then
    perform public.update_card_balance(
      existing_transaction.card_id, existing_transaction.amount
    );
    perform public.update_wallet_balance(
      existing_transaction.wallet_id, existing_transaction.amount
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
        else existing_transaction.amount
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
  p_wallet_id uuid
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

  select * into old_transaction
  from public.transactions
  where id = p_id and user_id = current_user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002', message = 'Transaction was not found.';
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

  if old_transaction.type = 'transfer' then
    perform public.update_card_balance(
      old_transaction.card_id, old_transaction.amount
    );
    perform public.update_wallet_balance(
      old_transaction.wallet_id, old_transaction.amount
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
        else old_transaction.amount
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

    if source_balance < p_amount then
      raise exception using
        errcode = 'P0001', message = 'Insufficient balance.';
    end if;
  end if;

  update public.transactions
  set type = p_type,
      amount = p_amount,
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
    perform public.update_card_balance(p_card_id, -p_amount);
    perform public.update_wallet_balance(p_wallet_id, -p_amount);
    perform public.update_card_balance(p_to_card_id, p_amount);
    perform public.update_wallet_balance(p_to_wallet_id, p_amount);
  else
    balance_delta :=
      case when p_type = 'income' then p_amount else -p_amount end;
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

create or replace function public.update_transaction(
  p_id uuid,
  p_type text,
  p_amount numeric,
  p_description text,
  p_transaction_date date,
  p_category_id uuid,
  p_payment_method text,
  p_card_id uuid default null,
  p_wallet_id uuid default null,
  p_to_card_id uuid default null,
  p_to_wallet_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform public.update_transaction_checked(
    p_amount => p_amount,
    p_card_id => p_card_id,
    p_category_id => p_category_id,
    p_description => p_description,
    p_id => p_id,
    p_payment_method => p_payment_method,
    p_to_card_id => p_to_card_id,
    p_to_wallet_id => p_to_wallet_id,
    p_transaction_date => p_transaction_date,
    p_type => p_type,
    p_wallet_id => p_wallet_id
  );
end;
$$;

create or replace function public.save_monthly_report(
  p_report_month date default current_date
)
returns public.monthly_reports
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  month_start date;
  month_end date;
  report_income numeric := 0;
  report_expense numeric := 0;
  report_withdrawal numeric := 0;
  report_transfer numeric := 0;
  report_transaction_count integer := 0;
  report_categories jsonb := '[]'::jsonb;
  report_accounts jsonb := '[]'::jsonb;
  saved_report public.monthly_reports;
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501', message = 'Authentication is required.';
  end if;

  if p_report_month is null then
    raise exception using
      errcode = '22004', message = 'Report month is required.';
  end if;

  month_start := date_trunc('month', p_report_month)::date;
  month_end := (month_start + interval '1 month')::date;

  if month_start > date_trunc('month', current_date)::date then
    raise exception using
      errcode = '22023',
      message = 'Reports cannot be generated for a future month.';
  end if;

  select
    coalesce(sum(t.amount) filter (where t.type = 'income'), 0),
    coalesce(sum(t.amount) filter (where t.type = 'expense'), 0),
    coalesce(sum(t.amount) filter (where t.type = 'withdrawal'), 0),
    coalesce(sum(t.amount) filter (where t.type = 'transfer'), 0),
    count(*)::integer
  into
    report_income,
    report_expense,
    report_withdrawal,
    report_transfer,
    report_transaction_count
  from public.transactions as t
  where t.user_id = current_user_id
    and t.transaction_date >= month_start
    and t.transaction_date < month_end;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'category_id', category_totals.category_id,
        'category_name', category_totals.category_name,
        'type', category_totals.type,
        'total', category_totals.total
      )
      order by category_totals.total desc
    ),
    '[]'::jsonb
  )
  into report_categories
  from (
    select
      t.category_id,
      coalesce(c.name, 'Uncategorized') as category_name,
      t.type,
      sum(t.amount) as total
    from public.transactions as t
    left join public.categories as c on c.id = t.category_id
    where t.user_id = current_user_id
      and t.transaction_date >= month_start
      and t.transaction_date < month_end
    group by t.category_id, c.name, t.type
  ) as category_totals;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', account_rows.id,
        'kind', account_rows.kind,
        'name', account_rows.name,
        'balance', account_rows.balance,
        'is_active', account_rows.is_active
      )
      order by account_rows.kind, account_rows.name
    ),
    '[]'::jsonb
  )
  into report_accounts
  from (
    select
      card.id,
      'card'::text as kind,
      card.card_name as name,
      card.balance - coalesce((
        select sum(
          case
            when t.type = 'income' and t.card_id = card.id then t.amount
            when t.type in ('expense', 'withdrawal')
              and t.card_id = card.id then -t.amount
            else 0
          end
          + case
              when t.type = 'transfer' and t.card_id = card.id
                then -t.amount
              else 0
            end
          + case
              when t.type = 'transfer' and t.to_card_id = card.id
                then t.amount
              else 0
            end
        )
        from public.transactions as t
        where t.user_id = current_user_id
          and t.transaction_date >= month_end
      ), 0) as balance,
      card.is_active
    from public.bank_cards as card
    where card.user_id = current_user_id
      and card.created_at < month_end::timestamptz

    union all

    select
      wallet.id,
      case
        when wallet.wallet_type = 'cash' then 'cash'
        else 'wallet'
      end as kind,
      wallet.wallet_name as name,
      wallet.balance - coalesce((
        select sum(
          case
            when t.type = 'income' and t.wallet_id = wallet.id then t.amount
            when t.type in ('expense', 'withdrawal')
              and t.wallet_id = wallet.id then -t.amount
            else 0
          end
          + case
              when t.type = 'transfer' and t.wallet_id = wallet.id
                then -t.amount
              else 0
            end
          + case
              when t.type = 'transfer' and t.to_wallet_id = wallet.id
                then t.amount
              else 0
            end
          + case
              when t.type = 'withdrawal' and wallet.wallet_type = 'cash'
                then t.amount
              else 0
            end
        )
        from public.transactions as t
        where t.user_id = current_user_id
          and t.transaction_date >= month_end
      ), 0) as balance,
      wallet.is_active
    from public.e_wallets as wallet
    where wallet.user_id = current_user_id
      and wallet.created_at < month_end::timestamptz
  ) as account_rows;

  insert into public.monthly_reports (
    user_id,
    report_month,
    income_total,
    expense_total,
    withdrawal_total,
    transfer_total,
    net_cashflow,
    transaction_count,
    category_breakdown,
    account_snapshot,
    generated_at
  )
  values (
    current_user_id,
    month_start,
    report_income,
    report_expense,
    report_withdrawal,
    report_transfer,
    report_income - report_expense,
    report_transaction_count,
    report_categories,
    report_accounts,
    timezone('utc', now())
  )
  on conflict (user_id, report_month)
  do update set
    income_total = excluded.income_total,
    expense_total = excluded.expense_total,
    withdrawal_total = excluded.withdrawal_total,
    transfer_total = excluded.transfer_total,
    net_cashflow = excluded.net_cashflow,
    transaction_count = excluded.transaction_count,
    category_breakdown = excluded.category_breakdown,
    account_snapshot = excluded.account_snapshot,
    generated_at = excluded.generated_at,
    updated_at = timezone('utc', now())
  returning * into saved_report;

  return saved_report;
end;
$$;

create or replace function public.sync_monthly_reports()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  first_month date;
  month_cursor date;
  current_month date := date_trunc('month', current_date)::date;
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501', message = 'Authentication is required.';
  end if;

  select coalesce(
    date_trunc('month', min(origins.started_on))::date,
    current_month
  )
  into first_month
  from (
    select min(t.transaction_date) as started_on
    from public.transactions as t
    where t.user_id = current_user_id

    union all

    select min(card.created_at)::date as started_on
    from public.bank_cards as card
    where card.user_id = current_user_id

    union all

    select min(wallet.created_at)::date as started_on
    from public.e_wallets as wallet
    where wallet.user_id = current_user_id
  ) as origins;

  month_cursor := first_month;

  while month_cursor <= current_month loop
    perform public.save_monthly_report(month_cursor);
    month_cursor := (month_cursor + interval '1 month')::date;
  end loop;
end;
$$;

comment on table public.monthly_reports is
  'Automatically rebuilt monthly finance reports with reconstructed month-end account balances.';

comment on function public.sync_monthly_reports() is
  'Rebuilds the authenticated user monthly reports, including months with no transactions.';

revoke all on function public.update_card_balance(uuid, numeric) from public;
revoke all on function public.update_wallet_balance(uuid, numeric) from public;
revoke all on function public.process_transaction(
  text, numeric, text, date, uuid, text, uuid, uuid, uuid, uuid, uuid
) from public;
revoke all on function public.process_transaction_checked(
  numeric, uuid, uuid, text, text, uuid, uuid, date, text, uuid
) from public;
revoke all on function public.delete_transaction(uuid) from public;
revoke all on function public.update_transaction_checked(
  numeric, uuid, uuid, text, uuid, text, uuid, uuid, date, text, uuid
) from public;
revoke all on function public.update_transaction(
  uuid, text, numeric, text, date, uuid, text, uuid, uuid, uuid, uuid
) from public;
revoke all on function public.save_monthly_report(date) from public;
revoke all on function public.sync_monthly_reports() from public;

grant execute on function public.process_transaction_checked(
  numeric, uuid, uuid, text, text, uuid, uuid, date, text, uuid
) to authenticated;
grant execute on function public.delete_transaction(uuid) to authenticated;
grant execute on function public.update_transaction_checked(
  numeric, uuid, uuid, text, uuid, text, uuid, uuid, date, text, uuid
) to authenticated;
grant execute on function public.update_transaction(
  uuid, text, numeric, text, date, uuid, text, uuid, uuid, uuid, uuid
) to authenticated;
grant execute on function public.save_monthly_report(date) to authenticated;
grant execute on function public.sync_monthly_reports() to authenticated;
