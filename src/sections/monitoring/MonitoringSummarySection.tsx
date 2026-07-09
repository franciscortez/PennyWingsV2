import { Flag, Gauge, Target, WalletCards, type LucideIcon } from 'lucide-react'

import { compactCurrency } from '@/sections/monitoring/monitoringFormat'
import type { MonitoringData } from '@/types'

type MonitoringSummarySectionProps = {
  budgetCount: number
  goalCount: number
  linkedGoalCount: number
  loading: boolean
  summary: MonitoringData['summary']
}

export function MonitoringSummarySection({
  budgetCount,
  goalCount,
  linkedGoalCount,
  loading,
  summary,
}: MonitoringSummarySectionProps) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={Gauge}
        label="Budget Used"
        value={loading ? '...' : `${summary.averageBudgetProgress}%`}
        detail={
          loading
            ? 'Loading limits'
            : `${compactCurrency.format(summary.budgetSpentTotal)} of ${compactCurrency.format(summary.budgetLimitTotal)}`
        }
      />
      <SummaryCard
        icon={Target}
        label="Goal Progress"
        value={loading ? '...' : `${summary.averageGoalProgress}%`}
        detail={
          loading
            ? 'Loading goals'
            : `${compactCurrency.format(summary.goalCurrentTotal)} saved`
        }
      />
      <SummaryCard
        icon={Flag}
        label="Active Plans"
        value={loading ? '...' : String(budgetCount + goalCount)}
        detail={`${budgetCount} budgets, ${goalCount} goals`}
      />
      <SummaryCard
        icon={WalletCards}
        label="Linked Goals"
        value={loading ? '...' : String(linkedGoalCount)}
        detail={`${summary.dueSoonGoals} due in 30 days`}
      />
    </section>
  )
}

function SummaryCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <article className="flex min-h-32 items-center gap-4 rounded-[2rem] border border-pink-50 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-500 dark:bg-slate-800 dark:text-pink-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
          {label}
        </p>
        <p className="truncate text-2xl font-black text-gray-900 dark:text-slate-100">{value}</p>
        <p className="mt-1 truncate text-xs font-bold text-gray-400 dark:text-slate-500">{detail}</p>
      </div>
    </article>
  )
}
