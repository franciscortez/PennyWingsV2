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
        when wallet.wallet_type = 'lent' then 'lent'
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
