# Supabase Migration Baseline

`supabase/migrations/202607090005_add_bill_and_allowance_expense_categories.sql`
replaces the previous PennyWings migration chain with one current-state schema
migration. Its historical filename is intentionally retained because the
Supabase CLI matches both migration version and migration name.

The baseline contains:

- All application-owned public tables, constraints, indexes, and RLS policies.
- Current default income and expense categories.
- Transaction balance RPCs and monthly report RPCs.
- The current ownership model, where each account has one canonical owner in
  `user_id`.

Joint-account membership and invitation tables are intentionally deferred to a
new forward-only migration. Keeping `user_id` as the owner makes it possible to
add shared access without losing ownership or rewriting existing records.

## Existing linked project

The linked project already has schema version `202607090005` applied. Do not
push the baseline into that existing schema. First replace the old migration
history entries with the single retained baseline entry:

```powershell
npm run db:baseline:repair
```

Then verify:

```powershell
npm run db:migrations
npm run db:push:dry-run
```

The migration list should contain only `202607090005` on both sides, and the
dry run should report that the linked project is up to date.

`migration repair` changes migration-history records only. It does not execute
or reverse schema SQL.

## Fresh project

On an empty Supabase project, link the project and run:

```powershell
npm run db:push
npm run db:types
npm run build
```

The baseline creates the full current schema in one pass.
