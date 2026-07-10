/*
 * Secure joint-account invitation acceptance.
 *
 * Clients may create and list their own invitations, but accepting or
 * revoking an invitation now goes through RPCs so membership creation and
 * invite state changes happen atomically under database validation.
 */

drop policy if exists "Owners manage invites"
  on public.joint_account_invites;
drop policy if exists "Read invites for acceptance"
  on public.joint_account_invites;
drop policy if exists "Accept pending invites"
  on public.joint_account_invites;
drop policy if exists "Join accounts"
  on public.account_memberships;

create policy "Owners create invites"
  on public.joint_account_invites for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners view invites"
  on public.joint_account_invites for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owners delete invites"
  on public.joint_account_invites for delete to authenticated
  using (owner_id = (select auth.uid()));

create or replace function public.accept_joint_account_invite(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  invite_record public.joint_account_invites%rowtype;
  normalized_code text;
  normalized_hash text;
  resource_is_valid boolean;
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  normalized_code := upper(trim(coalesce(p_code, '')));

  if normalized_code !~ '^WING-[0-9]{6}$' then
    raise exception using
      errcode = '22023',
      message = 'Invalid invitation code.';
  end if;

  normalized_hash := encode(
    extensions.digest(normalized_code, 'sha256'),
    'hex'
  );

  select *
  into invite_record
  from public.joint_account_invites
  where code_hash = normalized_hash
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Invalid invitation code.';
  end if;

  if invite_record.accepted_by is not null then
    raise exception using
      errcode = '23505',
      message = 'This invitation has already been used.';
  end if;

  if invite_record.revoked_at is not null then
    raise exception using
      errcode = '22023',
      message = 'This invitation has been revoked.';
  end if;

  if invite_record.expires_at <= timezone('utc', now()) then
    raise exception using
      errcode = '22023',
      message = 'This invitation has expired.';
  end if;

  if invite_record.owner_id = current_user_id then
    raise exception using
      errcode = '23505',
      message = 'You already own this account.';
  end if;

  if invite_record.resource_type = 'bank_card' then
    select exists (
      select 1
      from public.bank_cards
      where id = invite_record.resource_id
        and user_id = invite_record.owner_id
        and is_active = true
    ) into resource_is_valid;
  elsif invite_record.resource_type = 'e_wallet' then
    select exists (
      select 1
      from public.e_wallets
      where id = invite_record.resource_id
        and user_id = invite_record.owner_id
        and is_active = true
    ) into resource_is_valid;
  else
    resource_is_valid := false;
  end if;

  if not resource_is_valid then
    raise exception using
      errcode = 'P0002',
      message = 'The shared account was not found or is inactive.';
  end if;

  perform 1
  from public.account_memberships
  where resource_type = invite_record.resource_type
    and resource_id = invite_record.resource_id
    and user_id = current_user_id;

  if found then
    raise exception using
      errcode = '23505',
      message = 'You are already a member of this account.';
  end if;

  insert into public.account_memberships (
    invited_by,
    resource_id,
    resource_type,
    user_id
  )
  values (
    invite_record.owner_id,
    invite_record.resource_id,
    invite_record.resource_type,
    current_user_id
  );

  update public.joint_account_invites
  set accepted_at = timezone('utc', now()),
      accepted_by = current_user_id
  where id = invite_record.id;
end;
$$;

create or replace function public.revoke_joint_account_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  update public.joint_account_invites
  set revoked_at = timezone('utc', now())
  where id = p_invite_id
    and owner_id = current_user_id
    and accepted_by is null
    and revoked_at is null;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Invitation was not found or cannot be revoked.';
  end if;
end;
$$;

revoke all on function public.accept_joint_account_invite(text) from public;
revoke all on function public.revoke_joint_account_invite(uuid) from public;

grant execute on function public.accept_joint_account_invite(text)
  to authenticated;
grant execute on function public.revoke_joint_account_invite(uuid)
  to authenticated;

revoke insert, update on table public.account_memberships from authenticated;
revoke update on table public.joint_account_invites from authenticated;
