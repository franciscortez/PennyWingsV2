import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useRef, useState, type RefObject } from 'react'
import {
  useForm,
  type FieldErrors,
  type FieldPath,
  type FieldPathValue,
  type Resolver,
} from 'react-hook-form'

import { twMerge } from 'tailwind-merge'

import { AppButton, fieldError, fieldInput, fieldLabel } from '@/components/ui'
import { ModalFrame } from '@/components/ui/ModalFrame'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { toDateInputValue } from '@/lib/date'
import { AmountHero } from '@/sections/transactions/AmountHero'
import { CategoryChips } from '@/sections/transactions/CategoryChips'
import { DateChips } from '@/sections/transactions/DateChips'
import { PaymentSourcePicker } from '@/sections/transactions/PaymentSourcePicker'
import type {
  Account,
  DestinationPaymentMethod,
  FormPaymentMethod,
  Transaction,
  TransactionCategory,
  TransactionFormValues,
  TransactionType,
} from '@/types'
import { transactionSchema } from '@/validation/transactionSchemas'
import {
  applyType,
  type TransactionFormState,
} from '@/sections/transactions/transactionFormState'

type TransactionFormProps = {
  cardAccounts: Account[]
  cashAccount: Account | null
  categories: TransactionCategory[]
  /**
   * Dismissal permission only. The caller owns the real guard, but the frame
   * needs it too so Escape, the backdrop and the close button stay inert while
   * the mutation is in flight.
   */
  dismissDisabled: boolean
  /** Quick add: the sheet grows out of the floating button. */
  enterFrom?: 'fab'
  /**
   * Category ids most recent first, read once on open. Recent categories lead
   * the chip row; without it the incoming (alphabetical) order is kept.
   */
  getRecentCategoryIds?: () => string[]
  /** Type a new transaction opens on. Ignored when editing. */
  initialType?: TransactionType
  lentAccounts: Account[]
  onClose: () => void
  onSubmit: (values: TransactionFormValues) => Promise<boolean>
  /** Where focus lands on close when the opener may be gone (quick add dial). */
  returnFocusRef?: RefObject<HTMLElement | null>
  /** Busy submission: mutation saving plus option loading. */
  saving: boolean
  transaction: Transaction | null
  walletAccounts: Account[]
}

const defaultFormState = (): TransactionFormState => ({
  amount: '',
  card_id: '',
  category_id: '',
  description: '',
  fee_amount: '0',
  payment_method: 'cash',
  to_card_id: '',
  to_payment_method: 'card',
  to_wallet_id: '',
  transaction_date: toDateInputValue(),
  type: 'expense',
  wallet_id: '',
})

const toFormState = (
  transaction: Transaction | null,
  initialType: TransactionType = 'expense',
  lentAccounts: Account[] = [],
): TransactionFormState => {
  if (!transaction) {
    const initial = defaultFormState()
    return initial.type === initialType
      ? initial
      : applyType(initial, initialType, lentAccounts)
  }

  return {
    amount: String(transaction.amount),
    card_id: transaction.card_id ?? '',
    category_id: transaction.category_id ?? '',
    description: transaction.description ?? '',
    fee_amount: String(transaction.fee_amount ?? 0),
    payment_method:
      transaction.payment_method === 'ewallet' &&
      transaction.wallet?.walletType === 'lent'
        ? 'lent'
        : transaction.payment_method,
    to_card_id: transaction.to_card_id ?? '',
    to_payment_method: transaction.to_card_id
      ? 'card'
      : transaction.to_wallet?.walletType === 'cash'
        ? 'cash'
        : transaction.to_wallet?.walletType === 'lent'
          ? 'lent'
          : 'ewallet',
    to_wallet_id: transaction.to_wallet_id ?? '',
    transaction_date: transaction.transaction_date ?? toDateInputValue(),
    type: transaction.type,
    wallet_id: transaction.wallet_id ?? '',
  }
}

export function TransactionForm({
  cardAccounts,
  cashAccount,
  categories,
  dismissDisabled,
  enterFrom,
  getRecentCategoryIds,
  initialType,
  lentAccounts,
  onClose,
  onSubmit,
  returnFocusRef,
  saving,
  transaction,
  walletAccounts,
}: TransactionFormProps) {
  const {
    clearErrors,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<TransactionFormState, unknown, TransactionFormValues>({
    defaultValues: toFormState(transaction, initialType, lentAccounts),
    resolver: zodResolver(transactionSchema) as Resolver<
      TransactionFormState,
      unknown,
      TransactionFormValues
    >,
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const form = watch()

  // While a payment picker is open it is the only dialog on screen. The form
  // stays mounted (and keeps its values) but is hidden underneath.
  const [pickerOpen, setPickerOpen] = useState(false)

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) =>
        form.type === 'income'
          ? category.type === 'income'
          : category.type === 'expense',
      ),
    [categories, form.type],
  )

  const sourceOwnerId = useMemo(() => {
    if (form.payment_method === 'card') {
      return cardAccounts.find((account) => account.id === form.card_id)?.userId
    }

    if (form.payment_method === 'cash') {
      return cashAccount?.userId
    }

    return [...walletAccounts, ...lentAccounts].find(
      (account) => account.id === form.wallet_id,
    )?.userId
  }, [
    cardAccounts,
    cashAccount?.userId,
    form.card_id,
    form.payment_method,
    form.wallet_id,
    lentAccounts,
    walletAccounts,
  ])

  const destinationCardAccounts = sourceOwnerId
    ? cardAccounts.filter((account) => account.userId === sourceOwnerId)
    : cardAccounts
  const destinationWalletAccounts = sourceOwnerId
    ? walletAccounts.filter((account) => account.userId === sourceOwnerId)
    : walletAccounts
  const destinationLentAccounts = sourceOwnerId
    ? lentAccounts.filter((account) => account.userId === sourceOwnerId)
    : lentAccounts
  const destinationCashAccount =
    !sourceOwnerId || cashAccount?.userId === sourceOwnerId ? cashAccount : null

  const updateField = <TField extends FieldPath<TransactionFormState>>(
    field: TField,
    value: FieldPathValue<TransactionFormState, TField>,
  ) => {
    const sourceChanged =
      (field === 'card_id' || field === 'wallet_id') &&
      getValues(field) !== value
    setValue(field, value, { shouldDirty: true })
    clearErrors(field)

    if (field === 'card_id' || field === 'wallet_id') {
      if (sourceChanged && getValues('type') === 'withdrawal') {
        setValue('fee_amount', '0', { shouldDirty: true })
        clearErrors('fee_amount')
      }
      setValue('to_card_id', '', { shouldDirty: true })
      setValue('to_wallet_id', '', { shouldDirty: true })
      clearErrors(['to_card_id', 'to_wallet_id'])
    }
  }

  const updateType = (type: TransactionType) => {
    reset(applyType(getValues(), type, lentAccounts), { keepDirty: true })
  }

  const updateSource = (paymentMethod: FormPaymentMethod, accountId: string) => {
    const current = getValues()
    const previousAccountId =
      current.payment_method === 'card' ? current.card_id : current.wallet_id
    const sourceChanged =
      paymentMethod !== current.payment_method ||
      (paymentMethod !== 'cash' && accountId !== previousAccountId)

    reset(
      {
        ...current,
        card_id: paymentMethod === 'card' ? accountId : '',
        fee_amount:
          current.type === 'withdrawal' && sourceChanged ? '0' : current.fee_amount,
        payment_method: paymentMethod,
        to_card_id: sourceChanged ? '' : current.to_card_id,
        to_payment_method:
          paymentMethod === 'cash' && current.to_payment_method === 'cash'
            ? 'card'
            : current.to_payment_method,
        to_wallet_id: sourceChanged ? '' : current.to_wallet_id,
        wallet_id:
          paymentMethod === 'ewallet' || paymentMethod === 'lent' ? accountId : '',
      },
      { keepDirty: true },
    )
  }

  const updateDestination = (
    paymentMethod: DestinationPaymentMethod,
    accountId: string,
  ) => {
    const current = getValues()
    reset(
      {
        ...current,
        to_card_id: paymentMethod === 'card' ? accountId : '',
        to_payment_method: paymentMethod,
        to_wallet_id:
          paymentMethod === 'ewallet' || paymentMethod === 'lent' ? accountId : '',
      },
      { keepDirty: true },
    )
  }

  const submitForm = handleSubmit(async (values) => {
    const saved = await onSubmit(values)

    if (saved) {
      onClose()
    }
  })

  const formId = 'transaction-form'

  const isPhone = useMediaQuery('(max-width: 767px)')
  const amountRef = useRef<HTMLInputElement>(null)

  // Read once when the form opens so chips never reshuffle mid-choice.
  const [recentCategoryIds] = useState(() => getRecentCategoryIds?.() ?? [])

  const saveLabel = saving
    ? transaction
      ? 'Updating...'
      : 'Recording...'
    : transaction
      ? 'Update Transaction'
      : `Save ${typeNouns[form.type]}`

  return (
    <ModalFrame
      mobilePresentation="sheet"
      actions={
        <AppButton
          disabled={saving}
          form={formId}
          type="submit"
          className="w-full"
        >
          {saveLabel}
        </AppButton>
      }
      closeDisabled={dismissDisabled}
      closeLabel="Close transaction form"
      // A new entry on a wide screen starts in the amount: type the number,
      // press Enter. Phones and edits keep focus on the dialog itself.
      initialFocusRef={!transaction && !isPhone ? amountRef : undefined}
      onClose={onClose}
      overlayClassName={pickerOpen ? 'invisible' : undefined}
      returnFocusRef={returnFocusRef}
      panelClassName={twMerge(
        'txn-panel font-geist motion-reduce:[&_button]:transform-none motion-reduce:[&_button]:transition-none md:max-w-lg min-[60rem]:max-w-[56rem] shadow-wing-lg dark:shadow-none focus-visible:ring-pink-800 dark:focus-visible:ring-pink-300',
        enterFrom === 'fab' ? 'txn-sheet-from-fab' : undefined,
      )}
      headerClassName="[&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-slate-950 dark:[&_h2]:text-slate-100 [&_button]:h-11 [&_button]:w-11 [&_button]:text-slate-600 dark:[&_button]:text-slate-300 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-pink-800 dark:[&_button]:focus-visible:outline-pink-300"
      title={transaction ? 'Edit Transaction' : 'New Transaction'}
      titleId="transaction-form-title"
    >
      <form
        id={formId}
        noValidate
        onSubmit={submitForm}
        className="txn-form"
      >
        <SegmentedControl
          className="txn-area-type"
          label="Transaction type"
          options={typeOptions}
          value={form.type}
          onChange={updateType}
        />

        <div className="txn-area-amount">
          <AmountHero
            error={errors.amount?.message}
            errorId="transaction-amount-error"
            inputRef={amountRef}
            value={form.amount}
            onValueChange={(value) => updateField('amount', value)}
          />
        </div>

        <div className="txn-area-details">
          <AccountSourcePanel
            cardAccounts={cardAccounts}
            cashAccount={cashAccount}
            errors={errors}
            form={form}
            lentAccounts={lentAccounts}
            onPickerOpenChange={setPickerOpen}
            onSourceChange={updateSource}
            walletAccounts={walletAccounts}
          />

          {form.type === 'transfer' ? (
            <DestinationPanel
              cardAccounts={destinationCardAccounts}
              cashAccount={destinationCashAccount}
              errors={errors}
              form={form}
              lentAccounts={destinationLentAccounts}
              onDestinationChange={updateDestination}
              onPickerOpenChange={setPickerOpen}
              walletAccounts={destinationWalletAccounts}
            />
          ) : null}

          {form.type === 'transfer' || form.type === 'withdrawal' ? (
            <TransactionFeePanel
              errors={errors}
              form={form}
              onUpdate={updateField}
            />
          ) : null}

          <CategoryChips
            categories={filteredCategories}
            error={errors.category_id?.message}
            errorId="transaction-category-error"
            recentIds={recentCategoryIds}
            value={form.category_id}
            onChange={(value) => updateField('category_id', value)}
          />

          <DateChips
            error={errors.transaction_date?.message}
            errorId="transaction-date-error"
            value={form.transaction_date}
            onChange={(value) => updateField('transaction_date', value)}
          />
        </div>

        <div className="txn-area-note min-w-0 space-y-2">
          <label htmlFor="transaction-note" className={`${fieldLabel} ml-1 block`}>
            Note <span className="font-normal text-slate-600 dark:text-slate-400">(optional)</span>
          </label>
          <input
            id="transaction-note"
            type="text"
            autoComplete="off"
            enterKeyHint="done"
            placeholder="Short note..."
            value={form.description}
            onChange={(event) =>
              updateField('description', event.target.value)
            }
            className={fieldInput(false)}
          />
        </div>
      </form>
    </ModalFrame>
  )
}

const typeNouns: Record<TransactionType, string> = {
  expense: 'expense',
  income: 'income',
  transfer: 'transfer',
  withdrawal: 'withdrawal',
}

const typeOptions: ReadonlyArray<SegmentedOption<TransactionType>> = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'withdrawal', label: 'Withdraw' },
]

const sourceSheetTitles: Record<TransactionType, string> = {
  expense: 'Pay with',
  income: 'Deposit to',
  transfer: 'Send from',
  withdrawal: 'Withdraw from',
}

const sourceLabels: Record<TransactionType, string> = {
  expense: 'Payment Method',
  income: 'Deposit To',
  transfer: 'From Account',
  withdrawal: 'Withdraw From',
}

function AccountSourcePanel({
  cardAccounts,
  cashAccount,
  errors,
  form,
  lentAccounts,
  onPickerOpenChange,
  onSourceChange,
  walletAccounts,
}: {
  cardAccounts: Account[]
  cashAccount: Account | null
  errors: FieldErrors<TransactionFormState>
  form: TransactionFormState
  lentAccounts: Account[]
  onPickerOpenChange: (open: boolean) => void
  onSourceChange: (paymentMethod: FormPaymentMethod, accountId: string) => void
  walletAccounts: Account[]
}) {
  const sourceError =
    errors.payment_method?.message ??
    errors.card_id?.message ??
    errors.wallet_id?.message
  const label = sourceLabels[form.type]
  // Mirrors the composer's balance check (amount plus any fee) so the picker
  // can flag short accounts. Display only: the checked RPC stays the authority.
  const amount = Number(form.amount)
  const fee = form.type === 'transfer' || form.type === 'withdrawal' ? Number(form.fee_amount || '0') : 0
  const requiredAmount =
    form.type !== 'income' && Number.isFinite(amount) && amount > 0 && Number.isFinite(fee)
      ? amount + fee
      : undefined

  return (
    <div className="min-w-0 space-y-2">
      <p className={`${fieldLabel} ml-1 block`} aria-hidden="true">
        {label}
      </p>
      <PaymentSourcePicker
        allowCash={form.type !== 'withdrawal'}
        allowLent={form.type === 'transfer' || form.type === 'withdrawal'}
        cardAccounts={cardAccounts}
        cardId={form.card_id ?? ''}
        cashAccount={cashAccount}
        error={sourceError}
        errorId="transaction-source-error"
        label={label}
        lentAccounts={lentAccounts}
        method={form.payment_method}
        onChange={onSourceChange}
        onOpenChange={onPickerOpenChange}
        requiredAmount={requiredAmount}
        sheetTitle={sourceSheetTitles[form.type]}
        walletAccounts={walletAccounts}
        walletId={form.wallet_id ?? ''}
      />
    </div>
  )
}

function DestinationPanel({
  cardAccounts,
  cashAccount,
  errors,
  form,
  lentAccounts,
  onDestinationChange,
  onPickerOpenChange,
  walletAccounts,
}: {
  cardAccounts: Account[]
  cashAccount: Account | null
  errors: FieldErrors<TransactionFormState>
  form: TransactionFormState
  lentAccounts: Account[]
  onDestinationChange: (
    paymentMethod: DestinationPaymentMethod,
    accountId: string,
  ) => void
  onPickerOpenChange: (open: boolean) => void
  walletAccounts: Account[]
}) {
  const canTransferToCash = form.payment_method !== 'cash' && Boolean(cashAccount)
  const destinationError =
    errors.to_payment_method?.message ??
    errors.to_card_id?.message ??
    errors.to_wallet_id?.message

  return (
    <div className="min-w-0 space-y-2">
      <p className={`${fieldLabel} ml-1 block`} aria-hidden="true">
        To Account
      </p>
      <PaymentSourcePicker
        allowCash={canTransferToCash}
        allowLent
        cardAccounts={cardAccounts}
        cardId={form.to_card_id ?? ''}
        cashAccount={cashAccount}
        error={destinationError}
        errorId="transaction-destination-error"
        excludeCardId={form.card_id}
        excludeWalletId={form.wallet_id}
        label="To Account"
        lentAccounts={lentAccounts}
        method={form.to_payment_method ?? 'card'}
        onChange={onDestinationChange}
        onOpenChange={onPickerOpenChange}
        sheetTitle="Send to"
        walletAccounts={walletAccounts}
        walletId={form.to_wallet_id ?? ''}
      />
    </div>
  )
}

function TransactionFeePanel({
  errors,
  form,
  onUpdate,
}: {
  errors: FieldErrors<TransactionFormState>
  form: TransactionFormState
  onUpdate: <TField extends FieldPath<TransactionFormState>>(
    field: TField,
    value: FieldPathValue<TransactionFormState, TField>,
  ) => void
}) {
  const presets = [0, 15, 25]
  const currentFee = Number(form.fee_amount || '0')

  return (
    <div className="min-w-0 space-y-2">
      <label
        htmlFor="transaction-fee"
        className={`${fieldLabel} ml-1 block`}
      >
        {form.type === 'withdrawal' ? 'Withdrawal' : 'Transfer'} Fee (PHP)
      </label>
      <div className="txn-fee-row">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onUpdate('fee_amount', String(preset))}
            aria-pressed={currentFee === preset}
            className="txn-pill"
          >
            ₱{preset}
          </button>
        ))}
        <MoneyInput
          aria-describedby={errors.fee_amount ? 'transaction-fee-error' : undefined}
          aria-invalid={Boolean(errors.fee_amount)}
          id="transaction-fee"
          placeholder="0.00"
          value={form.fee_amount}
          onValueChange={(value) => onUpdate('fee_amount', value)}
          className={fieldInput(Boolean(errors.fee_amount), 'h-11 min-w-0 flex-1 px-4 font-geist-mono tabular-nums')}
        />
      </div>
      {errors.fee_amount ? (
        <p id="transaction-fee-error" className={`ml-1 ${fieldError}`}>
          {errors.fee_amount.message}
        </p>
      ) : null}
    </div>
  )
}
