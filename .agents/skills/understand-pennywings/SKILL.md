---
name: understand-pennywings
description: Map and explain the PennyWings repository architecture, routes, domain boundaries, data flow, database ownership, and operational commands. Use for repository-wide analysis, onboarding, architecture or impact questions, cross-domain planning, or before work whose affected subsystem is unclear. Do not use for a narrow task whose relevant files and focused PennyWings workflow are already known.
---

# Understand PennyWings

1. Read `git status --short` and preserve unrelated work.
2. Load only what is needed: [architecture](references/architecture.md), [domains](references/domains.md), or [database and operations](references/database-and-operations.md).
3. Verify implementation-affecting facts against current code, `package.json`, generated types, and all migrations affecting an object.
4. Trace changes through types, validation, services, hooks, UI, and database contracts; invoke focused skills when triggered.
5. Update stale maps during AI-workflow maintenance.

Never read `.env`, duplicate generated types, or persist secrets or financial data in context or memories.
