import { fieldInput, fieldLabel } from '@/components/ui/fieldStyles'
import { useState, type FormEvent } from 'react'

import {
  ModalActions,
  ModalShell,
  type ModalMode,
} from '@/sections/monitoring/MonitoringShared'
import { currency } from '@/sections/monitoring/monitoringFormat'
import { alerts } from '@/lib/alert'
import { goalSchema } from '@/validation/monitoringSchemas'
import { getZodErrorMessage } from '@/validation/zodError'
import type { Account, Goal, GoalFormValues } from '@/types'

type GoalModalProps = {
  accounts: Account[]
  goal: Goal | null
  mode: ModalMode
  onClose: () => void
  onSubmit: (values: GoalFormValues) => Promise<boolean>
  saving: boolean
}

export function GoalModal({
  accounts,
  goal,
  mode,
  onClose,
  onSubmit,
  saving,
}: GoalModalProps) {
  const initialLinkedValue = goal?.linkedCardId
    ? `card:${goal.linkedCardId}`
    : goal?.linkedWalletId
      ? `wallet:${goal.linkedWalletId}`
      : 'none'
  const [name, setName] = useState(goal?.name ?? '')
  const [targetAmount, setTargetAmount] = useState(
    goal ? String(goal.targetAmount) : '',
  )
  const [currentAmount, setCurrentAmount] = useState(
    goal ? String(goal.currentAmount) : '0',
  )
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '')
  const [linkedValue, setLinkedValue] = useState(initialLinkedValue)
  const formId = 'goal-form'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const [linkedKind, linkedId] = linkedValue.split(':')
    const result = goalSchema.safeParse({
      currentAmount,
      linkedCardId: linkedKind === 'card' ? linkedId : null,
      linkedWalletId: linkedKind === 'wallet' ? linkedId : null,
      name,
      targetAmount,
      targetDate: targetDate || null,
    })

    if (!result.success) {
      const message = getZodErrorMessage(result.error, 'Invalid goal.')
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
          submitLabel={mode === 'edit' ? 'Save goal' : 'Create goal'}
          waitingLabel={mode === 'edit' ? 'Saving...' : 'Creating...'}
          onClose={onClose}
        />
      }
      saving={saving}
      title={mode === 'edit' ? 'Edit goal' : 'New goal'}
      onClose={onClose}
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="goal-name"
            className={`mb-2 block ${fieldLabel}`}
          >
            Goal name
          </label>
          <input
            id="goal-name"
              name="goal-name"
              autoComplete="off"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldInput(false, "min-w-0")}
            placeholder="Emergency fund"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="goal-target"
              className={`mb-2 block ${fieldLabel}`}
            >
              Target
            </label>
            <input
              id="goal-target"
              name="goal-target"
              autoComplete="off"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
              className={fieldInput(false, "min-w-0")}
              placeholder="0.00"
            />
          </div>
          <div>
            <label
              htmlFor="goal-current"
              className={`mb-2 block ${fieldLabel}`}
            >
              Saved
            </label>
            <input
              id="goal-current"
              name="goal-current"
              autoComplete="off"
              type="number"
              min="0"
              step="0.01"
              value={currentAmount}
              onChange={(event) => setCurrentAmount(event.target.value)}
              className={fieldInput(false, "min-w-0")}
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="goal-link"
            className={`mb-2 block ${fieldLabel}`}
          >
            Tracking source
          </label>
          <select
            id="goal-link"
              name="goal-link"
              autoComplete="off"
            value={linkedValue}
            onChange={(event) => setLinkedValue(event.target.value)}
            className={fieldInput(false, "min-w-0")}
          >
            <option value="none" className="dark:bg-slate-900">Manual saved amount</option>
            {accounts.map((account) => {
              const kind = account.kind === 'card' ? 'card' : 'wallet'

              return (
                <option key={`${kind}:${account.id}`} value={`${kind}:${account.id}`} className="dark:bg-slate-900">
                  {account.name} - {currency.format(account.balance)}
                </option>
              )
            })}
          </select>
        </div>
        <div className="min-w-0">
          <label
            htmlFor="goal-date"
            className={`mb-2 block ${fieldLabel}`}
          >
            Target date
          </label>
          <div className="min-w-0">
            <input
              id="goal-date"
              name="goal-date"
              autoComplete="off"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className={fieldInput(false, "min-w-0 max-w-full")}
            />
          </div>
        </div>
      </form>
    </ModalShell>
  )
}
