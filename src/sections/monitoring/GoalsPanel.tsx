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
        actionLabel="Create Goal"
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
    <article className="overflow-hidden rounded-[2rem] border border-pink-50 bg-white transition hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900">
      <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white dark:from-pink-900/60 dark:to-pink-950/80">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-2xl font-black tracking-tight">
              {goal.name}
            </h3>
            <p className="mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-100 dark:text-pink-200">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {getDaysLeftLabel(goal.daysLeft)}
            </p>
          </div>
          <ActionButtons
            deleting={deleting}
            deleteLabel="Delete goal"
            editLabel="Edit goal"
            light
            onDelete={() => onDelete(goal)}
            onEdit={() => onEdit(goal)}
          />
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-pink-100 dark:text-pink-200">
              Saved
            </p>
            <p className="text-3xl font-black">
              {compactCurrency.format(goal.currentAmount)}
            </p>
          </div>
          <p className="rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-widest">
            {goal.progress}%
          </p>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="h-3 overflow-hidden rounded-full border border-pink-100 bg-pink-50 dark:border-slate-850 dark:bg-slate-950">
          <div
            className="h-full rounded-full bg-pink-500 transition-all duration-500"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricBox label="Target" value={currency.format(goal.targetAmount)} />
          <MetricBox
            label="Remaining"
            value={currency.format(goal.remainingAmount)}
          />
        </div>
        <div className="rounded-2xl border border-pink-50 bg-pink-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-950/55">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
            Tracking Source
          </p>
          <p className="mt-1 truncate text-sm font-black text-gray-800 dark:text-slate-200">
            {goal.linkedAccount
              ? `${goal.linkedAccount.name} balance`
              : 'Manual saved amount'}
          </p>
          <p className="mt-1 text-xs font-bold text-gray-400 dark:text-slate-500">
            Target date: {formatDate(goal.targetDate)}
          </p>
        </div>
      </div>
    </article>
  )
}
