
-- Fix security warning: set immutable search_path on all RPC functions
create or replace function update_card_balance(p_id uuid, p_delta numeric)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.bank_cards set balance = balance + p_delta where id = p_id;
end;
$$;

create or replace function update_wallet_balance(p_id uuid, p_delta numeric)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.e_wallets set balance = balance + p_delta where id = p_id;
end;
$$;

-- Fix performance warning: use (select auth.uid()) instead of auth.uid() in categories RLS
-- to avoid re-evaluation per row
drop policy if exists "Categories: Access default or own" on public.categories;
create policy "Categories: Access default or own" on public.categories
  for all
  using (user_id is null or user_id = (select auth.uid()));
;
