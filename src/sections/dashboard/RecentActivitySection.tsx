import { ArrowRight, Clock, ReceiptText } from 'lucide-react'
import { Link } from 'react-router'

import { formatShortDate } from '@/lib/date'
import type { DashboardTransaction } from '@/types/dashboard'

type RecentActivitySectionProps = {
  loading: boolean
  transactions: DashboardTransaction[]
}

const compactCurrency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  maximumFractionDigits: 0,
  style: 'currency',
})

const getTransactionSource = (transaction: DashboardTransaction) => {
  if (transaction.type === 'transfer') {
    const from =
      transaction.card?.card_name ?? transaction.wallet?.wallet_name ?? 'Account'
    const to =
      transaction.to_card?.card_name ??
      transaction.to_wallet?.wallet_name ??
      'Account'

    return `${from} -> ${to}`
  }

  return transaction.card?.card_name ?? transaction.wallet?.wallet_name ?? 'Cash'
}

export function RecentActivitySection({
  loading,
  transactions,
}: RecentActivitySectionProps) {
  return (
    <section className="rounded-[2.5rem] border border-pink-50 bg-white p-6 sm:p-10 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-3 text-2xl font-black tracking-tight text-gray-900 dark:text-slate-100">
          <Clock className="h-7 w-7 text-pink-500 dark:text-pink-400" aria-hidden="true" />
          Recent Activity
        </h3>
        <Link
          to="/transactions"
          className="group flex items-center gap-1 self-start text-sm font-black text-pink-500 transition hover:text-pink-600 dark:text-pink-400 dark:hover:text-pink-300 sm:self-auto"
        >
          View All History
          <ArrowRight
            className="h-4 w-4 transition group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-[2rem] border border-pink-50 bg-pink-50/70 dark:border-slate-850 dark:bg-slate-800/70"
            />
          ))}
        </div>
      ) : transactions.length ? (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </div>
      ) : (
        <div className="rounded-[2.5rem] border-2 border-dashed border-pink-100 bg-pink-50/40 px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-950/40">
          <p className="mb-2 font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">
            No Transactions Yet
          </p>
          <p className="text-sm text-gray-400 dark:text-slate-500">
            Head to the transactions page to track your first penny.
          </p>
        </div>
      )}
    </section>
  )
}

function TransactionRow({
  transaction,
}: {
  transaction: DashboardTransaction
}) {
  const isIncome = transaction.type === 'income'
  const isTransfer = transaction.type === 'transfer'
  const amountClass = isIncome
    ? 'text-emerald-500'
    : isTransfer
      ? 'text-blue-500'
      : 'text-rose-500'
  const amountPrefix = isIncome ? '+' : isTransfer ? '' : '-'

  return (
    <div className="flex items-center gap-4 rounded-[2rem] border border-pink-50 bg-white p-4 transition hover:translate-x-1 hover:bg-pink-50/30 sm:p-5 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/40">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-500 dark:bg-slate-800 dark:text-pink-400">
        <ReceiptText className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-black tracking-tight text-gray-900 sm:text-lg dark:text-slate-100">
          {transaction.description ?? transaction.category?.name ?? 'Uncategorized'}
        </p>
        <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-550">
          <span>{transaction.category?.name ?? 'No Category'}</span>
          <span>{formatShortDate(transaction.transaction_date)}</span>
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-lg font-black tracking-tight ${amountClass}`}>
          {amountPrefix}
          {compactCurrency.format(Number(transaction.amount ?? 0))}
        </p>
        <p className="ml-auto max-w-[120px] truncate text-[10px] font-black uppercase tracking-tight text-gray-300 dark:text-slate-500">
          {getTransactionSource(transaction)}
        </p>
      </div>
    </div>
  )
}
