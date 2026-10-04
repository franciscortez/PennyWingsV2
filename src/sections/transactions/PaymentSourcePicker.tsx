import { useEffect, useRef, useState } from 'react'
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HandCoins,
  Wallet,
} from 'lucide-react'
import { twMerge } from 'tailwind-merge'

import { fieldError, fieldInput } from '@/components/ui/fieldStyles'
import { ModalFrame } from '@/components/ui/ModalFrame'
import { figure, textMuted } from '@/components/ui/surfaces'
import type { Account, FormPaymentMethod } from '@/types'

type PaymentSourcePickerProps = {
  allowCash: boolean
  allowLent: boolean
  cardAccounts: Account[]
  cardId: string
  cashAccount: Account | null
  error?: string
  errorId: string
  excludeCardId?: string
  excludeWalletId?: string
  label: string
  lentAccounts: Account[]
  method: FormPaymentMethod
  /** Called once with the method and account. `accountId` is '' for cash. */
  onChange: (method: FormPaymentMethod, accountId: string) => void
  /** Lets a parent modal step aside while the picker is the only dialog shown. */
  onOpenChange?: (open: boolean) => void
  /** Accounts below this balance are marked "Insufficient" in the sheet. */
  requiredAmount?: number
  sheetTitle?: string
  /** No source chosen yet: the tile shows a prompt instead of a default method. */
  unselected?: boolean
  unselectedLabel?: string
  walletAccounts: Account[]
  walletId: string
}

type AccountMethod = Exclude<FormPaymentMethod, 'cash'>

const balanceFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

const methodLabels: Record<FormPaymentMethod, string> = {
  card: 'Bank Card',
  cash: 'Cash',
  ewallet: 'E-Wallet',
  lent: 'Lent',
}

const accountStepTitles: Record<AccountMethod, string> = {
  card: 'Choose a bank card',
  ewallet: 'Choose an e-wallet',
  lent: 'Choose a lent account',
}

const choosePrompts: Record<AccountMethod, string> = {
  card: 'Choose a bank card',
  ewallet: 'Choose an e-wallet',
  lent: 'Choose a lent account',
}

const emptyCopy: Record<AccountMethod, string> = {
  card: 'No bank cards yet. Add one in Accounts.',
  ewallet: 'No e-wallets yet. Add one in Accounts.',
  lent: 'No lent accounts yet. Add one in Accounts.',
}

const countNoun = (method: AccountMethod, count: number) => {
  const nouns: Record<AccountMethod, [string, string]> = {
    card: ['card', 'cards'],
    ewallet: ['wallet', 'wallets'],
    lent: ['account', 'accounts'],
  }
  return `${count} ${nouns[method][count === 1 ? 0 : 1]}`
}

function MethodIcon({ method }: { method: FormPaymentMethod }) {
  const className = 'h-5 w-5'
  if (method === 'cash') return <Banknote className={className} aria-hidden="true" />
  if (method === 'card') return <CreditCard className={className} aria-hidden="true" />
  if (method === 'lent') return <HandCoins className={className} aria-hidden="true" />
  return <Wallet className={className} aria-hidden="true" />
}

function IconChip({ method }: { method: FormPaymentMethod }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-800 dark:bg-slate-800 dark:text-pink-300">
      <MethodIcon method={method} />
    </span>
  )
}

const rowClass =
  'flex min-h-14 w-full items-center gap-3 rounded-[1.25rem] border px-4 py-3 text-left transition-[background-color,border-color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 dark:focus-visible:outline-pink-300 motion-reduce:transition-none'
const rowIdle =
  'border-slate-200 bg-white hover:border-pink-300 hover:bg-pink-50/60 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-pink-700 dark:hover:bg-slate-800'
const rowSelected =
  'border-pink-600 bg-pink-50/60 ring-2 ring-pink-500/20 dark:border-pink-500 dark:bg-pink-950/30'

export function PaymentSourcePicker({
  allowCash,
  allowLent,
  cardAccounts,
  cardId,
  cashAccount,
  error,
  errorId,
  excludeCardId,
  excludeWalletId,
  label,
  lentAccounts,
  method,
  onChange,
  onOpenChange,
  requiredAmount,
  sheetTitle = 'Pay with',
  unselected = false,
  unselectedLabel = 'Choose a source account',
  walletAccounts,
  walletId,
}: PaymentSourcePickerProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'method' | 'account'>('method')
  const [pickedMethod, setPickedMethod] = useState<AccountMethod>('card')
  const tileRef = useRef<HTMLButtonElement>(null)
  const wasOpenRef = useRef(false)
  const onOpenChangeRef = useRef(onOpenChange)

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  })

  // Runs after the parent has shown itself again, so the tile can take focus
  // back even though it was hidden while the sheet was open.
  useEffect(() => {
    onOpenChangeRef.current?.(open)
    if (wasOpenRef.current && !open) {
      tileRef.current?.focus()
    }
    wasOpenRef.current = open
  }, [open])

  // A parent that unmounts mid-open must not stay hidden.
  useEffect(() => () => onOpenChangeRef.current?.(false), [])

  const accountsFor = (target: AccountMethod): Account[] => {
    if (target === 'card') {
      return cardAccounts.filter((account) => account.id !== excludeCardId)
    }
    const pool = target === 'lent' ? lentAccounts : walletAccounts
    return pool.filter((account) => account.id !== excludeWalletId)
  }

  const selectedAccount: Account | null =
    method === 'cash'
      ? cashAccount
      : (method === 'card' ? cardAccounts : [...walletAccounts, ...lentAccounts]).find(
          (account) => account.id === (method === 'card' ? cardId : walletId),
        ) ?? null

  const tileTitle =
    method === 'cash'
      ? (cashAccount?.name ?? 'No cash account available')
      : (selectedAccount?.name ?? choosePrompts[method])

  const isShort = (account: Account | null) =>
    account !== null && requiredAmount !== undefined && account.balance < requiredAmount

  const tileEyebrow = unselected ? 'Not selected' : methodLabels[method]
  const tileText = unselected ? unselectedLabel : tileTitle

  const openSheet = () => {
    setStep('method')
    setOpen(true)
  }

  const closeSheet = () => setOpen(false)

  const choose = (nextMethod: FormPaymentMethod, accountId: string) => {
    onChange(nextMethod, accountId)
    closeSheet()
  }

  const methodRows: Array<{ method: FormPaymentMethod; count: number }> = [
    ...(allowCash ? [{ count: cashAccount ? 1 : 0, method: 'cash' as const }] : []),
    { count: accountsFor('card').length, method: 'card' },
    { count: accountsFor('ewallet').length, method: 'ewallet' },
    ...(allowLent ? [{ count: accountsFor('lent').length, method: 'lent' as const }] : []),
  ]

  const accountList = accountsFor(pickedMethod)
  const selectedIdForPicked = pickedMethod === 'card' ? cardId : walletId
  const sheetOpenTitle = step === 'method' ? sheetTitle : accountStepTitles[pickedMethod]

  return (
    <div>
      <button
        ref={tileRef}
        type="button"
        aria-describedby={error ? errorId : undefined}
        aria-haspopup="dialog"
        aria-invalid={Boolean(error)}
        aria-label={`${label}, ${tileEyebrow}, ${tileText}`}
        onClick={openSheet}
        className={fieldInput(
          Boolean(error),
          'flex h-auto min-h-14 items-center gap-3 rounded-[1.25rem] px-4 py-2.5 text-left active:scale-[0.99] motion-reduce:transform-none',
        )}
      >
        <IconChip method={unselected ? 'ewallet' : method} />
        <span className="min-w-0 flex-1">
          <span className={`block text-xs font-medium ${textMuted}`}>
            {tileEyebrow}
          </span>
          <span className="block truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
            {tileText}
          </span>
        </span>
        {!unselected && selectedAccount ? (
          <span className={`shrink-0 text-sm font-semibold text-slate-800 dark:text-slate-200 ${figure}`}>
            {balanceFormatter.format(selectedAccount.balance)}
          </span>
        ) : null}
        <ChevronRight
          className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400"
          aria-hidden="true"
        />
      </button>

      {error ? (
        <p id={errorId} className={`mt-2 ${fieldError}`}>
          {error}
        </p>
      ) : null}

      {open ? (
        <ModalFrame
          closeLabel={`Close ${label} picker`}
          contentClassName="space-y-3 px-4 pb-4 md:px-6 md:pb-6"
          headerClassName="px-4 pt-4 md:px-6 md:pt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight"
          onClose={closeSheet}
          overlayClassName="items-end p-0 [--modal-gutter:0px] md:items-center md:p-4 md:[--modal-gutter:1rem]"
          panelClassName={twMerge(
            'picker-sheet font-geist rounded-b-none pb-[env(safe-area-inset-bottom)] shadow-wing-lg dark:shadow-none md:max-w-md md:rounded-b-[2rem] md:pb-0',
          )}
          title={sheetOpenTitle}
        >
          {step === 'method' ? (
            <ul className="space-y-2">
              {methodRows.map((row) => {
                const disabled = row.count === 0
                const isCurrent = !unselected && row.method === method
                const accountMethod = row.method as AccountMethod

                return (
                  <li key={row.method}>
                    <button
                      type="button"
                      aria-current={isCurrent ? 'true' : undefined}
                      disabled={disabled}
                      onClick={() => {
                        if (row.method === 'cash') {
                          choose('cash', '')
                          return
                        }
                        setPickedMethod(accountMethod)
                        setStep('account')
                      }}
                      className={twMerge(rowClass, isCurrent ? rowSelected : rowIdle)}
                    >
                      <IconChip method={row.method} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-950 dark:text-slate-100">
                          {row.method === 'card'
                            ? 'Bank Card'
                            : row.method === 'ewallet'
                              ? 'E-Wallet'
                              : row.method === 'lent'
                                ? 'Lent'
                                : 'Cash'}
                        </span>
                        <span className={`block truncate text-xs ${textMuted}`}>
                          {row.method === 'cash'
                            ? (cashAccount?.name ?? 'No cash account available')
                            : disabled
                              ? emptyCopy[accountMethod]
                              : countNoun(accountMethod, row.count)}
                        </span>
                      </span>
                      {row.method === 'cash' && cashAccount ? (
                        <span className="shrink-0 text-right">
                          <span className={`block text-sm font-semibold ${figure}`}>
                            {balanceFormatter.format(cashAccount.balance)}
                          </span>
                          {isShort(cashAccount) ? (
                            <span className="block text-[11px] font-medium text-red-700 dark:text-red-300">
                              Insufficient
                            </span>
                          ) : null}
                        </span>
                      ) : row.method !== 'cash' && !disabled ? (
                        <ChevronRight
                          className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400"
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('method')}
                className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-semibold text-pink-800 hover:bg-pink-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800 dark:text-pink-300 dark:hover:bg-slate-800 dark:focus-visible:outline-pink-300"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Back to payment methods</span>
                <span aria-hidden="true">Back</span>
              </button>

              <ul className="max-h-[50dvh] space-y-2 overflow-y-auto pr-1" aria-label={accountStepTitles[pickedMethod]}>
                {accountList.map((account) => {
                  const selected =
                    !unselected && account.id === selectedIdForPicked && method === pickedMethod

                  return (
                    <li key={account.id}>
                      <button
                        type="button"
                        aria-current={selected ? 'true' : undefined}
                        onClick={() => choose(pickedMethod, account.id)}
                        className={twMerge(rowClass, selected ? rowSelected : rowIdle)}
                      >
                        <IconChip method={pickedMethod} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                            {account.name}
                          </span>
                          <span className={`block truncate text-xs capitalize ${textMuted}`}>
                            {account.accountType}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className={`block text-sm font-semibold text-slate-800 dark:text-slate-200 ${figure}`}>
                            {balanceFormatter.format(account.balance)}
                          </span>
                          {isShort(account) ? (
                            <span className="block text-[11px] font-medium text-red-700 dark:text-red-300">
                              Insufficient
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </ModalFrame>
      ) : null}
    </div>
  )
}
