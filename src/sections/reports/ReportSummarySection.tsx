import { FormattedFigure } from '@/components/ui/FormattedFigure'
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  ReceiptText,
  type LucideIcon,
} from 'lucide-react'

import { compactReportCurrency } from '@/sections/reports/reportFormat'
import type { MonthlyReport } from '@/types'

export function ReportSummarySection({
  report,
}: {
  report: MonthlyReport
}) {
  const items = [
    {
      accent: 'emerald' as const,
      detail: 'Money added this month',
      icon: ArrowUpRight,
      label: 'Income',
      value: compactReportCurrency.format(report.incomeTotal),
    },
    {
      accent: 'rose' as const,
      detail: 'Recorded spending',
      icon: ArrowDownRight,
      label: 'Expenses',
      value: compactReportCurrency.format(report.expenseTotal),
    },
    {
      accent: 'pink' as const,
      detail: report.netCashflow >= 0 ? 'Positive cash flow' : 'Negative cash flow',
      icon: Landmark,
      label: 'Net cash flow',
      value: compactReportCurrency.format(report.netCashflow),
    },
    {
      accent: 'violet' as const,
      detail: `${compactReportCurrency.format(report.transferTotal)} transferred`,
      icon: ReceiptText,
      label: 'Transactions',
      value: String(report.transactionCount),
    },
  ]

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <SummaryCard key={item.label} {...item} />
      ))}
    </section>
  )
}

function SummaryCard({
  accent,
  detail,
  icon: Icon,
  label,
  value,
}: {
  accent: 'emerald' | 'pink' | 'rose' | 'violet'
  detail: string
  icon: LucideIcon
  label: string
  value: string
}) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    pink: 'bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400',
    rose: 'bg-rose-50 text-rose-700 dark:text-rose-300 dark:bg-rose-950/30 dark:text-rose-400',
    violet: 'bg-pink-50 text-pink-700 dark:bg-slate-800 dark:text-pink-400',
  }

  return (
    <article className="flex min-h-36 flex-col items-start gap-3 sm:flex-row sm:items-center rounded-[2rem] border border-pink-100 bg-white shadow-wing dark:shadow-none p-5 dark:border-slate-800 dark:bg-slate-900">
      <span
        className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-[1.25rem] ${styles[accent]}`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0 w-full">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {label}
        </p>
        <p className="mt-1 min-w-0 max-w-full [overflow-wrap:anywhere] text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          <FormattedFigure value={value} />
        </p>
        <p className="mt-1 min-w-0 max-w-full [overflow-wrap:anywhere] text-xs font-medium text-slate-600 dark:text-slate-400">{detail}</p>
      </div>
    </article>
  )
}
