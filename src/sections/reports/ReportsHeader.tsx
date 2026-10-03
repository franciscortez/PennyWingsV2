import { RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui'
import { ReportMonthPicker } from '@/sections/reports/ReportMonthPicker'

type ReportsHeaderProps = { onMonthChange: (month: string) => void; selectedMonth: string }
export function ReportsHeader({ onMonthChange, selectedMonth }: ReportsHeaderProps) {
  return <PageHeader title="Reports" description="Review monthly cash flow, spending categories, and closing balances." actions={
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><RefreshCw className="h-4 w-4" aria-hidden="true" />Updates automatically</span>
      <ReportMonthPicker value={selectedMonth} onChange={onMonthChange} />
    </div>
  } />
}
