import {
  ArrowDownLeft,
  ArrowLeftRight,
  Banknote,
  Check,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'

import { useAuth } from '@/hooks/useAuth'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useMobileKeyboard } from '@/hooks/useMobileKeyboard'
import { useRecentCategoryIds } from '@/hooks/useRecentCategoryIds'
import { useTransactionComposer } from '@/hooks/useTransactionComposer'
import { alerts } from '@/lib/alert'
import { TransactionForm } from '@/sections/transactions/TransactionForm'
import type { TransactionFormValues, TransactionType } from '@/types'

/** The other kinds, nearest the thumb first. Expense is the plain tap. */
const dialOptions: Array<{ icon: LucideIcon; label: string; type: TransactionType }> = [
  { type: 'income', icon: ArrowDownLeft, label: 'Income' },
  { type: 'transfer', icon: ArrowLeftRight, label: 'Transfer' },
  { type: 'withdrawal', icon: Banknote, label: 'Withdraw' },
]

const LONG_PRESS_MS = 450
const SAVED_PULSE_MS = 900

type QuickAddState =
  | { step: 'closed' }
  | { step: 'dial' }
  | { step: 'form'; type: TransactionType }

/**
 * Phone-only floating "+" mounted once in the signed-in shell, on every page.
 * A tap opens a new expense in place (no navigation). Press and hold, right
 * click, Shift+Enter or the context-menu key fans out Income, Transfer and
 * Withdraw. The form's own type switch covers every kind too, so the dial is
 * only ever a shortcut. Desktop keeps the page actions.
 */
export function QuickAddTransaction() {
  const isPhone = useMediaQuery('(max-width: 767px)')

  if (!isPhone) {
    return null
  }

  return <QuickAddLauncher />
}

function QuickAddLauncher() {
  const { user } = useAuth()
  const keyboardOpen = useMobileKeyboard()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const pressTimer = useRef<number | undefined>(undefined)
  const longPressed = useRef(false)
  const dialId = useId()
  const hintId = useId()
  const [state, setState] = useState<QuickAddState>({ step: 'closed' })
  const [saved, setSaved] = useState(false)
  // Warmed on the first touch so accounts and categories are usually cached by
  // the time the form opens.
  const [warm, setWarm] = useState(false)
  const getRecentCategoryIds = useRecentCategoryIds(user?.id)

  const {
    cardAccounts,
    cashAccount,
    categories,
    createTransaction,
    creating,
    lentAccounts,
    optionsLoading,
    walletAccounts,
  } = useTransactionComposer(user?.id, { enabled: warm || state.step !== 'closed' })

  const dialOpen = state.step === 'dial'

  useEffect(() => () => window.clearTimeout(pressTimer.current), [])

  useEffect(() => {
    if (!saved) return
    const timer = window.setTimeout(() => setSaved(false), SAVED_PULSE_MS)
    return () => window.clearTimeout(timer)
  }, [saved])

  // The dial is a light popover, not a modal: Escape, a tap on the scrim or
  // moving focus away closes it. The scrim takes that tap, so dismissing never
  // also activates whatever sits underneath.
  useEffect(() => {
    if (!dialOpen) return

    itemRefs.current[0]?.focus()

    // Functional updates: picking an item opens the form, whose dialog takes
    // focus before these listeners are removed. That focus move must not
    // read as "focus left the dial" and close the form it just opened.
    const closeDialOnly = () =>
      setState((current) => (current.step === 'dial' ? { step: 'closed' } : current))
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeDialOnly()
        buttonRef.current?.focus()
      }
    }
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target)) return
      if (itemRefs.current.some((item) => item?.contains(target))) return
      closeDialOnly()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [dialOpen])

  const openDial = () => {
    setWarm(true)
    setState({ step: 'dial' })
  }

  const openForm = (type: TransactionType) => setState({ step: 'form', type })

  const close = () => {
    if (!creating) setState({ step: 'closed' })
  }

  const cancelPress = () => window.clearTimeout(pressTimer.current)

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    setWarm(true)
    longPressed.current = false
    if (event.pointerType === 'mouse') return
    cancelPress()
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true
      navigator.vibrate?.(10)
      openDial()
    }, LONG_PRESS_MS)
  }

  const handleClick = () => {
    // The release that ends a long press must not also open the form.
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    if (dialOpen) {
      setState({ step: 'closed' })
      return
    }
    openForm('expense')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault()
      openDial()
    }
  }

  const handleDialKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = dialOptions.length - 1
    // Items stack upward from the button, so Up moves away from it.
    const next =
      event.key === 'ArrowUp'
        ? (index === last ? 0 : index + 1)
        : event.key === 'ArrowDown'
          ? (index === 0 ? last : index - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (next === null) return
    event.preventDefault()
    itemRefs.current[next]?.focus()
  }

  const handleSubmit = async (values: TransactionFormValues) => {
    const { error } = await createTransaction(values)

    if (error) {
      alerts.error(error.message)
      return false
    }

    alerts.success('Transaction created.')
    setSaved(true)
    return true
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="quick-add-fab md:hidden"
        // The open sheet covers the button, so it only steps aside for the
        // keyboard when nothing of its own is open (focus returns to it).
        hidden={keyboardOpen && state.step === 'closed'}
        aria-label="Quick add transaction"
        aria-describedby={hintId}
        aria-haspopup="dialog"
        aria-expanded={state.step !== 'closed'}
        aria-controls={dialOpen ? dialId : undefined}
        aria-keyshortcuts="Shift+Enter"
        data-open={dialOpen ? 'true' : undefined}
        data-saved={saved ? 'true' : undefined}
        onClick={handleClick}
        onContextMenu={(event) => {
          event.preventDefault()
          cancelPress()
          longPressed.current = false
          openDial()
        }}
        onFocus={() => setWarm(true)}
        onKeyDown={handleKeyDown}
        onPointerCancel={cancelPress}
        onPointerDown={handlePointerDown}
        onPointerLeave={cancelPress}
        onPointerUp={cancelPress}
      >
        <span className="quick-add-fab-icon" aria-hidden="true">
          {saved ? <Check size={24} strokeWidth={2.5} /> : <Plus size={24} strokeWidth={2.25} />}
        </span>
      </button>
      <span id={hintId} hidden>
        Opens a new expense. Press and hold, or Shift+Enter, for income, transfer or withdrawal.
      </span>

      {dialOpen ? (
        <>
          <div
            className="quick-add-scrim"
            aria-hidden="true"
            onClick={() => setState({ step: 'closed' })}
          />
          <div id={dialId} role="menu" aria-label="Add another kind" className="quick-add-dial">
            {dialOptions.map(({ icon: Icon, label, type }, index) => (
              <button
                key={type}
                ref={(element) => {
                  itemRefs.current[index] = element
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className="quick-add-dial-item"
                data-kind={type}
                style={{ '--dial-index': index } as CSSProperties}
                onClick={() => openForm(type)}
                onKeyDown={(event) => handleDialKeyDown(event, index)}
              >
                <span className="quick-add-dial-label">{label}</span>
                <span className="quick-add-dial-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={2} />
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {state.step === 'form' ? (
        <TransactionForm
          key={state.type}
          cardAccounts={cardAccounts}
          cashAccount={cashAccount}
          categories={categories}
          dismissDisabled={creating}
          enterFrom="fab"
          getRecentCategoryIds={getRecentCategoryIds}
          initialType={state.type}
          lentAccounts={lentAccounts}
          returnFocusRef={buttonRef}
          saving={creating || optionsLoading}
          transaction={null}
          walletAccounts={walletAccounts}
          onClose={close}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  )
}
