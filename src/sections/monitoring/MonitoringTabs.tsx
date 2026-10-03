import { ReceiptText, Target } from 'lucide-react'
import { surface, textMuted } from '@/components/ui/surfaces'
import { appChoice, appChoiceActive, appChoiceIdle } from '@/sections/shared/appDesignStyles'
import type { MonitoringTab } from '@/types'

type MonitoringTabsProps = {
  activeTab: MonitoringTab
  budgetCount: number
  goalCount: number
  onChange: (tab: MonitoringTab) => void
}

export function MonitoringTabs({ activeTab, budgetCount, goalCount, onChange }: MonitoringTabsProps) {
  return <section className={`${surface} flex flex-wrap items-center justify-between gap-4 p-4`} aria-label="Monitoring views">
    <div className="flex flex-wrap gap-2">
      {([{ id: 'budgets', label: 'Budgets', icon: ReceiptText }, { id: 'goals', label: 'Goals', icon: Target }] as const).map(tab => <button key={tab.id} type="button" onClick={() => onChange(tab.id)} aria-pressed={activeTab === tab.id} className={`${appChoice} ${activeTab === tab.id ? appChoiceActive : appChoiceIdle}`}>
        <tab.icon className="h-5 w-5 shrink-0" aria-hidden="true" />{tab.label}
      </button>)}
    </div>
    <p className={`text-sm ${textMuted}`}>{activeTab === 'budgets' ? `${budgetCount} spending limit${budgetCount === 1 ? '' : 's'}` : `${goalCount} savings target${goalCount === 1 ? '' : 's'}`}</p>
  </section>
}
