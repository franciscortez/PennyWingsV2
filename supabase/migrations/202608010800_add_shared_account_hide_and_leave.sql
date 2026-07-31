/* Per-member "hide shared account" preference + self-service leave support.
   Leaving already works via existing RLS policy "Leave or kick members"
   (account_memberships DELETE, user_id = auth.uid()) — no schema change needed for that. */

alter table account_memberships
  add column is_hidden boolean not null default false;

/* update/insert on account_memberships is revoked from `authenticated` directly
   (see 202607100001_secure_joint_account_invites.sql), so hiding must go through
   this RPC. Only the member themself may toggle their own row — not the owner. */
create or replace function set_account_membership_hidden(
  p_membership_id uuid,
  p_hidden boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update account_memberships
  set is_hidden = p_hidden
  where id = p_membership_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Membership not found or not owned by caller';
  end if;
end;
$$;

grant execute on function set_account_membership_hidden(uuid, boolean) to authenticated;
