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
security invoker
set search_path = ''
as $$
declare
  source_balance numeric;
begin
  if auth.uid() is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception using
      errcode = '22023',
      message = 'Amount must be greater than zero.';
  end if;

  if p_type in ('expense', 'withdrawal', 'transfer') then
    if (p_card_id is null) = (p_wallet_id is null) then
      raise exception using
        errcode = '22023',
        message = 'Choose exactly one source account.';
    end if;

    if p_card_id is not null then
      select balance
      into source_balance
      from public.bank_cards
      where id = p_card_id
        and user_id = auth.uid()
        and is_active = true
      for update;
    else
      select balance
      into source_balance
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
        errcode = 'P0001',
        message = 'Insufficient balance.';
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

revoke all on function public.process_transaction_checked(
  numeric,
  uuid,
  uuid,
  text,
  text,
  uuid,
  uuid,
  date,
  text,
  uuid
) from public;

grant execute on function public.process_transaction_checked(
  numeric,
  uuid,
  uuid,
  text,
  text,
  uuid,
  uuid,
  date,
  text,
  uuid
) to authenticated;

create table if not exists public.monthly_reports (
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

create index if not exists monthly_reports_user_month_idx
  on public.monthly_reports (user_id, report_month desc);

alter table public.monthly_reports enable row level security;

drop policy if exists "Users can manage own monthly reports"
  on public.monthly_reports;

create policy "Users can manage own monthly reports"
  on public.monthly_reports
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on table public.monthly_reports from anon;
grant select, insert, update, delete
  on table public.monthly_reports
  to authenticated;

comment on table public.monthly_reports is
  'Saved monthly finance snapshots. Account balances reflect generation time.';

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
  month_start date := date_trunc('month', p_report_month)::date;
  month_end date := (month_start + interval '1 month')::date;
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
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  if p_report_month is null then
    raise exception using
      errcode = '22004',
      message = 'Report month is required.';
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
      card.balance,
      card.is_active
    from public.bank_cards as card
    where card.user_id = current_user_id

    union all

    select
      wallet.id,
      case
        when wallet.wallet_type = 'cash' then 'cash'
        else 'wallet'
      end as kind,
      wallet.wallet_name as name,
      wallet.balance,
      wallet.is_active
    from public.e_wallets as wallet
    where wallet.user_id = current_user_id
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

revoke all on function public.save_monthly_report(date) from public;
grant execute on function public.save_monthly_report(date) to authenticated;
