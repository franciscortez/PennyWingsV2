import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import {
  useForm,
  type FieldErrors,
  type FieldPath,
  type FieldPathValue,
  type Resolver,
} from 'react-hook-form'

import { AppButton, fieldError, fieldHint, fieldInput, fieldLabel, surfaceNested } from '@/components/ui'
import { ModalFrame } from '@/components/ui/ModalFrame'
import { toDateInputValue } from '@/lib/date'
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
  lentAccounts: Account[]
  onClose: () => void
  onSubmit: (values: TransactionFormValues) => Promise<boolean>
  /** Busy submission: mutation saving plus option loading. */
  saving: boolean
  transaction: Transaction | null
  walletAccounts: Account[]
}

type TransactionFormState = Omit<TransactionFormValues, 'amount' | 'fee_amount'> & {
  amount: string
  fee_amount: string
}

const accountBalanceFormatter = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

const accountOptionLabel = (account: Account) =>
  `${account.name}: ${accountBalanceFormatter.format(account.balance)}`

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

const toFormState = (transaction: Transaction | null): TransactionFormState => {
  if (!transaction) {
    return defaultFormState()
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
  lentAccounts,
  onClose,
  onSubmit,
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
    defaultValues: toFormState(transaction),
    resolver: zodResolver(transactionSchema) as Resolver<
      TransactionFormState,
      unknown,
      TransactionFormValues
    >,
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const form = watch()

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
    const current = getValues()
    reset(
      {
        ...current,
        card_id: current.payment_method === 'card' ? current.card_id : '',
        category_id: '',
        fee_amount: type === current.type ? current.fee_amount : '0',
        payment_method:
          type === 'withdrawal' && current.payment_method === 'cash'
            ? 'card'
            : type !== 'transfer' &&
                type !== 'withdrawal' &&
                current.payment_method === 'lent'
              ? 'ewallet'
              : current.payment_method,
        to_card_id: type === 'transfer' ? current.to_card_id : '',
        to_wallet_id: type === 'transfer' ? current.to_wallet_id : '',
        type,
        wallet_id:
          (current.payment_method === 'ewallet' ||
            current.payment_method === 'lent') &&
          (type === 'transfer' ||
            type === 'withdrawal' ||
            (current.payment_method === 'ewallet' &&
              !lentAccounts.some((account) => account.id === current.wallet_id)))
            ? current.wallet_id
            : '',
      },
      { keepDirty: true },
    )
  }

  const updatePaymentMethod = (paymentMethod: FormPaymentMethod) => {
    const current = getValues()
    reset(
      {
        ...current,
        card_id: '',
        fee_amount:
          current.type === 'withdrawal' && paymentMethod !== current.payment_method
            ? '0'
            : current.fee_amount,
        payment_method: paymentMethod,
        to_payment_method:
          paymentMethod === 'cash' && current.to_payment_method === 'cash'
            ? 'card'
            : current.to_payment_method,
        wallet_id: '',
      },
      { keepDirty: true },
    )
  }

  const updateDestinationMethod = (
    paymentMethod: DestinationPaymentMethod,
  ) => {
    const current = getValues()
    reset(
      {
        ...current,
        to_card_id: '',
        to_payment_method: paymentMethod,
        to_wallet_id: '',
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

  return (
    <ModalFrame
      actions={
        <AppButton
          disabled={saving}
          form={formId}
          type="submit"
          className="w-full"
        >
          {saving
            ? transaction
              ? 'Updating...'
              : 'Recording...'
            : transaction
              ? 'Update Transaction'
              : 'Save Transaction'}
        </AppButton>
      }
      closeDisabled={dismissDisabled}
      closeLabel="Close transaction form"
      onClose={onClose}
      panelClassName="font-geist motion-reduce:[&_button]:transform-none motion-reduce:[&_button]:transition-none md:max-w-lg shadow-wing-lg dark:shadow-none focus-visible:ring-pink-800 dark:focus-visible:ring-pink-300"
      headerClassName="[&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-slate-950 dark:[&_h2]:text-slate-100 [&_button]:h-11 [&_button]:w-11 [&_button]:text-slate-600 dark:[&_button]:text-slate-300 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-pink-800 dark:[&_button]:focus-visible:outline-pink-300"
      title={transaction ? 'Edit Transaction' : 'New Transaction'}
      titleId="transaction-form-title"
    >
      <form
        id={formId}
        noValidate
        onSubmit={submitForm}
        className="space-y-4 md:space-y-6"
      >
          <TransactionTypePicker value={form.type} onChange={updateType} />

          <div className="text-center">
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-600 dark:text-slate-400">
                PHP
              </span>
              <input
                aria-describedby={errors.amount ? 'transaction-amount-error' : undefined}
                aria-invalid={Boolean(errors.amount)}
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(event) => updateField('amount', event.target.value)}
                className={fieldInput(Boolean(errors.amount), 'pl-16 font-geist-mono tabular-nums text-xl')}
              />
            </div>
            {errors.amount ? (
              <p id="transaction-amount-error" className={`mt-2 text-left ${fieldError}`}>
                {errors.amount.message}
              </p>
            ) : null}
          </div>

          <AccountSourcePanel
            cardAccounts={cardAccounts}
            cashAccount={cashAccount}
            errors={errors}
            form={form}
            lentAccounts={lentAccounts}
            onPaymentMethodChange={updatePaymentMethod}
            onUpdate={updateField}
            walletAccounts={walletAccounts}
          />

          {form.type === 'transfer' ? (
            <DestinationPanel
              cardAccounts={destinationCardAccounts}
              cashAccount={destinationCashAccount}
              errors={errors}
              form={form}
              lentAccounts={destinationLentAccounts}
              onDestinationMethodChange={updateDestinationMethod}
              onUpdate={updateField}
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1 md:space-y-2">
              <label
                htmlFor="transaction-category"
                className={`${fieldLabel} ml-1 block`}
              >
                Category
              </label>
              <select
                aria-describedby={errors.category_id ? 'transaction-category-error' : undefined}
                aria-invalid={Boolean(errors.category_id)}
                id="transaction-category"
                value={form.category_id}
                onChange={(event) =>
                  updateField('category_id', event.target.value)
                }
                className={fieldInput(Boolean(errors.category_id))}
              >
                <option value="" className="dark:bg-slate-900">Choose a category</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id} className="dark:bg-slate-900">
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id ? (
                <p id="transaction-category-error" className={fieldError}>
                  {errors.category_id.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 space-y-1 md:space-y-2">
              <label
                htmlFor="transaction-date"
                className={`${fieldLabel} ml-1 block`}
              >
                Date
              </label>
              <div className="min-w-0">
                <input
                  aria-describedby={errors.transaction_date ? 'transaction-date-error' : undefined}
                  aria-invalid={Boolean(errors.transaction_date)}
                  id="transaction-date"
                  type="date"
                  value={form.transaction_date}
                  onChange={(event) =>
                    updateField('transaction_date', event.target.value)
                  }
                  className={fieldInput(Boolean(errors.transaction_date), 'min-w-0 max-w-full appearance-none')}
                />
              </div>
              {errors.transaction_date ? (
                <p id="transaction-date-error" className={fieldError}>
                  {errors.transaction_date.message}
                </p>
              ) : null}
            </div>
          </div>

          <input
            type="text"
            placeholder="Short note..."
            value={form.description}
            onChange={(event) =>
              updateField('description', event.target.value)
            }
            className={fieldInput(false)}
          />

      </form>
    </ModalFrame>
  )
}

function TransactionTypePicker({
  onChange,
  value,
}: {
  onChange: (type: TransactionType) => void
  value: TransactionType
}) {
  const rows: TransactionType[][] = [
    ['income', 'expense'],
    ['withdrawal', 'transfer'],
  ]

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.join('-')} className="flex gap-2">
          {row.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              aria-pressed={value === type}
              className={`relative min-h-11 min-w-0 flex-1 rounded-full px-3 py-2.5 [overflow-wrap:anywhere] text-sm font-semibold capitalize transition-[border-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800 dark:focus-visible:outline-pink-300 ${
                value === type
                  ? 'bg-pink-700 text-white'
                  : 'border border-slate-500 bg-white text-slate-600 hover:bg-pink-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {type === 'transfer' ? 'Transfer/Deposit' : type}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

function AccountSourcePanel({
  cardAccounts,
  cashAccount,
  errors,
  form,
  lentAccounts,
  onPaymentMethodChange,
  onUpdate,
  walletAccounts,
}: {
  cardAccounts: Account[]
  cashAccount: Account | null
  errors: FieldErrors<TransactionFormState>
  form: TransactionFormState
  lentAccounts: Account[]
  onPaymentMethodChange: (paymentMethod: FormPaymentMethod) => void
  onUpdate: <TField extends FieldPath<TransactionFormState>>(
    field: TField,
    value: FieldPathValue<TransactionFormState, TField>,
  ) => void
  walletAccounts: Account[]
}) {
  const showLentOption = form.type === 'transfer' || form.type === 'withdrawal'
  const sourceError =
    errors.payment_method?.message ??
    errors.card_id?.message ??
    errors.wallet_id?.message

  return (
    <div className={`${surfaceNested} space-y-4 p-4 sm:p-5`}>
      <p className={`${fieldLabel} ml-1 block`}>
        {form.type === 'transfer' ? 'From Account' : 'Payment Method'}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
        <select
          aria-describedby={sourceError ? 'transaction-source-error' : undefined}
          aria-invalid={Boolean(errors.payment_method)}
          value={form.payment_method}
          onChange={(event) =>
            onPaymentMethodChange(event.target.value as FormPaymentMethod)
          }
          className={fieldInput(Boolean(errors.payment_method))}
        >
          {form.type !== 'withdrawal' ? <option value="cash" className="dark:bg-slate-900">Cash</option> : null}
          <option value="card" className="dark:bg-slate-900">Bank Card</option>
          <option value="ewallet" className="dark:bg-slate-900">E-Wallet</option>
          {showLentOption ? <option value="lent" className="dark:bg-slate-900">Lent</option> : null}
        </select>

        {form.payment_method === 'card' ? (
          <select
            aria-describedby={sourceError ? 'transaction-source-error' : undefined}
            aria-invalid={Boolean(errors.card_id)}
            value={form.card_id}
            onChange={(event) => onUpdate('card_id', event.target.value)}
            className={fieldInput(Boolean(errors.card_id))}
          >
            <option value="" className="dark:bg-slate-900">Select Card</option>
            {cardAccounts.map((account) => (
              <option key={account.id} value={account.id} className="dark:bg-slate-900">
                {accountOptionLabel(account)}
              </option>
            ))}
          </select>
        ) : form.payment_method === 'ewallet' || form.payment_method === 'lent' ? (
          <select
            aria-describedby={sourceError ? 'transaction-source-error' : undefined}
            aria-invalid={Boolean(errors.wallet_id)}
            value={form.wallet_id}
            onChange={(event) => onUpdate('wallet_id', event.target.value)}
            className={fieldInput(Boolean(errors.wallet_id))}
          >
            <option value="" className="dark:bg-slate-900">
              {form.payment_method === 'lent' ? 'Select Lent' : 'Select Wallet'}
            </option>
            {(form.payment_method === 'lent' ? lentAccounts : walletAccounts).map((account) => (
              <option key={account.id} value={account.id} className="dark:bg-slate-900">
                {accountOptionLabel(account)}
              </option>
            ))}
          </select>
        ) : (
          <div className={`${fieldHint} flex min-h-12 min-w-0 items-center rounded-[1.25rem] bg-white px-5 py-3 [overflow-wrap:anywhere] dark:bg-slate-900`}>
            {cashAccount
              ? accountOptionLabel(cashAccount)
              : 'No cash account available'}
          </div>
        )}
      </div>
      {sourceError ? (
        <p id="transaction-source-error" className={fieldError}>
          {sourceError}
        </p>
      ) : null}
    </div>
  )
}

function DestinationPanel({
  cardAccounts,
  cashAccount,
  errors,
  form,
  lentAccounts,
  onDestinationMethodChange,
  onUpdate,
  walletAccounts,
}: {
  cardAccounts: Account[]
  cashAccount: Account | null
  errors: FieldErrors<TransactionFormState>
  form: TransactionFormState
  lentAccounts: Account[]
  onDestinationMethodChange: (paymentMethod: DestinationPaymentMethod) => void
  onUpdate: <TField extends FieldPath<TransactionFormState>>(
    field: TField,
    value: FieldPathValue<TransactionFormState, TField>,
  ) => void
  walletAccounts: Account[]
}) {
  const canTransferToCash = form.payment_method !== 'cash' && Boolean(cashAccount)
  const destinationError =
    errors.to_payment_method?.message ??
    errors.to_card_id?.message ??
    errors.to_wallet_id?.message

  return (
    <div className={`${surfaceNested} space-y-4 p-4 sm:p-5`}>
      <p className={`${fieldLabel} ml-1 block`}>
        To Account
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
        <select
          aria-describedby={destinationError ? 'transaction-destination-error' : undefined}
          aria-invalid={Boolean(errors.to_payment_method)}
          value={form.to_payment_method}
          onChange={(event) =>
            onDestinationMethodChange(
              event.target.value as DestinationPaymentMethod,
            )
          }
          className={fieldInput(Boolean(errors.to_payment_method))}
        >
          {canTransferToCash ? <option value="cash" className="dark:bg-slate-900">Cash</option> : null}
          <option value="card" className="dark:bg-slate-900">Bank Card</option>
          <option value="ewallet" className="dark:bg-slate-900">E-Wallet</option>
          <option value="lent" className="dark:bg-slate-900">Lent</option>
        </select>

        {form.to_payment_method === 'card' ? (
          <select
            aria-describedby={destinationError ? 'transaction-destination-error' : undefined}
            aria-invalid={Boolean(errors.to_card_id)}
            value={form.to_card_id}
            onChange={(event) => onUpdate('to_card_id', event.target.value)}
            className={fieldInput(Boolean(errors.to_card_id))}
          >
            <option value="" className="dark:bg-slate-900">Select Card</option>
            {cardAccounts
              .filter((account) => account.id !== form.card_id)
              .map((account) => (
                <option key={account.id} value={account.id} className="dark:bg-slate-900">
                  {accountOptionLabel(account)}
                </option>
              ))}
          </select>
        ) : form.to_payment_method === 'cash' ? (
          <div className={`${fieldHint} flex min-h-12 min-w-0 items-center rounded-[1.25rem] bg-white px-5 py-3 [overflow-wrap:anywhere] dark:bg-slate-900`}>
            {cashAccount
              ? accountOptionLabel(cashAccount)
              : 'No cash account available'}
          </div>
        ) : form.to_payment_method === 'ewallet' || form.to_payment_method === 'lent' ? (
          <select
            aria-describedby={destinationError ? 'transaction-destination-error' : undefined}
            aria-invalid={Boolean(errors.to_wallet_id)}
            value={form.to_wallet_id}
            onChange={(event) => onUpdate('to_wallet_id', event.target.value)}
            className={fieldInput(Boolean(errors.to_wallet_id))}
          >
            <option value="" className="dark:bg-slate-900">
              {form.to_payment_method === 'lent' ? 'Select Lent' : 'Select Wallet'}
            </option>
            {(form.to_payment_method === 'lent' ? lentAccounts : walletAccounts)
              .filter((account) => account.id !== form.wallet_id)
              .map((account) => (
                <option key={account.id} value={account.id} className="dark:bg-slate-900">
                  {accountOptionLabel(account)}
                </option>
              ))}
          </select>
        ) : null}
      </div>
      {destinationError ? (
        <p id="transaction-destination-error" className={fieldError}>
          {destinationError}
        </p>
      ) : null}
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
    <div className={`${surfaceNested} space-y-3 p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label
          htmlFor="transaction-fee"
          className={`${fieldLabel} ml-1 block`}
        >
          {form.type === 'withdrawal' ? 'Withdrawal' : 'Transfer'} Fee (PHP)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onUpdate('fee_amount', String(preset))}
              aria-pressed={currentFee === preset}
              className={`min-h-11 min-w-11 rounded-full px-3 py-2 text-sm font-semibold transition-[border-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800 dark:focus-visible:outline-pink-300 ${
                currentFee === preset
                  ? 'bg-pink-700 text-white'
                  : 'border border-slate-500 bg-white text-slate-600 hover:bg-pink-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              ₱{preset}
            </button>
          ))}
        </div>
      </div>
      <input
        aria-describedby={errors.fee_amount ? 'transaction-fee-error' : undefined}
        aria-invalid={Boolean(errors.fee_amount)}
        id="transaction-fee"
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        value={form.fee_amount}
        onChange={(event) => onUpdate('fee_amount', event.target.value)}
        className={fieldInput(Boolean(errors.fee_amount), 'font-geist-mono tabular-nums')}
      />
      {errors.fee_amount ? (
        <p id="transaction-fee-error" className={fieldError}>
          {errors.fee_amount.message}
        </p>
      ) : null}
    </div>
  )
}
