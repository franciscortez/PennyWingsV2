import { FormattedFigure } from '@/components/ui/FormattedFigure'
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
        label="Budget used"
        value={loading ? '...' : `${summary.averageBudgetProgress}%`}
        detail={
          loading
            ? 'Loading limits'
            : `${compactCurrency.format(summary.budgetSpentTotal)} of ${compactCurrency.format(summary.budgetLimitTotal)}`
        }
      />
      <SummaryCard
        icon={Target}
        label="Goal progress"
        value={loading ? '...' : `${summary.averageGoalProgress}%`}
        detail={
          loading
            ? 'Loading goals'
            : `${compactCurrency.format(summary.goalCurrentTotal)} saved`
        }
      />
      <SummaryCard
        icon={Flag}
        label="Active plans"
        value={loading ? '...' : String(budgetCount + goalCount)}
        detail={`${budgetCount} budgets, ${goalCount} goals`}
      />
      <SummaryCard
        icon={WalletCards}
        label="Linked goals"
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
    <article className="flex min-h-32 flex-col items-start gap-3 sm:flex-row sm:items-center rounded-[2rem] border border-pink-100 bg-white shadow-wing dark:shadow-none p-5 dark:border-slate-800 dark:bg-slate-900">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-pink-50 text-pink-700 dark:bg-slate-800 dark:text-pink-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0 w-full">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {label}
        </p>
        <p className="min-w-0 max-w-full [overflow-wrap:anywhere] text-2xl font-semibold text-slate-950 dark:text-slate-100"><FormattedFigure value={value} /></p>
        <p className="mt-1 min-w-0 max-w-full [overflow-wrap:anywhere] text-xs font-medium text-slate-600 dark:text-slate-400">{detail}</p>
      </div>
    </article>
  )
}
