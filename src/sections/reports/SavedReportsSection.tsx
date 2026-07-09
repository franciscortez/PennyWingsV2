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
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-gray-950">
            Monthly Reports
          </h2>
          <p className="text-sm font-medium text-gray-400">
            Generated automatically from your account history.
          </p>
        </div>
        <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-black text-pink-600">
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
                className={`rounded-[2rem] border p-5 text-left transition hover:-translate-y-1 ${
                  active
                    ? 'border-pink-300 bg-pink-500 text-white'
                    : 'border-pink-50 bg-white text-gray-900 hover:border-pink-200'
                }`}
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      active ? 'bg-white/20' : 'bg-pink-50 text-pink-500'
                    }`}
                  >
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-black">
                    {report.transactionCount} entries
                  </span>
                </div>
                <p className="text-lg font-black">
                  {formatReportMonth(report.reportMonth)}
                </p>
                <p
                  className={`mt-1 text-sm font-black ${
                    active ? 'text-pink-50' : 'text-pink-600'
                  }`}
                >
                  {compactReportCurrency.format(report.netCashflow)} net
                </p>
                <p
                  className={`mt-4 flex items-center gap-1.5 text-[10px] font-bold ${
                    active ? 'text-white/70' : 'text-gray-400'
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
        <div className="rounded-[2rem] border border-dashed border-pink-200 bg-white px-6 py-10 text-center">
          <p className="font-black text-gray-700">No reports yet</p>
          <p className="mt-1 text-sm font-medium text-gray-400">
            Your first report appears automatically when tracking begins.
          </p>
        </div>
      )}
    </section>
  )
}
