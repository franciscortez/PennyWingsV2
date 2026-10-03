import { PageHeader } from '@/components/ui/PageHeader'
import { textMuted } from '@/components/ui/surfaces'
import { formatLongDate } from '@/lib/date'

export function DashboardHeader() {
  return (
    <PageHeader title="My PennyWings" description="Every penny has wings, keep them flying in the right direction."
      actions={<div className="min-w-0 sm:text-right">
        <p className={`text-sm ${textMuted}`}>Current Date</p>
        <p className="mt-1 text-base font-medium text-slate-950 dark:text-slate-100">{formatLongDate(new Date())}</p>
      </div>}
    />
  )
}
