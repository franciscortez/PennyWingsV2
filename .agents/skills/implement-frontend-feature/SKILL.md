---
name: implement-frontend-feature
description: Implement or modify PennyWings React features across pages, sections, components, hooks, services, types, and Zod forms. Use for user-facing routes, dashboards, forms, CRUD flows, or query-backed UI behavior. Do not use for a database-only change or a review-only request.
---

# Implement a Frontend Feature

For cross-domain work or an unfamiliar subsystem, read the relevant `$understand-pennywings` architecture and domain references before tracing the vertical flow.

Deliver the smallest complete vertical slice while preserving the repository's `UI -> hook -> service -> Supabase` boundary.

## Workflow

1. Read root `AGENTS.md`, inspect `git status --short`, and find the closest analogous feature.
2. Trace the affected route, page/section, hook, service, types, validation, query keys, and relevant current migrations.
3. Write down inputs, outputs, permissions, loading/error/empty states, and every aggregate that the mutation can make stale.
4. Implement from the contract outward:
   - update domain types and Zod schemas;
   - add or extend a typed service method;
   - add a guarded query or mutation hook;
   - invalidate all affected query keys after success;
   - compose the page/section and accessible controls.
5. Reuse nearby UI and data-access patterns. Keep database rows and database errors behind the service boundary.
6. Exercise authentication, authorization-dependent states, form failures, destructive confirmations, responsive layout, and keyboard behavior.
7. Run `$verify-pennywings-change` with the frontend validation set.

## Boundaries

- Do not import the Supabase client into a page, section, or component.
- Do not calculate or persist authoritative balances in the browser.
- Do not create a schema workaround in TypeScript. If the database contract must change, invoke `$change-supabase-schema`.
- If the feature touches money, transfers, shared accounts, budgets, or reports, also invoke `$review-financial-integrity`.
- Do not add dependencies or broad abstractions without a concrete need in the requested feature.

## Completion report

Summarize the user-visible behavior, affected layers, permission/cache decisions, validation commands, and any unverified manual states.
