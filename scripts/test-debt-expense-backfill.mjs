import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

// Deliberately targets only the disposable validation stack, never a linked DB.
const container = 'supabase_db_PennyWingsV2-debt-check'
const migration = readFileSync(new URL('../supabase/migrations/20261009131011_record_debt_repayments_as_expenses.sql', import.meta.url), 'utf8')
const sql = `
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(10);

-- Restore the schema before this migration within a rollback-only transaction.
drop trigger sync_debt_payment_expense on public.debt_payments;
drop trigger protect_debt_payment_expense on public.transactions;
drop function private.sync_debt_payment_expense();
drop function private.protect_debt_payment_expense();
alter table public.transactions drop column debt_payment_id;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000099', '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'backfill-99@example.test', '', now(), now(), now());
insert into public.bank_cards (id, user_id, card_name, card_type, balance, is_active, status)
values ('00000000-0000-0000-0000-000000000991', '00000000-0000-0000-0000-000000000099', 'Backfill Card', 'debit', 5000, true, 'active');
insert into public.debts (id, user_id, provider_name, debt_type, original_amount, outstanding_amount)
values ('00000000-0000-0000-0000-000000009901', '00000000-0000-0000-0000-000000000099', 'Legacy Provider', 'bnpl', 3000, 2000);
insert into public.debt_payments (id, debt_id, user_id, amount, payment_date, payment_method, card_id, status)
values
  ('00000000-0000-0000-0000-000000009910', '00000000-0000-0000-0000-000000009901', '00000000-0000-0000-0000-000000000099', 1000, current_date, 'card', '00000000-0000-0000-0000-000000000991', 'completed'),
  ('00000000-0000-0000-0000-000000009911', '00000000-0000-0000-0000-000000009901', '00000000-0000-0000-0000-000000000099', 2000, current_date, 'card', '00000000-0000-0000-0000-000000000991', 'reversed');

${migration}

select is((select count(*)::int from public.transactions where debt_payment_id = '00000000-0000-0000-0000-000000009910'), 1, 'backfills completed payment exactly once');
select is((select amount from public.transactions where debt_payment_id = '00000000-0000-0000-0000-000000009910'), 1000::numeric, 'backfill preserves payment amount');
select is((select transaction_date from public.transactions where debt_payment_id = '00000000-0000-0000-0000-000000009910'), current_date, 'backfill preserves payment date');
select is((select count(*)::int from public.transactions where debt_payment_id = '00000000-0000-0000-0000-000000009911'), 0, 'does not backfill reversed payment');
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000991'), 5000::numeric, 'backfill never deducts balances again');
select is((select outstanding_amount from public.debts where id = '00000000-0000-0000-0000-000000009901'), 2000::numeric, 'backfill leaves debt balance unchanged');

set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000099';
set local role authenticated;
select public.sync_monthly_reports();
select is((select expense_total from public.monthly_reports where user_id = '00000000-0000-0000-0000-000000000099' and report_month = date_trunc('month', current_date)::date), 1000::numeric, 'reports include backfilled repayment');
select public.reverse_debt_payment_checked('00000000-0000-0000-0000-000000009910', 'Legacy reversal');
reset role;
select is((select count(*)::int from public.transactions where debt_payment_id = '00000000-0000-0000-0000-000000009910'), 0, 'legacy reversal removes backfilled expense');
select is((select balance from public.bank_cards where id = '00000000-0000-0000-0000-000000000991'), 6000::numeric, 'legacy reversal refunds exactly once');
select is((select status from public.debt_payments where id = '00000000-0000-0000-0000-000000009910'), 'reversed', 'legacy reversal retains audit history');
select * from finish();
rollback;
`
const result = spawnSync('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At'], {
  input: sql, encoding: 'utf8',
})
if (result.error) throw result.error
const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
console.log(output)
process.exit(result.status === 0 && !/^not ok|^# Looks like/m.test(output) && /^ok 10 /m.test(output) ? 0 : 1)
