import { FormattedFigure } from '@/components/ui/FormattedFigure'
import { Activity, TrendingDown, TrendingUp } from 'lucide-react'

import {
  compactReportCurrency,
  reportCurrency,
} from '@/sections/reports/reportFormat'
import type { MonthlyReport } from '@/types'

export function CashFlowOverviewSection({
  report,
}: {
  report: MonthlyReport
}) {
  const maximum = Math.max(report.incomeTotal, report.expenseTotal, 1)
  const incomeWidth = (report.incomeTotal / maximum) * 100
  const expenseWidth = (report.expenseTotal / maximum) * 100
  const savingsRate =
    report.incomeTotal > 0
      ? Math.round((report.netCashflow / report.incomeTotal) * 100)
      : null
  const burnRate =
    report.incomeTotal > 0
      ? Math.round((report.expenseTotal / report.incomeTotal) * 100)
      : null
  const pulseMessage =
    report.transactionCount === 0
      ? 'This month is still quiet. Record transactions to build your story.'
      : report.netCashflow >= 0
        ? 'You kept more money than you spent this month.'
        : 'Your pennies moved faster than they arrived. A calmer next month is within reach.'

  return (
    <section className="space-y-6">
      <article className="rounded-[2rem] border border-pink-100 bg-white shadow-wing dark:shadow-none p-4 sm:p-6 md:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tighter text-slate-950 dark:text-white">
              Income vs. expense
            </h2>
            <p className="mt-1 text-sm font-medium italic text-slate-600 dark:text-slate-400">
              Monthly cash flow comparison
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Flow: <FormattedFigure value={compactReportCurrency.format(report.incomeTotal + report.expenseTotal)} />
          </p>
        </div>

        <div className="space-y-7">
          <FlowBar
            color="bg-emerald-700 dark:bg-emerald-400"
            icon={TrendingUp}
            label="Income"
            value={report.incomeTotal}
            width={incomeWidth}
          />
          <FlowBar
            color="bg-rose-700 dark:bg-rose-300"
            icon={TrendingDown}
            label="Expense"
            value={report.expenseTotal}
            width={expenseWidth}
          />
        </div>
      </article>

      <article className="rounded-[2rem] border border-pink-100 bg-white p-6 shadow-wing sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="relative">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] bg-pink-50 text-pink-700 dark:bg-slate-800 dark:text-pink-400">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Pulse check
              </p>
              <h2 className="text-2xl font-semibold tracking-tighter text-slate-950 dark:text-white">Monthly efficiency</h2>
            </div>
          </div>
          <p className="max-w-2xl font-medium leading-relaxed text-slate-600 dark:text-slate-400">
            {pulseMessage}
          </p>
          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-md">
            <PulseMetric label="Savings rate" value={savingsRate} />
            <PulseMetric label="Burn rate" value={burnRate} />
          </div>
        </div>
      </article>
    </section>
  )
}

function FlowBar({
  color,
  icon: Icon,
  label,
  value,
  width,
}: {
  color: string
  icon: typeof TrendingUp
  label: string
  value: number
  width: number
}) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
          <Icon className="h-5 w-5 text-pink-700 dark:text-pink-400" aria-hidden="true" />
          {label}
        </span>
        <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">
          <FormattedFigure value={reportCurrency.format(value)} />
        </span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          data-chart-mark={label.toLowerCase()} className={`h-full rounded-full motion-safe:transition-[width] motion-safe:duration-200 ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function PulseMetric({
  label,
  value,
}: {
  label: string
  value: number | null
}) {
  return (
    <div className="rounded-[1.25rem] bg-pink-50/60 dark:bg-slate-800 p-4">
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
        <FormattedFigure value={value === null ? 'N/A' : `${value}%`} />
      </p>
    </div>
  )
}
