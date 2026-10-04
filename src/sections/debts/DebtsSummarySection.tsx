import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'

import { figure, surface, textMuted } from '@/components/ui/surfaces'

type DebtsSummarySectionProps = {
  dueSoonCount: number
  overdueCount: number
  totalOutstanding: number
  totalSettled: number
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

export function DebtsSummarySection({
  dueSoonCount,
  overdueCount,
  totalOutstanding,
  totalSettled,
}: DebtsSummarySectionProps) {
  return (
    <section aria-label="Debt summary metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Total Outstanding */}
      <div className={`${surface} p-6`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${textMuted}`}>Total Outstanding</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
            <Clock size={16} aria-hidden="true" />
          </span>
        </div>
        <div className={`mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-white ${figure}`}>
          {currencyFormatter.format(totalOutstanding)}
        </div>
        <p className={`mt-1 text-xs ${textMuted}`}>
          Current remaining liability
        </p>
      </div>

      {/* Due / Overdue Status */}
      <div className={`${surface} p-6`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${textMuted}`}>Payment Urgency</span>
          <span className={`flex h-8 w-8 items-center justify-center rounded-full ${
            overdueCount > 0
              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
              : dueSoonCount > 0
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            <AlertCircle size={16} aria-hidden="true" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          {overdueCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800 dark:bg-red-950/80 dark:text-red-200">
              {overdueCount} Overdue
            </span>
          ) : null}
          {dueSoonCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-950/80 dark:text-amber-200">
              {dueSoonCount} Due Soon
            </span>
          ) : null}
          {overdueCount === 0 && dueSoonCount === 0 ? (
            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">
              On Schedule
            </span>
          ) : null}
        </div>
        <p className={`mt-1 text-xs ${textMuted}`}>
          {overdueCount > 0
            ? 'Action required on overdue accounts'
            : dueSoonCount > 0
              ? 'Upcoming payments due within 3 days'
              : 'No immediate overdue balances'}
        </p>
      </div>

      {/* Total Settled */}
      <div className={`${surface} p-6`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${textMuted}`}>Total Settled</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 size={16} aria-hidden="true" />
          </span>
        </div>
        <div className={`mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl dark:text-white ${figure}`}>
          {currencyFormatter.format(totalSettled)}
        </div>
        <p className={`mt-1 text-xs ${textMuted}`}>
          Repaid principal to date
        </p>
      </div>
    </section>
  )
}
