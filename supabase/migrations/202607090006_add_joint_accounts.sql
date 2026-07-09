/*
 * Joint-account storage only.
 *
 * Invitation workflows, membership operations, and account-sharing behavior
 * are implemented separately in the application service layer.
 */

create table public.account_memberships (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null
    check (resource_type in ('bank_card', 'e_wallet')),
  resource_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  invited_by uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default timezone('utc', now()),
  constraint account_memberships_resource_user_key
    unique (resource_type, resource_id, user_id)
);

create table public.joint_account_invites (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null
    check (resource_type in ('bank_card', 'e_wallet')),
  resource_id uuid not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null unique,
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint joint_account_invites_acceptance_check check (
    (accepted_by is null and accepted_at is null)
    or (accepted_by is not null and accepted_at is not null)
  )
);

alter table public.transactions
  add column created_by uuid references auth.users(id) on delete set null;

update public.transactions
set created_by = user_id
where created_by is null;

alter table public.transactions
  alter column created_by set default auth.uid();

create index account_memberships_user_idx
  on public.account_memberships(user_id);

create index account_memberships_resource_idx
  on public.account_memberships(resource_type, resource_id);

create index joint_account_invites_owner_idx
  on public.joint_account_invites(owner_id, created_at desc);

alter table public.account_memberships enable row level security;
alter table public.joint_account_invites enable row level security;

-- ═══════════ account_memberships policies ═══════════

create policy "View own or invited memberships"
  on public.account_memberships for select to authenticated
  using (
    user_id = (select auth.uid())
    or invited_by = (select auth.uid())
  );

create policy "Join accounts"
  on public.account_memberships for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Leave or kick members"
  on public.account_memberships for delete to authenticated
  using (
    user_id = (select auth.uid())
    or invited_by = (select auth.uid())
  );

-- ═══════════ joint_account_invites policies ═══════════

create policy "Owners manage invites"
  on public.joint_account_invites for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Read invites for acceptance"
  on public.joint_account_invites for select to authenticated
  using (true);

create policy "Accept pending invites"
  on public.joint_account_invites for update to authenticated
  using (
    accepted_by is null
    and revoked_at is null
    and expires_at > timezone('utc', now())
  )
  with check (
    accepted_by = (select auth.uid())
    and accepted_at is not null
  );

-- ═══════════ Member-aware SELECT policies ═══════════

create policy "Members view shared cards"
  on public.bank_cards for select to authenticated
  using (
    exists (
      select 1 from public.account_memberships
      where resource_type = 'bank_card'
        and resource_id = bank_cards.id
        and user_id = (select auth.uid())
    )
  );

create policy "Members view shared wallets"
  on public.e_wallets for select to authenticated
  using (
    exists (
      select 1 from public.account_memberships
      where resource_type = 'e_wallet'
        and resource_id = e_wallets.id
        and user_id = (select auth.uid())
    )
  );

create policy "Members view shared transactions"
  on public.transactions for select to authenticated
  using (
    exists (
      select 1 from public.account_memberships m
      where m.user_id = (select auth.uid())
        and (
          (m.resource_type = 'bank_card'
            and m.resource_id in (transactions.card_id, transactions.to_card_id))
          or (m.resource_type = 'e_wallet'
            and m.resource_id in (transactions.wallet_id, transactions.to_wallet_id))
        )
    )
  );

-- ═══════════ Grants ═══════════

revoke all on table public.account_memberships from anon;
revoke all on table public.joint_account_invites from anon;

grant select, insert, update, delete
  on table public.account_memberships,
  public.joint_account_invites
  to authenticated;
