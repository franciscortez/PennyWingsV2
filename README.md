# PennyWings V2

PennyWings is a personal-finance app for accounts, transactions and transfers, shared access, budgets, goals, monthly reports, and an authenticated finance assistant.

## Stack and setup

React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod, and Supabase Auth/Postgres/RLS/RPCs/Edge Functions.

1. Run `npm install`.
2. Create `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; never commit or print it.
3. Run `npm run dev`.

The finance assistant requires the `OPENROUTER_API_KEY` function secret. `OPENROUTER_MODEL`, `OPENROUTER_SITE_URL`, and `OPENROUTER_SITE_NAME` are optional.

## Architecture

Dependencies flow from pages/sections through hooks and typed services to Supabase. PostgreSQL is authoritative for authorization, balances, transfers, and reporting. Routes live in `src/App.tsx`; UI in `src/components` and `src/sections`; orchestration in `src/hooks`; database access in `src/services`; validation and application types in their named directories. Migrations under `supabase/migrations` are forward-only.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite |
| `npm run lint` | Run ESLint |
| `npm run build` | Type-check and build |
| `npm run db:lint` | Lint the linked database |
| `npm run db:migrations` | List linked migrations |
| `npm run db:push:dry-run` | Preview migration application |
| `npm run db:types` | Regenerate database types |

Linked database commands require authenticated Supabase CLI access and appropriate scope. Developer safeguards are in `AGENTS.md`; detailed on-demand maps are in `.agents/skills/understand-pennywings`. Current code, `package.json`, generated types, and migrations take precedence over documentation.
