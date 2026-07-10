import { Banknote, CreditCard, HandCoins, Wallet } from 'lucide-react'

import { reportCurrency } from '@/sections/reports/reportFormat'
import type { MonthlyReport, ReportAccountSnapshot } from '@/types'

export function AccountSnapshotSection({
  report,
}: {
  report: MonthlyReport
}) {
  return (
    <section className="rounded-[2.5rem] border border-pink-50 bg-white p-6 md:p-8 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6">
        <h2 className="text-xl font-black tracking-tight text-gray-950 dark:text-white">
          Account Snapshot
        </h2>
        <p className="mt-1 text-sm font-medium text-gray-400 dark:text-slate-500">
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
        <p className="rounded-2xl bg-pink-50 px-5 py-8 text-center text-sm font-bold text-gray-400 dark:bg-slate-950 dark:text-slate-550">
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
    <article className="flex items-center gap-4 rounded-2xl border border-pink-50 bg-pink-50/40 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-pink-500 dark:bg-slate-800 dark:text-pink-400">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-black text-gray-800 dark:text-slate-200">{account.name}</p>
          {!account.isActive ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-black uppercase text-gray-400 dark:bg-slate-800 dark:text-slate-500">
              Archived
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-black text-pink-600 dark:text-pink-400">
          {reportCurrency.format(account.balance)}
        </p>
      </div>
    </article>
  )
}
