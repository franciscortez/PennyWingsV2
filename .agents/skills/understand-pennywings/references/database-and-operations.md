# Database and Operations Map

The baseline creates profiles, cards, wallets, categories, budgets, goals, transactions, and monthly reports with RLS. Later migrations add memberships/invites, shared actor attribution, secure invites, hardened transactions, and viewer/transactor roles. Later definitions are effective; inspect every migration affecting an object.

- Account helpers centralize view, transact, and owner checks. Checked transaction RPCs validate authentication, amounts, types, methods, access, destinations, categories, and funds while locking sources.
- RPCs keep balance changes atomic. Security-definer functions require safe search paths, qualification, `auth.uid()` checks, revokes, and narrow grants.
- Migration sequence: `202607090005` baseline; `090006` joint accounts; `090007` profile lookup; `090008` lent snapshots; `100001` secure invites; `100002` hardened transaction creation; `100003` explicit shared permissions.
- Commands: `npm run dev`, `lint`, `build`, `db:fetch`, `db:lint`, `db:migrations`, `db:push:dry-run`, `db:types`, and explicitly authorized `db:push`.
- No automated test script exists. AI docs require skill validation and `git diff --check`; UI requires lint/build; database work requires effective SQL/RLS/grant review, permitted linked checks, regenerated types, and build.
- Frontend environment names are `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; the function requires `OPENROUTER_API_KEY` with optional OpenRouter model/site metadata. Never inspect values.
