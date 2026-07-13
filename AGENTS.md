# PennyWings Agent Guide

## Scope and priorities

These instructions apply to the whole repository and are the only repository `AGENTS.md`. Do not create nested `AGENTS.md` files; keep universal and path-specific rules centralized here, and move detailed repeatable procedures into focused skills under `.agents/skills`.

Optimize for correctness, financial integrity, security, and a small reviewable diff. Preserve unrelated user changes. Do not commit, push, deploy, run a remote database migration, or mutate production data unless the user explicitly asks.

## Repository map

- `src/pages` owns route-level composition; `src/sections` owns page/domain sections; `src/components` owns reusable UI.
- `src/hooks` owns TanStack Query orchestration and reusable client state.
- `src/services` is the application boundary for Supabase reads, writes, and RPC calls.
- `src/validation` owns Zod schemas; `src/types` owns application-facing domain and UI types.
- `src/lib` owns shared clients and infrastructure helpers, including the generated `database.types.ts` contract.
- `supabase/migrations` is the forward-only history for schema, RLS, grants, and database functions.
- `docs` provides product context but may lag the implementation. Treat current code, `package.json`, and migrations as authoritative when they disagree.

The main dependency flow is `page/section/component -> hook -> service -> Supabase`. Keep database calls out of presentation components.

## Working method

1. Read the user request, this `AGENTS.md`, `git status --short`, and the smallest relevant slice of code and migrations.
2. Identify the affected domain and trace its types, validation, service, query/mutation hook, UI, and database contract before editing.
3. State assumptions that can change behavior. Prefer the smallest complete vertical change and reuse established patterns.
4. Protect the worktree: never discard, overwrite, reformat, or stage unrelated edits. Do not use destructive Git commands.
5. Validate in proportion to risk and report exactly what passed, failed, or was not run.

Use `rg`/`rg --files` for discovery. Do not expose `.env` values, tokens, passwords, or personal financial data in output, logs, fixtures, or commits.

## Engineering rules

- Keep TypeScript strict. Avoid `any`, unsafe assertions, duplicated domain types, and handwritten replacements for generated database types.
- Use the `@/` alias for imports across feature boundaries and follow the style of neighboring files.
- Validate user-controlled input with Zod. Reuse React Hook Form for non-trivial forms.
- Use TanStack Query for server state. Keep query keys stable and invalidate every affected aggregate after a successful mutation.
- Make loading, empty, error, disabled, and success states explicit. Preserve keyboard access, labels, focus behavior, and responsive layouts.
- Do not introduce a new dependency, state-management layer, architectural abstraction, or formatter unless the task clearly requires it.

## Frontend and application rules

- Keep route definitions and route guards centralized in `App.tsx`; pages should compose sections rather than accumulate business logic.
- Put reusable visual primitives in `components`, domain-sized UI in `sections`, async orchestration in `hooks`, and Supabase access in `services`.
- Components and pages must not import the Supabase client directly. Extend a typed service, then expose it through a query or mutation hook.
- Map raw database rows to application models at the service boundary. Do not leak raw nullable rows throughout the UI.
- Prefer small typed components and pure helpers over effects. Use effects only to synchronize with an external system.
- Do not mirror server state in local component state. Derive presentation values from query data where practical.
- Keep money and date formatting consistent with existing utilities. Never use formatted strings for calculations.
- Surface useful service errors without exposing database internals or secrets.

For a frontend feature, find the closest analogous flow, define types and validation, add the smallest service API, add a guarded query/mutation hook with complete invalidation, then build accessible UI states. Check authentication, account membership, mobile layout, keyboard access, and destructive-action confirmation. Use `$implement-frontend-feature` for the full workflow.

## Financial and authorization invariants

- The database is authoritative for balances, ownership, membership, and money-moving invariants.
- Perform multi-row or balance-affecting mutations atomically in checked database RPCs. Do not implement read-modify-write balance arithmetic in the browser.
- Validate account access on the server for both owners and authorized shared members. RLS, function grants, and `SECURITY DEFINER` behavior must be reviewed together.
- Preserve decimal precision, transaction direction/sign semantics, account transfer symmetry, and reporting date boundaries.
- Prefer least privilege. New tables and functions need explicit RLS/grant decisions; public execution is never assumed.

Use `$review-financial-integrity` for any change touching balances, accounts, transactions, transfers, budgets, shared access, or reports. Use `$change-supabase-schema` for all schema, RLS, grant, trigger, or RPC changes.

## Supabase and database rules

- Treat the ordered SQL files in `supabase/migrations` as forward-only database history. Inspect every migration that creates or later alters an affected object.
- Never rewrite, reorder, or delete an existing migration to change deployed behavior. Add one timestamped, descriptive migration and keep it focused.
- Make backfills, defaults, constraints, indexes, idempotency, RLS, grants, and compatibility decisions explicit.
- Enable RLS for user or household data and define explicit policies for each required operation.
- Never trust a client-supplied user ID as authorization. Derive identity from authenticated context and check ownership or shared membership in the database.
- Revoke broad defaults and grant only required privileges. For `SECURITY DEFINER` functions, set a safe `search_path`, schema-qualify objects, validate `auth.uid()`, and constrain execution grants.
- Update generated database types with `npm run db:types` after a contract change. Inspect the generated diff; never hand-edit it to simulate a schema change.
- Never run `npm run db:push`, reset a database, repair migration history, or modify production data without an explicit user request and confirmed target environment.

For database validation, review the final effective SQL, run `npm run db:lint` and `npm run db:migrations` when linked-environment access is permitted, and use `npm run db:push:dry-run` only when credentials, network access, and task scope permit it. Refresh types when needed and then run `npm run build`. Report every environment-dependent check not run.

## Validation baseline

- Documentation or AI-config-only changes: inspect the rendered text/metadata and run `git diff --check`.
- TypeScript/UI changes: run `npm run lint` and `npm run build`.
- Supabase changes: follow the database rules above; run `npm run db:lint` and `npm run db:migrations` when linked-environment access is permitted, then run the TypeScript build after refreshing generated types when appropriate.
- There is currently no automated test script in `package.json`. Never claim tests passed when only lint/build ran, and do not install a test framework merely to satisfy a checklist.

Use `$verify-pennywings-change` to choose and run the proportional check set.

## Git handoff

Use conventional commits in the form `<type>(<scope>): <imperative summary>`, with a concise lowercase subject. Codex-created branches default to `codex/<short-topic>` unless the user specifies a branch. Stage only named, reviewed paths; never use blanket staging when unrelated edits exist. Use `$prepare-git-change` when the user asks to stage, commit, prepare a PR, or summarize a handoff.

## Repository skills

Skills live in `.agents/skills/<skill-name>/SKILL.md`:

- `$implement-frontend-feature`: deliver a React feature through UI, hooks, validation, and services.
- `$change-supabase-schema`: create safe forward-only Supabase migrations and refresh contracts.
- `$verify-pennywings-change`: select and run risk-based validation.
- `$review-financial-integrity`: audit money flows, authorization, atomicity, and derived totals.
- `$prepare-git-change`: package only intended changes for a safe Git handoff.
- `$maintain-ai-workflow`: evolve this centralized guide and skill catalog.

Invoke a skill explicitly when its workflow fits; agents may also select one from its description.

## AI workflow maintenance

- Keep this root file as the single repository `AGENTS.md`; do not add folder-level variants.
- Keep each skill focused on one reusable job. Prefer procedural instructions over scripts unless deterministic automation materially reduces risk or repetition.
- Skill folder names and SKILL.md frontmatter `name` values must match and use lowercase hyphen-case.
- Limit SKILL.md frontmatter to `name` and `description`; put trigger conditions and boundaries in the description.
- Keep product-facing metadata at `agents/openai.yaml`, quote every string, and mention `$skill-name` in the default prompt.
- If adding, removing, or renaming a skill, update the catalog above and validate positive and negative trigger examples.
- Do not add unused resource folders or per-skill README files. Add `scripts/`, `references/`, or `assets/` only when used.
- Use the installed `skill-creator` workflow and its `quick_validate.py` for changed skills. Search for placeholders, stale names, broken paths, and conflicting instructions, then run `git diff --check`.
- Do not add `.codex/config.toml` merely to hold instructions. Add it only for a concrete project setting with an understood repository-wide effect.

Use `$maintain-ai-workflow` whenever changing this guide or the repository skill catalog.
