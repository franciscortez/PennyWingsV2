# Mobile PWA implementation

Approved scope: redesign the signed-in experience below 768px while preserving desktop layouts, account artwork, financial services, RPC contracts, and access rules. Public pages receive authentication continuity fixes only.

## Delivery plan

1. Shared foundation: five labeled navigation destinations (Home, Accounts, Activity, Reports, More), secondary destinations in More, compact sticky mobile toolbars, safe areas, visual viewport sizing, and reduced motion.
2. Forms: opt-in bottom sheets for transaction, account, debt, budget, and goal forms; fullscreen account creation; retain shared focus, scroll locks, nested pickers, and saving guards.
3. Screens: compact summary surfaces, horizontal filter rows, reachable records, and consistent mobile typography across Home, Accounts, Activity, Debts, Monitoring, Reports, Profile, and Assistant.
4. Continuity: safe one-use login return URLs, removal of the artificial auth delay, query-preserving OAuth cleanup, history/tab scroll restoration, and report month URLs.
5. PWA: production service worker, a public offline fallback without financial caching, manual Safari installation help, offline mutation rejection without replay, and clear connection status.
6. Verification: unit tests, lint, production build, mobile browser checks, built-preview worker checks, independent review, and audit status updates. Real iPhone installation and keyboard checks remain a device release gate.

## Execution record

- Baseline: existing shared modal focus/scroll infrastructure and persistent app shell retained. Only AUDIT.md was untracked before implementation.
- Ruling: work on a local feature branch in the existing workspace; no commits, dependencies, deployment, or database changes are authorized.
- Browser prerequisites: Chromium and WebKit binaries are available locally.
- Implementation complete for the revised visual scope. Unit, lint/build, mobile browser, and production-worker checks passed; physical iPhone acceptance remains a release gate. See AUDIT.md for exact evidence.

## Revised scope from screenshot feedback

The user requested restoration of the previous page design. The new five-destination navbar and connection handling remain. Horizontal scrolling in account summaries, account tabs, and transaction filters is removed by restoring the original responsive grids and wrapping rows. Transactions retain bottom sheets; account creation now uses a content-height bottom sheet rather than fullscreen. Compact page headers, summary surfaces, and reordered records are no longer part of delivery. Authentication, navigation continuity, and PWA reliability improvements remain in scope.

## Final verification

- Independent reviewer verified the transport-error guard, logout isolation, storage-disabled user-switch handling, and the revised sheet presentation; no remaining important findings.
- 409 unit tests passed; lint passed with three existing debt-form compiler warnings; production build passed with a bundle-size warning.
- Mobile Safari selections passed (54 form/auth/presentation checks; 20 navigation/PWA/route checks plus one insufficient-height fixture skip; one explicit scroll-restoration regression). WebKit flow/scroll checks passed (19); production worker checks passed in Chromium and WebKit (2).
- Architecture reference validated; `git diff --check` passed. The temporary preview/dev sessions owned by this task were stopped. No commits, deployment, dependency changes, or database changes were made.
