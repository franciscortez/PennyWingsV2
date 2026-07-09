import { FileChartColumn } from 'lucide-react'
import { useMemo, useState } from 'react'

import Layout from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useErrorAlert } from '@/hooks/useErrorAlert'
import { useReportsData } from '@/hooks/useReportsData'
import {
  AccountSnapshotSection,
  CashFlowOverviewSection,
  CategoryAllocationSection,
  ReportsHeader,
  ReportsSkeleton,
  ReportSummarySection,
  SavedReportsSection,
} from '@/sections/reports'
import {
  currentMonthInput,
  formatReportMonth,
  toReportMonth,
} from '@/sections/reports/reportFormat'

export default function Reports() {
  const { user } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState(currentMonthInput)
  const { error, loading, reports } = useReportsData(user?.id)
  useErrorAlert(error)
  const selectedReport = useMemo(
    () =>
      reports.find(
        (report) => report.reportMonth === toReportMonth(selectedMonth),
      ) ?? null,
    [reports, selectedMonth],
  )

  if (loading) {
    return (
      <Layout>
        <ReportsSkeleton />
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-9 pb-20">
        <ReportsHeader
          onMonthChange={setSelectedMonth}
          selectedMonth={selectedMonth}
        />

        {selectedReport ? (
          <>
            <ReportSummarySection report={selectedReport} />
            <section className="grid grid-cols-1 gap-7 xl:grid-cols-5">
              <div className="xl:col-span-3">
                <CashFlowOverviewSection report={selectedReport} />
              </div>
              <div className="xl:col-span-2">
                <CategoryAllocationSection report={selectedReport} />
              </div>
            </section>
            <AccountSnapshotSection report={selectedReport} />
          </>
        ) : (
          <EmptyReport
            month={toReportMonth(selectedMonth)}
          />
        )}

        <SavedReportsSection
          onSelect={setSelectedMonth}
          reports={reports}
          selectedMonth={selectedMonth}
        />
      </div>
    </Layout>
  )
}

function EmptyReport({
  month,
}: {
  month: string
}) {
  return (
    <section className="relative overflow-hidden rounded-[2.75rem] border border-pink-100 bg-white px-6 py-14 text-center md:px-10">
      <div className="absolute left-1/2 top-0 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-200/50 blur-3xl" />
      <div className="relative">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-pink-50 text-pink-500">
          <FileChartColumn className="h-10 w-10" aria-hidden="true" />
        </span>
        <h2 className="mt-6 text-2xl font-black tracking-tight text-gray-950 md:text-3xl">
          No report for {formatReportMonth(month)}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-relaxed text-gray-500">
          Automatic reports begin with your first account or transaction.
          There is nothing to calculate for this earlier month.
        </p>
      </div>
    </section>
  )
}
