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
import {
  debtChoice,
  debtChoiceActive,
  debtChoiceIdle,
  debtModalPanel,
} from '@/sections/debts/debtStyles'
import { debtCreateSchema } from '@/validation/debtSchemas'
import type { DebtCreateValues, DebtType } from '@/types'

type AddDebtModalProps = {
  onClose: () => void
  onSubmit: (values: DebtCreateValues) => Promise<boolean>
  saving: boolean
}

type AddDebtFormValues = {
  debt_type: DebtType
  due_date?: string | null
  note?: string | null
  original_amount: number
  provider_name: string
}

const providerSuggestions = [
  'Atome',
  'SPayLater',
  'Billease',
  'BDO Card',
  'BPI Card',
  'GCredit',
  'Maya Credit',
]

const debtTypes: Array<{ id: DebtType; label: string }> = [
  { id: 'bnpl', label: 'BNPL' },
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'personal_loan', label: 'Personal Loan' },
  { id: 'other', label: 'Other' },
]

export function AddDebtModal({ onClose, onSubmit, saving }: AddDebtModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<AddDebtFormValues>({
    defaultValues: {
      debt_type: 'bnpl',
      due_date: '',
      note: '',
      original_amount: '' as unknown as number,
      provider_name: '',
    },
    resolver: zodResolver(debtCreateSchema),
  })

  const selectedType = watch('debt_type')

  const handleFormSubmit = async (values: AddDebtFormValues) => {
    const success = await onSubmit({
      debt_type: values.debt_type,
      due_date: values.due_date || null,
      note: values.note || null,
      original_amount: Number(values.original_amount),
      provider_name: values.provider_name.trim(),
    })
    if (success) {
      onClose()
    }
  }

  return (
    <ModalFrame
      title="Add New Debt"
      description="Track an installment, credit card balance, or personal loan."
      onClose={onClose}
      closeLabel="Close add debt dialog"
      closeDisabled={saving}
      panelClassName={debtModalPanel}
      actions={
        <div className="flex w-full items-center justify-end gap-3">
          <AppButton
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            type="submit"
            form="add-debt-form"
            disabled={saving}
          >
            {saving ? 'Creating…' : 'Create Debt'}
          </AppButton>
        </div>
      }
    >
      <form
        id="add-debt-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-5"
      >
        {/* Provider Name */}
        <div>
          <label htmlFor="provider-name" className={fieldLabel}>
            Provider or Creditor Name
          </label>
          <div className="mt-1">
            <input
              id="provider-name"
              type="text"
              autoComplete="off"
              placeholder="e.g. Atome, SPayLater, BDO"
              className={fieldInput(Boolean(errors.provider_name))}
              {...register('provider_name')}
            />
          </div>
          {errors.provider_name && (
            <p className={`mt-1.5 ${fieldError}`}>{errors.provider_name.message}</p>
          )}

          {/* Suggestions */}
          <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Provider suggestions">
            {providerSuggestions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setValue('provider_name', name, { shouldValidate: true })}
                aria-label={`Use ${name} as provider`}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-pink-300 hover:bg-pink-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-pink-700 dark:hover:bg-slate-700"
              >
                + {name}
              </button>
            ))}
          </div>
        </div>

        {/* Debt Type Selector */}
        <div>
          <label className={fieldLabel}>Debt Type</label>
          <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Debt type">
            {debtTypes.map(({ id, label }) => {
              const active = selectedType === id
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setValue('debt_type', id)}
                  className={`${debtChoice} ${active ? debtChoiceActive : debtChoiceIdle}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Original Amount */}
        <div>
          <label htmlFor="original-amount" className={fieldLabel}>
            Total Amount (PHP)
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
              ₱
            </span>
            <input
              id="original-amount"
              type="number"
              step="0.01"
              min="0.01"
              autoComplete="off"
              placeholder="0.00"
              className={fieldInput(Boolean(errors.original_amount), 'pl-10 font-geist-mono tabular-nums')}
              {...register('original_amount', { valueAsNumber: true })}
            />
          </div>
          {errors.original_amount && (
            <p className={`mt-1.5 ${fieldError}`}>{errors.original_amount.message}</p>
          )}
          <p className={`mt-1 ${fieldHint}`}>
            The total borrowed balance or total purchase price.
          </p>
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="due-date" className={fieldLabel}>
            Due Date (Optional)
          </label>
          <div className="mt-1">
            <input
              id="due-date"
              type="date"
              autoComplete="off"
              className={fieldInput(Boolean(errors.due_date))}
              {...register('due_date')}
            />
          </div>
          <p className={`mt-1 ${fieldHint}`}>
            Set an optional payment deadline to receive due and overdue reminders.
          </p>
        </div>

        {/* Note */}
        <div>
          <label htmlFor="debt-note" className={fieldLabel}>
            Note or Reference (Optional)
          </label>
          <div className="mt-1">
            <textarea
              id="debt-note"
              rows={2}
              placeholder="e.g. 3-month installment plan for phone purchase"
              className={fieldTextarea(Boolean(errors.note))}
              {...register('note')}
            />
          </div>
        </div>
      </form>
    </ModalFrame>
  )
}
