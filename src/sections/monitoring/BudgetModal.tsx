import { fieldInput, fieldLabel } from '@/components/ui/fieldStyles'
import { useState, type FormEvent } from 'react'

import {
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
  const formId = 'budget-form'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = budgetSchema.safeParse({
      categoryId,
      limitAmount,
      period,
    })

    if (!result.success) {
      const message = getZodErrorMessage(result.error, 'Invalid budget.')
      alerts.warning(message)
      return
    }

    await onSubmit(result.data)
  }

  return (
    <ModalShell
      actions={
        <ModalActions
          formId={formId}
          saving={saving}
          submitLabel={mode === 'edit' ? 'Save budget' : 'Create budget'}
          waitingLabel={mode === 'edit' ? 'Saving...' : 'Creating...'}
          onClose={onClose}
        />
      }
      saving={saving}
      title={mode === 'edit' ? 'Edit budget' : 'New budget'}
      onClose={onClose}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="budget-category"
            className={`mb-2 block ${fieldLabel}`}
          >
            Category
          </label>
          <select
            id="budget-category"
              name="budget-category"
              autoComplete="off"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={fieldInput(false, "min-w-0")}
          >
            <option value="" className="dark:bg-slate-900">Choose expense category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id} className="dark:bg-slate-900">
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="budget-limit"
              className={`mb-2 block ${fieldLabel}`}
            >
              Limit
            </label>
            <input
              id="budget-limit"
              name="budget-limit"
              autoComplete="off"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={limitAmount}
              onChange={(event) => setLimitAmount(event.target.value)}
              className={fieldInput(false, "min-w-0")}
              placeholder="0.00"
            />
          </div>
          <div>
            <label
              htmlFor="budget-period"
              className={`mb-2 block ${fieldLabel}`}
            >
              Period
            </label>
            <select
              id="budget-period"
              name="budget-period"
              autoComplete="off"
              value={period}
              onChange={(event) => setPeriod(event.target.value as BudgetPeriod)}
              className={fieldInput(false, "min-w-0")}
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value} className="dark:bg-slate-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </ModalShell>
  )
}
