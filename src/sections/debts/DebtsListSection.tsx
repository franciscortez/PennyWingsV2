import { useMemo, useState } from 'react'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'

import { AppButton } from '@/components/ui/Button'
import { fieldInput } from '@/components/ui/fieldStyles'
import { textMuted } from '@/components/ui/surfaces'
import { DebtCard } from '@/sections/debts/DebtCard'
import type { Debt, DebtStatus, DebtType } from '@/types'

type DebtsListSectionProps = {
  debts: Debt[]
  onAddDebt: () => void
  onArchive: (debt: Debt) => void
  onEdit: (debt: Debt) => void
  onHistory: (debt: Debt) => void
  onPay: (debt: Debt) => void
  onUnarchive: (debt: Debt) => void
}

export function DebtsListSection({
  debts,
  onAddDebt,
  onArchive,
  onEdit,
  onHistory,
  onPay,
  onUnarchive,
}: DebtsListSectionProps) {
  const [activeTab, setActiveTab] = useState<DebtStatus>('outstanding')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<DebtType | 'all'>('all')

  const counts = useMemo(() => {
    return {
      archived: debts.filter((d) => d.status === 'archived').length,
      outstanding: debts.filter((d) => d.status === 'outstanding').length,
      paid: debts.filter((d) => d.status === 'paid').length,
    }
  }, [debts])

  const filteredDebts = useMemo(() => {
    return debts
      .filter((debt) => {
        // Tab filter
        if (debt.status !== activeTab) return false

        // Type filter
        if (typeFilter !== 'all' && debt.debtType !== typeFilter) return false

        // Search query
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase()
          const matchesProvider = debt.providerName.toLowerCase().includes(query)
          const matchesNote = debt.note?.toLowerCase().includes(query) ?? false
          const matchesType = debt.debtType.toLowerCase().includes(query)
          if (!matchesProvider && !matchesNote && !matchesType) return false
        }

        return true
      })
      .sort((a, b) => {
        // For outstanding debts, prioritize overdue and due soon debts first
        if (activeTab === 'outstanding') {
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          }
          if (a.dueDate) return -1
          if (b.dueDate) return 1
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [debts, activeTab, typeFilter, searchQuery])

  return (
    <section aria-label="Debts list" className="space-y-6">
      {/* Controls: Tabs & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex rounded-full border border-pink-100 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('outstanding')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'outstanding'
                ? 'bg-pink-700 text-white shadow-wing dark:bg-pink-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <span>Active</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                activeTab === 'outstanding'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {counts.outstanding}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paid')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'paid'
                ? 'bg-pink-700 text-white shadow-wing dark:bg-pink-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <span>Settled</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                activeTab === 'paid'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {counts.paid}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'archived'
                ? 'bg-pink-700 text-white shadow-wing dark:bg-pink-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            <span>Archived</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                activeTab === 'archived'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {counts.archived}
            </span>
          </button>
        </div>

        {/* Search & Type Filter */}
        <div className="flex flex-1 items-center gap-2 sm:max-w-md sm:justify-end">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Search debts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={fieldInput(false, 'h-10 pl-9 pr-4 text-xs')}
            />
          </div>

          <div className="relative">
            <select
              aria-label="Filter by debt type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DebtType | 'all')}
              className={fieldInput(false, 'h-10 px-3 pr-8 text-xs font-medium')}
            >
              <option value="all">All Types</option>
              <option value="bnpl">BNPL</option>
              <option value="credit_card">Credit Card</option>
              <option value="personal_loan">Personal Loan</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Debts Grid or Empty State */}
      {filteredDebts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-pink-200 bg-white/60 p-12 text-center dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">
            <SlidersHorizontal size={24} aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
            {searchQuery.trim() || typeFilter !== 'all'
              ? 'No matching debts found'
              : activeTab === 'outstanding'
                ? 'No active debts'
                : activeTab === 'paid'
                  ? 'No settled debts'
                  : 'No archived debts'}
          </h3>
          <p className={`mt-1 max-w-sm text-sm ${textMuted}`}>
            {searchQuery.trim() || typeFilter !== 'all'
              ? 'Try changing your search terms or filters.'
              : activeTab === 'outstanding'
                ? 'You currently have no outstanding debts recorded.'
                : 'Debts you mark as paid or archive will show up here.'}
          </p>

          {activeTab === 'outstanding' && !searchQuery.trim() && typeFilter === 'all' && (
            <div className="mt-6">
              <AppButton variant="primary" onClick={onAddDebt}>
                <Plus size={16} aria-hidden="true" />
                <span>Add your first debt</span>
              </AppButton>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onPay={onPay}
              onHistory={onHistory}
              onEdit={onEdit}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
            />
          ))}
        </div>
      )}
    </section>
  )
}
