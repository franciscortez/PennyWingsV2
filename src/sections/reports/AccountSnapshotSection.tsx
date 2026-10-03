import { FormattedFigure } from '@/components/ui/FormattedFigure'
import { Banknote, CreditCard, HandCoins, Wallet } from 'lucide-react'

import { reportCurrency } from '@/sections/reports/reportFormat'
import type { MonthlyReport, ReportAccountSnapshot } from '@/types'

export function AccountSnapshotSection({
  report,
}: {
  report: MonthlyReport
}) {
  return (
    <section className="rounded-[2rem] border border-pink-100 bg-white shadow-wing dark:shadow-none p-4 sm:p-6 md:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tighter text-slate-950 dark:text-white">
          Account snapshot
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
          Closing balances reconstructed at the end of this month.
        </p>
      </div>

      {report.accountSnapshot.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {report.accountSnapshot.map((account) => (
            <AccountCard key={`${account.kind}-${account.id}`} account={account} />
          ))}
        </div>
      ) : (
        <p className="rounded-[1.25rem] bg-pink-50 px-5 py-8 text-center text-sm font-medium text-slate-600 dark:bg-slate-950 dark:text-slate-400">
          No account balances were captured.
        </p>
      )}
    </section>
  )
}

function AccountCard({ account }: { account: ReportAccountSnapshot }) {
  const Icon =
    account.kind === 'card'
      ? CreditCard
      : account.kind === 'cash'
        ? Banknote
        : account.kind === 'lent'
          ? HandCoins
          : Wallet

  return (
    <article className="flex flex-col items-start gap-3 sm:flex-row sm:items-center rounded-[1.25rem] border border-pink-100 bg-pink-50/40 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-pink-700 dark:bg-slate-800 dark:text-pink-400">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 w-full">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 max-w-full [overflow-wrap:anywhere] text-sm font-semibold text-slate-800 dark:text-slate-200">{account.name}</p>
          {!account.isActive ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Archived
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-pink-800 dark:text-pink-400">
          <FormattedFigure value={reportCurrency.format(account.balance)} />
        </p>
      </div>
    </article>
  )
}
