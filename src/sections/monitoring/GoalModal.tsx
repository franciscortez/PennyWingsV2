import { useState, type FormEvent } from 'react'

import {
  FormError,
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
  const [formError, setFormError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

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
      setFormError(message)
      alerts.warning(message)
      return
    }

    await onSubmit(result.data)
  }

  return (
    <ModalShell
      saving={saving}
      title={mode === 'edit' ? 'Edit Goal' : 'New Goal'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError ? <FormError message={formError} /> : null}
        <div>
          <label
            htmlFor="goal-name"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
          >
            Goal Name
          </label>
          <input
            id="goal-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
            placeholder="Emergency fund"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="goal-target"
              className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
            >
              Target
            </label>
            <input
              id="goal-target"
              type="number"
              min="0"
              step="0.01"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
              placeholder="0.00"
            />
          </div>
          <div>
            <label
              htmlFor="goal-current"
              className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
            >
              Saved
            </label>
            <input
              id="goal-current"
              type="number"
              min="0"
              step="0.01"
              value={currentAmount}
              onChange={(event) => setCurrentAmount(event.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="goal-link"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
          >
            Tracking Source
          </label>
          <select
            id="goal-link"
            value={linkedValue}
            onChange={(event) => setLinkedValue(event.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
          >
            <option value="none">Manual saved amount</option>
            {accounts.map((account) => {
              const kind = account.kind === 'card' ? 'card' : 'wallet'

              return (
                <option key={`${kind}:${account.id}`} value={`${kind}:${account.id}`}>
                  {account.name} - {currency.format(account.balance)}
                </option>
              )
            })}
          </select>
        </div>
        <div>
          <label
            htmlFor="goal-date"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
          >
            Target Date
          </label>
          <input
            id="goal-date"
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
          />
        </div>
        <ModalActions
          saving={saving}
          submitLabel={mode === 'edit' ? 'Save Goal' : 'Create Goal'}
          waitingLabel={mode === 'edit' ? 'Saving...' : 'Creating...'}
          onClose={onClose}
        />
      </form>
    </ModalShell>
  )
}
