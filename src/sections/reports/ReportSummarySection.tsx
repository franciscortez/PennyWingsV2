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
      label: 'Net Cash Flow',
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
    emerald: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-400',
    pink: 'bg-pink-50 text-pink-500 dark:bg-pink-950/30 dark:text-pink-400',
    rose: 'bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400',
    violet: 'bg-violet-50 text-violet-500 dark:bg-violet-950/30 dark:text-violet-400',
  }

  return (
    <article className="flex min-h-36 items-center gap-4 rounded-[2rem] border border-pink-50 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <span
        className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl ${styles[accent]}`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-slate-500">
          {label}
        </p>
        <p className="mt-1 truncate text-2xl font-black tracking-tight text-gray-950 dark:text-slate-100">
          {value}
        </p>
        <p className="mt-1 truncate text-xs font-bold text-gray-400 dark:text-slate-500">{detail}</p>
      </div>
    </article>
  )
}
