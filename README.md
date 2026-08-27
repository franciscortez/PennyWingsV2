# PennyWings V2

PennyWings is a personal-finance app for accounts, transactions and transfers, shared access, budgets, goals, monthly reports, and an authenticated finance assistant.

## Stack and setup

React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Hook Form, Zod, and Supabase Auth/Postgres/RLS/RPCs/Edge Functions.

1. Run `npm install`.
2. Configure `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example` for full reference); never commit or print secrets.
3. Start the local Supabase stack: `npm run db:start` (or `npx supabase start`). The stack is defined entirely by `supabase/config.toml`; starting it applies `supabase/migrations` and then `supabase/seed.sql`. Run `npx supabase status` to print the local URL and keys, and `npm run db:stop` to shut it down.
4. Run `npm run dev`.

Local services: API `http://127.0.0.1:54321`, Postgres `54322`, Studio `http://127.0.0.1:54323`, mail catcher `http://127.0.0.1:54324`. Containers are only created by the CLI, so nothing auto-starts when Docker is opened.

The seed creates two demo logins, `demo@pennywings.local` and `partner@pennywings.local`, both with password `password123`.

### Google sign-in (local)

There is no mock Google provider, so local Google sign-in needs real credentials from an OAuth 2.0 Client (Web application) in the Google Cloud console. Add `http://127.0.0.1:54321/auth/v1/callback` as an Authorized redirect URI on that client, then put the values in `.env` (not `.env.local`) as `GOOGLE_CLIENT_ID` and `GOOGLE_SECRET` and restart the stack.

Two env files are in play and they are read by different tools: the Supabase CLI auto-loads `.env` to resolve the `env(...)` references in `supabase/config.toml`, while Vite loads `.env.local` for the `VITE_*` app variables. Both are gitignored.

The finance assistant requires the `OPENROUTER_API_KEY` function secret. `OPENROUTER_MODEL`, `OPENROUTER_SITE_URL`, and `OPENROUTER_SITE_NAME` are optional.

## Architecture

Dependencies flow from pages/sections through hooks and typed services to Supabase. PostgreSQL is authoritative for authorization, balances, transfers, and reporting. Routes live in `src/App.tsx`; UI in `src/components` and `src/sections`; orchestration in `src/hooks`; database access in `src/services`; validation and application types in their named directories. Migrations under `supabase/migrations` are forward-only.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run lint` | Run ESLint |
| `npm run build` | Type-check and build |
| `npm run db:start` | Start local Supabase via CLI |
| `npm run db:stop` | Stop local Supabase via CLI |
| `npm run test:db` | Run pgTAP database tests |
| `npm run db:lint` | Lint the linked database |
| `npm run db:migrations` | List linked migrations |
| `npm run db:push:dry-run` | Preview migration application |
| `npm run db:types` | Regenerate database types |

Linked database commands require authenticated Supabase CLI access and appropriate scope. Developer safeguards are in `AGENTS.md`; detailed on-demand maps are in `.agents/skills/understand-pennywings`. Current code, `package.json`, generated types, and migrations take precedence over documentation.
