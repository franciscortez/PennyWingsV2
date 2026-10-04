import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { AppButton } from '@/components/ui/Button'
import {
  fieldError,
  fieldHint,
  fieldInput,
  fieldLabel,
  fieldTextarea,
} from '@/components/ui/fieldStyles'
import { ModalFrame } from '@/components/ui/ModalFrame'
import { figure, surfaceNested, textMuted } from '@/components/ui/surfaces'
import { debtModalPanel } from '@/sections/debts/debtStyles'
import { debtChargeSchema } from '@/validation/debtSchemas'
import type { Debt, DebtChargeValues } from '@/types'

type AddChargeModalProps = {
  debt: Debt
  onClose: () => void
  onSubmit: (values: DebtChargeValues) => Promise<boolean>
  saving: boolean
}

type AddChargeFormValues = {
  amount: number
  charge_date: string
  note?: string | null
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

const todayIso = () => new Date().toISOString().slice(0, 10)

export function AddChargeModal({ debt, onClose, onSubmit, saving }: AddChargeModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<AddChargeFormValues>({
    defaultValues: {
      amount: '' as unknown as number,
      charge_date: todayIso(),
      note: '',
    },
    resolver: zodResolver(debtChargeSchema),
  })

  const rawAmount = Number(watch('amount'))
  const previewAmount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : 0
  const balanceAfter = debt.outstandingAmount + previewAmount

  const handleFormSubmit = async (values: AddChargeFormValues) => {
    const success = await onSubmit({
      amount: Number(values.amount),
      charge_date: values.charge_date,
      debt_id: debt.id,
      note: values.note || null,
    })
    if (success) {
      onClose()
    }
  }

  return (
    <ModalFrame
      title={`Add Purchase: ${debt.providerName}`}
      description="Record a new purchase. It is added to what you already owe this provider."
      onClose={onClose}
      closeLabel="Close add purchase dialog"
      closeDisabled={saving}
      panelClassName={debtModalPanel}
      actions={
        <div className="flex w-full items-center justify-end gap-3">
          <AppButton variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            type="submit"
            form="add-charge-form"
            disabled={saving}
          >
            {saving ? 'Adding…' : 'Add Purchase'}
          </AppButton>
        </div>
      }
    >
      <form
        id="add-charge-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-5"
      >
        <div>
          <label htmlFor="charge-amount" className={fieldLabel}>
            Purchase Amount (PHP)
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
              ₱
            </span>
            <input
              id="charge-amount"
              type="number"
              step="0.01"
              min="0.01"
              autoFocus
              autoComplete="off"
              placeholder="0.00"
              aria-describedby="charge-balance-preview"
              className={fieldInput(Boolean(errors.amount), 'pl-10 font-geist-mono tabular-nums')}
              {...register('amount', { valueAsNumber: true })}
            />
          </div>
          {errors.amount && (
            <p className={`mt-1.5 ${fieldError}`}>{errors.amount.message}</p>
          )}
        </div>

        <div
          id="charge-balance-preview"
          aria-live="polite"
          className={`flex items-center justify-between rounded-2xl p-4 ${surfaceNested}`}
        >
          <div>
            <span className={`block text-xs font-medium ${textMuted}`}>Owed now</span>
            <span className={`text-base font-semibold text-slate-900 dark:text-slate-100 ${figure}`}>
              {currencyFormatter.format(debt.outstandingAmount)}
            </span>
          </div>
          <div className="text-right">
            <span className={`block text-xs font-medium ${textMuted}`}>Owed after</span>
            <span className={`text-base font-bold text-pink-700 dark:text-pink-300 ${figure}`}>
              {currencyFormatter.format(balanceAfter)}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="charge-date" className={fieldLabel}>
            Purchase Date
          </label>
          <div className="mt-1">
            <input
              id="charge-date"
              type="date"
              autoComplete="off"
              className={fieldInput(Boolean(errors.charge_date))}
              {...register('charge_date')}
            />
          </div>
          {errors.charge_date && (
            <p className={`mt-1.5 ${fieldError}`}>{errors.charge_date.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="charge-note" className={fieldLabel}>
            Note (Optional)
          </label>
          <div className="mt-1">
            <textarea
              id="charge-note"
              rows={2}
              placeholder="e.g. Headphones, 3 installments"
              className={fieldTextarea(Boolean(errors.note))}
              {...register('note')}
            />
          </div>
          {errors.note && <p className={`mt-1.5 ${fieldError}`}>{errors.note.message}</p>}
          <p className={`mt-1 ${fieldHint}`}>
            This only updates what you owe. Your account balances do not change.
          </p>
        </div>
      </form>
    </ModalFrame>
  )
}
