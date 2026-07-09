import { BarChart3, RefreshCw } from 'lucide-react'

import { currentMonthInput } from '@/sections/reports/reportFormat'

type ReportsHeaderProps = {
  onMonthChange: (month: string) => void
  selectedMonth: string
}

export function ReportsHeader({
  onMonthChange,
  selectedMonth,
}: ReportsHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500 text-white">
            <BarChart3 className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-3xl font-black tracking-tight text-gray-950 md:text-4xl">
            Financial Insights
          </h1>
        </div>
        <p className="font-medium italic text-gray-500">
          Every penny tells a story. Let&apos;s keep each chapter.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-600">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Updates automatically
        </span>
        <label className="sr-only" htmlFor="report-month">
          Report month
        </label>
        <input
          id="report-month"
          type="month"
          max={currentMonthInput()}
          value={selectedMonth}
          onChange={(event) => onMonthChange(event.target.value)}
          className="rounded-[1.5rem] border border-pink-100 bg-white px-5 py-3.5 text-sm font-black text-gray-700 outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10"
        />
      </div>
    </header>
  )
}
