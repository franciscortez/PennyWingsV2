import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { AppButton } from '@/components/ui/Button'
import {
  fieldError,
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
import { debtUpdateSchema } from '@/validation/debtSchemas'
import type { Debt, DebtType, DebtUpdateValues } from '@/types'

type EditDebtModalProps = {
  debt: Debt
  onClose: () => void
  onSubmit: (id: string, values: DebtUpdateValues) => Promise<boolean>
  saving: boolean
}

type EditDebtFormValues = {
  debt_type: DebtType
  due_date?: string | null
  note?: string | null
  provider_name: string
}

const debtTypes: Array<{ id: DebtType; label: string }> = [
  { id: 'bnpl', label: 'BNPL' },
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'personal_loan', label: 'Personal Loan' },
  { id: 'other', label: 'Other' },
]

export function EditDebtModal({
  debt,
  onClose,
  onSubmit,
  saving,
}: EditDebtModalProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<EditDebtFormValues>({
    defaultValues: {
      debt_type: debt.debtType,
      due_date: debt.dueDate ?? '',
      note: debt.note ?? '',
      provider_name: debt.providerName,
    },
    resolver: zodResolver(debtUpdateSchema),
  })

  const selectedType = watch('debt_type')

  const handleFormSubmit = async (values: EditDebtFormValues) => {
    const success = await onSubmit(debt.id, {
      debt_type: values.debt_type,
      due_date: values.due_date || null,
      note: values.note || null,
      provider_name: values.provider_name.trim(),
    })
    if (success) {
      onClose()
    }
  }

  return (
    <ModalFrame
      title={`Edit ${debt.providerName}`}
      description="Update debt information or payment deadline."
      onClose={onClose}
      closeLabel="Close edit debt dialog"
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
            form="edit-debt-form"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </AppButton>
        </div>
      }
    >
      <form
        id="edit-debt-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        className="space-y-5"
      >
        {/* Provider Name */}
        <div>
          <label htmlFor="edit-provider-name" className={fieldLabel}>
            Provider or Creditor Name
          </label>
          <div className="mt-1">
            <input
              id="edit-provider-name"
              type="text"
              autoComplete="off"
              className={fieldInput(Boolean(errors.provider_name))}
              {...register('provider_name')}
            />
          </div>
          {errors.provider_name && (
            <p className={`mt-1.5 ${fieldError}`}>{errors.provider_name.message}</p>
          )}
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

        {/* Due Date */}
        <div>
          <label htmlFor="edit-due-date" className={fieldLabel}>
            Due Date (Optional)
          </label>
          <div className="mt-1">
            <input
              id="edit-due-date"
              type="date"
              autoComplete="off"
              className={fieldInput(Boolean(errors.due_date))}
              {...register('due_date')}
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label htmlFor="edit-debt-note" className={fieldLabel}>
            Note or Reference (Optional)
          </label>
          <div className="mt-1">
            <textarea
              id="edit-debt-note"
              rows={2}
              className={fieldTextarea(Boolean(errors.note))}
              {...register('note')}
            />
          </div>
        </div>
      </form>
    </ModalFrame>
  )
}
