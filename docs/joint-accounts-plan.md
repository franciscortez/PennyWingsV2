# Joint Accounts Plan

Joint accounts will be added after the current schema baseline as a new,
forward-only migration. The existing `user_id` on cards and wallets remains
the canonical owner.

## Invitation flow

1. The owner chooses an account to share.
2. A server-side RPC generates a one-time code containing random text and six
   random digits, for example `WING-482731`.
3. Only a cryptographic hash of the code is stored. The plain code is returned
   once to the owner.
4. Another authenticated user enters the code.
5. A server-side acceptance RPC locks and validates the invitation, then adds
   that user as an account member.
6. The code expires after a short period and cannot be reused after acceptance.

The code must be generated with PostgreSQL cryptographic randomness, not
`Math.random()` in the browser.

## Planned tables

### `account_memberships`

- `id`
- `resource_type`: `bank_card` or `e_wallet`
- `resource_id`
- `user_id`
- `role`: initially `member`; later extensible to `viewer` or `editor`
- `invited_by`
- `joined_at`
- Unique constraint on `resource_type`, `resource_id`, and `user_id`

### `joint_account_invites`

- `id`
- `resource_type`
- `resource_id`
- `owner_id`
- `code_hash`
- `expires_at`
- `accepted_by`
- `accepted_at`
- `revoked_at`
- `created_at`

## Access and audit requirements

- Owners keep full edit/archive/invitation control.
- Members can see the shared account and its transactions.
- Balance-changing RPCs must authorize either the owner or an accepted member.
- Transactions should gain `created_by` so joint activity identifies the actor.
- Invitation lookup and acceptance happen only through RPCs; raw invitation
  rows and code hashes are never readable from the client.
- RLS helper functions must use fixed `search_path` values and avoid recursive
  membership-policy checks.
