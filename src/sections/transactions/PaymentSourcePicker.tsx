import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import {
  Banknote,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HandCoins,
  Wallet,
} from 'lucide-react'

import { AppButton } from '@/components/ui/Button'
import { fieldError, fieldInput } from '@/components/ui/fieldStyles'
import { ModalFrame } from '@/components/ui/ModalFrame'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { figure, textMuted } from '@/components/ui/surfaces'
import { AccountFace } from '@/sections/accounts/AccountFace'
import { getAccountKindLabel } from '@/sections/accounts/accountLabels'
import { darkChipKeys, getAccountLogo, type AccountLogo } from '@/sections/accounts/bankLogos'
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

const emptyCashCopy = 'No cash account yet. Add one in Accounts.'

const tabLabels: Record<FormPaymentMethod, string> = {
  card: 'Cards',
  cash: 'Cash',
  ewallet: 'Wallets',
  lent: 'Lent',
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

/** White chip with the provider's wordmark, sized to keep the row height. */
function LogoChip({ logo }: { logo: AccountLogo }) {
  const tone = darkChipKeys.has(logo.key)
    ? 'border-slate-700 bg-slate-900'
    : 'border-slate-200 bg-white dark:border-slate-600'

  return (
    <span
      className={`flex h-10 w-14 shrink-0 items-center justify-center rounded-xl border p-1.5 ${tone}`}
    >
      <img
        src={logo.src}
        alt=""
        aria-hidden="true"
        data-logo={logo.key}
        decoding="async"
        className="max-h-full max-w-full object-contain"
      />
    </span>
  )
}

/** Provider logo when the account has one, otherwise the method icon. */
function AccountChip({ account, method }: { account: Account; method: FormPaymentMethod }) {
  const logo = getAccountLogo(account)
  if (logo) return <LogoChip logo={logo} />

  // Same width as a logo chip, so names line up in a mixed list.
  return (
    <span className="flex w-14 shrink-0 justify-center">
      <IconChip method={method} />
    </span>
  )
}

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
  const tileRef = useRef<HTMLButtonElement>(null)
  const wasOpenRef = useRef(false)
  const onOpenChangeRef = useRef(onOpenChange)

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  })

  // The parent hid itself (visibility: hidden) while the sheet was open and
  // only shows itself again on its next render, so a browser refuses focus
  // on the tile right now. Try at once, then again on the next frame.
  useEffect(() => {
    onOpenChangeRef.current?.(open)
    let frame = 0
    if (wasOpenRef.current && !open) {
      tileRef.current?.focus()
      frame = requestAnimationFrame(() => {
        if (document.activeElement !== tileRef.current) tileRef.current?.focus()
      })
    }
    wasOpenRef.current = open
    return () => cancelAnimationFrame(frame)
  }, [open])

  // A parent that unmounts mid-open must not stay hidden.
  useEffect(() => () => onOpenChangeRef.current?.(false), [])

  const accountsFor = (target: FormPaymentMethod): Account[] => {
    if (target === 'cash') return cashAccount ? [cashAccount] : []
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

  const tileEyebrow = unselected ? 'Not selected' : methodLabels[method]
  const tileText = unselected ? unselectedLabel : tileTitle

  const tabs: FormPaymentMethod[] = [
    ...(allowCash ? (['cash'] as const) : []),
    'card',
    'ewallet',
    ...(allowLent ? (['lent'] as const) : []),
  ]

  const choose = (nextMethod: FormPaymentMethod, accountId: string) => {
    onChange(nextMethod, accountId)
    setOpen(false)
  }

  return (
    <div>
      <button
        ref={tileRef}
        type="button"
        aria-describedby={error ? errorId : undefined}
        aria-haspopup="dialog"
        aria-invalid={Boolean(error)}
        aria-label={`${label}, ${tileEyebrow}, ${tileText}`}
        onClick={() => setOpen(true)}
        className={fieldInput(
          Boolean(error),
          'flex h-auto min-h-14 items-center gap-3 rounded-[1.25rem] px-4 py-2.5 text-left active:scale-[0.99] motion-reduce:transform-none',
        )}
      >
        {!unselected && (method === 'card' || method === 'ewallet') && selectedAccount ? (
          <AccountChip account={selectedAccount} method={method} />
        ) : (
          <IconChip method={unselected ? 'ewallet' : method} />
        )}
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
        <SourceSheet
          accountsFor={accountsFor}
          initialMethod={unselected ? null : method}
          initialAccountId={
            unselected ? null : method === 'cash' ? (cashAccount?.id ?? null) : (selectedAccount?.id ?? null)
          }
          label={label}
          requiredAmount={requiredAmount}
          tabs={tabs}
          title={sheetTitle}
          onChoose={choose}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}

/**
 * The picker sheet: account-type tabs over a swipeable rail of the real card
 * and banknote faces. The centred card is the candidate; the details and the
 * Use button below it always describe that one card.
 */
function SourceSheet({
  accountsFor,
  initialAccountId,
  initialMethod,
  label,
  onChoose,
  onClose,
  requiredAmount,
  tabs,
  title,
}: {
  accountsFor: (method: FormPaymentMethod) => Account[]
  initialAccountId: string | null
  initialMethod: FormPaymentMethod | null
  label: string
  onChoose: (method: FormPaymentMethod, accountId: string) => void
  onClose: () => void
  requiredAmount?: number
  tabs: FormPaymentMethod[]
  title: string
}) {
  const firstTabWithAccounts = tabs.find((tab) => accountsFor(tab).length > 0) ?? tabs[0]
  // Open on the current account's tab; when that tab is empty (no cash
  // account yet, say) open on the first tab that has something to choose.
  const [tab, setTab] = useState<FormPaymentMethod>(
    initialMethod && tabs.includes(initialMethod) && accountsFor(initialMethod).length > 0
      ? initialMethod
      : firstTabWithAccounts,
  )
  const accounts = accountsFor(tab)
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, accounts.findIndex((account) => account.id === initialAccountId)),
  )
  const railRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([])
  // Focus starts on the centred card, so arrow keys work straight away.
  const activeCardRef = useRef<HTMLButtonElement | null>(null)
  // Scroll events from our own scrollTo must not drag the index through the
  // cards it passes on the way.
  const settling = useRef(false)
  const settleTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(settleTimer.current), [])

  const index = Math.min(activeIndex, Math.max(accounts.length - 1, 0))
  const active = accounts[index] ?? null
  const isCurrent = (account: Account) =>
    tab === initialMethod && account.id === initialAccountId
  const shortBy =
    active && requiredAmount !== undefined && requiredAmount > 0 && active.balance < requiredAmount
      ? requiredAmount - active.balance
      : null

  const scrollToIndex = (next: number, smooth: boolean) => {
    const rail = railRef.current
    const card = cardRefs.current[next]
    if (!rail || !card) return
    const left = card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    settling.current = true
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => {
      settling.current = false
    }, smooth && !reduce ? 450 : 50)
    rail.scrollTo?.({ left, behavior: smooth && !reduce ? 'smooth' : 'auto' })
  }

  const goTo = (next: number, { focus = false, smooth = true } = {}) => {
    if (next < 0 || next >= accounts.length) return
    setActiveIndex(next)
    scrollToIndex(next, smooth)
    if (focus) cardRefs.current[next]?.focus({ preventScroll: true })
  }

  // Open (and every tab change) lands on the chosen card with no animation.
  useLayoutEffect(() => {
    scrollToIndex(index, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const handleScroll = () => {
    const rail = railRef.current
    if (!rail || settling.current) return
    const center = rail.scrollLeft + rail.clientWidth / 2
    let nearest = index
    let distance = Number.POSITIVE_INFINITY
    cardRefs.current.forEach((card, cardIndex) => {
      if (!card) return
      const cardCenter = card.offsetLeft + card.offsetWidth / 2
      const gap = Math.abs(cardCenter - center)
      if (gap < distance) {
        distance = gap
        nearest = cardIndex
      }
    })
    if (nearest !== index) setActiveIndex(nearest)
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLButtonElement>, cardIndex: number) => {
    const last = accounts.length - 1
    const next =
      event.key === 'ArrowRight'
        ? Math.min(cardIndex + 1, last)
        : event.key === 'ArrowLeft'
          ? Math.max(cardIndex - 1, 0)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (next === null) return
    event.preventDefault()
    goTo(next, { focus: true })
  }

  const switchTab = (next: FormPaymentMethod) => {
    const list = accountsFor(next)
    setTab(next)
    setActiveIndex(
      Math.max(0, next === initialMethod ? list.findIndex((account) => account.id === initialAccountId) : 0),
    )
  }

  const confirm = () => {
    if (!active) return
    onChoose(tab, tab === 'cash' ? '' : active.id)
  }

  const tabOptions = tabs.map((value) => {
    const count = accountsFor(value).length
    return {
      label: value === 'cash' ? tabLabels.cash : `${tabLabels[value]} ${count}`,
      value,
    }
  })

  return (
    <ModalFrame
      mobilePresentation="sheet"
      actions={
        <AppButton
          className="w-full"
          disabled={!active}
          onClick={confirm}
          type="button"
        >
          {active ? `Use ${active.name}${shortBy !== null ? ' anyway' : ''}` : 'Nothing to choose'}
        </AppButton>
      }
      closeLabel={`Close ${label} picker`}
      contentClassName="space-y-4 px-4 pb-4 md:px-6 md:pb-6"
      description={
        requiredAmount !== undefined && requiredAmount > 0
          ? `Amount ${balanceFormatter.format(requiredAmount)}`
          : undefined
      }
      initialFocusRef={activeCardRef}
      headerClassName="px-4 pt-4 md:px-6 md:pt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:text-sm [&_p]:font-medium [&_p]:text-slate-600 dark:[&_p]:text-slate-400"
      onClose={onClose}
      overlayClassName="items-end p-0 [--modal-gutter:0px] md:items-center md:p-4 md:[--modal-gutter:1rem]"
      panelClassName="picker-sheet source-sheet font-geist rounded-b-none pb-[env(safe-area-inset-bottom)] shadow-wing-lg dark:shadow-none md:max-w-lg md:rounded-b-[2rem] md:pb-0"
      title={title}
    >
      {tabs.length > 1 ? (
        <SegmentedControl
          label="Account type"
          options={tabOptions}
          value={tab}
          onChange={switchTab}
        />
      ) : null}

      {accounts.length === 0 ? (
        <div className="source-empty">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {tab === 'cash' ? emptyCashCopy : emptyCopy[tab]}
          </p>
        </div>
      ) : (
        <>
          <div className="source-rail-wrap">
            <button
              type="button"
              className="source-rail-arrow"
              data-side="prev"
              aria-label="Previous account"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            >
              <ChevronLeft aria-hidden="true" size={20} />
            </button>
            <div
              ref={railRef}
              role="radiogroup"
              aria-label={`${tabLabels[tab]} accounts`}
              className="source-rail"
              data-single={accounts.length === 1 ? 'true' : undefined}
              onScroll={handleScroll}
            >
              {accounts.map((account, cardIndex) => {
                const checked = cardIndex === index
                const short =
                  requiredAmount !== undefined && requiredAmount > 0 && account.balance < requiredAmount
                return (
                  <button
                    key={account.id}
                    ref={(element) => {
                      cardRefs.current[cardIndex] = element
                      if (checked) activeCardRef.current = element
                    }}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    aria-label={[
                      account.name,
                      getAccountKindLabel(account),
                      balanceFormatter.format(account.balance),
                      isCurrent(account) ? 'current' : null,
                      short ? 'not enough balance' : null,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                    tabIndex={checked ? 0 : -1}
                    className="source-card"
                    data-active={checked ? 'true' : undefined}
                    onClick={() => (checked ? confirm() : goTo(cardIndex))}
                    onKeyDown={(event) => handleCardKeyDown(event, cardIndex)}
                  >
                    <AccountFace account={account} />
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              className="source-rail-arrow"
              data-side="next"
              aria-label="Next account"
              disabled={index >= accounts.length - 1}
              onClick={() => goTo(index + 1)}
            >
              <ChevronRight aria-hidden="true" size={20} />
            </button>
          </div>

          {accounts.length > 1 ? (
            <div className="source-dots" aria-hidden="true">
              {accounts.map((account, cardIndex) => (
                <span key={account.id} data-active={cardIndex === index ? 'true' : undefined} />
              ))}
            </div>
          ) : null}

          {active ? (
            <div className="source-details" aria-live="polite">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-950 dark:text-slate-100">
                  {active.name}
                </p>
                <p className={`flex items-center gap-1.5 text-sm ${textMuted}`}>
                  {getAccountKindLabel(active)}
                  {isCurrent(active) ? (
                    <span className="source-current">
                      <Check aria-hidden="true" size={12} strokeWidth={3} />
                      Current
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`text-base font-semibold ${figure} ${
                    shortBy !== null
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-slate-950 dark:text-slate-100'
                  }`}
                >
                  {balanceFormatter.format(active.balance)}
                </p>
                {shortBy !== null ? (
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">
                    Short by {balanceFormatter.format(shortBy)}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      )}
    </ModalFrame>
  )
}
