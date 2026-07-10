/*
 * Add explicit shared-account permissions and allow transactor members to
 * create transactions on the account owner's ledger.
 */

update public.account_memberships
set role = 'viewer'
where role not in ('viewer', 'transactor');

alter table public.account_memberships
  alter column role set default 'viewer';

alter table public.account_memberships
  add constraint account_memberships_role_check
  check (role in ('viewer', 'transactor'));

alter table public.joint_account_invites
  add column role text not null default 'viewer';

alter table public.joint_account_invites
  add constraint joint_account_invites_role_check
  check (role in ('viewer', 'transactor'));

create or replace function public.can_view_account(
  p_resource_type text,
  p_resource_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_resource_type
    when 'bank_card' then exists (
      select 1
      from public.bank_cards as account
      where account.id = p_resource_id
        and (
          account.user_id = auth.uid()
          or exists (
            select 1
            from public.account_memberships as membership
            where membership.resource_type = 'bank_card'
              and membership.resource_id = account.id
              and membership.user_id = auth.uid()
          )
        )
    )
    when 'e_wallet' then exists (
      select 1
      from public.e_wallets as account
      where account.id = p_resource_id
        and (
          account.user_id = auth.uid()
          or exists (
            select 1
            from public.account_memberships as membership
            where membership.resource_type = 'e_wallet'
              and membership.resource_id = account.id
              and membership.user_id = auth.uid()
          )
        )
    )
    else false
  end;
$$;

create or replace function public.can_transact_account(
  p_resource_type text,
  p_resource_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case p_resource_type
    when 'bank_card' then exists (
      select 1
      from public.bank_cards as account
      where account.id = p_resource_id
        and account.is_active = true
        and (
          account.user_id = auth.uid()
          or exists (
            select 1
            from public.account_memberships as membership
            where membership.resource_type = 'bank_card'
              and membership.resource_id = account.id
              and membership.user_id = auth.uid()
              and membership.role = 'transactor'
          )
        )
    )
    when 'e_wallet' then exists (
      select 1
      from public.e_wallets as account
      where account.id = p_resource_id
        and account.is_active = true
        and (
          account.user_id = auth.uid()
          or exists (
            select 1
            from public.account_memberships as membership
            where membership.resource_type = 'e_wallet'
              and membership.resource_id = account.id
              and membership.user_id = auth.uid()
              and membership.role = 'transactor'
              and account.wallet_type not in ('cash', 'lent')
          )
        )
    )
    else false
  end;
$$;

create or replace function public.get_account_owner(
  p_resource_type text,
  p_resource_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select case p_resource_type
    when 'bank_card' then (
      select user_id from public.bank_cards where id = p_resource_id
    )
    when 'e_wallet' then (
      select user_id from public.e_wallets where id = p_resource_id
    )
    else null
  end;
$$;

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
        and wallet_type not in ('cash', 'lent')
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
    role,
    user_id
  )
  values (
    invite_record.owner_id,
    invite_record.resource_id,
    invite_record.resource_type,
    invite_record.role,
    current_user_id
  );

  update public.joint_account_invites
  set accepted_at = timezone('utc', now()),
      accepted_by = current_user_id
  where id = invite_record.id;
end;
$$;

create or replace function public.update_account_member_role(
  p_membership_id uuid,
  p_role text
)
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
      errcode = '42501', message = 'Authentication is required.';
  end if;

  if p_role not in ('viewer', 'transactor') then
    raise exception using
      errcode = '22023', message = 'Choose a valid account role.';
  end if;

  update public.account_memberships as membership
  set role = p_role
  where membership.id = p_membership_id
    and membership.invited_by = current_user_id
    and public.get_account_owner(
      membership.resource_type,
      membership.resource_id
    ) = current_user_id;

  if not found then
    raise exception using
      errcode = 'P0002', message = 'Account member was not found.';
  end if;
end;
$$;

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
  where id = p_id
    and public.can_transact_account('bank_card', p_id);
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
  where id = p_id
    and public.can_transact_account('e_wallet', p_id);
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
  source_owner_id uuid;
begin
  source_owner_id := case
    when p_card_id is not null
      then public.get_account_owner('bank_card', p_card_id)
    when p_wallet_id is not null
      then public.get_account_owner('e_wallet', p_wallet_id)
    else null
  end;

  if source_owner_id is distinct from p_user_id
    or (
      p_card_id is not null
      and not public.can_transact_account('bank_card', p_card_id)
    )
    or (
      p_wallet_id is not null
      and not public.can_transact_account('e_wallet', p_wallet_id)
    ) then
    raise exception using errcode = '42501', message = 'Unauthorized.';
  end if;

  insert into public.transactions (
    user_id, created_by, type, amount, description, transaction_date,
    category_id, payment_method, card_id, wallet_id, to_card_id, to_wallet_id
  )
  values (
    p_user_id, auth.uid(), p_type, p_amount, p_description,
    p_transaction_date, p_category_id, p_payment_method, p_card_id,
    p_wallet_id, p_to_card_id, p_to_wallet_id
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
      where user_id = p_user_id
        and wallet_type = 'cash'
        and is_active = true
      limit 1
      for update;

      if cash_wallet_id is not null then
        update public.e_wallets
        set balance = balance + p_amount
        where id = cash_wallet_id;
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
  current_user_id uuid := auth.uid();
  source_balance numeric;
  source_owner_id uuid;
  source_wallet_type text;
  destination_found boolean;
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

    select balance, user_id
    into source_balance, source_owner_id
    from public.bank_cards
    where id = p_card_id
      and is_active = true
      and public.can_transact_account('bank_card', p_card_id)
    for update;
  else
    select balance, user_id, wallet_type
    into source_balance, source_owner_id, source_wallet_type
    from public.e_wallets
    where id = p_wallet_id
      and is_active = true
      and public.can_transact_account('e_wallet', p_wallet_id)
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
      message = 'Source account was not found, inactive, or read-only.';
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
        select 1
        from public.bank_cards
        where id = p_to_card_id
          and user_id = source_owner_id
          and is_active = true
          and public.can_transact_account('bank_card', p_to_card_id)
      ) into destination_found;
    else
      select exists (
        select 1
        from public.e_wallets
        where id = p_to_wallet_id
          and user_id = source_owner_id
          and is_active = true
          and public.can_transact_account('e_wallet', p_to_wallet_id)
      ) into destination_found;
    end if;

    if not destination_found then
      raise exception using
        errcode = 'P0002',
        message = 'Destination must belong to the same owner and allow transactions.';
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
    and (
      user_id is null
      or user_id = current_user_id
      or user_id = source_owner_id
    );

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Choose a valid category for this transaction.';
  end if;

  if p_type in ('expense', 'withdrawal', 'transfer')
    and source_balance < p_amount then
    raise exception using
      errcode = 'P0001', message = 'Insufficient balance.';
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
    p_user_id => source_owner_id,
    p_wallet_id => p_wallet_id
  );
end;
$$;

create policy "Members view shared transaction categories"
  on public.categories for select to authenticated
  using (
    exists (
      select 1
      from public.transactions as tx
      where tx.category_id = categories.id
        and (
          tx.user_id = (select auth.uid())
          or exists (
            select 1
            from public.account_memberships as membership
            where membership.user_id = (select auth.uid())
              and (
                (membership.resource_type = 'bank_card'
                  and membership.resource_id in (
                    tx.card_id,
                    tx.to_card_id
                  ))
                or (membership.resource_type = 'e_wallet'
                  and membership.resource_id in (
                    tx.wallet_id,
                    tx.to_wallet_id
                  ))
              )
          )
        )
    )
  );

revoke all on function public.can_view_account(text, uuid) from public;
revoke all on function public.can_transact_account(text, uuid) from public;
revoke all on function public.get_account_owner(text, uuid) from public;
revoke all on function public.update_account_member_role(uuid, text) from public;

grant execute on function public.update_account_member_role(uuid, text)
  to authenticated;
