# Domain Map

- **Auth/profile:** Supabase sessions via `AuthContext`/`authService`; email, Google, recovery, profile, password, and deletion flows.
- **Accounts:** cards and wallets map to card/wallet/cash/lent models; create, edit, archive/restore/delete, summaries, invitations, joining, roles, and removal.
- **Shared access:** account rows retain ownership; memberships grant viewer/transactor access to shareable cards and non-cash/non-lent wallets. RPCs secure invitation codes and eligibility.
- **Transactions:** income, expense, withdrawal, and transfer via cash/card/e-wallet. Checked RPCs lock sources, validate access/categories/funds, preserve symmetry, and record shared actors on owner ledgers. Hooks invalidate transactions, accounts, dashboard, and reports.
- **Dashboard/sidebar:** query-backed accessible-account totals, monthly stats, progress, recent activity, and profile summaries.
- **Monitoring:** weekly/monthly/yearly category budgets and manual or linked-account goals; mutations invalidate monitoring/dashboard.
- **Reports:** cash flow, category allocation, snapshots, and saved months. Lent balances appear in snapshots but not available cash totals.
- **Assistant:** bounded Zod history reaches an authenticated Edge Function that builds RLS-visible financial context and returns sanitized OpenRouter results.
