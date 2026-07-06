import { X } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'

import { alerts } from '@/lib/alert'
import type {
  Account,
  DestinationPaymentMethod,
  PaymentMethod,
  Transaction,
  TransactionCategory,
  TransactionFormValues,
  TransactionType,
} from '@/types'
import { transactionSchema } from '@/validation/transactionSchemas'
import { getZodErrorMessage } from '@/validation/zodError'

type TransactionFormProps = {
  cardAccounts: Account[]
  categories: TransactionCategory[]
  error: string
  onClose: () => void
  onSubmit: (values: TransactionFormValues) => Promise<boolean>
  saving: boolean
  transaction: Transaction | null
  walletAccounts: Account[]
}

type TransactionFormState = Omit<TransactionFormValues, 'amount'> & {
  amount: string
}

const today = () => new Date().toISOString().slice(0, 10)

const defaultFormState = (): TransactionFormState => ({
  amount: '',
  card_id: '',
  category_id: '',
  description: '',
  payment_method: 'cash',
  to_card_id: '',
  to_payment_method: 'card',
  to_wallet_id: '',
  transaction_date: today(),
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
    payment_method: transaction.payment_method,
    to_card_id: transaction.to_card_id ?? '',
    to_payment_method: transaction.to_card_id ? 'card' : 'ewallet',
    to_wallet_id: transaction.to_wallet_id ?? '',
    transaction_date: transaction.transaction_date ?? today(),
    type: transaction.type,
    wallet_id: transaction.wallet_id ?? '',
  }
}

export function TransactionForm({
  cardAccounts,
  categories,
  error,
  onClose,
  onSubmit,
  saving,
  transaction,
  walletAccounts,
}: TransactionFormProps) {
  const [form, setForm] = useState<TransactionFormState>(() =>
    toFormState(transaction),
  )
  const [formError, setFormError] = useState('')

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) =>
        form.type === 'income'
          ? category.type === 'income'
          : category.type === 'expense',
      ),
    [categories, form.type],
  )

  const updateField = <TField extends keyof TransactionFormState>(
    field: TField,
    value: TransactionFormState[TField],
  ) => {
    setForm((current) => ({ ...current, [field]: value }))
    setFormError('')
  }

  const updateType = (type: TransactionType) => {
    setForm((current) => ({
      ...current,
      card_id: current.payment_method === 'card' ? current.card_id : '',
      category_id: '',
      payment_method:
        type === 'withdrawal' && current.payment_method === 'cash'
          ? 'card'
          : current.payment_method,
      to_card_id: type === 'transfer' ? current.to_card_id : '',
      to_wallet_id: type === 'transfer' ? current.to_wallet_id : '',
      type,
      wallet_id: current.payment_method === 'ewallet' ? current.wallet_id : '',
    }))
    setFormError('')
  }

  const updatePaymentMethod = (paymentMethod: PaymentMethod) => {
    setForm((current) => ({
      ...current,
      card_id: '',
      payment_method: paymentMethod,
      wallet_id: '',
    }))
    setFormError('')
  }

  const updateDestinationMethod = (
    paymentMethod: DestinationPaymentMethod,
  ) => {
    setForm((current) => ({
      ...current,
      to_card_id: '',
      to_payment_method: paymentMethod,
      to_wallet_id: '',
    }))
    setFormError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const result = transactionSchema.safeParse(form)

    if (!result.success) {
      const message = getZodErrorMessage(result.error, 'Invalid transaction.')
      setFormError(message)
      alerts.warning(message)
      return
    }

    const saved = await onSubmit(result.data)

    if (saved) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Close transaction form"
      />
      <section className="relative z-10 flex max-h-[95vh] w-full flex-col overflow-hidden rounded-[2rem] border border-pink-100 bg-white md:max-h-[90vh] md:max-w-lg md:rounded-[2.5rem]">
        <div className="overflow-y-auto p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between md:mb-8">
            <h2 className="text-xl font-black tracking-tight text-gray-800 md:text-2xl">
              {transaction ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full p-2 text-gray-400 transition hover:bg-pink-50 hover:text-pink-600 disabled:pointer-events-none disabled:opacity-50"
              aria-label="Close transaction form"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {formError || error ? (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {formError || error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <TransactionTypePicker value={form.type} onChange={updateType} />

            <div className="text-center">
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-pink-300 md:left-6 md:text-2xl">
                  PHP
                </span>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(event) => updateField('amount', event.target.value)}
                  className="w-full rounded-xl border-2 border-pink-100 bg-pink-50/50 py-3 pl-20 pr-4 text-xl font-black text-gray-800 outline-none transition placeholder:text-pink-300 focus:border-pink-500 md:rounded-2xl md:py-4 md:pl-24 md:pr-6 md:text-2xl"
                />
              </div>
            </div>

            <AccountSourcePanel
              cardAccounts={cardAccounts}
              form={form}
              onPaymentMethodChange={updatePaymentMethod}
              onUpdate={updateField}
              walletAccounts={walletAccounts}
            />

            {form.type === 'transfer' ? (
              <DestinationPanel
                cardAccounts={cardAccounts}
                form={form}
                onDestinationMethodChange={updateDestinationMethod}
                onUpdate={updateField}
                walletAccounts={walletAccounts}
              />
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1 md:space-y-2">
                <label
                  htmlFor="transaction-category"
                  className="ml-1 block truncate text-[10px] font-black uppercase tracking-widest text-gray-400"
                >
                  Category
                </label>
                <select
                  id="transaction-category"
                  required
                  value={form.category_id}
                  onChange={(event) =>
                    updateField('category_id', event.target.value)
                  }
                  className="w-full rounded-xl border border-pink-100 bg-pink-50/50 px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                >
                  <option value="">Choose Box...</option>
                  {filteredCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:space-y-2">
                <label
                  htmlFor="transaction-date"
                  className="ml-1 block text-[10px] font-black uppercase tracking-widest text-gray-400"
                >
                  Date
                </label>
                <input
                  id="transaction-date"
                  type="date"
                  required
                  value={form.transaction_date}
                  onChange={(event) =>
                    updateField('transaction_date', event.target.value)
                  }
                  className="w-full rounded-xl border border-pink-100 bg-pink-50/50 px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
                />
              </div>
            </div>

            <input
              type="text"
              placeholder="Short note..."
              value={form.description}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-3.5 text-sm font-bold text-gray-700 outline-none transition placeholder:text-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 md:py-4 md:text-base"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-[1.5rem] bg-gradient-to-r from-pink-500 to-pink-600 py-4 text-lg font-black text-white shadow-xl shadow-pink-500/20 transition hover:shadow-2xl hover:shadow-pink-500/30 disabled:opacity-50 md:rounded-[2rem] md:py-5 md:text-xl"
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
                  ? 'bg-gray-900 text-white shadow-lg shadow-pink-500/20'
                  : 'bg-pink-50 text-gray-400 hover:text-pink-500'
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
  form,
  onPaymentMethodChange,
  onUpdate,
  walletAccounts,
}: {
  cardAccounts: Account[]
  form: TransactionFormState
  onPaymentMethodChange: (paymentMethod: PaymentMethod) => void
  onUpdate: <TField extends keyof TransactionFormState>(
    field: TField,
    value: TransactionFormState[TField],
  ) => void
  walletAccounts: Account[]
}) {
  return (
    <div className="space-y-4 rounded-[1.5rem] border border-pink-50 bg-pink-50/30 p-4 md:rounded-[2rem] md:p-5">
      <p className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
        {form.type === 'transfer' ? 'From Account' : 'Payment Method'}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
        <select
          value={form.payment_method}
          onChange={(event) =>
            onPaymentMethodChange(event.target.value as PaymentMethod)
          }
          className="w-full rounded-xl border border-pink-100 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
        >
          {form.type !== 'withdrawal' ? <option value="cash">Cash</option> : null}
          <option value="card">Bank Card</option>
          <option value="ewallet">E-Wallet</option>
        </select>

        {form.payment_method === 'card' ? (
          <select
            required
            value={form.card_id}
            onChange={(event) => onUpdate('card_id', event.target.value)}
            className="w-full rounded-xl border border-pink-100 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          >
            <option value="">Select Card</option>
            {cardAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        ) : form.payment_method === 'ewallet' ? (
          <select
            required
            value={form.wallet_id}
            onChange={(event) => onUpdate('wallet_id', event.target.value)}
            className="w-full rounded-xl border border-pink-100 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          >
            <option value="">Select Wallet</option>
            {walletAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-[10px] font-bold text-gray-400">
            Cash on Hand
          </div>
        )}
      </div>
    </div>
  )
}

function DestinationPanel({
  cardAccounts,
  form,
  onDestinationMethodChange,
  onUpdate,
  walletAccounts,
}: {
  cardAccounts: Account[]
  form: TransactionFormState
  onDestinationMethodChange: (paymentMethod: DestinationPaymentMethod) => void
  onUpdate: <TField extends keyof TransactionFormState>(
    field: TField,
    value: TransactionFormState[TField],
  ) => void
  walletAccounts: Account[]
}) {
  return (
    <div className="space-y-4 rounded-[1.5rem] border border-pink-50 bg-pink-50/30 p-4 md:rounded-[2rem] md:p-5">
      <p className="ml-1 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
        To Account
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
        <select
          value={form.to_payment_method}
          onChange={(event) =>
            onDestinationMethodChange(
              event.target.value as DestinationPaymentMethod,
            )
          }
          className="w-full rounded-xl border border-pink-100 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
        >
          <option value="card">Bank Card</option>
          <option value="ewallet">E-Wallet</option>
        </select>

        {form.to_payment_method === 'card' ? (
          <select
            required
            value={form.to_card_id}
            onChange={(event) => onUpdate('to_card_id', event.target.value)}
            className="w-full rounded-xl border border-pink-100 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          >
            <option value="">Select Card</option>
            {cardAccounts
              .filter((account) => account.id !== form.card_id)
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
          </select>
        ) : (
          <select
            required
            value={form.to_wallet_id}
            onChange={(event) => onUpdate('to_wallet_id', event.target.value)}
            className="w-full rounded-xl border border-pink-100 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20"
          >
            <option value="">Select Wallet</option>
            {walletAccounts
              .filter((account) => account.id !== form.wallet_id)
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
          </select>
        )}
      </div>
    </div>
  )
}
