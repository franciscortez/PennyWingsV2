import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import { useRef, useState } from 'react'

import { ModalFrame } from '@/components/ui/ModalFrame'
import { useAuth } from '@/hooks/useAuth'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useMobileKeyboard } from '@/hooks/useMobileKeyboard'
import { useTransactionComposer } from '@/hooks/useTransactionComposer'
import { alerts } from '@/lib/alert'
import { TransactionForm } from '@/sections/transactions/TransactionForm'
import type { TransactionFormValues, TransactionType } from '@/types'

const quickAddOptions: Array<{
  description: string
  icon: LucideIcon
  label: string
  type: TransactionType
}> = [
  { type: 'expense', icon: ArrowUpRight, label: 'Expense', description: 'Pay for something' },
  { type: 'income', icon: ArrowDownLeft, label: 'Income', description: 'Money coming in' },
  {
    type: 'transfer',
    icon: ArrowLeftRight,
    label: 'Transfer / Deposit',
    description: 'Move money between accounts',
  },
  {
    type: 'withdrawal',
    icon: Banknote,
    label: 'Withdrawal',
    description: 'Cash out from a card or wallet',
  },
]

type QuickAddState = { step: 'closed' } | { step: 'menu' } | { step: 'form'; type: TransactionType }

/**
 * Phone-only floating "+" mounted once in the signed-in shell, on every page.
 * It opens a Quick add sheet in place (no navigation); picking a kind opens the
 * regular transaction form with that type selected. Desktop keeps the page
 * actions.
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
  const [state, setState] = useState<QuickAddState>({ step: 'closed' })
  // Warmed on the first touch so accounts and categories are usually cached by
  // the time a kind is chosen from the menu.
  const [warm, setWarm] = useState(false)

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

  const close = () => {
    if (!creating) setState({ step: 'closed' })
  }

  const handleSubmit = async (values: TransactionFormValues) => {
    const { error } = await createTransaction(values)

    if (error) {
      alerts.error(error.message)
      return false
    }

    alerts.success('Transaction created.')
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
        aria-haspopup="dialog"
        aria-expanded={state.step !== 'closed'}
        onFocus={() => setWarm(true)}
        onPointerDown={() => setWarm(true)}
        onClick={() => setState({ step: 'menu' })}
      >
        <Plus aria-hidden="true" size={24} strokeWidth={2.25} />
      </button>

      {state.step === 'menu' ? (
        <ModalFrame
          mobilePresentation="sheet"
          closeLabel="Close quick add"
          onClose={close}
          returnFocusRef={buttonRef}
          title="Quick add"
          titleId="quick-add-title"
          description="What would you like to record?"
          panelClassName="font-geist md:max-w-sm shadow-wing-lg dark:shadow-none focus-visible:ring-pink-800 dark:focus-visible:ring-pink-300"
          headerClassName="[&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-slate-950 dark:[&_h2]:text-slate-100 [&_button]:h-11 [&_button]:w-11 [&_button]:text-slate-600 dark:[&_button]:text-slate-300 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-pink-800 dark:[&_button]:focus-visible:outline-pink-300"
        >
          <ul className="quick-add-options" aria-label="Transaction kinds">
            {quickAddOptions.map(({ description, icon: Icon, label, type }) => (
              <li key={type}>
                <button
                  type="button"
                  className="quick-add-option"
                  data-kind={type}
                  onClick={() => setState({ step: 'form', type })}
                >
                  <span className="quick-add-option-icon" aria-hidden="true">
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  <span className="quick-add-option-copy">
                    <span className="quick-add-option-label">{label}</span>
                    <span className="quick-add-option-description">{description}</span>
                  </span>
                  <ChevronRight aria-hidden="true" size={18} className="quick-add-option-chevron" />
                </button>
              </li>
            ))}
          </ul>
        </ModalFrame>
      ) : null}

      {state.step === 'form' ? (
        <TransactionForm
          key={state.type}
          cardAccounts={cardAccounts}
          cashAccount={cashAccount}
          categories={categories}
          dismissDisabled={creating}
          initialType={state.type}
          lentAccounts={lentAccounts}
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
