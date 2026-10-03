-- Add status column to bank_cards
alter table public.bank_cards
  add column if not exists status text not null default 'active'
  check (status in ('active', 'archived', 'deleted'));

-- Add status column to e_wallets
alter table public.e_wallets
  add column if not exists status text not null default 'active'
  check (status in ('active', 'archived', 'deleted'));

-- Backfill existing rows based on is_active
update public.bank_cards
set status = case when is_active = true then 'active' else 'archived' end;

update public.e_wallets
set status = case when is_active = true then 'active' else 'archived' end;

-- Lookup indexes for status filtering
create index if not exists idx_bank_cards_user_status
  on public.bank_cards(user_id, status);

create index if not exists idx_e_wallets_user_status
  on public.e_wallets(user_id, status);
