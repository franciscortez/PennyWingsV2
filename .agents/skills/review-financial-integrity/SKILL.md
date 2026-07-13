---
name: review-financial-integrity
description: Review PennyWings changes that affect accounts, balances, transactions, transfers, budgets, shared access, reports, or money-derived UI for authorization, atomicity, precision, concurrency, and cache correctness. Use for security or code review and before accepting any money-sensitive implementation. This is a review workflow; do not implement fixes unless requested.
---

# Review Financial Integrity

Audit the complete data path, not only the visible diff. The database is the authority for balances and access.

## Build the review model

1. Read the frontend, database, and financial rules in root `AGENTS.md`.
2. Inspect the diff and trace every affected UI action through hooks, services, generated types, RPCs, tables, policies, grants, and query invalidations.
3. Identify the actor, owned/shared resources, trusted inputs, rows changed, derived totals, and behavior on retry, concurrency, or partial failure.

## Review checkpoints

- **Authorization:** derive identity from authenticated context; check owner/member access in the database; deny cross-account and cross-household access; align RLS with function grants.
- **Atomicity:** apply all balance and ledger changes once in one transaction; prevent partial transfers, duplicate retries, stale read-modify-write, and race-condition overdrafts.
- **Correctness:** require valid positive amounts where appropriate; preserve `numeric` precision, currency assumptions, income/expense direction, transfer symmetry, and deletion/update reversal behavior.
- **Time and reporting:** define timezone and inclusive/exclusive date boundaries; avoid double counting transfers; keep budget and report aggregation consistent with transaction semantics.
- **Client consistency:** prevent browser-authoritative arithmetic; invalidate accounts, transactions, budgets, reports, and shared views affected by the mutation; expose safe failure messages.
- **Privacy:** avoid secrets and personal financial data in logs, analytics, fixtures, URLs, or error output.

## High-risk scenarios

Explicitly test or reason about self-transfers, same-account endpoints, unauthorized shared members, deleted/replayed transactions, simultaneous writes, RPC failure after partial work, null/negative/over-precision amounts, month-boundary timezones, and revoked membership.

## Output

Report only actionable findings, ordered by severity, with a tight file/line reference, the violated invariant, a concrete failure scenario, and the safest remediation direction. Then list unresolved assumptions and verification gaps. If no finding exists, state which checkpoints and scenarios were reviewed.
