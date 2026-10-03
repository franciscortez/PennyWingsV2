import { Plus } from 'lucide-react'
import { AppButton, PageHeader } from '@/components/ui'
import type { MonitoringTab } from '@/types'

type MonitoringHeaderProps = {
  activeTab: MonitoringTab
  onCreateBudget: () => void
  onCreateGoal: () => void
}

export function MonitoringHeader({ activeTab, onCreateBudget, onCreateGoal }: MonitoringHeaderProps) {
  return <PageHeader title="Budgets & Goals" description="Keep spending limits and savings targets visible before they drift." actions={
    <AppButton type="button" onClick={activeTab === 'budgets' ? onCreateBudget : onCreateGoal} className="motion-reduce:transform-none motion-reduce:transition-none">
      <Plus className="h-5 w-5" aria-hidden="true" />
      {activeTab === 'budgets' ? 'New budget' : 'New goal'}
    </AppButton>
  } />
}
