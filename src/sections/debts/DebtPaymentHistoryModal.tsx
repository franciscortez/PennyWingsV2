import { useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  CreditCard,
  RotateCcw,
  Wallet,
  XCircle,
} from 'lucide-react'

import { AppButton } from '@/components/ui/Button'
import { fieldInput } from '@/components/ui/fieldStyles'
import { ModalFrame } from '@/components/ui/ModalFrame'
import { figure, surfaceNested, textMuted } from '@/components/ui/surfaces'
import { debtModalPanelWide } from '@/sections/debts/debtStyles'
import type { Debt, DebtPayment } from '@/types'

type DebtPaymentHistoryModalProps = {
  debt: Debt
  onClose: () => void
  onReverse: (paymentId: string, reason?: string) => Promise<boolean>
  payments: DebtPayment[]
  saving: boolean
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

export function DebtPaymentHistoryModal({
  debt,
  onClose,
  onReverse,
  payments,
  saving,
}: DebtPaymentHistoryModalProps) {
  const [reversingId, setReversingId] = useState<string | null>(null)
  const [reversalReason, setReversalReason] = useState<string>('')

  // Filter payments for this specific debt
  const debtPayments = payments.filter((p) => p.debtId === debt.id)

  const handleConfirmReversal = async (paymentId: string) => {
    const success = await onReverse(paymentId, reversalReason.trim() || undefined)
    if (success) {
      setReversingId(null)
      setReversalReason('')
    }
  }

  return (
    <ModalFrame
      title={`Payment History: ${debt.providerName}`}
      description="View audit log and reverse recorded repayments if needed."
      onClose={onClose}
      closeLabel="Close payment history dialog"
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
        {/* Context Summary */}
        <div className={`flex items-center justify-between rounded-2xl p-4 ${surfaceNested}`}>
          <div>
            <span className={`block text-xs font-medium ${textMuted}`}>Total Borrowed</span>
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

        {/* Payments List */}
        <div>
          <h4 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Recorded Repayments ({debtPayments.length})
          </h4>

          {debtPayments.length === 0 ? (
            <div className={`mt-3 rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800`}>
              <p className={`text-sm ${textMuted}`}>
                No repayments have been recorded for this debt yet.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {debtPayments.map((payment) => {
                const isReversed = payment.status === 'reversed'
                const isCurrentlyReversing = reversingId === payment.id

                return (
                  <div
                    key={payment.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      isReversed
                        ? 'border-slate-200 bg-slate-50/50 opacity-70 dark:border-slate-800 dark:bg-slate-900/40'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
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
                            {currencyFormatter.format(payment.amount)}
                          </span>

                          {isReversed ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-300">
                              <XCircle size={12} aria-hidden="true" />
                              <span>Reversed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 size={12} aria-hidden="true" />
                              <span>Completed</span>
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={13} aria-hidden="true" />
                            <span>
                              {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
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

                      {/* Reverse action button */}
                      {!isReversed && !isCurrentlyReversing && (
                        <button
                          type="button"
                          onClick={() => {
                            setReversingId(payment.id)
                            setReversalReason('')
                          }}
                          className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                        >
                          <RotateCcw size={13} aria-hidden="true" />
                          <span>Reverse</span>
                        </button>
                      )}
                    </div>

                    {/* Inline reversal confirmation */}
                    {isCurrentlyReversing && (
                      <div className="mt-3 rounded-xl border border-red-200 bg-red-50/60 p-3 dark:border-red-900/60 dark:bg-red-950/40">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-700 dark:text-red-300" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-red-800 dark:text-red-200">
                              Reverse this repayment?
                            </p>
                            <p className="mt-0.5 text-xs text-red-700 dark:text-red-300">
                              This will refund {currencyFormatter.format(payment.amount)} to{' '}
                              {payment.accountName ?? 'your account'} and increase the remaining debt by{' '}
                              {currencyFormatter.format(payment.amount)}.
                            </p>

                            <div className="mt-2.5">
                              <input
                                type="text"
                                autoComplete="off"
                                placeholder="Reason for reversal (optional)"
                                value={reversalReason}
                                onChange={(e) => setReversalReason(e.target.value)}
                                className={fieldInput(false, 'h-9 text-xs')}
                              />
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleConfirmReversal(payment.id)}
                                disabled={saving}
                                className="rounded-full bg-red-700 px-3 py-1 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50"
                              >
                                {saving ? 'Reversing…' : 'Confirm Reversal'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setReversingId(null)}
                                disabled={saving}
                                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </ModalFrame>
  )
}
