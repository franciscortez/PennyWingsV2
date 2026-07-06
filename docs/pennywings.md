# PennyWings V2 Analysis Brief

Use this file as the standing context brief for PennyWings V2. When this file is mentioned in a future Codex request, first read this document, then read the current local codebase, then compare the current state against the original PennyWings repository:

`https://github.com/franciscortez/PennyWings`

Do not assume this document is perfectly current. Treat it as the product and architecture intent, then verify the actual status from source files before making recommendations or edits.

## App Purpose

PennyWings is a personal finance tracker for managing everyday money across bank cards, e-wallets, cash, budgets, goals, and transactions. The app is designed for users who want a polished, friendly interface while still getting accurate financial records and useful summaries.

The core product loop is:

1. Create accounts: bank cards, digital banks, e-wallets, and cash.
2. Record money movement: income, expenses, withdrawals, and transfers.
3. Keep balances accurate across accounts.
4. Review financial health through dashboard, budgets, goals, and reports.
5. Adjust profile and account settings safely.

V2 is a rebuild of the original PennyWings app. The goal is to keep the full visual direction and product behavior, but rebuild the frontend and backend structure so the codebase is easier to understand, safer to extend, and more production ready.

## V2 Direction

V2 should not blindly copy files from the original repo. Use the original repo as a behavior and design reference, then rebuild modules in the V2 style:

- React + TypeScript.
- Clear feature sections under `src/pages`, `src/sections`, `src/hooks`, `src/services`, `src/types`, and `src/validation`.
- Supabase access isolated behind service modules.
- Forms validated through Zod or equivalent typed validation.
- Shared UI components kept small and reusable.
- Production data mutations handled safely, especially balance-changing transactions.

The design should remain recognizably PennyWings: pink-forward, soft, polished, friendly, finance-focused, and mobile-conscious. The structure should become more professional than V1: typed, predictable, modular, and careful around money mutation logic.

## Current V2 Status

As of this analysis, V2 contains these implemented areas:

- Public landing page: `src/pages/Home.tsx`.
- Auth pages: login, register, forgot password, reset password.
- Supabase client: `src/lib/supabase.ts`.
- Auth provider/context: `src/context/AuthContext.tsx`.
- Protected/public route guards.
- Dashboard shell and dashboard data aggregation.
- Accounts page with list, search, tab filters, and account creation wizard.
- Shared layout with desktop sidebar and mobile navigation.
- Supabase schema documentation in `docs/supabase-tables.md`.

V2 currently has these notable gaps:

- Transactions route is still `ComingSoon`.
- Profile/settings route is still `ComingSoon`.
- Reports route is still `ComingSoon`.
- Monitoring route for budgets/goals is still `ComingSoon`.
- Calculator route is still `ComingSoon`.
- Accounts are create/list only; edit, archive/delete, last four digits, and wallet identifiers are not yet exposed.
- React Query is installed but not yet used as the main server-state layer.
- Supabase database types are not generated into the repo.
- `README.md` still reads like the Vite template and does not describe the real app.
- `docs/supabase-tables.md` says the app has no Supabase usage, but the current app now does use Supabase. Update this doc when backend work stabilizes.

Verification already observed:

- `npm.cmd run build` passes.
- `npx.cmd eslint src --ext .ts,.tsx` passes.
- `npm.cmd run lint` may fail if analysis artifacts or cloned reference repos exist under `.agents`, because ESLint scans everything.

## Original Repo Role

The original PennyWings repository is the feature reference. It includes mature implementations for:

- Transactions page and transaction form.
- Transaction pagination, filtering, editing, and deletion.
- Balance-changing Supabase RPC calls such as `process_transaction`, `update_transaction`, and `delete_transaction`.
- Bank card and e-wallet hooks.
- Category, budget, goal, and report hooks.
- Monitoring page for budgets and goals.
- Reports page with chart-oriented analytics.
- Profile page with update password/profile/delete account flows.
- Realtime sync using Supabase channels and query invalidation.
- AI assistant integration through Gemini.
- Calculator page.

Important: the original repo is JavaScript/JSX and more feature-complete, but not the final architecture target. It has useful product behavior and mutation logic, but V2 should port concepts into TypeScript with cleaner boundaries.

## Recommended Next Work

The next highest-value module is Transactions.

Reason: the dashboard and accounts page already show account balances and recent activity, but users cannot create the activity that changes those balances. Until Transactions exists, the app is mostly a display shell with account setup. Transactions also unlock useful behavior for dashboard, reports, budgets, and goals.

Build this next:

1. Add typed transaction models and schemas.
2. Add `transactionsService.ts` with Supabase reads and RPC-backed mutations.
3. Add hooks for transaction list state, pagination/filtering, and create/update/delete.
4. Add a V2-styled Transactions page.
5. Add a transaction form for income, expense, withdrawal, and transfer.
6. Fetch categories and active accounts for form dropdowns.
7. Use the existing Supabase RPC pattern from the original app for balance-changing operations.
8. Refresh dashboard/accounts data after transaction mutation.

Do not implement Reports or Monitoring before Transactions unless specifically requested. Those modules depend on trustworthy transaction data.

## Backend Structure Goals

Make backend-facing code production ready before adding too many pages.

Priorities:

- Generate and commit Supabase TypeScript database types.
- Prefer typed table row aliases from generated types instead of hand-written row casts.
- Keep all Supabase `.from(...)` and `.rpc(...)` calls inside `src/services`.
- Keep UI components unaware of Supabase response shapes.
- Put money mutation rules in server-side RPCs or database functions, not scattered client arithmetic.
- Document required RPC signatures and expected behavior.
- Avoid direct destructive deletes for financial records unless the product intentionally supports them; consider soft delete or reversible history for accounts.
- Ensure `updated_at` behavior is handled intentionally, since the documented database currently has no custom trigger for automatic updates.
- Add focused tests or at least validation coverage around transaction payload building.

Suggested backend-oriented structure:

```text
src/
  lib/
    supabase.ts
    database.types.ts
  services/
    accountsService.ts
    authService.ts
    categoriesService.ts
    transactionsService.ts
    budgetsService.ts
    goalsService.ts
    reportsService.ts
  hooks/
    useAccountsData.ts
    useTransactionsData.ts
    useCategoriesData.ts
  validation/
    accountSchemas.ts
    transactionSchemas.ts
  types/
    accounts.ts
    transactions.ts
```

## Analysis Protocol For Future Runs

When asked to use this file:

1. Read this file first.
2. Inspect the current local V2 codebase with `rg --files`.
3. Read `package.json`, `src/App.tsx`, `src/lib/supabase.ts`, route pages, services, hooks, and validation files.
4. Read `docs/supabase-tables.md` for database shape, but verify whether it has become stale.
5. Inspect the original repo only as a reference for behavior and design. Do not copy large files directly.
6. Identify which V2 modules are complete, partial, or missing.
7. Recommend the next smallest production-ready step.
8. If making code changes, keep them in V2 style and preserve the existing design language.

Avoid these mistakes:

- Do not expose `.env` values.
- Do not clone the reference repo into the project unless the user asks for it.
- Do not use screenshots unless the user asks for visual QA.
- Do not port V1 wholesale into V2.
- Do not add a new backend abstraction unless it clearly improves safety or clarity.

## Product Completion Order

Recommended order from here:

1. Transactions.
2. Account edit/archive/details.
3. Categories support if needed by Transactions.
4. Monitoring: budgets and goals.
5. Reports.
6. Profile/settings.
7. Realtime sync and React Query migration.
8. Calculator.
9. AI assistant.
10. README and deployment documentation cleanup.

Transactions should come first because it is the central money movement workflow. Everything else becomes more useful once transactions are reliable.
