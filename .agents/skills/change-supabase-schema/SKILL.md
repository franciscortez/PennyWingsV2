---
name: change-supabase-schema
description: Design, implement, and verify PennyWings Supabase changes involving migrations, tables, columns, indexes, constraints, RLS, grants, triggers, RPCs, or generated database types. Use whenever SQL or the database contract changes. Do not use to push a remote migration unless the user explicitly requests that operation.
---

# Change the Supabase Schema

Create a forward-only, least-privilege database change whose client contract and operational consequences are explicit.

## Preflight

1. Read the database rules in root `AGENTS.md`; inspect the worktree without disturbing unrelated changes.
2. Search every migration that creates or later alters the affected objects, policies, grants, triggers, and functions.
3. Trace all calling services, RPC type definitions, query invalidations, and assumptions about nullability, defaults, precision, and dates.
4. Record whether the change affects authorization, financial invariants, existing rows, locks, or backward compatibility.

## Implement

1. Add one timestamped, descriptive migration. Do not edit an existing migration to change deployed behavior.
2. Make constraints, data backfills, defaults, indexes, RLS, and grants explicit. Order statements so existing data remains valid.
3. For privileged functions, schema-qualify objects, set a safe `search_path`, derive identity from `auth.uid()`, and grant execution narrowly.
4. Make multi-row financial work atomic and concurrency-safe. Validate ownership/membership and reject invalid amounts or account relationships inside the database.
5. Update service calls and regenerate database types when the public contract changes. Never hand-edit generated types as a substitute.

## Verify

1. Read the migration as the final database state, including interactions with older policies/functions.
2. Run `npm run db:lint` and `npm run db:migrations` when linked-environment access is permitted.
3. Run `npm run db:push:dry-run` only when environment access and task scope allow it.
4. Run `npm run db:types` when the contract changed, inspect the generated diff, then run `npm run build`.
5. Invoke `$review-financial-integrity` for account, balance, transaction, transfer, budget, sharing, or reporting changes.

## Operational boundary

Do not run `npm run db:push`, reset a database, repair migration history, or modify production data without an explicit user request and confirmed target. Report the migration filename, compatibility/backfill implications, grants/RLS decisions, and any environment-dependent check not run.
