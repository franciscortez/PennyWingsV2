import {
  ArrowLeft,
  Clock,
  CreditCard,
  Edit3,
  Landmark,
  Search,
  Trash2,
} from 'lucide-react'

import { AppButton, fieldInput, fieldLabel, figure, surface, textMuted } from '@/components/ui'
import { FormattedFigure } from '@/components/ui/FormattedFigure'
import { TransactionsLoadingRows } from '@/sections/transactions/TransactionsSkeleton'
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
      amountClass: 'text-emerald-700 dark:text-emerald-400',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
      prefix: '+',
    }
  }

  if (transaction.type === 'transfer') {
    return {
      amountClass: 'text-blue-700 dark:text-blue-400',
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
      prefix: '',
    }
  }

  if (transaction.type === 'withdrawal') {
    return {
      amountClass: 'text-amber-700 dark:text-amber-400',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
      prefix: '-',
    }
  }

  return {
    amountClass: 'text-rose-700 dark:text-rose-400',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
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
      <section className={`${surface} flex min-w-0 flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-end`}>
        <div className="min-w-0 flex-1">
          <label htmlFor="transaction-search" className={`${fieldLabel} mb-2 ml-1 block`}>
            Search Ledger
          </label>
          <div className="relative">
            <Search className={`pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 ${textMuted}`} aria-hidden="true" />
            <input
              id="transaction-search"
              type="text"
              placeholder="Description, category..."
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className={fieldInput(false, 'pl-12')}
            />
          </div>
        </div>
        <div className="min-w-0">
          <p className={`${fieldLabel} mb-2 ml-1`}>Filter Type</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter Type">
            {filters.map((filter) => (
              <AppButton
                key={filter}
                type="button"
                variant={filterType === filter ? 'primary' : 'secondary'}
                size="sm"
                aria-pressed={filterType === filter}
                onClick={() => onFilterChange(filter)}
                className="min-h-11 min-w-0 max-w-full px-3 capitalize transition-[transform] [overflow-wrap:anywhere]"
              >
                {filter}
              </AppButton>
            ))}
          </div>
        </div>
      </section>

      <section className={`${surface} @container/ledger min-w-0`} aria-label="Transactions">
        {loading ? (
          <TransactionsLoadingRows />
        ) : transactions.length ? (
          <>
            <div className="space-y-3 p-4 sm:p-5 @min-[48rem]/ledger:hidden">
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
            <div className="hidden @min-[48rem]/ledger:block">
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-pink-100 dark:border-slate-800">
                    <TableHead className="w-[25%]">Transaction</TableHead>
                    <TableHead className="w-[13%]">Category</TableHead>
                    <TableHead className="w-[17%]">Account</TableHead>
                    <TableHead className="w-[12%]">Payment</TableHead>
                    <TableHead className="w-[19%] text-right">Amount</TableHead>
                    <TableHead className="w-[14%] text-center">Action</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100 dark:divide-slate-800">
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
          <Pagination page={page} pageSize={pageSize} totalCount={totalCount} totalPages={totalPages} onPageChange={onPageChange} />
        ) : null}
      </section>
    </>
  )
}

function TableHead({ children, className = '' }: { children: string; className?: string }) {
  return (
    <th scope="col" className={`px-3 py-5 text-xs font-medium text-slate-600 first:pl-5 last:pr-5 dark:text-slate-300 ${className}`}>
      {children}
    </th>
  )
}

type TransactionItemProps = {
  canManage: boolean
  deleting: boolean
  onDelete: (transaction: Transaction) => void
  onEdit: (transaction: Transaction) => void
  transaction: Transaction
}

function TransactionAmount({ transaction }: { transaction: Transaction }) {
  const { amountClass, prefix } = getAmountStyle(transaction)
  return (
    <div className="min-w-0 text-right">
      <p className={`text-base font-semibold ${amountClass}`} data-transaction-amount>
        <FormattedFigure value={`${prefix}${currency.format(transaction.amount)}`} />
      </p>
      {transaction.fee_amount && transaction.fee_amount > 0 ? (
        <p className={`mt-1 text-xs ${textMuted}`} data-transaction-fee>
          + <FormattedFigure value={currency.format(transaction.fee_amount)} /> fee
        </p>
      ) : null}
    </div>
  )
}

function TypeBadge({ transaction }: { transaction: Transaction }) {
  const { badgeClass } = getAmountStyle(transaction)
  return (
    <span className={`inline-block max-w-full rounded-full [overflow-wrap:anywhere] px-2.5 py-1 text-xs font-medium capitalize ${badgeClass}`}>
      {transaction.type}
    </span>
  )
}

function TransactionActions({ canManage, deleting, transaction, onEdit, onDelete, compact = false }: TransactionItemProps & { compact?: boolean }) {
  if (!canManage) return <span className={`text-xs ${textMuted}`}>View only</span>

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <AppButton
        type="button"
        variant="ghost"
        size={compact ? 'icon' : 'sm'}
        onClick={() => onEdit(transaction)}
        disabled={deleting}
        aria-label="Edit transaction"
        className={compact ? 'h-11 w-11' : 'min-h-11'}
      >
        <Edit3 className="h-4 w-4 shrink-0" aria-hidden="true" />
        {compact ? null : <span>Edit</span>}
      </AppButton>
      <AppButton
        type="button"
        variant="danger"
        size={compact ? 'icon' : 'sm'}
        onClick={() => onDelete(transaction)}
        disabled={deleting}
        aria-label="Delete transaction"
        className={compact ? 'h-11 w-11' : 'min-h-11'}
      >
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        {compact ? null : <span>Delete</span>}
      </AppButton>
    </div>
  )
}

function TransactionCard(props: TransactionItemProps) {
  const { transaction } = props
  const paymentLabel = getPaymentLabel(transaction)
  return (
    <article className="min-w-0 rounded-[1.25rem] bg-pink-50/60 p-4 dark:bg-slate-800/60">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="min-w-0 text-xs font-medium text-pink-900 [overflow-wrap:anywhere] dark:text-pink-200">
          {transaction.category?.name || 'Uncategorized'}
        </span>
        <TypeBadge transaction={transaction} />
      </div>
      <p className="mt-3 text-base font-semibold leading-snug tracking-tight text-slate-950 [overflow-wrap:anywhere] dark:text-slate-100">
        {transaction.description || transaction.category?.name || 'Untitled'}
      </p>
      <div className="mt-3">
        <TransactionAmount transaction={transaction} />
      </div>
      <div className={`mt-4 space-y-2 text-xs ${textMuted}`}>
        <div className="flex min-w-0 items-start gap-2">
          <Landmark className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{getTransactionAccount(transaction)}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {paymentLabel !== '---' ? <span>{paymentLabel}</span> : null}
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {formatDate(transaction.transaction_date)}
          </span>
        </div>
      </div>
      <div className="mt-4 border-t border-pink-100 pt-3 dark:border-slate-700">
        <TransactionActions {...props} />
      </div>
    </article>
  )
}

function TransactionRow(props: TransactionItemProps) {
  const { transaction } = props
  const cellClass = 'px-3 py-5 align-top [overflow-wrap:anywhere]'
  return (
    <tr className="transition-colors hover:bg-pink-50/60 dark:hover:bg-slate-800/60">
      <td className={`${cellClass} pl-5`}>
        <p className="font-semibold leading-snug text-slate-950 dark:text-slate-100">
          {transaction.description || transaction.category?.name || 'Untitled'}
        </p>
        <p className={`mt-2 flex flex-wrap items-center gap-1.5 text-xs ${textMuted}`}>
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {formatDate(transaction.transaction_date)}
        </p>
      </td>
      <td className={cellClass}>
        <span className="text-xs font-medium text-pink-900 dark:text-pink-200">
          {transaction.category?.name || 'Uncategorized'}
        </span>
      </td>
      <td className={cellClass}>
        <div className={`flex items-start gap-1.5 text-xs ${textMuted}`}>
          <Landmark className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0">{getTransactionAccount(transaction)}</span>
        </div>
      </td>
      <td className={`${cellClass} text-xs ${textMuted}`}>{getPaymentLabel(transaction)}</td>
      <td className={`${cellClass} text-right`}>
        <TransactionAmount transaction={transaction} />
        <div className="mt-2"><TypeBadge transaction={transaction} /></div>
      </td>
      <td className={`${cellClass} pr-5 text-right`}>
        <TransactionActions {...props} compact />
      </td>
    </tr>
  )
}

function EmptyState() {
  return (
    <div className="px-5 py-16 text-center sm:py-20">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-pink-50 dark:bg-slate-800">
        <CreditCard className="h-8 w-8 text-pink-700 dark:text-pink-400" aria-hidden="true" />
      </div>
      <p className={`text-base font-medium ${textMuted}`}>No entries found</p>
    </div>
  )
}

function Pagination({ onPageChange, page, pageSize, totalCount, totalPages }: {
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
    <div className="flex min-w-0 flex-col items-center justify-between gap-4 border-t border-pink-100 px-5 py-5 dark:border-slate-800 @min-[48rem]/ledger:flex-row">
      <p className={`text-sm ${textMuted}`}>
        Showing <span className={figure}>{fromIndex}</span> to <span className={figure}>{toIndex}</span> of <span className={figure}>{totalCount}</span>
      </p>
      <nav className="flex min-w-0 flex-wrap items-center justify-center gap-2" aria-label="Transaction pagination">
        <PaginationButton disabled={page === 1} label="Previous page" onClick={() => onPageChange(Math.max(1, page - 1))} />
        {visiblePages.map((visiblePage, index) => {
          const previousPage = visiblePages[index - 1]
          const showGap = previousPage !== undefined && visiblePage - previousPage > 1
          return (
            <span key={visiblePage} className="flex items-center gap-2">
              {showGap ? <span className={`text-sm ${textMuted}`}>...</span> : null}
              <AppButton
                type="button"
                size="icon"
                variant={page === visiblePage ? 'primary' : 'secondary'}
                aria-current={page === visiblePage ? 'page' : undefined}
                onClick={() => onPageChange(visiblePage)}
                className={`h-11 w-11 transition-[transform] ${figure}`}
              >
                {visiblePage}
              </AppButton>
            </span>
          )
        })}
        <PaginationButton disabled={page === totalPages} label="Next page" next onClick={() => onPageChange(Math.min(totalPages, page + 1))} />
      </nav>
    </div>
  )
}

function PaginationButton({ disabled, label, next = false, onClick }: {
  disabled: boolean
  label: string
  next?: boolean
  onClick: () => void
}) {
  return (
    <AppButton type="button" variant="secondary" size="icon" onClick={onClick} disabled={disabled} className="h-11 w-11" aria-label={label}>
      <ArrowLeft className={`h-4 w-4 ${next ? 'rotate-180' : ''}`} aria-hidden="true" />
    </AppButton>
  )
}
