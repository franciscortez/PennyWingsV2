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
        ? 'Your wings are strong—you kept more money in the nest this month.'
        : 'Your pennies moved faster than they arrived. A calmer next month is within reach.'

  return (
    <section className="space-y-6">
      <article className="rounded-[2.5rem] border border-pink-50 bg-white p-6 md:p-8">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-gray-950">
              <span className="h-7 w-2 rounded-full bg-pink-500" />
              Income vs. Expense
            </h2>
            <p className="mt-1 text-sm font-medium italic text-gray-400">
              Monthly cash flow comparison
            </p>
          </div>
          <p className="text-sm font-black text-gray-500">
            Flow: {compactReportCurrency.format(report.incomeTotal + report.expenseTotal)}
          </p>
        </div>

        <div className="space-y-7">
          <FlowBar
            color="bg-emerald-400"
            icon={TrendingUp}
            label="Income"
            value={report.incomeTotal}
            width={incomeWidth}
          />
          <FlowBar
            color="bg-pink-400"
            icon={TrendingDown}
            label="Expense"
            value={report.expenseTotal}
            width={expenseWidth}
          />
        </div>
      </article>

      <article className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-gray-950 to-gray-800 p-7 text-white md:p-9">
        <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="relative">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-500">
              <Activity className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-300">
                Pulse Check
              </p>
              <h2 className="text-2xl font-black">Monthly efficiency</h2>
            </div>
          </div>
          <p className="max-w-2xl font-medium leading-relaxed text-gray-300">
            {pulseMessage}
          </p>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:max-w-md">
            <PulseMetric label="Savings Rate" value={savingsRate} />
            <PulseMetric label="Burn Rate" value={burnRate} />
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
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-sm font-black text-gray-600">
          <Icon className="h-5 w-5 text-pink-500" aria-hidden="true" />
          {label}
        </span>
        <span className="text-sm font-black text-gray-950">
          {reportCurrency.format(value)}
        </span>
      </div>
      <div className="h-4 overflow-hidden rounded-full bg-pink-50">
        <div
          className={`h-full min-w-1 rounded-full transition-all duration-700 ${color}`}
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-pink-300">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">
        {value === null ? 'N/A' : `${value}%`}
      </p>
    </div>
  )
}
