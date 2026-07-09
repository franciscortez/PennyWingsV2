import { PieChart } from 'lucide-react'

import { compactReportCurrency } from '@/sections/reports/reportFormat'
import type { MonthlyReport } from '@/types'

const colors = [
  'bg-pink-500',
  'bg-rose-400',
  'bg-amber-400',
  'bg-violet-400',
  'bg-emerald-400',
  'bg-sky-400',
]

export function CategoryAllocationSection({
  report,
}: {
  report: MonthlyReport
}) {
  const categories = report.categoryBreakdown.filter(
    (category) => category.type === 'expense',
  )
  const maximum = Math.max(...categories.map((category) => category.total), 1)

  return (
    <article className="h-full rounded-[2.5rem] border border-pink-50 bg-white p-6 md:p-8">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
          <PieChart className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-gray-950">
            Spending Allocation
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            By category
          </p>
        </div>
      </div>

      {categories.length ? (
        <div className="space-y-5">
          {categories.map((category, index) => (
            <div key={`${category.categoryId ?? category.categoryName}-${category.type}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="truncate text-sm font-black text-gray-700">
                  {category.categoryName}
                </span>
                <span className="shrink-0 text-sm font-black text-gray-950">
                  {compactReportCurrency.format(category.total)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-pink-50">
                <div
                  className={`h-full rounded-full ${colors[index % colors.length]}`}
                  style={{ width: `${(category.total / maximum) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 text-pink-200">
            <PieChart className="h-8 w-8" aria-hidden="true" />
          </span>
          <p className="font-black text-gray-700">No expense allocation yet</p>
          <p className="mt-1 max-w-xs text-sm font-medium text-gray-400">
            Expense categories will appear when this month has spending.
          </p>
        </div>
      )}
    </article>
  )
}
