import { useMemo, useState } from 'react'
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Clock,
  Edit2,
  History,
  MoreVertical,
} from 'lucide-react'

import { AppButton } from '@/components/ui/Button'
import { figure, surface, surfaceNested, textMuted } from '@/components/ui/surfaces'
import type { Debt, DebtType } from '@/types'

type DebtCardProps = {
  debt: Debt
  onArchive?: (debt: Debt) => void
  onEdit?: (debt: Debt) => void
  onHistory: (debt: Debt) => void
  onPay?: (debt: Debt) => void
  onUnarchive?: (debt: Debt) => void
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

const debtTypeLabels: Record<DebtType, string> = {
  bnpl: 'Buy Now Pay Later',
  credit_card: 'Credit Card',
  other: 'Other Liability',
  personal_loan: 'Personal Loan',
}

const debtTypeStyles: Record<DebtType, string> = {
  bnpl: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  credit_card: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  other: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  personal_loan: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
}

export function DebtCard({
  debt,
  onArchive,
  onEdit,
  onHistory,
  onPay,
  onUnarchive,
}: DebtCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const paidAmount = debt.originalAmount - debt.outstandingAmount
  const percentPaid = Math.min(
    100,
    Math.max(0, Math.round((paidAmount / debt.originalAmount) * 100)),
  )

  const dueStatus = useMemo(() => {
    if (!debt.dueDate || debt.status !== 'outstanding') return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const due = new Date(debt.dueDate)
    due.setHours(0, 0, 0, 0)

    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return {
        isOverdue: true,
        label: `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'}`,
        style: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
      }
    }

    if (diffDays <= 3) {
      return {
        isDueSoon: true,
        label: diffDays === 0 ? 'Due today' : `Due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`,
        style: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      }
    }

    return {
      label: `Due ${new Date(debt.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      style: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    }
  }, [debt.dueDate, debt.status])

  return (
    <article
      aria-label={`Debt: ${debt.providerName}`}
      className={`${surface} flex flex-col justify-between p-6 transition-all hover:border-pink-200 dark:hover:border-slate-700`}
    >
      <div>
        {/* Top bar: Provider & Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
              {debt.providerName}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${debtTypeStyles[debt.debtType]}`}>
                {debtTypeLabels[debt.debtType]}
              </span>
              {debt.status === 'paid' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CheckCircle2 size={12} aria-hidden="true" />
                  <span>Paid in Full</span>
                </span>
              )}
              {debt.status === 'archived' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <Archive size={12} aria-hidden="true" />
                  <span>Archived</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Menu button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Debt actions"
              aria-expanded={menuOpen}
            >
              <MoreVertical size={16} aria-hidden="true" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
                role="menu"
              >
                {debt.status !== 'archived' && onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onEdit(debt)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-pink-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    role="menuitem"
                  >
                    <Edit2 size={14} aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                )}
                {debt.status !== 'archived' && onArchive && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onArchive(debt)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-pink-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    role="menuitem"
                  >
                    <Archive size={14} aria-hidden="true" />
                    <span>Archive</span>
                  </button>
                )}
                {debt.status === 'archived' && onUnarchive && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      onUnarchive(debt)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-pink-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    role="menuitem"
                  >
                    <ArchiveRestore size={14} aria-hidden="true" />
                    <span>Restore</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Due Date Indicator */}
        {dueStatus && (
          <div className="mt-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${dueStatus.style}`}>
              <Clock size={12} aria-hidden="true" />
              <span>{dueStatus.label}</span>
            </span>
          </div>
        )}

        {/* Balance Display */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between">
            <span className={`text-xs ${textMuted}`}>Outstanding Balance</span>
            <span className={`text-xs font-semibold text-slate-700 dark:text-slate-300 ${figure}`}>
              {percentPaid}% paid
            </span>
          </div>
          <div className={`mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white ${figure}`}>
            {currencyFormatter.format(debt.outstandingAmount)}
          </div>

          {/* Progress bar */}
          <div className={`mt-3 h-2 w-full overflow-hidden rounded-full ${surfaceNested}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-500"
              style={{ width: `${percentPaid}%` }}
              role="progressbar"
              aria-valuenow={percentPaid}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Paid: {currencyFormatter.format(paidAmount)}</span>
            <span>Total: {currencyFormatter.format(debt.originalAmount)}</span>
          </div>
        </div>

        {/* Note */}
        {debt.note && (
          <p className="mt-3 line-clamp-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
            {debt.note}
          </p>
        )}
      </div>

      {/* Action CTA buttons */}
      <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        {debt.status === 'outstanding' && onPay ? (
          <AppButton
            variant="primary"
            onClick={() => onPay(debt)}
            className="flex-1 font-semibold"
          >
            Pay
          </AppButton>
        ) : null}

        <AppButton
          variant="secondary"
          onClick={() => onHistory(debt)}
          className={debt.status === 'outstanding' ? 'px-3' : 'flex-1'}
          title="Payment history"
        >
          <History size={16} aria-hidden="true" />
          <span className={debt.status === 'outstanding' ? 'sr-only' : 'ml-1.5'}>History</span>
        </AppButton>
      </div>
    </article>
  )
}
