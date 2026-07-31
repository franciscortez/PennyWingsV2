import { Plus } from 'lucide-react'

import type { MonitoringTab } from '@/types'

type MonitoringHeaderProps = {
  activeTab: MonitoringTab
  onCreateBudget: () => void
  onCreateGoal: () => void
}

export function MonitoringHeader({
  activeTab,
  onCreateBudget,
  onCreateGoal,
}: MonitoringHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-pink-500">
          Monitoring
        </p>
        <h1 className="text-3xl font-black tracking-tight text-gray-950 dark:text-white sm:text-4xl">
          Budgets & Goals
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500 dark:text-slate-400 sm:text-base">
          Keep spending limits and savings targets visible before they drift.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={activeTab === 'budgets' ? onCreateBudget : onCreateGoal}
          className="flex items-center justify-center gap-2 rounded-[2rem] bg-pink-500 px-7 py-4 font-black text-white transition hover:bg-pink-600"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          {activeTab === 'budgets' ? 'New Budget' : 'New Goal'}
        </button>
      </div>
    </header>
  )
}

