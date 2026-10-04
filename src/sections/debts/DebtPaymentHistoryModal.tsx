import { useMemo, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CreditCard,
  RotateCcw,
  ShoppingBag,
  Wallet,
  XCircle,
} from 'lucide-react'

import { AppButton } from '@/components/ui/Button'
import { fieldInput } from '@/components/ui/fieldStyles'
import { ModalFrame } from '@/components/ui/ModalFrame'
import { figure, surfaceNested, textMuted } from '@/components/ui/surfaces'
import { debtModalPanelWide } from '@/sections/debts/debtStyles'
import type { Debt, DebtActivityItem, DebtCharge, DebtPayment } from '@/types'

type DebtPaymentHistoryModalProps = {
  charges?: DebtCharge[]
  debt: Debt
  onClose: () => void
  onReverse: (paymentId: string, reason?: string) => Promise<boolean>
  onVoidCharge?: (chargeId: string, reason?: string) => Promise<boolean>
  payments: DebtPayment[]
  saving: boolean
}

type PendingAction = { id: string; kind: 'reverse' | 'void' } | null

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const rowTone = (inactive: boolean) =>
  inactive
    ? 'border-slate-200 bg-slate-50/50 opacity-70 dark:border-slate-800 dark:bg-slate-900/40'
    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'

const ghostAction =
  'flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-300'

export function DebtPaymentHistoryModal({
  charges = [],
  debt,
  onClose,
  onReverse,
  onVoidCharge,
  payments,
  saving,
}: DebtPaymentHistoryModalProps) {
  const [pending, setPending] = useState<PendingAction>(null)
  const [reason, setReason] = useState<string>('')

  const activity = useMemo<DebtActivityItem[]>(() => {
    const items: DebtActivityItem[] = [
      ...charges
        .filter((c) => c.debtId === debt.id)
        .map((charge) => ({
          charge,
          createdAt: charge.createdAt,
          date: charge.chargeDate,
          kind: 'charge' as const,
        })),
      ...payments
        .filter((p) => p.debtId === debt.id)
        .map((payment) => ({
          createdAt: payment.createdAt,
          date: payment.paymentDate,
          kind: 'payment' as const,
          payment,
        })),
    ]
    return items.sort(
      (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    )
  }, [charges, payments, debt.id])

  const activeChargeCount = charges.filter(
    (c) => c.debtId === debt.id && c.status === 'active',
  ).length
  const canVoid = Boolean(onVoidCharge) && debt.status !== 'archived' && activeChargeCount > 1

  const closePending = () => {
    setPending(null)
    setReason('')
  }

  const handleConfirm = async () => {
    if (!pending) return
    const trimmed = reason.trim() || undefined
    const success =
      pending.kind === 'reverse'
        ? await onReverse(pending.id, trimmed)
        : await (onVoidCharge?.(pending.id, trimmed) ?? Promise.resolve(false))
    if (success) closePending()
  }

  const confirmPanel = (
    title: string,
    body: string,
    confirmLabel: string,
    busyLabel: string,
  ) => (
    <div className="mt-3 rounded-xl border border-red-200 bg-red-50/60 p-3 dark:border-red-900/60 dark:bg-red-950/40">
      <div className="flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-700 dark:text-red-300" aria-hidden="true" />
        <div className="flex-1">
          <p className="text-xs font-medium text-red-800 dark:text-red-200">{title}</p>
          <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">{body}</p>

          <div className="mt-2.5">
            <input
              type="text"
              autoComplete="off"
              aria-label="Reason (optional)"
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={fieldInput(false, 'h-9 text-xs')}
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving}
              className="rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50"
            >
              {saving ? busyLabel : confirmLabel}
            </button>
            <button
              type="button"
              onClick={closePending}
              disabled={saving}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ModalFrame
      title={`Activity: ${debt.providerName}`}
      description="Purchases and repayments for this provider. Reverse or void entries if needed."
      onClose={onClose}
      closeLabel="Close activity dialog"
      closeDisabled={saving}
      panelClassName={debtModalPanelWide}
      actions={
        <div className="flex w-full items-center justify-end">
          <AppButton variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Close
          </AppButton>
        </div>
      }
    >
      <div className="space-y-5">
        <div className={`flex items-center justify-between rounded-2xl p-4 ${surfaceNested}`}>
          <div>
            <span className={`block text-xs font-medium ${textMuted}`}>Total Charged</span>
            <span className={`text-base font-semibold text-slate-900 dark:text-slate-100 ${figure}`}>
              {currencyFormatter.format(debt.originalAmount)}
            </span>
          </div>
          <div className="text-right">
            <span className={`block text-xs font-medium ${textMuted}`}>Remaining Outstanding</span>
            <span className={`text-base font-bold text-pink-700 dark:text-pink-300 ${figure}`}>
              {currencyFormatter.format(debt.outstandingAmount)}
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Activity ({activity.length})
          </h4>

          {activity.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
              <p className={`text-sm ${textMuted}`}>
                No purchases or repayments have been recorded for this debt yet.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {activity.map((item) => {
                if (item.kind === 'charge') {
                  const { charge } = item
                  const isVoided = charge.status === 'voided'
                  const isPending = pending?.kind === 'void' && pending.id === charge.id

                  return (
                    <li key={`charge-${charge.id}`} className={`rounded-2xl border p-4 transition-all ${rowTone(isVoided)}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-base font-bold ${figure} ${
                                isVoided
                                  ? 'line-through text-slate-500 dark:text-slate-400'
                                  : 'text-slate-950 dark:text-white'
                              }`}
                            >
                              +{currencyFormatter.format(charge.amount)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              <ShoppingBag size={12} aria-hidden="true" />
                              <span>{isVoided ? 'Purchase voided' : 'Purchase'}</span>
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar size={13} aria-hidden="true" />
                            <span>{formatDate(charge.chargeDate)}</span>
                          </div>

                          {charge.note && (
                            <p className="mt-2 text-xs italic text-slate-600 dark:text-slate-400">
                              "{charge.note}"
                            </p>
                          )}

                          {isVoided && charge.voidReason && (
                            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                              Reason: {charge.voidReason}
                            </p>
                          )}
                        </div>

                        {canVoid && !isVoided && !isPending && (
                          <button
                            type="button"
                            onClick={() => {
                              setPending({ id: charge.id, kind: 'void' })
                              setReason('')
                            }}
                            className={ghostAction}
                          >
                            <XCircle size={13} aria-hidden="true" />
                            <span>Void</span>
                          </button>
                        )}
                      </div>

                      {isPending &&
                        confirmPanel(
                          'Void this purchase?',
                          `This removes ${currencyFormatter.format(charge.amount)} from what you owe. It cannot be voided if it has already been repaid.`,
                          'Confirm Void',
                          'Voiding…',
                        )}
                    </li>
                  )
                }

                const { payment } = item
                const isReversed = payment.status === 'reversed'
                const isPending = pending?.kind === 'reverse' && pending.id === payment.id

                return (
                  <li key={`payment-${payment.id}`} className={`rounded-2xl border p-4 transition-all ${rowTone(isReversed)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-base font-bold ${figure} ${
                              isReversed
                                ? 'line-through text-slate-500 dark:text-slate-400'
                                : 'text-slate-950 dark:text-white'
                            }`}
                          >
                            -{currencyFormatter.format(payment.amount)}
                          </span>

                          {isReversed ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-300">
                              <XCircle size={12} aria-hidden="true" />
                              <span>Reversed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 size={12} aria-hidden="true" />
                              <span>Repayment</span>
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} aria-hidden="true" />
                            <span>{formatDate(payment.paymentDate)}</span>
                          </span>

                          <span className="flex items-center gap-1">
                            {payment.paymentMethod === 'card' ? (
                              <CreditCard size={13} aria-hidden="true" />
                            ) : (
                              <Wallet size={13} aria-hidden="true" />
                            )}
                            <span>{payment.accountName ?? payment.paymentMethod}</span>
                          </span>
                        </div>

                        {payment.note && (
                          <p className="mt-2 text-xs italic text-slate-600 dark:text-slate-400">
                            "{payment.note}"
                          </p>
                        )}

                        {isReversed && payment.reversalReason && (
                          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                            Reason: {payment.reversalReason}
                          </p>
                        )}
                      </div>

                      {!isReversed && !isPending && (
                        <button
                          type="button"
                          onClick={() => {
                            setPending({ id: payment.id, kind: 'reverse' })
                            setReason('')
                          }}
                          className={ghostAction}
                        >
                          <RotateCcw size={13} aria-hidden="true" />
                          <span>Reverse</span>
                        </button>
                      )}
                    </div>

                    {isPending &&
                      confirmPanel(
                        'Reverse this repayment?',
                        `This will refund ${currencyFormatter.format(payment.amount)} to ${payment.accountName ?? 'your account'} and increase the remaining debt by ${currencyFormatter.format(payment.amount)}.`,
                        'Confirm Reversal',
                        'Reversing…',
                      )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </ModalFrame>
  )
}
