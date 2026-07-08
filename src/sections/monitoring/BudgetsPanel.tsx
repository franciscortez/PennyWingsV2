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
        actionLabel="Create Budget"
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
  const progressColor = overBudget ? 'bg-rose-500' : 'bg-pink-500'
  const categoryColor = budget.category?.color ?? '#ec4899'

  return (
    <article className="rounded-[2rem] border border-pink-50 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-100/70">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: categoryColor }}
          >
            <ReceiptText className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-xl font-black text-gray-900">
              {budget.category?.name ?? 'Uncategorized'}
            </h3>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
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

      <div className="mb-4 grid grid-cols-2 gap-3">
        <MetricBox label="Spent" value={currency.format(budget.spentAmount)} />
        <MetricBox label="Limit" value={currency.format(budget.limitAmount)} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          Usage
        </p>
        <p
          className={`text-sm font-black ${
            overBudget ? 'text-rose-500' : 'text-pink-600'
          }`}
        >
          {budget.progress}%
        </p>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-pink-100 bg-pink-50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${budget.progress}%` }}
        />
      </div>

      <p
        className={`mt-4 text-sm font-bold ${
          overBudget ? 'text-rose-500' : 'text-gray-500'
        }`}
      >
        {overBudget
          ? `Over by ${currency.format(Math.abs(budget.remainingAmount))}`
          : `${currency.format(budget.remainingAmount)} remaining`}
      </p>
    </article>
  )
}
