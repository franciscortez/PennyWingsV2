# PennyWings Agent Guide

## Core workflow

- Read the request, `git status --short`, and the smallest relevant source slice. Preserve unrelated changes and keep diffs reviewable.
- Current code, `package.json`, generated database types, and ordered migrations are authoritative; documentation may lag.
- Follow `page/section/component -> hook -> service -> Supabase`. Keep database access out of presentation code; use TanStack Query, typed services, Zod, and `@/` imports.
- Use `$understand-pennywings` for repository-wide analysis, onboarding, architecture questions, or cross-domain work. Its references contain detailed project maps.

## Non-negotiable safeguards

- The database owns balances, ownership, membership, and money invariants. Use checked atomic RPCs for balance-affecting multi-row work; never do browser read-modify-write arithmetic.
- Review owner/member access with RLS, grants, and `SECURITY DEFINER`. Derive identity from `auth.uid()` and preserve precision, signs, transfer symmetry, and reporting boundaries.
- Never expose `.env` values, secrets, tokens, or personal financial data. Do not commit, push, deploy, run remote migrations, mutate production data, or add dependencies unless explicitly requested.
- Migrations are forward-only. Never rewrite deployed history or hand-edit generated database types to simulate schema changes.

## Required skills

- `$implement-frontend-feature`: React UI, forms, hooks, services, and query-backed behavior.
- `$change-supabase-schema`: schema, RLS, grants, triggers, RPCs, migrations, or generated types.
- `$review-financial-integrity`: accounts, balances, transactions, transfers, budgets, shared access, reports, or money-derived UI.
- `$verify-pennywings-change`: proportional validation after implementation or before handoff.
- `$prepare-git-change`: staging, commits, branches, PR preparation, or final handoff.
- `$maintain-ai-workflow`: this guide, repository skills, metadata, or reusable AI practices.

## Validation and Git

- Documentation/AI: inspect text and metadata, validate changed skills, and run `git diff --check`.
- TypeScript/UI: run `npm run lint` and `npm run build`.
- Database: follow `$change-supabase-schema`; run linked checks only when permitted, refresh types after contract changes, then build.
- There is no automated test script. Report exactly what ran; never call lint/build tests.
- Use `<type>(<scope>): <imperative summary>`. Stage only named reviewed paths; never discard user work or use destructive Git commands.

## Context maintenance

- Keep this as the only `AGENTS.md`; move detailed reusable procedures into focused skills.
- Update `$understand-pennywings` references after material architecture, command, migration, or domain changes. Audit quarterly or at major milestones.
- Treat local memories as generated recall, not mandatory policy. Never put secrets in memory-worthy prompts or manually edit `~/.codex/memories/`.
