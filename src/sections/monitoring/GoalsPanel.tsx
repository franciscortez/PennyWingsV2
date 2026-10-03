import { FormattedFigure } from '@/components/ui/FormattedFigure'
import { surface } from '@/components/ui/surfaces'
import { CalendarDays, Target } from 'lucide-react'

import {
  ActionButtons,
  CardSkeletonGrid,
  EmptyPanel,
  MetricBox,
} from '@/sections/monitoring/MonitoringShared'
import {
  compactCurrency,
  currency,
  formatDate,
  getDaysLeftLabel,
} from '@/sections/monitoring/monitoringFormat'
import type { Goal } from '@/types'

type GoalsPanelProps = {
  deletingId: string | null
  goals: Goal[]
  loading: boolean
  onCreate: () => void
  onDelete: (goal: Goal) => void
  onEdit: (goal: Goal) => void
}

export function GoalsPanel({
  deletingId,
  goals,
  loading,
  onCreate,
  onDelete,
  onEdit,
}: GoalsPanelProps) {
  if (loading) {
    return <CardSkeletonGrid />
  }

  if (!goals.length) {
    return (
      <EmptyPanel
        actionLabel="New goal"
        description="Set target amounts and optionally link them to an account balance."
        icon={Target}
        title="No goals yet"
        onAction={onCreate}
      />
    )
  }

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          deleting={deletingId === goal.id}
          goal={goal}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </section>
  )
}

function GoalCard({
  deleting,
  goal,
  onDelete,
  onEdit,
}: {
  deleting: boolean
  goal: Goal
  onDelete: (goal: Goal) => void
  onEdit: (goal: Goal) => void
}) {
  return (
    <article className={`${surface} min-w-0 p-4 sm:p-6`}>
      <div className="text-slate-950 dark:text-slate-100">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="min-w-0 max-w-full [overflow-wrap:anywhere] text-2xl font-semibold tracking-tighter">
              {goal.name}
            </h3>
            <p className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {getDaysLeftLabel(goal.daysLeft)}
            </p>
          </div>
          <ActionButtons
            deleting={deleting}
            deleteLabel="Delete goal"
            editLabel="Edit goal"
            onDelete={() => onDelete(goal)}
            onEdit={() => onEdit(goal)}
          />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Saved
            </p>
            <p className="text-3xl font-semibold">
              <FormattedFigure value={compactCurrency.format(goal.currentAmount)} />
            </p>
          </div>
          <p className="rounded-full bg-pink-50 text-pink-800 dark:bg-slate-800 dark:text-pink-400 px-4 py-2 text-xs font-semibold ">
            {goal.progress}%
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        <div role="progressbar" aria-label={`${goal.name} savings progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={goal.progress} className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-pink-700 dark:bg-pink-400 motion-safe:transition-[width] motion-safe:duration-200"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricBox label="Target" value={currency.format(goal.targetAmount)} />
          <MetricBox
            label="Remaining"
            value={currency.format(goal.remainingAmount)}
          />
        </div>
        <div className="rounded-[1.25rem] border border-pink-100 bg-pink-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-950/55">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Tracking source
          </p>
          <p className="mt-1 min-w-0 max-w-full [overflow-wrap:anywhere] text-sm font-semibold text-slate-800 dark:text-slate-200">
            {goal.linkedAccount
              ? `${goal.linkedAccount.name} balance`
              : 'Manual saved amount'}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            Target date: {formatDate(goal.targetDate)}
          </p>
        </div>
      </div>
    </article>
  )
}
