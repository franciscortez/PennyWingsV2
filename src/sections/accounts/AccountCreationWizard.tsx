import {
  FaArrowLeft,
  FaBuilding,
  FaHandHoldingDollar,
  FaMobileScreenButton,
  FaMoneyBillWave,
  FaWallet,
  FaXmark,
} from 'react-icons/fa6'
import type { IconType } from 'react-icons'
import { memo, useCallback, useState } from 'react'

import { alerts } from '@/lib/alert'
import type { AccountColor, AccountCreateValues } from '@/types'
import {
  accountColors,
  digitalBankOptions,
  eWalletProviderOptions,
  traditionalBankOptions,
} from '@/sections/accounts/accountOptions'
import { accountSchema } from '@/validation/accountSchemas'
import { getZodErrorMessage } from '@/validation/zodError'

type AccountCreationWizardProps = {
  hasCashAccount: boolean
  saving: boolean
  onClose: () => void
  onCreate: (values: AccountCreateValues) => Promise<boolean>
}

type SetupType = 'traditional' | 'digital' | 'ewallet' | 'cash' | 'lent'
type Step = 1 | 2 | 3

type WizardForm = {
  accountName: string
  balance: string
  color: AccountColor
  provider: string
  setupType: SetupType | ''
}

const initialForm: WizardForm = {
  accountName: '',
  balance: '',
  color: accountColors[0],
  provider: '',
  setupType: '',
}

const accountTypes: Array<{
  icon: IconType
  id: SetupType
  label: string
}> = [
  { id: 'traditional', label: 'Traditional Bank', icon: FaBuilding },
  { id: 'digital', label: 'Digital Bank', icon: FaMobileScreenButton },
  { id: 'ewallet', label: 'E-Wallet', icon: FaWallet },
  { id: 'cash', label: 'Cash on Hand', icon: FaMoneyBillWave },
  { id: 'lent', label: 'Lent Money', icon: FaHandHoldingDollar },
]

const directSetupTypes = ['cash', 'lent'] as const

const isDirectSetupType = (
  setupType: SetupType | '',
): setupType is (typeof directSetupTypes)[number] =>
  directSetupTypes.includes(setupType as (typeof directSetupTypes)[number])

const providerOptions: Record<Exclude<SetupType, 'cash' | 'lent'>, string[]> = {
  digital: digitalBankOptions,
  ewallet: eWalletProviderOptions,
  traditional: traditionalBankOptions,
}

const formatProviderValue = (value: string) =>
  value.toLowerCase().replace(/\s+/g, '')

export function AccountCreationWizard({
  hasCashAccount,
  onClose,
  onCreate,
  saving,
}: AccountCreationWizardProps) {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<WizardForm>(initialForm)

  const handleFieldChange = useCallback(
    <TField extends keyof WizardForm>(field: TField, value: WizardForm[TField]) => {
      setForm((current) => ({ ...current, [field]: value }))
    },
    [],
  )

  const handleSelectType = useCallback(
    (setupType: SetupType) => {
      setForm((current) => ({
        ...current,
        accountName:
          setupType === 'cash'
            ? 'Cash on Hand'
            : setupType === 'lent'
              ? ''
              : current.accountName,
        provider: '',
        setupType,
      }))
    },
    [],
  )

  const handleStep1Next = () => {
    if (!form.setupType) {
      alerts.warning('Choose an account type.')
      return
    }

    setStep(isDirectSetupType(form.setupType) ? 3 : 2)
  }

  const handleStep2Next = () => {
    if (!form.provider) {
      alerts.warning('Choose a bank or wallet provider.')
      return
    }

    setStep(3)
  }

  const handleBack = () => {
    setStep((current) => {
      if (current === 3 && isDirectSetupType(form.setupType)) {
        return 1
      }

      return current === 3 ? 2 : 1
    })
  }

  const buildCreateValues = () => {
    const name =
      form.setupType === 'cash'
        ? 'Cash on Hand'
        : form.setupType === 'lent'
          ? form.accountName.trim()
          : form.accountName.trim() || form.provider
    const accountType =
      form.setupType === 'cash'
        ? 'cash'
        : form.setupType === 'lent'
          ? 'lent'
        : form.setupType === 'ewallet'
          ? formatProviderValue(form.provider)
          : form.setupType === 'traditional'
            ? 'savings'
            : 'debit'
    const kind =
      form.setupType === 'cash'
        ? 'cash'
        : form.setupType === 'lent'
          ? 'lent'
        : form.setupType === 'ewallet'
          ? 'wallet'
          : 'card'

    return accountSchema.safeParse({
      accountType,
      balance: form.balance,
      color: form.color.value,
      kind,
      name,
      textColor: form.color.text,
    })
  }

  const handleSubmit = async () => {
    const result = buildCreateValues()

    if (!result.success) {
      const message = getZodErrorMessage(result.error, 'Invalid account details.')
      alerts.warning(message)
      return
    }

    const created = await onCreate(result.data as AccountCreateValues)

    if (created) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/40"
        aria-label="Close account setup"
      />
      <section className="relative z-10 flex max-h-[95vh] w-full max-w-md flex-col overflow-hidden rounded-[2.5rem] border border-pink-100 bg-white animate-fade-in dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-pink-50 p-6 pb-4 sm:p-8 sm:pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-pink-50 active:scale-90 dark:hover:bg-slate-800"
                aria-label="Back"
              >
                <FaArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : null}
            <h2 className="text-2xl font-black tracking-tight text-gray-800 dark:text-slate-100">
              {isDirectSetupType(form.setupType)
                ? form.setupType === 'cash'
                  ? 'Cash on Hand'
                  : 'Lent Money'
                : `Step ${step} of 3`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-all duration-200 hover:rotate-90 hover:bg-pink-50 active:scale-90 dark:hover:bg-slate-800"
            aria-label="Close account setup"
          >
            <FaXmark className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4 sm:p-8 sm:pt-4">
          <div className="mb-8 flex gap-2">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="relative h-2 flex-1 overflow-hidden rounded-full bg-pink-100 dark:bg-slate-800"
              >
                <div
                  className="absolute inset-0 bg-pink-500 transition-all duration-200 ease-out"
                  style={{
                    width:
                      item <= step || isDirectSetupType(form.setupType)
                        ? '100%'
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          <div key={step} className="animate-fade-in">
            {step === 1 ? (
              <StepOne
                form={form}
                hasCashAccount={hasCashAccount}
                onNext={handleStep1Next}
                onSelectType={handleSelectType}
              />
            ) : null}

            {step === 2 && form.setupType && !isDirectSetupType(form.setupType) ? (
              <StepTwo
                form={form}
                providers={providerOptions[form.setupType]}
                onChange={handleFieldChange}
                onNext={handleStep2Next}
              />
            ) : null}

            {step === 3 ? (
              <StepThree
                form={form}
                saving={saving}
                onChange={handleFieldChange}
                onSubmit={handleSubmit}
              />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}

const StepOne = memo(function StepOne({
  form,
  hasCashAccount,
  onNext,
  onSelectType,
}: {
  form: WizardForm
  hasCashAccount: boolean
  onNext: () => void
  onSelectType: (type: SetupType) => void
}) {
  return (
    <div className="space-y-6">
      <label className="ml-1 block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
        What kind of account?
      </label>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {accountTypes
          .filter(
            (type) =>
              !(type.id === 'cash' && hasCashAccount),
          )
          .map((type) => {
            const Icon = type.icon
            const active = form.setupType === type.id

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onSelectType(type.id)}
                className={`flex flex-col items-center justify-center gap-2 rounded-4xl border-2 p-4 text-center transition-all duration-200 active:scale-95 sm:gap-3 sm:p-6 ${
                  active
                    ? 'scale-[1.02] border-pink-500 bg-pink-50 dark:border-pink-600 dark:bg-pink-950/20'
                    : 'border-transparent bg-pink-50/50 hover:border-pink-200 hover:bg-white dark:bg-slate-850/50 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform sm:h-14 sm:w-14 ${
                    active ? 'bg-pink-500 text-white dark:bg-pink-600' : 'bg-white text-pink-500 dark:bg-slate-900 dark:text-pink-400'
                  }`}
                >
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8" aria-hidden="true" />
                </span>
                <span
                  className={`text-xs font-bold sm:text-base ${
                    active ? 'text-pink-700 dark:text-pink-400' : 'text-gray-700 dark:text-slate-300'
                  }`}
                >
                  {type.label}
                </span>
              </button>
            )
          })}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={!form.setupType}
        className="mt-2 w-full rounded-2xl bg-linear-to-r from-pink-500 to-pink-600 py-4 text-lg font-black text-white transition-all hover:-translate-y-0.5 disabled:opacity-30"
      >
        Continue
      </button>
    </div>
  )
})

const StepTwo = memo(function StepTwo({
  form,
  onChange,
  onNext,
  providers,
}: {
  form: WizardForm
  providers: string[]
  onChange: <TField extends keyof WizardForm>(
    field: TField,
    value: WizardForm[TField],
  ) => void
  onNext: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="mb-3 ml-1 block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
          Select Provider
        </label>
        <select
          required
          value={form.provider}
          onChange={(event) => onChange('provider', event.target.value)}
          className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 font-bold text-gray-700 outline-none transition-all focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
        >
          <option value="" className="dark:bg-slate-900">Choose a bank/wallet...</option>
          {providers.map((provider) => (
            <option key={provider} value={provider} className="dark:bg-slate-900">
              {provider}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-3 ml-1 block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
          Custom Name (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. My Savings"
          value={form.accountName}
          onChange={(event) => onChange('accountName', event.target.value)}
          className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 font-bold text-gray-700 outline-none transition-all focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
        />
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!form.provider}
        className="w-full rounded-2xl bg-linear-to-r from-pink-500 to-pink-600 py-4 text-lg font-black text-white transition-all hover:-translate-y-0.5 disabled:opacity-30"
      >
        Continue
      </button>
    </div>
  )
})

const StepThree = memo(function StepThree({
  form,
  onChange,
  onSubmit,
  saving,
}: {
  form: WizardForm
  saving: boolean
  onChange: <TField extends keyof WizardForm>(
    field: TField,
    value: WizardForm[TField],
  ) => void
  onSubmit: () => void
}) {
  const handleColorClick = useCallback(
    (color: AccountColor) => onChange('color', color),
    [onChange],
  )

  return (
    <div className="space-y-8">
      {form.setupType === 'lent' ? (
        <div>
          <label
            htmlFor="lent-account-name"
            className="mb-3 ml-1 block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500"
          >
            Person or Lending Label
          </label>
          <input
            id="lent-account-name"
            autoFocus
            required
            type="text"
            placeholder="e.g. Juan's utang"
            value={form.accountName}
            onChange={(event) => onChange('accountName', event.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 font-bold text-gray-700 outline-none transition-all focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
          />
          <p className="mt-2 text-xs font-medium text-gray-400 dark:text-slate-500">
            Use a name that identifies who owes you this money.
          </p>
        </div>
      ) : null}

      <div className="text-center">
        <label className="mb-4 block text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
          Initial Balance
        </label>
        <div className="relative inline-block w-full">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-pink-300 sm:text-4xl dark:text-slate-650">
            PHP
          </span>
          <input
            autoFocus={form.setupType !== 'lent'}
            required
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.balance}
            onChange={(event) => onChange('balance', event.target.value)}
            className="w-full rounded-[2.5rem] border-2 border-pink-100 bg-pink-50/50 py-6 pl-24 pr-6 text-center text-3xl font-black text-gray-800 outline-none transition-all placeholder:text-pink-300 focus:border-pink-500 sm:py-8 sm:text-4xl dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="ml-1 block text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">
          Card Color
        </label>
        <div className="flex flex-wrap gap-2">
          {accountColors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => handleColorClick(color)}
              className={`h-8 w-8 rounded-xl transition-transform ${
                form.color.value === color.value
                  ? 'scale-110 ring-2 ring-pink-500 ring-offset-2 dark:ring-offset-slate-900'
                  : 'border border-gray-200 hover:scale-105 dark:border-slate-700'
              }`}
              style={{ backgroundColor: color.value }}
              aria-label={color.label}
            />
          ))}
        </div>
      </div>

      <div
        className="flex h-16 items-center justify-center rounded-3xl border border-pink-100 text-lg font-bold dark:border-slate-850"
        style={{
          background: `linear-gradient(135deg, ${form.color.value}, ${form.color.value}DD)`,
          color: form.color.text,
        }}
      >
        Preview Card
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={saving}
        className="w-full rounded-3xl bg-linear-to-r from-pink-500 to-pink-600 py-5 text-xl font-black text-white transition-all hover:-translate-y-1 disabled:opacity-50"
      >
        {saving ? 'Creating...' : 'Finalize Account'}
      </button>
    </div>
  )
})
