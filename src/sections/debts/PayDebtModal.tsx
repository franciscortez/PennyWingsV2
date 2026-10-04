import { useMemo, useState } from 'react'
import { AlertCircle, CreditCard, Wallet } from 'lucide-react'

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
import type { Account, Debt, DebtPayMutationValues, PaymentMethod } from '@/types'

type PayDebtModalProps = {
  accounts: Account[]
  debt: Debt
  onClose: () => void
  onSubmit: (values: DebtPayMutationValues) => Promise<boolean>
  saving: boolean
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

export function PayDebtModal({
  accounts,
  debt,
  onClose,
  onSubmit,
  saving,
}: PayDebtModalProps) {
  const [amount, setAmount] = useState<number>(debt.outstandingAmount)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  )
  const [note, setNote] = useState<string>('')

  // Filter out lent and inactive accounts
  const eligibleAccounts = useMemo(() => {
    return accounts.filter(
      (a) =>
        a.kind !== 'lent' &&
        a.accountType !== 'lent' &&
        (a.status ? a.status === 'active' : a.isActive) &&
        !a.isHidden,
    )
  }, [accounts])

  const selectedAccount = useMemo(() => {
    return eligibleAccounts.find((a) => a.id === selectedAccountId) ?? null
  }, [eligibleAccounts, selectedAccountId])

  // Overpayment check
  const isOverpaying = amount > debt.outstandingAmount
  const isInvalidAmount = isNaN(amount) || amount <= 0

  // Insufficient funds check
  const hasInsufficientFunds = selectedAccount ? selectedAccount.balance < amount : false

  const canSubmit =
    !isInvalidAmount &&
    !isOverpaying &&
    Boolean(selectedAccount) &&
    !hasInsufficientFunds &&
    !saving

  const handlePreset = (fraction: number) => {
    const raw = Math.round(debt.outstandingAmount * fraction * 100) / 100
    setAmount(raw)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !selectedAccount) return

    const paymentMethod: PaymentMethod =
      selectedAccount.kind === 'card'
        ? 'card'
        : selectedAccount.accountType === 'cash'
          ? 'cash'
          : 'ewallet'

    const success = await onSubmit({
      amount,
      card_id: selectedAccount.kind === 'card' ? selectedAccount.id : null,
      debt_id: debt.id,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      wallet_id: selectedAccount.kind !== 'card' ? selectedAccount.id : null,
      note: note.trim() || null,
    })

    if (success) {
      onClose()
    }
  }

  return (
    <ModalFrame
      title={`Repay ${debt.providerName}`}
      description="Pay off a portion or the full balance of this debt."
      onClose={onClose}
      closeLabel="Close repay debt dialog"
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
            form="pay-debt-form"
            disabled={!canSubmit}
          >
            {saving ? 'Processing…' : 'Confirm Repayment'}
          </AppButton>
        </div>
      }
    >
      <form id="pay-debt-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Outstanding Context Banner */}
        <div className={`rounded-2xl p-4 ${surfaceNested} flex items-center justify-between`}>
          <div>
            <span className={`block text-xs font-medium ${textMuted}`}>
              Remaining Balance
            </span>
            <span className={`text-xl font-bold text-slate-950 sm:text-2xl dark:text-white ${figure}`}>
              {currencyFormatter.format(debt.outstandingAmount)}
            </span>
          </div>
          <div className="text-right">
            <span className={`block text-xs font-medium ${textMuted}`}>
              Original Amount
            </span>
            <span className={`text-sm font-semibold text-slate-700 dark:text-slate-300 ${figure}`}>
              {currencyFormatter.format(debt.originalAmount)}
            </span>
          </div>
        </div>

        {/* Amount Input & Presets */}
        <div>
          <label htmlFor="pay-amount" className={fieldLabel}>
            Payment Amount (PHP)
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
              ₱
            </span>
            <input
              id="pay-amount"
              type="number"
              step="0.01"
              min="0.01"
              autoComplete="off"
              value={isNaN(amount) ? '' : amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className={fieldInput(isOverpaying || isInvalidAmount, 'pl-10 font-geist-mono tabular-nums')}
              required
            />
          </div>

          {/* Quick preset buttons */}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handlePreset(1)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-pink-300 hover:bg-pink-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-pink-700 dark:hover:bg-slate-700"
            >
              Full ({currencyFormatter.format(debt.outstandingAmount)})
            </button>
            <button
              type="button"
              onClick={() => handlePreset(0.5)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-pink-300 hover:bg-pink-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-pink-700 dark:hover:bg-slate-700"
            >
              50% ({currencyFormatter.format(debt.outstandingAmount * 0.5)})
            </button>
            <button
              type="button"
              onClick={() => handlePreset(0.25)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-pink-300 hover:bg-pink-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-pink-700 dark:hover:bg-slate-700"
            >
              25% ({currencyFormatter.format(debt.outstandingAmount * 0.25)})
            </button>
          </div>

          {isOverpaying && (
            <p className={`mt-1.5 ${fieldError}`}>
              Payment amount exceeds remaining debt balance.
            </p>
          )}
        </div>

        {/* Source Account Selector */}
        <div>
          <label className={fieldLabel}>Select Source Account</label>
          <p className={`mt-0.5 text-xs ${fieldHint}`}>
            Choose an active bank card, e-wallet, or cash account to deduct funds from.
          </p>

          <div className="mt-2.5 max-h-48 space-y-2 overflow-y-auto pr-1" role="radiogroup" aria-label="Source account">
            {eligibleAccounts.length === 0 ? (
              <p className={`rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs ${textMuted} dark:border-slate-700`}>
                No active source accounts found. Please add a bank card or e-wallet first.
              </p>
            ) : (
              eligibleAccounts.map((account) => {
                const isSelected = selectedAccountId === account.id
                const insufficient = account.balance < amount

                return (
                  <label
                    key={account.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                      isSelected
                        ? 'border-pink-600 bg-pink-50/60 ring-2 ring-pink-500/20 dark:border-pink-500 dark:bg-pink-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="source_account"
                        value={account.id}
                        checked={isSelected}
                        onChange={() => setSelectedAccountId(account.id)}
                        className="sr-only"
                        aria-label={account.name}
                      />
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        {account.kind === 'card' ? (
                          <CreditCard size={16} className="text-slate-700 dark:text-slate-300" />
                        ) : (
                          <Wallet size={16} className="text-slate-700 dark:text-slate-300" />
                        )}
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-slate-950 dark:text-white">
                          {account.name}
                        </span>
                        <span className={`block text-xs uppercase ${textMuted}`}>
                          {account.kind} • {account.accountType}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`block text-sm font-semibold text-slate-900 dark:text-slate-100 ${figure}`}>
                        {currencyFormatter.format(account.balance)}
                      </span>
                      {insufficient && (
                        <span className="text-[11px] font-medium text-red-600 dark:text-red-400">
                          Insufficient
                        </span>
                      )}
                    </div>
                  </label>
                )
              })
            )}
          </div>

          {hasInsufficientFunds && (
            <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <AlertCircle size={14} className="shrink-0" />
              <span>
                Insufficient balance in this account (Available: {currencyFormatter.format(selectedAccount?.balance ?? 0)}).
              </span>
            </div>
          )}
        </div>

        {/* Payment Date */}
        <div>
          <label htmlFor="pay-date" className={fieldLabel}>
            Payment Date
          </label>
          <div className="mt-1">
            <input
              id="pay-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className={fieldInput(false)}
              required
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label htmlFor="pay-note" className={fieldLabel}>
            Note or Reference (Optional)
          </label>
          <div className="mt-1">
            <textarea
              id="pay-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Reference #12345678"
              className={fieldTextarea(false)}
            />
          </div>
        </div>
      </form>
    </ModalFrame>
  )
}
