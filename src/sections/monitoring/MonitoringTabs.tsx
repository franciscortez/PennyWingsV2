import { ReceiptText, Target, type LucideIcon } from 'lucide-react'

import type { MonitoringTab } from '@/types'

const tabs: Array<{
  icon: LucideIcon
  id: MonitoringTab
  label: string
}> = [
  { id: 'budgets', label: 'Budgets', icon: ReceiptText },
  { id: 'goals', label: 'Goals', icon: Target },
]

type MonitoringTabsProps = {
  activeTab: MonitoringTab
  budgetCount: number
  goalCount: number
  onChange: (tab: MonitoringTab) => void
}

export function MonitoringTabs({
  activeTab,
  budgetCount,
  goalCount,
  onChange,
}: MonitoringTabsProps) {
  return (
    <section className="flex flex-col gap-4 rounded-[2.5rem] border border-pink-50 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex gap-2 rounded-[2rem] bg-pink-50 p-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-[1.4rem] px-5 py-3 text-sm font-black transition sm:flex-none ${
                active
                  ? 'bg-white text-pink-600 shadow-sm'
                  : 'text-gray-400 hover:text-pink-500'
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </div>
      <p className="px-3 text-xs font-bold uppercase tracking-widest text-gray-400">
        {activeTab === 'budgets'
          ? `${budgetCount} spending limit${budgetCount === 1 ? '' : 's'}`
          : `${goalCount} savings target${goalCount === 1 ? '' : 's'}`}
      </p>
    </section>
  )
}
