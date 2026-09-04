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
      <section className="flex flex-col items-stretch gap-4 rounded-3xl border border-pink-50 bg-white p-4 sm:rounded-[2.5rem] sm:p-6 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center">
        <div className="relative w-full flex-1 text-left">
          <label
            htmlFor="transaction-search"
            className="mb-2 ml-3 block text-[10px] font-black uppercase tracking-widest text-gray-400 sm:ml-4 dark:text-slate-500"
          >
            Search Ledger
          </label>
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-300 sm:left-5 sm:h-5 sm:w-5 dark:text-slate-550"
              aria-hidden="true"
            />
            <input
              id="transaction-search"
              type="text"
              placeholder="Description, category..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/30 py-3.5 pl-11 pr-4 text-sm font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 sm:rounded-[1.5rem] sm:py-4 sm:pl-12 sm:pr-6 sm:text-base dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
            />
          </div>
        </div>

        <div className="w-full text-left lg:w-auto">
          <p className="mb-2 ml-3 text-[10px] font-black uppercase tracking-widest text-gray-400 sm:ml-4 dark:text-slate-500">
            Filter Type
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => onFilterChange(filter)}
                className={`min-h-11 shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition sm:min-h-12 sm:rounded-[1.2rem] sm:px-6 sm:py-4 ${
                  filterType === filter
                    ? 'bg-gray-900 text-white dark:bg-slate-800 dark:text-pink-400 shadow-sm'
                    : 'border border-pink-100 bg-pink-50/50 text-gray-400 hover:bg-pink-100/50 hover:text-pink-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-pink-400'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-pink-50 bg-white sm:rounded-[3rem] dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <LoadingRows />
        ) : transactions.length ? (
          <>
            {/* Mobile / Small Screen Card View */}
            <div className="space-y-3 p-3 sm:space-y-4 sm:p-4 md:hidden">
              {transactions.map((transaction) => (
                <TransactionCard
                  canManage={transaction.user_id === currentUserId}
                  key={transaction.id}
                  deleting={deletingId === transaction.id}
                  transaction={transaction}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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
          </>
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
      className={`px-4 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-slate-550 lg:px-6 lg:py-5 xl:px-8 xl:py-6 ${className}`}
    >
      {children}
    </th>
  )
}

function TransactionCard({
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
  const accountText = getTransactionAccount(transaction)
  const paymentLabel = getPaymentLabel(transaction)

  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-4 shadow-sm transition hover:border-pink-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      {/* Header Row: Category Badge + Type Badge + Amount */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-lg border border-pink-100 bg-pink-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-pink-500 dark:border-slate-800 dark:bg-slate-800 dark:text-pink-400">
              {transaction.category?.name || 'Uncategorized'}
            </span>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${badgeClass}`}
            >
              {transaction.type}
            </span>
          </div>
          <p className="mt-2 text-base font-black leading-snug tracking-tight text-gray-900 dark:text-slate-100">
            {transaction.description || transaction.category?.name || 'Untitled'}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className={`text-base font-black tracking-tight sm:text-lg ${amountClass}`}>
            {prefix}
            {currency.format(transaction.amount)}
          </p>
          {transaction.fee_amount && transaction.fee_amount > 0 ? (
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500">
              + {currency.format(transaction.fee_amount)} fee
            </p>
          ) : null}
        </div>
      </div>

      {/* Metadata Row: Account, Payment Method, Date */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-pink-50 pt-3 text-[10px] font-bold text-gray-500 dark:border-slate-800/80 dark:text-slate-400">
        <div className="flex min-w-0 items-center gap-1.5 text-gray-500 dark:text-slate-400">
          <Landmark className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden="true" />
          <span className="max-w-[160px] truncate uppercase tracking-wider">
            {accountText}
          </span>
        </div>

        {paymentLabel !== '---' ? (
          <div className="flex items-center gap-1">
            <span className="text-gray-300 dark:text-slate-650">•</span>
            <span className="uppercase tracking-wider text-gray-400 dark:text-slate-500">
              {paymentLabel}
            </span>
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-1 font-bold text-gray-400 dark:text-slate-500">
          <Clock className="h-3 w-3" aria-hidden="true" />
          <span>{formatDate(transaction.transaction_date)}</span>
        </div>
      </div>

      {/* Actions Row */}
      <div className="mt-3.5 flex items-center justify-end border-t border-pink-50 pt-3 dark:border-slate-800/80">
        {canManage ? (
          <div className="flex w-full items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onEdit(transaction)}
              disabled={deleting}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-pink-100 bg-pink-50/40 py-2 text-xs font-bold text-gray-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-40 sm:flex-initial sm:px-4 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300 dark:hover:border-sky-900 dark:hover:bg-sky-950/40 dark:hover:text-blue-400"
              aria-label="Edit transaction"
            >
              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(transaction)}
              disabled={deleting}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-pink-100 bg-pink-50/40 py-2 text-xs font-bold text-rose-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-40 sm:flex-initial sm:px-4 dark:border-slate-800 dark:bg-slate-950/50 dark:text-rose-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
              aria-label="Delete transaction"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Delete</span>
            </button>
          </div>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            View only
          </span>
        )}
      </div>
    </div>
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
      <td className="px-4 py-4 lg:px-6 lg:py-5 xl:px-8 xl:py-6">
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
      <td className="px-4 py-4 lg:px-6 lg:py-5 xl:px-8 xl:py-6">
        <span className="inline-flex items-center gap-2 rounded-xl border border-pink-100 bg-pink-50 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-pink-500 dark:border-slate-800 dark:bg-slate-800 dark:text-pink-400 lg:px-4 lg:py-2">
          {transaction.category?.name || 'Uncategorized'}
        </span>
      </td>
      <td className="px-4 py-4 lg:px-6 lg:py-5 xl:px-8 xl:py-6">
        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
          <Landmark className="h-4 w-4 opacity-50" aria-hidden="true" />
          <span className="max-w-44 truncate text-[10px] font-bold uppercase tracking-wider lg:max-w-52">
            {getTransactionAccount(transaction)}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 lg:px-6 lg:py-5 xl:px-8 xl:py-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-450">
          {getPaymentLabel(transaction)}
        </span>
      </td>
      <td className="px-4 py-4 text-right lg:px-6 lg:py-5 xl:px-8 xl:py-6">
        <p className={`text-sm font-black tracking-tight sm:text-base ${amountClass}`}>
          {prefix}
          {currency.format(transaction.amount)}
        </p>
        {transaction.fee_amount && transaction.fee_amount > 0 ? (
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500">
            + {currency.format(transaction.fee_amount)} fee
          </p>
        ) : null}
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${badgeClass}`}
        >
          {transaction.type}
        </span>
      </td>
      <td className="px-4 py-4 text-center lg:px-6 lg:py-5 xl:px-8 xl:py-6">
        {canManage ? (
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => onEdit(transaction)}
              disabled={deleting}
              className="rounded-xl p-2 text-gray-300 transition hover:bg-sky-50 hover:text-blue-500 disabled:pointer-events-none disabled:opacity-40 sm:p-3 dark:text-slate-600 dark:hover:bg-sky-950/40 dark:hover:text-blue-400"
              aria-label="Edit transaction"
            >
              <Edit3 className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(transaction)}
              disabled={deleting}
              className="rounded-xl p-2 text-gray-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:pointer-events-none disabled:opacity-40 sm:p-3 dark:text-slate-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
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
    <div className="space-y-3 p-3 sm:space-y-4 sm:p-6">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="flex flex-col gap-3 rounded-2xl border border-pink-50 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:gap-5 md:rounded-[2rem] md:p-5"
        >
          <div className="flex items-center justify-between md:hidden">
            <div className="h-5 w-20 rounded-lg bg-pink-100 dark:bg-slate-800" />
            <div className="h-5 w-20 rounded-full bg-pink-100 dark:bg-slate-800" />
          </div>
          <div className="hidden h-12 w-12 shrink-0 rounded-xl bg-pink-100 md:block dark:bg-slate-800" />
          <div className="flex-1 space-y-2.5">
            <div className="h-4 w-3/4 rounded-full bg-pink-100 dark:bg-slate-800" />
            <div className="h-3 w-1/3 rounded-full bg-pink-100 dark:bg-slate-800" />
          </div>
          <div className="hidden shrink-0 space-y-2 text-right md:block">
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
    <div className="py-16 text-center sm:py-24">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-50 sm:mb-6 sm:h-20 sm:w-20 sm:rounded-[2rem] dark:bg-slate-950">
        <CreditCard className="h-8 w-8 text-pink-300 sm:h-10 sm:w-10 dark:text-slate-700" aria-hidden="true" />
      </div>
      <p className="text-base font-black uppercase tracking-widest text-gray-400 sm:text-lg dark:text-slate-500">
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
  const fromIndex = (page - 1) * pageSize + 1
  const toIndex = Math.min(page * pageSize, totalCount)

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-pink-100 bg-pink-50/30 px-4 py-4 sm:flex-row sm:px-8 sm:py-6 dark:border-slate-800 dark:bg-slate-950/30">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
        Showing{' '}
        <span className="text-pink-500 dark:text-pink-400">{fromIndex}</span> to{' '}
        <span className="text-pink-500 dark:text-pink-400">{toIndex}</span> of{' '}
        {totalCount}
      </p>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <PaginationButton
          disabled={page === 1}
          label="Previous page"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        />
        <div className="flex gap-1">
          {visiblePages.map((visiblePage, index) => {
            const previousPage = visiblePages[index - 1]
            const showGap = previousPage !== undefined && visiblePage - previousPage > 1

            return (
              <span key={visiblePage} className="flex gap-1">
                {showGap ? (
                  <span className="flex h-9 w-6 items-center justify-center text-xs text-gray-300 sm:h-10 sm:w-10 dark:text-slate-600">
                    ...
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onPageChange(visiblePage)}
                  className={`h-9 w-9 rounded-xl text-xs font-black transition sm:h-10 sm:w-10 ${
                    page === visiblePage
                      ? 'bg-pink-500 text-white dark:bg-pink-600 shadow-sm'
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
      className="rounded-xl border border-pink-100 bg-white p-2.5 text-gray-400 transition hover:border-pink-200 hover:text-pink-500 disabled:opacity-30 sm:p-3 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-pink-400"
      aria-label={label}
    >
      <ArrowLeft
        className={`h-4 w-4 ${next ? 'rotate-180' : ''}`}
        aria-hidden="true"
      />
    </button>
  )
}
