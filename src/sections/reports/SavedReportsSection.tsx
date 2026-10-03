import { appChoice } from '@/sections/shared/appDesignStyles'
import { FormattedFigure } from '@/components/ui/FormattedFigure'
import { CalendarDays, Clock3 } from 'lucide-react'

import {
  compactReportCurrency,
  formatGeneratedAt,
  formatReportMonth,
} from '@/sections/reports/reportFormat'
import type { MonthlyReport } from '@/types'

type SavedReportsSectionProps = {
  onSelect: (month: string) => void
  reports: MonthlyReport[]
  selectedMonth: string
}

export function SavedReportsSection({
  onSelect,
  reports,
  selectedMonth,
}: SavedReportsSectionProps) {
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tighter text-slate-950 dark:text-white">
            Monthly reports
          </h2>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Generated automatically from your account history.
          </p>
        </div>
        <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-800 dark:bg-slate-800 dark:text-pink-400">
          {reports.length}
        </span>
      </div>

      {reports.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => {
            const monthInput = report.reportMonth.slice(0, 7)
            const active = monthInput === selectedMonth

            return (
              <button
                key={report.id}
                type="button"
                onClick={() => onSelect(monthInput)}
                aria-pressed={active}
                className={`${appChoice} block rounded-[2rem] border p-5 text-left transition  ${
                  active
                    ? 'border-pink-300 bg-pink-700 text-white dark:border-pink-400 dark:bg-pink-600'
                    : 'border-pink-50 bg-white text-slate-950 hover:border-pink-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700'
                }`}
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-[1.25rem] ${
                      active ? 'bg-white/20' : 'bg-pink-50 text-pink-700 dark:bg-slate-950 dark:text-pink-400'
                    }`}
                  >
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-semibold">
                    {report.transactionCount} entries
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {formatReportMonth(report.reportMonth)}
                </p>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    active ? 'text-white' : 'text-pink-800 dark:text-pink-400'
                  }`}
                >
                  <FormattedFigure value={compactReportCurrency.format(report.netCashflow)} /> net
                </p>
                <p
                  className={`mt-4 flex items-center gap-1.5 text-sm font-medium ${
                    active ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Updated {formatGeneratedAt(report.generatedAt)}
                </p>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="rounded-[2rem] border border-dashed border-pink-200 bg-white px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="font-semibold text-slate-700 dark:text-slate-300">No reports yet</p>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
            Your first report appears automatically when tracking begins.
          </p>
        </div>
      )}
    </section>
  )
}
