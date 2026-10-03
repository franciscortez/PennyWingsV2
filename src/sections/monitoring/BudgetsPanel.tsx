import { surface } from '@/components/ui/surfaces'
import { ReceiptText } from 'lucide-react'

import {
  ActionButtons,
  CardSkeletonGrid,
  EmptyPanel,
  MetricBox,
} from '@/sections/monitoring/MonitoringShared'
import {
  currency,
  formatPeriod,
} from '@/sections/monitoring/monitoringFormat'
import type { Budget } from '@/types'

type BudgetsPanelProps = {
  budgets: Budget[]
  deletingId: string | null
  loading: boolean
  onCreate: () => void
  onDelete: (budget: Budget) => void
  onEdit: (budget: Budget) => void
}

export function BudgetsPanel({
  budgets,
  deletingId,
  loading,
  onCreate,
  onDelete,
  onEdit,
}: BudgetsPanelProps) {
  if (loading) {
    return <CardSkeletonGrid />
  }

  if (!budgets.length) {
    return (
      <EmptyPanel
        actionLabel="New budget"
        description="Choose expense categories and set limits to monitor spending."
        icon={ReceiptText}
        title="No budgets yet"
        onAction={onCreate}
      />
    )
  }

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          deleting={deletingId === budget.id}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </section>
  )
}

function BudgetCard({
  budget,
  deleting,
  onDelete,
  onEdit,
}: {
  budget: Budget
  deleting: boolean
  onDelete: (budget: Budget) => void
  onEdit: (budget: Budget) => void
}) {
  const overBudget = budget.remainingAmount < 0
  const progressColor = overBudget ? 'bg-rose-700 dark:bg-rose-300' : 'bg-pink-700 dark:bg-pink-400'

  return (
    <article className={`${surface} min-w-0 p-4 sm:p-6`}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-pink-50 text-pink-700 dark:bg-slate-800 dark:text-pink-400"

          >
            <ReceiptText className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="min-w-0 max-w-full [overflow-wrap:anywhere] text-xl font-semibold text-slate-950 dark:text-slate-100 tracking-tighter">
              {budget.category?.name ?? 'Uncategorized'}
            </h3>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {formatPeriod(budget.period)} limit
            </p>
          </div>
        </div>
        <ActionButtons
          deleting={deleting}
          deleteLabel="Delete budget"
          editLabel="Edit budget"
          onDelete={() => onDelete(budget)}
          onEdit={() => onEdit(budget)}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricBox label="Spent" value={currency.format(budget.spentAmount)} />
        <MetricBox label="Limit" value={currency.format(budget.limitAmount)} />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Usage
        </p>
        <p
          className={`text-sm font-semibold ${
            overBudget ? 'text-rose-700 dark:text-rose-300' : 'text-pink-800 dark:text-pink-400'
          }`}
        >
          {budget.progress}%
        </p>
      </div>
      <div role="progressbar" aria-label={`${budget.category?.name ?? 'Uncategorized'} budget usage`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={budget.progress} className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full motion-safe:transition-[width] motion-safe:duration-200 ${progressColor}`}
          style={{ width: `${budget.progress}%` }}
        />
      </div>

      <p
        className={`mt-4 text-sm font-medium ${
          overBudget ? 'text-rose-700 dark:text-rose-300' : 'text-slate-600 dark:text-slate-400'
        }`}
      >
        {overBudget
          ? `Over by ${currency.format(Math.abs(budget.remainingAmount))}`
          : `${currency.format(budget.remainingAmount)} remaining`}
      </p>
    </article>
  )
}
