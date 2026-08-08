import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import {
  useForm,
  type FieldErrors,
  type FieldPath,
  type FieldPathValue,
  type Resolver,
} from 'react-hook-form'

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
  lentAccounts: Account[]
  onClose: () => void
  onSubmit: (values: TransactionFormValues) => Promise<boolean>
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
  `${account.name} — ${accountBalanceFormatter.format(account.balance)}`

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

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
    setValue(field, value, { shouldDirty: true })
    clearErrors(field)

    if (field === 'card_id' || field === 'wallet_id') {
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Close transaction form"
      />
      <section
        aria-labelledby="transaction-form-title"
        aria-modal="true"
        role="dialog"
        className="relative z-10 flex max-h-[95vh] w-full flex-col overflow-hidden rounded-[2rem] border border-pink-100 bg-white dark:border-slate-800 dark:bg-slate-900 md:max-h-[90vh] md:max-w-lg md:rounded-[2.5rem]"
      >
        <div className="overflow-y-auto p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between md:mb-8">
            <h2 id="transaction-form-title" className="text-xl font-black tracking-tight text-gray-800 dark:text-slate-100 md:text-2xl">
              {transaction ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full p-2 text-gray-400 transition hover:bg-pink-50 hover:text-pink-600 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-pink-400"
              aria-label="Close transaction form"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={submitForm} noValidate className="space-y-4 md:space-y-6">
            <TransactionTypePicker value={form.type} onChange={updateType} />

            <div className="text-center">
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-pink-300 md:left-6 md:text-2xl dark:text-slate-650">
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
                  className="w-full rounded-xl border-2 border-pink-100 bg-pink-50/50 py-3 pl-20 pr-4 text-xl font-black text-gray-800 outline-none transition placeholder:text-pink-300 focus:border-pink-500 md:rounded-2xl md:py-4 md:pl-24 md:pr-6 md:text-2xl dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
                />
              </div>
              {errors.amount ? (
                <p id="transaction-amount-error" className="mt-2 text-left text-xs font-bold text-red-500">
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
              <>
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
                <TransferFeePanel
                  errors={errors}
                  form={form}
                  onUpdate={updateField}
                />
              </>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1 md:space-y-2">
                <label
                  htmlFor="transaction-category"
                  className="ml-1 block truncate text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500"
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
                  className="w-full rounded-xl border border-pink-100 bg-pink-50/50 px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
                >
                  <option value="" className="dark:bg-slate-900">Choose a category</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id} className="dark:bg-slate-900">
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id ? (
                  <p id="transaction-category-error" className="text-xs font-bold text-red-500">
                    {errors.category_id.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1 md:space-y-2">
                <label
                  htmlFor="transaction-date"
                  className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500"
                >
                  Date
                </label>
                <input
                  aria-describedby={errors.transaction_date ? 'transaction-date-error' : undefined}
                  aria-invalid={Boolean(errors.transaction_date)}
                  id="transaction-date"
                  type="date"
                  value={form.transaction_date}
                  onChange={(event) =>
                    updateField('transaction_date', event.target.value)
                  }
                  className="w-full rounded-xl border border-pink-100 bg-pink-50/50 px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
                />
                {errors.transaction_date ? (
                  <p id="transaction-date-error" className="text-xs font-bold text-red-500">
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
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-3.5 text-sm font-bold text-gray-700 outline-none transition placeholder:text-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 md:py-4 md:text-base dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-[1.5rem] bg-gradient-to-r from-pink-500 to-pink-600 py-4 text-lg font-black text-white transition disabled:opacity-50 md:rounded-[2rem] md:py-5 md:text-xl"
            >
              {saving
                ? transaction
                  ? 'Updating...'
                  : 'Recording...'
                : transaction
                  ? 'Update Transaction'
                  : 'Save Transaction'}
            </button>
          </form>
        </div>
      </section>
    </div>
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
              className={`relative flex-1 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition md:rounded-2xl md:py-3 ${
                value === type
                  ? 'bg-pink-500 text-white dark:bg-pink-600'
                  : 'bg-pink-50 text-gray-400 hover:text-pink-500 dark:bg-slate-950 dark:text-slate-450 dark:hover:text-pink-400'
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
    <div className="space-y-4 rounded-[1.5rem] border border-pink-50 bg-pink-50/30 p-4 md:rounded-[2rem] md:p-5 dark:border-slate-800 dark:bg-slate-950/20">
      <p className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
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
          className="w-full rounded-xl border border-pink-100 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-pink-500"
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
            className="w-full rounded-xl border border-pink-100 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-pink-500"
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
            className="w-full rounded-xl border border-pink-100 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-pink-500"
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
          <div className="flex items-center rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-[10px] font-bold text-gray-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
            {cashAccount
              ? accountOptionLabel(cashAccount)
              : 'No cash account available'}
          </div>
        )}
      </div>
      {sourceError ? (
        <p id="transaction-source-error" className="text-xs font-bold text-red-500">
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
    <div className="space-y-4 rounded-[1.5rem] border border-pink-50 bg-pink-50/30 p-4 md:rounded-[2rem] md:p-5 dark:border-slate-800 dark:bg-slate-950/20">
      <p className="ml-1 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
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
          className="w-full rounded-xl border border-pink-100 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-pink-500"
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
            className="w-full rounded-xl border border-pink-100 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-pink-500"
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
          <div className="flex items-center rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-[10px] font-bold text-gray-400 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
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
            className="w-full rounded-xl border border-pink-100 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-pink-500"
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
        <p id="transaction-destination-error" className="text-xs font-bold text-red-500">
          {destinationError}
        </p>
      ) : null}
    </div>
  )
}

function TransferFeePanel({
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
    <div className="space-y-3 rounded-[1.5rem] border border-pink-50 bg-pink-50/30 p-4 md:rounded-[2rem] md:p-5 dark:border-slate-800 dark:bg-slate-950/20">
      <div className="flex items-center justify-between">
        <label
          htmlFor="transaction-fee"
          className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500"
        >
          Transfer Fee (PHP)
        </label>
        <div className="flex gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onUpdate('fee_amount', String(preset))}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition ${
                currentFee === preset
                  ? 'bg-pink-500 text-white dark:bg-pink-600'
                  : 'bg-white text-gray-600 hover:bg-pink-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
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
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={form.fee_amount}
        onChange={(event) => onUpdate('fee_amount', event.target.value)}
        className="w-full rounded-xl border border-pink-100 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-pink-500"
      />
      {errors.fee_amount ? (
        <p id="transaction-fee-error" className="text-xs font-bold text-red-500">
          {errors.fee_amount.message}
        </p>
      ) : null}
    </div>
  )
}
