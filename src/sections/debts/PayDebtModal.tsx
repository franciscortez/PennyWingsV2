import { useMemo, useState } from 'react'
import { AlertCircle } from 'lucide-react'

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
import { PaymentSourcePicker } from '@/sections/transactions/PaymentSourcePicker'
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
  // While the source picker is open it is the only dialog on screen.
  const [pickerOpen, setPickerOpen] = useState(false)

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

  const isCashAccount = (account: Account) =>
    account.kind === 'cash' || account.accountType === 'cash'

  const cardAccounts = useMemo(
    () => eligibleAccounts.filter((a) => a.kind === 'card'),
    [eligibleAccounts],
  )
  const cashAccount = useMemo(
    () => eligibleAccounts.find((a) => a.kind !== 'card' && isCashAccount(a)) ?? null,
    [eligibleAccounts],
  )
  const walletAccounts = useMemo(
    () => eligibleAccounts.filter((a) => a.kind !== 'card' && !isCashAccount(a)),
    [eligibleAccounts],
  )

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
        : isCashAccount(selectedAccount)
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
      overlayClassName={pickerOpen ? 'invisible' : undefined}
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

        {/* Source Account: a tile that opens the picker modal */}
        <div className={`${surfaceNested} space-y-3 p-4`}>
          <p className={`${fieldLabel} ml-1 block`}>Source Account</p>
          <PaymentSourcePicker
            allowCash
            allowLent={false}
            cardAccounts={cardAccounts}
            cardId={selectedAccount?.kind === 'card' ? selectedAccount.id : ''}
            cashAccount={cashAccount}
            errorId="pay-source-error"
            label="Source Account"
            lentAccounts={[]}
            method={
              !selectedAccount
                ? 'cash'
                : selectedAccount.kind === 'card'
                  ? 'card'
                  : isCashAccount(selectedAccount)
                    ? 'cash'
                    : 'ewallet'
            }
            onChange={(method, accountId) => {
              setSelectedAccountId(method === 'cash' ? (cashAccount?.id ?? '') : accountId)
            }}
            onOpenChange={setPickerOpen}
            requiredAmount={isInvalidAmount ? undefined : amount}
            sheetTitle="Pay from"
            unselected={!selectedAccount}
            walletAccounts={walletAccounts}
            walletId={
              selectedAccount && selectedAccount.kind !== 'card' && !isCashAccount(selectedAccount)
                ? selectedAccount.id
                : ''
            }
          />
          <p className={`ml-1 text-xs ${fieldHint}`}>
            Choose an active bank card, e-wallet, or cash account to deduct funds from.
          </p>

          {eligibleAccounts.length === 0 && (
            <p className={`rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs ${textMuted} dark:border-slate-700`}>
              No active source accounts found. Please add a bank card or e-wallet first.
            </p>
          )}

          {hasInsufficientFunds && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
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
