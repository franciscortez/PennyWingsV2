import { useState, type FormEvent } from 'react'

import {
  FormError,
  ModalActions,
  ModalShell,
  type ModalMode,
} from '@/sections/monitoring/MonitoringShared'
import { alerts } from '@/lib/alert'
import { budgetSchema } from '@/validation/monitoringSchemas'
import { getZodErrorMessage } from '@/validation/zodError'
import type {
  Budget,
  BudgetFormValues,
  BudgetPeriod,
  MonitoringCategory,
} from '@/types'

const periodOptions: Array<{ label: string; value: BudgetPeriod }> = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

type BudgetModalProps = {
  budget: Budget | null
  categories: MonitoringCategory[]
  mode: ModalMode
  onClose: () => void
  onSubmit: (values: BudgetFormValues) => Promise<boolean>
  saving: boolean
}

export function BudgetModal({
  budget,
  categories,
  mode,
  onClose,
  onSubmit,
  saving,
}: BudgetModalProps) {
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? '')
  const [limitAmount, setLimitAmount] = useState(
    budget ? String(budget.limitAmount) : '',
  )
  const [period, setPeriod] = useState<BudgetPeriod>(budget?.period ?? 'monthly')
  const [formError, setFormError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const result = budgetSchema.safeParse({
      categoryId,
      limitAmount,
      period,
    })

    if (!result.success) {
      const message = getZodErrorMessage(result.error, 'Invalid budget.')
      setFormError(message)
      alerts.warning(message)
      return
    }

    await onSubmit(result.data)
  }

  return (
    <ModalShell
      saving={saving}
      title={mode === 'edit' ? 'Edit Budget' : 'New Budget'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError ? <FormError message={formError} /> : null}
        <div>
          <label
            htmlFor="budget-category"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
          >
            Category
          </label>
          <select
            id="budget-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
          >
            <option value="">Choose expense category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="budget-limit"
              className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
            >
              Limit
            </label>
            <input
              id="budget-limit"
              type="number"
              min="0"
              step="0.01"
              value={limitAmount}
              onChange={(event) => setLimitAmount(event.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
              placeholder="0.00"
            />
          </div>
          <div>
            <label
              htmlFor="budget-period"
              className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
            >
              Period
            </label>
            <select
              id="budget-period"
              value={period}
              onChange={(event) => setPeriod(event.target.value as BudgetPeriod)}
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <ModalActions
          saving={saving}
          submitLabel={mode === 'edit' ? 'Save Budget' : 'Create Budget'}
          waitingLabel={mode === 'edit' ? 'Saving...' : 'Creating...'}
          onClose={onClose}
        />
      </form>
    </ModalShell>
  )
}
