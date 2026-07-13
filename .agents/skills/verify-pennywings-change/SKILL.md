---
name: verify-pennywings-change
description: Inspect a PennyWings diff, select risk-proportionate checks, run the available lint, build, database, and manual verification steps, and report evidence precisely. Use after implementation, before a handoff, or when asked whether a change is safe. Do not claim automated tests passed because the repository currently has no test script.
---

# Verify a PennyWings Change

Choose checks from the actual diff and report evidence, not a generic checklist.

## Select the check set

1. Read root `AGENTS.md` and inspect `git status --short`, `git diff --stat`, and the relevant diff without changing files.
2. Classify the change:
   - docs or AI configuration;
   - TypeScript, React, styles, routes, forms, hooks, or services;
   - schema, RLS, grants, functions, or generated database types;
   - financial, authorization, or privacy-sensitive behavior;
   - packaging, deployment, or operational configuration.
3. Add focused manual checks for the exact behavior and failure modes changed.

## Run checks

- For every change, run `git diff --check` and inspect unintended files or generated artifacts.
- For TypeScript/UI changes, run `npm run lint` and `npm run build`.
- For database changes, follow the database rules in root `AGENTS.md`: run database lint/migration checks, use the remote dry-run only when permitted, inspect regenerated types, and build the client.
- For financial or authorization changes, invoke `$review-financial-integrity` and test both allowed and denied paths where an appropriate local environment exists.
- For UI changes, manually inspect the affected route, loading/empty/error/success states, keyboard interaction, and responsive layout when browser access is available.

Do not install missing tooling, contact external systems, change remote state, or rewrite code merely to make a check pass unless the user's task authorizes those actions.

## Report

List each command or manual scenario with `passed`, `failed`, or `not run`, plus the reason for omissions. Separate lint, type/build, database checks, automated tests, and manual verification. If a failure predates or is unrelated to the change, provide the evidence; do not silently dismiss it.
