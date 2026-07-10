import {
  ArrowLeft,
  Clock,
  CreditCard,
  Edit3,
  Landmark,
  Search,
  Trash2,
} from 'lucide-react'

import { formatDate } from '@/lib/date'
import type { Transaction, TransactionFilterType } from '@/types'

type TransactionsTableProps = {
  currentUserId: string | undefined
  deletingId: string | null
  filterType: TransactionFilterType
  loading: boolean
  onDelete: (transaction: Transaction) => void
  onEdit: (transaction: Transaction) => void
  onFilterChange: (type: TransactionFilterType) => void
  onPageChange: (page: number) => void
  onSearchChange: (value: string) => void
  page: number
  pageSize: number
  searchQuery: string
  totalCount: number
  totalPages: number
  transactions: Transaction[]
}

const filters: TransactionFilterType[] = [
  'all',
  'income',
  'expense',
  'withdrawal',
  'transfer',
]

const currency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  maximumFractionDigits: 2,
  style: 'currency',
})

const getTransactionAccount = (transaction: Transaction) => {
  if (transaction.type === 'transfer') {
    const from = transaction.card?.name ?? transaction.wallet?.name ?? 'Account'
    const to =
      transaction.to_card?.name ?? transaction.to_wallet?.name ?? 'Account'

    return `${from} -> ${to}`
  }

  return transaction.card?.name ?? transaction.wallet?.name ?? 'Cash'
}

const getPaymentLabel = (transaction: Transaction) => {
  if (transaction.type === 'transfer') {
    return '---'
  }

  if (transaction.payment_method === 'card') {
    return 'Bank Card'
  }

  if (transaction.payment_method === 'ewallet') {
    return 'E-Wallet'
  }

  return 'Cash'
}

const getAmountStyle = (transaction: Transaction) => {
  if (transaction.type === 'income') {
    return {
      amountClass: 'text-emerald-500',
      badgeClass: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-400',
      prefix: '+',
    }
  }

  if (transaction.type === 'transfer') {
    return {
      amountClass: 'text-blue-500',
      badgeClass: 'bg-blue-50 text-blue-500 dark:bg-blue-950/30 dark:text-blue-400',
      prefix: '',
    }
  }

  if (transaction.type === 'withdrawal') {
    return {
      amountClass: 'text-amber-500',
      badgeClass: 'bg-amber-50 text-amber-500 dark:bg-amber-950/30 dark:text-amber-400',
      prefix: '-',
    }
  }

  return {
    amountClass: 'text-rose-500',
    badgeClass: 'bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400',
    prefix: '-',
  }
}

const getVisiblePages = (page: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = [1, totalPages]

  for (let value = page - 1; value <= page + 1; value += 1) {
    if (value > 1 && value < totalPages) {
      pages.push(value)
    }
  }

  return [...new Set(pages)].sort((first, second) => first - second)
}

export function TransactionsTable({
  currentUserId,
  deletingId,
  filterType,
  loading,
  onDelete,
  onEdit,
  onFilterChange,
  onPageChange,
  onSearchChange,
  page,
  pageSize,
  searchQuery,
  totalCount,
  totalPages,
  transactions,
}: TransactionsTableProps) {
  return (
    <>
      <section className="flex flex-col items-center gap-4 rounded-[2.5rem] border border-pink-50 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:flex-row">
        <div className="relative w-full flex-1 text-left">
          <label
            htmlFor="transaction-search"
            className="mb-2 ml-4 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500"
          >
            Search Ledger
          </label>
          <div className="relative">
            <Search
              className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-pink-300 dark:text-slate-550"
              aria-hidden="true"
            />
            <input
              id="transaction-search"
              type="text"
              placeholder="Description, category..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full rounded-[1.5rem] border border-pink-100 bg-pink-50/30 py-4 pl-12 pr-6 font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
            />
          </div>
        </div>

        <div className="w-full text-left lg:w-auto">
          <p className="mb-2 ml-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
            Filter Type
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => onFilterChange(filter)}
                className={`min-h-12 min-w-0 rounded-[1.2rem] px-3 py-3 text-xs font-bold uppercase tracking-widest transition sm:min-w-fit sm:px-6 sm:py-4 ${
                  filterType === filter
                    ? 'bg-gray-900 text-white dark:bg-slate-800 dark:text-pink-400'
                    : 'border border-pink-100 bg-pink-50/50 text-gray-400 hover:bg-pink-100/50 hover:text-pink-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-pink-400'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[3rem] border border-pink-50 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <LoadingRows />
        ) : transactions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-pink-100 bg-pink-50/50 dark:border-slate-800 dark:bg-slate-950/40">
                  <TableHead>Transaction</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50 dark:divide-slate-800">
                {transactions.map((transaction) => (
                  <TransactionRow
                    canManage={transaction.user_id === currentUserId}
                    key={transaction.id}
                    deleting={deletingId === transaction.id}
                    transaction={transaction}
                    onDelete={onDelete}
                    onEdit={onEdit}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}

        {totalPages > 1 ? (
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        ) : null}
      </section>
    </>
  )
}

function TableHead({
  children,
  className = '',
}: {
  children: string
  className?: string
}) {
  return (
    <th
      className={`px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-550 ${className}`}
    >
      {children}
    </th>
  )
}

function TransactionRow({
  canManage,
  deleting,
  onDelete,
  onEdit,
  transaction,
}: {
  canManage: boolean
  deleting: boolean
  onDelete: (transaction: Transaction) => void
  onEdit: (transaction: Transaction) => void
  transaction: Transaction
}) {
  const { amountClass, badgeClass, prefix } = getAmountStyle(transaction)

  return (
    <tr className="group transition hover:bg-pink-50/30 dark:hover:bg-slate-850/30">
      <td className="px-8 py-6">
        <div>
          <p className="mb-1 font-black leading-none tracking-tight text-gray-900 dark:text-slate-100">
            {transaction.description || transaction.category?.name || 'Untitled'}
          </p>
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {formatDate(transaction.transaction_date)}
          </p>
        </div>
      </td>
      <td className="px-8 py-6">
        <span className="inline-flex items-center gap-2 rounded-xl border border-pink-100 bg-pink-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-pink-500 dark:border-slate-800 dark:bg-slate-800 dark:text-pink-400">
          {transaction.category?.name || 'Uncategorized'}
        </span>
      </td>
      <td className="px-8 py-6">
        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
          <Landmark className="h-4 w-4 opacity-50" aria-hidden="true" />
          <span className="max-w-52 truncate text-[10px] font-bold uppercase tracking-wider">
            {getTransactionAccount(transaction)}
          </span>
        </div>
      </td>
      <td className="px-8 py-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-450">
          {getPaymentLabel(transaction)}
        </span>
      </td>
      <td className="px-8 py-6 text-right">
        <p className={`text-sm font-black tracking-tight sm:text-base ${amountClass}`}>
          {prefix}
          {currency.format(transaction.amount)}
        </p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${badgeClass}`}
        >
          {transaction.type}
        </span>
      </td>
      <td className="px-8 py-6 text-center">
        {canManage ? (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(transaction)}
              disabled={deleting}
              className="rounded-xl p-3 text-gray-300 transition hover:bg-sky-50 hover:text-blue-500 dark:text-slate-600 dark:hover:bg-sky-950/40 dark:hover:text-blue-400 disabled:pointer-events-none disabled:opacity-40"
              aria-label="Edit transaction"
            >
              <Edit3 className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(transaction)}
              disabled={deleting}
              className="rounded-xl p-3 text-gray-300 transition hover:bg-rose-50 hover:text-rose-500 dark:text-slate-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 disabled:pointer-events-none disabled:opacity-40"
              aria-label="Delete transaction"
            >
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            View only
          </span>
        )}
      </td>
    </tr>
  )
}

function LoadingRows() {
  return (
    <div className="space-y-4 p-6">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="flex items-center gap-5 rounded-[2rem] border border-pink-50 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="h-12 w-12 shrink-0 rounded-xl bg-pink-100 dark:bg-slate-800" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-2/3 rounded-full bg-pink-100 dark:bg-slate-800" />
            <div className="h-3 w-1/3 rounded-full bg-pink-100 dark:bg-slate-800" />
          </div>
          <div className="shrink-0 space-y-2 text-right">
            <div className="ml-auto h-5 w-20 rounded-full bg-pink-100 dark:bg-slate-800" />
            <div className="ml-auto h-3 w-12 rounded-full bg-pink-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-24 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-pink-50 dark:bg-slate-950">
        <CreditCard className="h-10 w-10 text-pink-300 dark:text-slate-700" aria-hidden="true" />
      </div>
      <p className="text-lg font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
        No entries found
      </p>
    </div>
  )
}

function Pagination({
  onPageChange,
  page,
  pageSize,
  totalCount,
  totalPages,
}: {
  onPageChange: (page: number) => void
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}) {
  const visiblePages = getVisiblePages(page, totalPages)

  return (
    <div className="flex items-center justify-between border-t border-pink-100 bg-pink-50/30 px-8 py-6 dark:border-slate-800 dark:bg-slate-950/30">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
        Showing{' '}
        <span className="text-pink-500 dark:text-pink-400">{(page - 1) * pageSize + 1}</span> to{' '}
        <span className="text-pink-500 dark:text-pink-400">
          {Math.min(page * pageSize, totalCount)}
        </span>{' '}
        of {totalCount}
      </p>
      <div className="flex gap-2">
        <PaginationButton
          disabled={page === 1}
          label="Previous page"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        />
        <div className="hidden gap-1 sm:flex">
          {visiblePages.map((visiblePage, index) => {
            const previousPage = visiblePages[index - 1]
            const showGap = previousPage !== undefined && visiblePage - previousPage > 1

            return (
              <span key={visiblePage} className="flex gap-1">
                {showGap ? (
                  <span className="flex h-10 w-10 items-center justify-center text-gray-300 dark:text-slate-600">
                    ...
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onPageChange(visiblePage)}
                  className={`h-10 w-10 rounded-xl text-xs font-black transition ${
                    page === visiblePage
                      ? 'bg-pink-500 text-white dark:bg-pink-600'
                      : 'border border-pink-100 bg-white text-gray-400 hover:bg-pink-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-pink-400'
                  }`}
                >
                  {visiblePage}
                </button>
              </span>
            )
          })}
        </div>
        <PaginationButton
          disabled={page === totalPages}
          label="Next page"
          next
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        />
      </div>
    </div>
  )
}

function PaginationButton({
  disabled,
  label,
  next = false,
  onClick,
}: {
  disabled: boolean
  label: string
  next?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-pink-100 bg-white p-3 text-gray-400 transition hover:border-pink-200 hover:text-pink-500 disabled:opacity-30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-pink-400"
      aria-label={label}
    >
      <ArrowLeft
        className={`h-4 w-4 ${next ? 'rotate-180' : ''}`}
        aria-hidden="true"
      />
    </button>
  )
}
